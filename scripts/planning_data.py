"""Refresh compact factual planning data from uma.moe's public Global exports.
Run from any directory: python scripts/planning_data.py
No API key or user MDB required. The downloaded MDB stays in a temporary folder.
"""
import gzip,hashlib,json,pathlib,sqlite3,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
def fetch(path):
    raw=subprocess.check_output(['curl','-fsSL','--max-time','90','https://uma.moe'+path])
    return gzip.decompress(raw) if raw[:2]==b'\x1f\x8b' else raw

def main():
    manifest=json.loads(fetch('/resources/manifest.json'))
    raw=fetch(manifest['master']['path'])
    if hashlib.sha256(raw).hexdigest()!=manifest['master']['sha256']:raise ValueError('MDB checksum mismatch; existing files unchanged.')
    with tempfile.TemporaryDirectory() as folder:
        path=pathlib.Path(folder)/'master.mdb';path.write_bytes(raw)
        con=sqlite3.connect(f'file:{path}?mode=ro',uri=True);con.row_factory=sqlite3.Row
        rules={};scenario_keys={1:'URA',2:'Aoharu',3:'GL',4:'MANT',5:'GM'}
        for r in con.execute('select id,chara_id,outing_max from support_card_data'):
            members=list(con.execute('select chara_id,outing_max from support_card_group where support_card_id=?',(r['id'],)))
            if members or r['outing_max']:
                rules[r['id']]={'characters':[x['chara_id'] for x in members] or [r['chara_id']], 'outings':r['outing_max']+sum(x['outing_max'] for x in members),'blockedScenarios':[scenario_keys[x[0]] for x in con.execute('select scenario_id from single_mode_restrict_support where support_card_id=?',(r['id'],))]}
        names=dict(con.execute('select "index",text from text_data where category=35'))
        con.close()
    entry=next(x for x in manifest['artifacts'] if x['name']=='simulator_courses.json')
    raw=fetch(entry['path'])
    if hashlib.sha256(raw).hexdigest()!=entry['sha256']:raise ValueError('Course checksum mismatch; existing files unchanged.')
    courses=json.loads(raw)['courses']
    for c in courses:c['trackName']=names.get(c['race_track_id'],str(c['race_track_id']))
    # Both payloads are validated before either is replaced.
    (ROOT/'support-rules.js').write_text('// Factual Global MDB extract. Refresh script and provenance: scripts/planning_data.py.\nexport const supportRules='+json.dumps(rules,separators=(',',':'))+';\nexport const ruleVersion='+json.dumps(manifest['version'])+';\n')
    (ROOT/'data/courses.json').write_text(json.dumps({'version':manifest['version'],'retrieved':manifest['generated_at'][:10],'courses':courses},separators=(',',':')))
    print(f'Updated {len(rules)} support rules and {len(courses)} courses. Review the diff and run npm test.')
if __name__=='__main__':main()
