"""Stage, validate and refresh the Global snapshot, MDB rules and training data.
No downloaded JavaScript is executed. The checked-in MIT converter is reviewed
code; unsupported MDB effects stop the refresh. Run from any directory.
"""
import ast
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import refresh_data
import planning_data

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = 'https://uma.moe/resources/manifest.json'
EVENTS = 'https://raw.githubusercontent.com/Euophrys/umamusume-tierlist/{sha}/src/card-events.js'

def parse_cards(text):
    match = re.fullmatch(r'\s*const cards\s*=\s*(\[.*\]);\s*export default cards;?\s*', text, re.S)
    if not match:
        raise ValueError('Unexpected training card format')
    return json.loads(match[1])

def parse_events(text):
    match = re.fullmatch(r'\s*const events\s*=\s*(\{.*\})\s*;?\s*export default events;?\s*', text, re.S)
    if not match:
        raise ValueError('Unexpected event data format')
    literal = re.sub(r'//[^\n]*', '', match[1])
    events = ast.literal_eval(literal)
    if not isinstance(events, dict) or not events:
        raise ValueError('Empty training events')
    for key, values in events.items():
        if not isinstance(key, int) or not isinstance(values, list) or len(values) != 8 or any(type(v) not in (int, float) for v in values):
            raise ValueError('Invalid event vector')
    return events

def validate_catalog(stage, before):
    keys = {'characters':'cardId','supports':'supportCardId','skills':'skillId','factors':'id'}
    for name, key in keys.items():
        rows = json.loads((stage/'data'/f'{name}.json').read_text())
        ids = [str(row[key]) for row in rows]
        if not rows or len(set(ids)) != len(ids):
            raise ValueError(f'Empty or duplicate {name} IDs')
        old = json.loads((before/'data'/f'{name}.json').read_text())
        if not {str(row[key]) for row in old}.issubset(ids):
            raise ValueError(f'{name} lost existing IDs; review source changes before updating')

def main():
    original_fetch = refresh_data.fetch
    cache = {}
    def fetch(url):
        if url not in cache:
            cache[url] = original_fetch(url)
        return cache[url]
    # Both refreshers share a single immutable manifest for this transaction.
    manifest = json.loads(fetch(MANIFEST))
    with tempfile.TemporaryDirectory(prefix='umaharashi-refresh-') as folder:
        stage = pathlib.Path(folder)
        shutil.copytree(ROOT/'data', stage/'data')
        refresh_data.ROOT = planning_data.ROOT = stage
        refresh_data.fetch = fetch
        planning_data.fetch = lambda path: fetch('https://uma.moe'+path)
        refresh_data.main()
        planning_data.main()
        validate_catalog(stage, ROOT)
        raw = fetch('https://uma.moe'+manifest['master']['path'])
        if hashlib.sha256(raw).hexdigest() != manifest['master']['sha256']:
            raise ValueError('MDB checksum mismatch')
        db = stage/'master.mdb'; db.write_bytes(raw)
        supports = json.loads((stage/'data/supports.json').read_text())
        ids = ','.join(str(s['supportCardId']) for s in supports)
        subprocess.run([sys.executable, str(ROOT/'vendor/tierlist/db-convert.py'), str(db), '--ids', ids], cwd=stage, check=True)
        cards = parse_cards((stage/'cards.js').read_text())
        expected = {(s['supportCardId'], lb) for s in supports for lb in range(5)}
        if {(c['id'],c['limit_break']) for c in cards} != expected or len(cards) != len(expected):
            raise ValueError('Missing or duplicate training models')
        by_id = {s['supportCardId']:s for s in supports}
        for card in cards:
            card['char_name'] = by_id[card['id']]['charaName']
        # Pin both provenance and the download URL to one upstream revision.
        sha = subprocess.check_output(['git','ls-remote','https://github.com/Euophrys/umamusume-tierlist.git','refs/heads/main'], text=True).split()[0]
        if not re.fullmatch(r'[0-9a-f]{40}',sha):
            raise ValueError('Invalid training source revision')
        events = parse_events(fetch(EVENTS.format(sha=sha)).decode())
        vendor = stage/'vendor/tierlist'; vendor.mkdir(parents=True)
        encode = lambda obj: json.dumps(obj, ensure_ascii=False, separators=(',',':'))
        (vendor/'cards.js').write_text('export default '+encode(cards)+';\n')
        (vendor/'card-events.js').write_text('export default '+encode(events)+';\n')
        metadata = json.loads((stage/'data/metadata.json').read_text())
        metadata['masterSha256'] = manifest['master']['sha256']
        metadata['trainingEventsRevision'] = sha
        metadata['trainingModels'] = len(cards)
        metadata['missingEventModels'] = [s['supportCardId'] for s in supports if s['rarity']>1 and s['supportCardId'] not in events]
        if metadata['missingEventModels']:
            raise ValueError('Training event data missing for SR/SSR supports: '+str(metadata['missingEventModels']))
        previous = json.loads((ROOT/'data/metadata.json').read_text())
        # No daily timestamp-only commits when the sources have not changed.
        if {k:v for k,v in previous.items() if k!='retrieved'} == {k:v for k,v in metadata.items() if k!='retrieved'}:
            metadata['retrieved'] = previous['retrieved']
        (stage/'data/metadata.json').write_text(encode(metadata))
        paths = [str(p.relative_to(stage)) for p in (stage/'data').glob('*.json')]+['support-rules.js','vendor/tierlist/cards.js','vendor/tierlist/card-events.js']
        changed = [p for p in paths if not (ROOT/p).exists() or (stage/p).read_bytes()!=(ROOT/p).read_bytes()]
        # Nothing in the working snapshot changes until every source validates.
        for path in changed:
            shutil.copyfile(stage/path, ROOT/path)
        print('Validated refresh: '+(', '.join(changed) if changed else 'no changes'))

if __name__ == '__main__':
    main()
