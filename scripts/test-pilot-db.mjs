import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url).pathname;
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema public,auth to authenticated,service_role; create table public.product_catalog(id text primary key); insert into public.product_catalog values ('p-always-infinity'); insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');`);
await db.exec(await readFile(root+'/supabase/pilot_orders.sql','utf8'));
await db.exec(await readFile(root+'/supabase/pilot_orders.sql','utf8'));
await db.exec(await readFile(root+'/supabase/pilot_prices.sql','utf8'));
await db.exec(await readFile(root+'/supabase/pilot_prices.sql','utf8'));
await db.exec(await readFile(root+'/supabase/pilot_requests.sql','utf8'));
await db.exec(await readFile(root+'/supabase/pilot_requests.sql','utf8'));
assert.equal((await db.query(`select count(*)::int n from information_schema.columns where table_schema='public' and table_name='pilot_fulfillments' and column_name='retailer_order_number'`)).rows[0].n,1);
const user='00000000-0000-4000-8000-000000000001';
const inserted=await db.query(`insert into pilot_orders(user_id,attempt_id,product_id,product_name,stripe_price_id,amount,currency,vendor_name) values ($1,gen_random_uuid(),'p-always-infinity','Always Infinity FlexFoam','price_test',800,'usd','TEST ONLY') returning id`,[user]);
const id=inserted.rows[0].id;
const pay=`select pilot_record_payment($1,'cs_test',800,'usd',$2,'{"name":"TEST"}'::jsonb,'test@example.com')`;
await assert.rejects(db.query(`select pilot_record_payment($1,'cs_test',900,'usd',$2,'{}'::jsonb,null)`,[id,user]));
assert.equal((await db.query('select status from pilot_orders')).rows[0].status,'pending');
await db.exec('set role service_role');
await db.query(`insert into pilot_requests(user_id,product_id,product_name,customer_email) values ($1,'p-always-infinity','Always Infinity FlexFoam','test@example.com')`,[user]);
await db.query(`insert into pilot_product_prices(product_id,amount,retailer_url) values ('p-always-infinity',1497,'https://www.amazon.com/dp/TEST')`);
await db.query(`insert into pilot_product_prices(product_id,variant_id,variant_label,amount,retailer_url) values ('p-always-infinity','size-1','Size 1',1597,'https://www.amazon.com/dp/TEST2')`);
assert.equal((await db.query('select count(*)::int n from pilot_product_prices')).rows[0].n,2);
await db.query(pay,[id,user]);
await db.query(`update pilot_fulfillments set tracking_number='123',status='shipped' where order_id=$1`,[id]);
await db.query(pay,[id,user]);
await db.exec('reset role');
assert.equal((await db.query('select count(*)::int n from pilot_fulfillments')).rows[0].n,1);
assert.equal((await db.query('select tracking_number from pilot_fulfillments')).rows[0].tracking_number,'123');
await db.exec(`set role authenticated; set request.jwt.claim.sub='${user}'`);
await assert.rejects(db.query('select * from pilot_product_prices'));
assert.equal((await db.query('select * from pilot_orders')).rows.length,1);
assert.equal((await db.query('select * from pilot_fulfillments')).rows.length,1);
assert.equal((await db.query('select * from pilot_requests')).rows.length,1);
await assert.rejects(db.query(`insert into pilot_requests(user_id,product_id,product_name) values ('00000000-0000-4000-8000-000000000002','p-always-infinity','Other')`));
await assert.rejects(db.query(`update pilot_orders set status='paid'`));
await assert.rejects(db.query(pay,[id,user]));
await db.exec(`set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002'`);
assert.equal((await db.query('select * from pilot_orders')).rows.length,0);
assert.equal((await db.query('select * from pilot_fulfillments')).rows.length,0);
assert.equal((await db.query('select * from pilot_requests')).rows.length,0);
await db.exec('reset role; set role anon');
await assert.rejects(db.query('select * from pilot_orders'));
await assert.rejects(db.query('select * from pilot_requests'));

