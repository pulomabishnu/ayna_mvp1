import { it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({ db: {}, user: null, config: { enabled: true, productId: 'p-always-infinity', priceId: 'price_test', vendor: 'TEST', admins: ['admin'], origin: 'https://test.example.com' }, stripe: {} }));
vi.mock('./_pilot.js', async () => ({ ...(await vi.importActual('./_pilot.js')), database: () => mocks.db, signedIn: async () => mocks.user, pilotConfig: () => mocks.config, stripeClient: () => mocks.stripe }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }) }));
import orders from './pilot-orders.js';
import checkout from './pilot-checkout.js';
function res() { return { code: 200, setHeader() {}, status(code) { this.code=code; return this; }, json(body) { this.body=body; return this; }, end() { return this; } }; }
function query(result) { const q={}; for (const method of ['select','eq','order','limit','insert','update']) q[method]=vi.fn(()=>q); q.then=(resolve)=>Promise.resolve(result).then(resolve); q.maybeSingle=q.single=vi.fn(async()=>result); return q; }
beforeEach(()=> { mocks.user=null; mocks.config.enabled=true; vi.stubEnv('STRIPE_WEBHOOK_SECRET','whsec_test'); });
it('orders require authentication', async()=> { const r=res(); await orders({method:'GET'},r); expect(r.code).toBe(401); });
it('customers cannot enter the admin inbox, change price, or save tracking', async()=> { mocks.user={id:'customer'}; for (const req of [{method:'GET',query:{admin:'1'}},{method:'PUT',query:{price:'1'},body:{price:'1'}},{method:'PATCH',body:{}}]) { const r=res(); await orders(req,r); expect(r.code).toBe(403); } });
it('customer reads are scoped to their authenticated id', async()=> { mocks.user={id:'customer'}; const q=query({data:[],error:null}); mocks.db={from:()=>q}; const r=res(); await orders({method:'GET'},r); expect(q.eq).toHaveBeenCalledWith('user_id','customer'); expect(r.code).toBe(200); });
it('admin inbox includes only paid orders', async()=> { mocks.user={id:'admin'}; const q=query({data:[],error:null}); mocks.db={from:()=>q}; const r=res(); await orders({method:'GET',query:{admin:'1'}},r); expect(q.eq).toHaveBeenCalledWith('status','paid'); expect(r.code).toBe(200); });
it('disabled checkout is rejected before payment creation', async()=> { mocks.config.enabled=false; const r=res(); await checkout({method:'POST'},r); expect(r.code).toBe(403); });
it('checkout requires authentication', async()=> { const r=res(); await checkout({method:'POST'},r); expect(r.code).toBe(401); });
it('non-pilot products are rejected', async()=> { mocks.user={id:'customer'}; const r=res(); await checkout({method:'POST',body:{productId:'other',attemptId:'00000000-0000-4000-8000-000000000001'}},r); expect(r.code).toBe(400); });
it('retry uses the existing session instead of creating a second charge', async()=> {
  mocks.user={id:'customer'};
  const q=query({ data:{id:'order',status:'pending',created_at:new Date().toISOString(),stripe_session_id:'cs_test_existing'},error:null }); mocks.db={from:()=>q};
  const retrieve=vi.fn(async()=>({id:'cs_test_existing',status:'open',livemode:false,url:'https://checkout.stripe.com/test'})); const create=vi.fn(); mocks.stripe={checkout:{sessions:{retrieve,create}}};
  const r=res(); await checkout({method:'POST',body:{productId:'p-always-infinity',attemptId:'00000000-0000-4000-8000-000000000001',amount:1}},r);
  expect(r.code).toBe(200); expect(retrieve).toHaveBeenCalledWith('cs_test_existing'); expect(create).not.toHaveBeenCalled();
});
it('creates a $16.47 test checkout with separate product and fee lines', async()=> {
  mocks.user={id:'customer'};
  const order={id:'order',status:'pending',created_at:new Date().toISOString(),stripe_session_id:null,stripe_price_id:'retailer:1497',amount:1647,currency:'usd',product_name:'Always Infinity FlexFoam'};
  const q=query({data:order,error:null}); mocks.db={from:()=>q};
  const create=vi.fn(async()=>({id:'cs_test_new',status:'open',livemode:false,url:'https://checkout.stripe.com/test'}));
  mocks.stripe={checkout:{sessions:{create}}};
  const r=res(); await checkout({method:'POST',body:{productId:'p-always-infinity',attemptId:'00000000-0000-4000-8000-000000000001'}},r);
  expect(r.code).toBe(200);
  const lines=create.mock.calls[0][0].line_items;
  expect(lines.map(line=>line.price_data.unit_amount)).toEqual([1497,150]);
});
