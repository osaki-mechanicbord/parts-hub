-- カテゴリマスターデータ
INSERT OR IGNORE INTO _cf_KV (key, value) VALUES 
  ('category:engine', '{"id":"engine","name":"エンジンパーツ","description":"エンジン関連部品"}'),
  ('category:brake', '{"id":"brake","name":"ブレーキパーツ","description":"ブレーキ関連部品"}'),
  ('category:suspension', '{"id":"suspension","name":"サスペンション","description":"サスペンション関連部品"}'),
  ('category:electric', '{"id":"electric","name":"電装パーツ","description":"電気系統部品"}'),
  ('category:exterior', '{"id":"exterior","name":"外装パーツ","description":"ボディ・外装部品"}'),
  ('category:interior', '{"id":"interior","name":"内装パーツ","description":"内装関連部品"}'),
  ('category:wheel', '{"id":"wheel","name":"ホイール・タイヤ","description":"ホイール・タイヤ"}'),
  ('category:exhaust', '{"id":"exhaust","name":"排気系パーツ","description":"マフラー・排気系"}');

-- メーカーマスターデータ
INSERT OR IGNORE INTO _cf_KV (key, value) VALUES 
  ('maker:toyota', '{"id":"toyota","name":"トヨタ","country":"JP"}'),
  ('maker:honda', '{"id":"honda","name":"ホンダ","country":"JP"}'),
  ('maker:nissan', '{"id":"nissan","name":"日産","country":"JP"}'),
  ('maker:mazda', '{"id":"mazda","name":"マツダ","country":"JP"}'),
  ('maker:subaru', '{"id":"subaru","name":"スバル","country":"JP"}'),
  ('maker:suzuki', '{"id":"suzuki","name":"スズキ","country":"JP"}'),
  ('maker:daihatsu', '{"id":"daihatsu","name":"ダイハツ","country":"JP"}'),
  ('maker:mitsubishi', '{"id":"mitsubishi","name":"三菱","country":"JP"}');
