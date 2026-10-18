export const SUPABASE='https://ufhobvpuwhainuheewxb.supabase.co';
export const PUBLIC_KEY='sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy';
export async function database(path,options={}){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)throw Error('Database is not configured');
 const response=await fetch(SUPABASE+'/rest/v1/'+path,{...options,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Database request failed ('+response.status+')');
 const body=await response.text();return body?JSON.parse(body):null;
}
export async function stripe(path,options={}){
 if(!process.env.STRIPE_SECRET_KEY)throw Error('Payments are not configured');
 const response=await fetch('https://api.stripe.com/v1/'+path,{...options,headers:{Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY,...options.headers},signal:AbortSignal.timeout(15000)});
 const body=await response.json();if(!response.ok)throw Error(body.error?.message||'Stripe request failed');return body;
}
export async function requireAdmin(req){
 const token=req.headers.authorization;
 if(!/^Bearer \S+$/.test(token||''))throw Object.assign(Error('Sign in required'),{status:401});
 const response=await fetch(SUPABASE+'/auth/v1/user',{headers:{apikey:PUBLIC_KEY,Authorization:token},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Object.assign(Error('Sign in required'),{status:401});
 const user=await response.json();
 const membership=await fetch(SUPABASE+'/rest/v1/review_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id),{headers:{apikey:PUBLIC_KEY,Authorization:token},signal:AbortSignal.timeout(10000)});
 if(!membership.ok||(await membership.json()).length!==1)throw Object.assign(Error('Administrator access required'),{status:403});
 return user;
}
export async function syncOrderRefund(order){
 if(!/^pi_/.test(order.order_number||''))throw Error('Order has no Stripe payment reference');
 const refunds=[];let after='';
 do{const list=await stripe('refunds?limit=100&payment_intent='+encodeURIComponent(order.order_number)+after);refunds.push(...list.data);after=list.has_more?'&starting_after='+encodeURIComponent(list.data.at(-1).id):'';}while(after);
 const refunded=refunds.filter(r=>r.status==='succeeded').reduce((n,r)=>n+r.amount,0);
 const pending=refunds.some(r=>['pending','requires_action'].includes(r.status));
 const status=pending?'pending':refunded>0?'succeeded':refunds.length?'failed':null;
 const patch={refunded_pence:refunded,refund_status:status,payment_status:refunded>=order.total_pence&&refunded>0?'refunded':refunded>0?'partially_refunded':'paid'};
 await database('customer_orders?id=eq.'+encodeURIComponent(order.id),{method:'PATCH',body:JSON.stringify(patch)});
 return patch;
}
