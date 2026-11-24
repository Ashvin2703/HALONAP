/* HALONAP quick-answer bot: intents, keywords and answers. Pure functions (no DOM), so tests can load it.
   Facts here must match delivery.html, returns.html and the live prices in store_settings. */
(()=>{
 'use strict';
 const money=p=>'£'+(p/100).toFixed(2);

 // Common misspellings and other ways people say the same thing, mapped to one word before matching.
 const TYPOS={deliverd:'delivered',delivary:'delivery',delivey:'delivery',deliviry:'delivery',dilivery:'delivery',shiping:'shipping',shippment:'shipment',postage:'delivery',
  recieve:'receive',recieved:'received',recived:'received',arived:'arrived',arrivd:'arrived',
  retrun:'return',retun:'return',reurn:'return',refnd:'refund',refun:'refund',
  cancle:'cancel',cancell:'cancel',canel:'cancel',
  adress:'address',addres:'address',
  payement:'payment',paymnt:'payment',
  dicount:'discount',discout:'discount',voucher:'code',coupon:'code',promo:'code',
  colour:'color',colours:'colors',gray:'grey',
  wher:'where',wen:'when',hw:'how',plz:'please',pls:'please',u:'you',ur:'your',
  masc:'mask',maks:'mask',eyemask:'eye mask',
  damage:'damaged',brokn:'broken',faulty:'faulty',
  wash:'wash',washing:'wash',cleaning:'clean',
  trackng:'tracking',trak:'track',traking:'tracking'};

 const norm=q=>' '+String(q||'').toLowerCase().replace(/[’‘`]/g,"'").replace(/[^a-z0-9£' ]+/g,' ').split(/\s+/).filter(Boolean)
  .map(w=>TYPOS[w]||w).join(' ')+' ';

 // Each intent: keywords with weights. A keyword ending in * matches any word starting with it.
 const INTENTS={
  person:{chip:'Talk to a person',words:{'talk to a person':6,'real person':6,'speak to someone':6,'speak to a person':6,'talk to someone':6,'human':5,'agent':4,'customer service':4,'staff':3,'call me':4,'phone me':4,'someone help':3,'live chat':3,'representative':4,'manager':3}},
  greet:{words:{'hi':2,'hello':2,'hey':2,'good morning':2,'good evening':2,'good afternoon':2}},
  thanks:{words:{'thank*':3,'thx':3,'cheers':3,'bye':2,'great':1,'perfect':1}},
  late:{chip:'My order hasn’t arrived',words:{'not arrived':6,"hasn't arrived":6,'hasnt arrived':6,'not received':6,"haven't received":6,'havent received':6,'still waiting':5,'not here':4,'late':3,'missing':4,'lost':4,'never came':6,'not come':5,'where is my order':6,'where s my order':6,'wheres my order':6,"where's my order":6,"where's my parcel":6,'where is my parcel':6,'wheres my parcel':6,'my parcel':3}},
  track:{chip:'Track my order',words:{'track*':5,'where is my':3,'order status':5,'dispatch*':4,'shipped':3,'when will':2,'arrive':2,'tracking number':6}},
  delivery:{chip:'Delivery',words:{'deliver*':6,'shipping':5,'ship':2,'courier':3,'express':3,'next day':3,'how long':3,'free delivery':5,'royal mail':3,'evri':3,'cost to send':3}},
  abroad:{chip:'Do you ship abroad?',words:{'international':7,'abroad':5,'outside uk':9,'outside the uk':9,'ship to':2,'europe':4,'ireland':4,'usa':4,'us shipping':5,'america':4,'india':4,'overseas':5,'worldwide':5,'country':2,'countries':3}},
  returns:{chip:'Returns',words:{'return*':5,'refund*':5,'send it back':5,'send back':5,'exchange':4,'money back':5,"don't like":3,'dont like':3,'change of mind':5,'changed my mind':5}},
  faulty:{chip:'Faulty or damaged',words:{'faulty':6,'broken':6,'damaged':6,'defect*':6,'ripped':5,'torn':5,'wrong item':6,'wrong colour':5,'wrong color':5,'not working':4,'stitching':4,'strap broke':6}},
  change:{chip:'Change or cancel my order',words:{'cancel*':6,'change my order':6,'change order':5,'change address':6,'change my address':6,'update my address':6,'change my':3,'wrong address':6,'edit order':5,'add to my order':5,'change colour':4,'change color':4}},
  price:{chip:'Price & offers',words:{'price':4,'cost':2,'how much':3,'how much is it':5,'how much is the mask':5,'how much are':4,'cheap*':3,'sale':3,'offer*':3,'deal':3,'black friday':5,'cyber monday':5,'discount':3,'bundle':3}},
  code:{chip:'Discount codes',words:{'code':5,'discount code':6,'promotion':4,'first order':3,'student':3,'apply code':6}},
  payment:{chip:'Payment',words:{'pay*':4,'card':3,'apple pay':6,'google pay':6,'paypal':6,'klarna':6,'clearpay':6,'secure':2,'checkout':3,'debit':3,'credit':3}},
  product:{chip:'About the mask',words:{'fit':3,'size':4,'sizing':4,'strap':3,'adjust*':3,'lash*':4,'eyelash*':4,'makeup':4,'make up':4,'light':3,'blackout':4,'block*':3,'dark':2,'side sleep*':5,'comfort*':3,'pressure':3,'3d':2,'contour*':3,'travel*':2,'plane':2,'flight':2,'nap':2,'migraine':2,'head':2}},
  material:{chip:'Material',words:{'material':5,'fabric':5,'made of':5,'cotton':4,'silk':4,'foam':4,'memory foam':5,'allerg*':4,'sensitive skin':4,'latex':4}},
  cleaning:{chip:'Cleaning',words:{'clean':5,'wash':5,'washing machine':6,'dry':3,'dryer':4,'iron':4,'dirty':3,'hygiene':2}},
  colours:{chip:'Colours',words:{'color*':4,'black':3,'pink':3,'grey':3,'which color':4}},
  account:{chip:'My account',words:{'account':4,'log in':4,'login':4,'sign in':4,'password':5,'forgot':3,'register':3,'sign up':4}},
  sleep:{chip:'Sleep tips',words:{'sleep tip*':6,"can't sleep":6,'cant sleep':6,'insomnia':5,'jet lag':6,'jetlag':6,'night shift*':6,'shift work*':6,'shifts':4,'nights':3,'light sleeper':6,'fall asleep':5,'wake up':3,'better sleep':5,'sleep better':5,'tired':3,'snoring partner':4}},
  warranty:{chip:'Warranty',words:{'warranty':7,'guarantee':6,'guaranteed':5,'how long does it last':5}},
  gift:{chip:'Gifts',words:{'gift*':6,'present':5,'christmas':4,'birthday':4,'wrap*':3,'for my mum':4,'for my wife':4,'for my husband':4,'for my girlfriend':4,'for my boyfriend':4}},
  stock:{chip:'Stock',words:{'in stock':7,'out of stock':7,'sold out':7,'restock':7,'back in stock':7,'available':3,'availability':4}},
  contact:{chip:'Contact details',words:{'email':3,'phone number':5,'whatsapp':5,'contact':4,'number':2,'address':2,'opening hours':4}}
 };

 function ctx(s){s=s||{};const price=Number.isInteger(s.price_pence)?s.price_pence:999;return {price,
  was:Number.isInteger(s.price_compare_at_pence)&&s.price_compare_at_pence>price?s.price_compare_at_pence:null,
  std:Number.isInteger(s.standard_delivery_pence)?s.standard_delivery_pence:299,
  exp:Number.isInteger(s.express_delivery_pence)?s.express_delivery_pence:399,
  free:Number.isInteger(s.free_delivery_threshold_pence)?s.free_delivery_threshold_pence:price*2}}

 const ANSWERS={
  greet:()=>'Hello! How can I help today? Ask me about delivery, returns, your order or the mask, or tap a topic below.',
  thanks:()=>'You’re welcome! Sleep well. If there’s anything else, just ask.',
  late:c=>'Sorry your order hasn’t arrived yet. UK Standard delivery usually takes about 3 business days (Express 1–2) after dispatch, and we email your tracking number when it ships. If it’s later than that, tap “Talk to a person” with your order number and we’ll chase it straight away.',
  track:()=>'When your order is dispatched we email you the tracking number (check your spam folder too). Standard delivery then takes about 3 business days. Can’t find the email? Tap “Talk to a person” and we’ll look it up.',
  delivery:c=>'UK Standard delivery is '+money(c.std)+' (about 3 business days) and free on orders of '+money(c.free)+' or more, so 2 masks ship free. UK Express is '+money(c.exp)+' (1–2 business days). Times are estimates and can vary around weekends and bank holidays.',
  abroad:()=>'At the moment we ship within the United Kingdom only, so we can’t deliver abroad yet.',
  returns:()=>'You can return an unused mask in its original packaging within 30 days of delivery for a refund. For hygiene reasons we can’t take back masks that have been opened or worn unless they’re faulty. Email hello@halonap.com with your order number to start. We refund within 14 days of receiving it. Full details: halonap.com/returns.html',
  faulty:()=>'Sorry about that! If your mask is faulty, damaged or the wrong item, we’ll put it right and pay the return postage, even if it’s been opened. Email hello@halonap.com with your order number and a photo, or tap “Talk to a person”.',
  change:()=>'To change or cancel an order, please tap “Talk to a person” with your order number as soon as possible. We can usually help if it hasn’t been dispatched yet. You also have a 14-day right to cancel after delivery.',
  price:c=>'The HALONAP 3D Contoured Sleep Mask is '+money(c.price)+' per mask'+(c.was?', down from '+money(c.was):'')+', in Black, Pink or Grey. Delivery is free on orders of '+money(c.free)+' or more.',
  code:()=>'If you have a discount code, you can enter it on the secure payment page at checkout (look for “Add promotion code”). The discount shows before you pay.',
  payment:()=>'You pay securely at checkout through Stripe using a debit or credit card. Depending on your device and browser, Apple Pay or Google Pay may also be offered there. We never see your full card details.',
  product:()=>'It’s a 3D contoured sleep mask: the shaped eye cups sit away from your eyes so there’s room to blink and for lashes, the adjustable strap fits most heads, and the design blocks light for sleep at home, naps or travel.',
  material:()=>'Good question. For exact fabric and filling details (for example if you have sensitive skin or allergies), tap “Talk to a person” and we’ll confirm for you.',
  cleaning:()=>'Hand wash gently in cold water (maximum 30°C), then air dry flat. Please don’t tumble dry or iron it.',
  colours:c=>'You can choose Black, Pink or Grey, all '+money(c.price)+'.',
  account:()=>'Use “Sign In” at the top of the page to log in or create an account. If you’ve forgotten your password, choose “Forgot password” there and we’ll email you a reset link.',
  sleep:()=>'A few things that help: keep a regular bedtime, avoid screens and bright light for the last hour, keep the room cool and dark, and cut caffeine after lunch. A contoured mask like HALONAP keeps light out without pressing on your eyes, which helps for naps, shift work and travel. If poor sleep goes on for weeks, it’s worth talking to your GP.',
  warranty:()=>'You have your full UK consumer-law rights if your mask is faulty, damaged or not as described, and we’ll put it right. We don’t advertise an extra fixed-term warranty. If there’s a problem, email hello@halonap.com with your order number and a short description (a photo helps).',
  gift:c=>'It makes a lovely gift for anyone who travels, naps or works shifts, at '+money(c.price)+' in Black, Pink or Grey, and 2 masks ship free. For gift wrapping or a gift message, please ask the team (tap “Talk to a person” or email hello@halonap.com) as I can’t confirm that here.',
  stock:()=>'If you can add a colour to your bag on the product page, it’s in stock and ready to ship. For restock dates of a sold-out colour, tap “Talk to a person” or email hello@halonap.com.',
  contact:()=>'You can email us at hello@halonap.com or message us on WhatsApp (button above). Or tap “Talk to a person” to chat with the team now.'
 };

 function score(text,words){let s=0;for(const [k,w] of Object.entries(words)){
  if(k.endsWith('*')){if(new RegExp(' '+k.slice(0,-1).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[a-z]*').test(text))s+=w}
  else if(text.includes(' '+k+' '))s+=w}return s}

 // Returns {intent} for a clear winner, {choices:[a,b]} when two topics tie, or {} when unsure.
 function match(q){
  const text=norm(q);if(!text.trim())return {};
  const ranked=Object.entries(INTENTS).map(([k,v])=>[k,score(text,v.words)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  if(!ranked.length)return {};
  const [top,second]=ranked;
  if(top[0]==='person'&&top[1]>=4)return {intent:'person'};
  if(top[1]<3&&!['greet','thanks'].includes(top[0]))return {};
  // "late" beats "track"/"delivery" when the customer says it hasn't come; it already scores higher.
  if(second&&second[1]>=3&&top[1]-second[1]<=1&&!['greet','thanks'].includes(second[0]))return {choices:[top[0],second[0]]};
  return {intent:top[0]};
 }
 const answer=(intent,settings)=>ANSWERS[intent]?ANSWERS[intent](ctx(settings)):null;
 const chip=intent=>INTENTS[intent]?.chip||intent;
 globalThis.HalonapChatBot={match,answer,chip,norm,INTENTS};
})();