// ---- Cart / multi-item orders (supabase/pilot_cart.sql) ----
await db.exec('reset role');
await db.exec(`insert into public.product_catalog values ('p-two'),('p-three')`);
await db.exec(await readFile(root+'/supabase/pilot_cart.sql','utf8'));
await db.exec(await readFile(root+'/supabase/pilot_cart.sql','utf8')); // re-apply must not duplicate backfill
{
  const legacy=(await db.query(`select i.*, o.order_number from pilot_order_items i join pilot_orders o on o.id=i.order_id where o.id=$1`,[id])).rows;
  assert.equal(legacy.length,1,'legacy order backfilled exactly once');
  assert.equal(legacy[0].quantity,1); assert.equal(legacy[0].item_status,'shipped'); assert.equal(legacy[0].tracking_number,'123');
  assert.ok(Number(legacy[0].order_number)>=1001,'legacy order got an order number');
}
const user2='00000000-0000-4000-8000-000000000002';
const attempt='11111111-1111-4111-8111-111111111111';
// Cart: Always Size 1 x2 ($14.97 each) + p-two x1 ($10.00). fee = 150*2 + 100 = 400, subtotal = 2994+1000 = 3994.
const items=[
  {line_no:1,product_id:'p-always-infinity',product_name:'Always Infinity FlexFoam',variant_id:'size-1',variant_label:'Size 1',quantity:2,retailer_url:'https://www.amazon.com/dp/A',retailer_unit_cents:1497,customer_unit_cents:1647,customer_line_cents:3294},
  {line_no:2,product_id:'p-two',product_name:'Product Two',variant_id:'',variant_label:null,quantity:1,retailer_url:'https://www.amazon.com/dp/B',retailer_unit_cents:1000,customer_unit_cents:1100,customer_line_cents:1100},
];
const create=`select pilot_create_order($1,$2,'Cart order','TEST ONLY','usd',$3,$4,$5,$6,$7,$8::jsonb) as id`;
const args=(over={})=>[user,attempt,'a;b',3994,400,150,4544,JSON.stringify(items)].map((v,i)=>over[i]??v);
await db.exec('set role service_role');
const first=(await db.query(create,args())).rows[0].id;
const again=(await db.query(create,args())).rows[0].id;
assert.equal(first,again,'retry of the same attempt returns the same order');
assert.equal((await db.query(`select count(*)::int n from pilot_order_items where order_id=$1`,[first])).rows[0].n,2,'retry does not duplicate items');
await assert.rejects(db.query(create,args({2:'different'})),/cart mismatch/);
await assert.rejects(db.query(create,[user,'22222222-2222-4222-8222-222222222222','k',3994,400,150,9999,JSON.stringify(items)]),/do not add up/);
await assert.rejects(db.query(create,[user,'33333333-3333-4333-8333-333333333333','k',3994,400,150,4544,'[]']),/invalid items/);
const row=(await db.query(`select amount,subtotal_cents,service_fee_cents,processing_cents,order_number,status from pilot_orders where id=$1`,[first])).rows[0];
assert.deepEqual([row.amount,row.subtotal_cents,row.service_fee_cents,row.processing_cents,row.status],[4544,3994,400,150,'pending']);
assert.ok(Number(row.order_number)>1001);
assert.equal((await db.query(`select quantity from pilot_order_items where order_id=$1 and line_no=1`,[first])).rows[0].quantity,2);
// Payment marks the whole order paid once; per-item tracking is independent and survives a replay.
const payCart=`select pilot_record_payment($1,'cs_cart',4544,'usd',$2,'{"name":"Cart Buyer"}'::jsonb,'cart@example.com')`;
await db.query(payCart,[first,user]);
await db.query(payCart,[first,user]);
assert.equal((await db.query(`select count(*)::int n from pilot_fulfillments where order_id=$1`,[first])).rows[0].n,1,'duplicate webhook creates one fulfillment');
await db.query(`update pilot_order_items set item_status='shipped', carrier='UPS', tracking_number='1Z-A' where order_id=$1 and line_no=1`,[first]);
await db.query(`update pilot_order_items set item_status='processing', internal_notes='secret note', actual_cost_cents=800 where order_id=$1 and line_no=2`,[first]);
await db.query(payCart,[first,user]);
assert.equal((await db.query(`select tracking_number from pilot_order_items where order_id=$1 and line_no=1`,[first])).rows[0].tracking_number,'1Z-A');
await assert.rejects(db.query(`insert into pilot_order_items(order_id,line_no,product_id,product_name,quantity,retailer_unit_cents,customer_unit_cents,customer_line_cents) values ($1,3,'p-two','x',11,100,110,1210)`,[first]),'quantity capped at 10');
await assert.rejects(db.query(`update pilot_order_items set tracking_url='javascript:alert(1)' where order_id=$1`,[first]),'non-https tracking link refused');
// Customer role: own items only, customer-safe columns only.
await db.exec('reset role');
await db.exec(`set role authenticated; set request.jwt.claim.sub='${user}'`);
const mine=(await db.query(`select product_name,quantity,variant_label,customer_line_cents,item_status,tracking_number from pilot_order_items where order_id=$1 order by line_no`,[first])).rows;
assert.equal(mine.length,2); assert.equal(mine[0].tracking_number,'1Z-A'); assert.equal(mine[1].item_status,'processing');
for (const col of ['retailer_url','retailer_unit_cents','actual_cost_cents','internal_notes','retailer_order_number','retailer_name']) {
  await assert.rejects(db.query(`select ${col} from pilot_order_items`),new RegExp('permission denied'),`customer cannot read ${col}`);
}
await assert.rejects(db.query(`select * from pilot_order_items`),/permission denied/);
await assert.rejects(db.query(`update pilot_order_items set item_status='delivered'`),/permission denied/);
await assert.rejects(db.query(create,args()),/permission denied/);
await db.exec(`set request.jwt.claim.sub='${user2}'`);
assert.equal((await db.query(`select id from pilot_order_items`)).rows.length,0,'other customers see no items');
await db.exec('reset role; set role anon');
await assert.rejects(db.query(`select id from pilot_order_items`),/permission denied/);

await db.close();
console.log('PASS: cart schema (backfill, atomic create, retry, tampered totals, duplicate webhook, per-item tracking, customer-safe columns); schema repeat apply, amount mismatch rollback, atomic payment/fulfillment, webhook replay preserves tracking, owner read, cross-user isolation, client mutation/RPC refusal, anonymous denial');
