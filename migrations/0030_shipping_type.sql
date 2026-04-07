-- 送料負担設定カラム追加
-- seller_paid: 出品者負担（送料込み）
-- buyer_paid: 着払い（購入者負担）
ALTER TABLE products ADD COLUMN shipping_type TEXT DEFAULT 'buyer_paid' CHECK(shipping_type IN ('seller_paid', 'buyer_paid'));
