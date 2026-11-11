import importlib.util,json,pathlib,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from refresh_all import parse_events,parse_cards,validate_catalog
class RefreshTests(unittest.TestCase):
 def test_events_are_data_not_executable_code(self):
  self.assertEqual(parse_events('const events = {123: [1,2,3,4,5,6,7,8],}; export default events'),{123:[1,2,3,4,5,6,7,8]})
  with self.assertRaises((ValueError,SyntaxError)):parse_events('const events = {123: __import__("os").system("false")}; export default events')
  with self.assertRaises(ValueError):parse_events('const events = {123: [1,2]}; export default events')
 def test_training_parser_rejects_extra_javascript(self):
  self.assertEqual(parse_cards('const cards = [{"id": 1}]; export default cards;'),[{'id':1}])
  with self.assertRaises(ValueError):parse_cards('const cards = []; fetch("bad"); export default cards;')
 def test_catalog_does_not_silently_lose_existing_ids(self):
  with tempfile.TemporaryDirectory() as folder:
   old=pathlib.Path(folder)/'old';new=pathlib.Path(folder)/'new'
   for root in [old,new]:
    (root/'data').mkdir(parents=True)
    for name,key in [('characters','cardId'),('supports','supportCardId'),('skills','skillId'),('factors','id')]:
     (root/'data'/f'{name}.json').write_text(json.dumps([{key:1}]))
   validate_catalog(new,old)
   (new/'data/supports.json').write_text('[{"supportCardId":2}]')
   with self.assertRaisesRegex(ValueError,'lost existing'):validate_catalog(new,old)
   (new/'data/supports.json').write_text('[{"supportCardId":1},{"supportCardId":1}]')
   with self.assertRaisesRegex(ValueError,'duplicate'):validate_catalog(new,old)
if __name__=='__main__': unittest.main()
