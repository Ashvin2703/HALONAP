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
  person:{chip:'Talk to a person',words:{'talk to a person':6,'real person':6,'speak to someone':6,'speak to a person':6,'talk to someone':6,'human':5,'agent':4,'customer service':4,'staff':3,'call me':4,'phone me':4,'someone help':3,'live chat':3,'representative':4,'manager':3,'a person':4,'chat to a person':6,'chat to someone':6,'chat with someone':6,'talk to the team':6,'speak to the team':6,'put me through':6,'member of staff':6,'speak with':3,'connect me':5,'your team':4,'with your team':5}},
  greet:{words:{'hi':2,'hello':2,'hey':2,'good morning':2,'good evening':2,'good afternoon':2,'hiya':2,'hii':2,'helo':2}},
  thanks:{words:{'thank*':3,'thx':3,'cheers':3,'bye':2,'great':1,'perfect':1}},
  late:{chip:'My order hasn’t arrived',words:{'not arrived':6,"hasn't arrived":6,'hasnt arrived':6,'not received':6,"haven't received":6,'havent received':6,'still waiting':5,'not here':4,'late':3,'missing':4,'lost':4,'never came':6,'not come':5,'where is my order':6,'where s my order':6,'wheres my order':6,"where's my order":6,"where's my parcel":6,'where is my parcel':6,'wheres my parcel':6,'my parcel':3,'been a week':6,'a week':2,'turned up':5,'not turned up':6,'not delivered':8,'not been delivered':8,'order come':5,'come yet':5,'missing':7,'still not':4,'nothing yet':5,'and nothing':4,'still nothing':6,'overdue':7,'last week':3,'not arrived yet':7,'havent got':6,"haven't got":6,'should be here':7,'nothing has arrived':8,'not got it':6,'paid days ago':6}},
  track:{chip:'Track my order',words:{'track*':5,'where is my':3,'order status':5,'dispatch*':4,'shipped':3,'when will':2,'arrive':2,'tracking number':6,'posted':5,'been posted':6,'status':4,'have you sent':6,'sent my':4,'will it ship':6,'when will it':3,'dispatched yet':6,'royal mail tracking':6,'on its way':6,'whats my tracking':7,'left yet':6,'has my order left':8,'tracking link':7}},
  delivery:{chip:'Delivery',words:{'deliver*':6,'shipping':5,'ship':2,'courier':3,'express':3,'next day':3,'how long':3,'free delivery':5,'royal mail':3,'evri':3,'cost to send':3,'get it':2,'order today':5,'arrive by':4,'delivery time':5,'how much to post':8,'to post':4,'how many days':5,'charge for shipping':7,'only ship to':4}},
  abroad:{chip:'Do you ship abroad?',words:{'international':7,'abroad':5,'outside uk':9,'outside the uk':9,'ship to':2,'europe':4,'ireland':4,'usa':4,'us shipping':5,'america':4,'india':4,'overseas':5,'worldwide':5,'country':2,'countries':3,'ireland':8,'usa':8,'us':3,'united states':8,'america':8,'france':8,'germany':8,'spain':8,'italy':8,'netherlands':8,'canada':8,'australia':8,'india':8,'uae':8,'dubai':8,'worldwide':9,'international':9,'abroad':9,'overseas':9}},
  returns:{chip:'Returns',words:{'return*':5,'refund*':5,'send it back':5,'send back':5,'exchange':4,'money back':5,"don't like":3,'dont like':3,'change of mind':5,'changed my mind':5}},
  faulty:{chip:'Faulty or damaged',words:{'faulty':6,'broken':6,'damaged':6,'defect*':6,'ripped':5,'torn':5,'wrong item':6,'wrong colour':5,'wrong color':5,'not working':4,'stitching':4,'strap broke':6,'snapped':7,'snap':6,'broke':6,'fell apart':7,'came apart':7,'defective':7,'not as described':7,'hole':6,'a hole':7,'scratched':6,'stained':6}},
  change:{chip:'Change or cancel my order',words:{'cancel*':6,'change my order':6,'change order':5,'change address':6,'change my address':6,'update my address':6,'change my':3,'wrong address':6,'edit order':5,'add to my order':5,'change colour':4,'change color':4,'change the color':7,'add another':6,'edit my order':7,'update my delivery address':9,'update my address':8,'change my order':7,'delivery address':4,'wrong address':8,'shipping address':6,'change my shipping address':9,'swap':5,'swap the color':8,'before it ships':5,'mistake in my address':9,'mistake':3,'stop my order':9,'stop the order':9}},
  price:{chip:'Price & offers',words:{'price':4,'cost':2,'how much':3,'how much is it':5,'how much is the mask':5,'how much are':4,'cheap*':3,'sale':3,'offer*':3,'deal':3,'black friday':5,'cyber monday':5,'discount':3,'bundle':3,'cost of':4,'cost of the mask':6,'how much for':5,'what does it cost':7,'does it cost':5,'cheaper':4,'whats the cost':7,'the cost':4}},
  code:{chip:'Discount codes',words:{'code':5,'discount code':6,'promotion':4,'first order':3,'student':3,'apply code':6,'student discount':8,'first order discount':8,'nhs discount':8,'discount code':8,'promo code':8,'code isnt':6,'code not working':7}},
  payment:{chip:'Payment',words:{'pay*':4,'card':3,'apple pay':6,'google pay':6,'paypal':6,'klarna':6,'clearpay':6,'secure':2,'checkout':3,'debit':3,'credit':3,'amex':7,'american express':7,'mastercard':6,'visa':6,'didnt go through':6,'declined':6}},
  product:{chip:'About the mask',words:{'fit':3,'size':4,'sizing':4,'strap':3,'adjust*':3,'lash*':4,'eyelash*':4,'makeup':4,'make up':4,'light':3,'blackout':4,'block*':3,'dark':2,'side sleep*':5,'comfort*':3,'pressure':3,'3d':2,'contour*':3,'travel*':2,'plane':2,'flight':2,'nap':2,'migraine':2,'head':2,'press on':5,'press*':3,'good for travel':6,'plane':5,'flight*':5,'nap*':4,'airplane':5,'big head':6,'small head':6,'light in':4,'let light':5,'migraines':4}},
  material:{chip:'Material',words:{'material':5,'fabric':5,'made of':5,'cotton':4,'silk':4,'foam':4,'memory foam':5,'allerg*':4,'sensitive skin':4,'latex':4,'hypoallergenic':7,'hypo allergenic':7,'vegan':5,'polyester':5,'nylon':5}},
  cleaning:{chip:'Cleaning',words:{'clean':5,'wash':5,'washing machine':6,'dry':3,'dryer':4,'iron':4,'dirty':3,'hygiene':2,'machine washable':8,'washable':7}},
  colours:{chip:'Colours',words:{'color*':4,'black':3,'pink':3,'grey':3,'which color':4,'blue':4,'red':4,'white':4,'green':4,'purple':4,'navy':4,'beige':4,'other colors':6}},
  account:{chip:'My account',words:{'account':4,'log in':4,'login':4,'sign in':4,'password':5,'forgot':3,'register':3,'sign up':4}},
  sleep:{chip:'Sleep tips',words:{'sleep tip*':6,"can't sleep":6,'cant sleep':6,'insomnia':5,'jet lag':6,'jetlag':6,'night shift*':6,'shift work*':6,'shifts':4,'nights':3,'light sleeper':6,'fall asleep':5,'wake up':3,'better sleep':5,'sleep better':5,'tired':3,'snoring partner':4,'trouble sleeping':8,'sleeping':3,'sleep problems':7}},
  warranty:{chip:'Warranty',words:{'warranty':7,'guarantee':6,'guaranteed':5,'how long does it last':5,'breaks after':6,'after a few months':5,'stops working':5,'how long will it last':5}},
  gift:{chip:'Gifts',words:{'gift*':6,'present':5,'christmas':4,'birthday':4,'wrap*':3,'for my mum':4,'for my wife':4,'for my husband':4,'for my girlfriend':4,'for my boyfriend':4}},
  stock:{chip:'Stock',words:{'in stock':7,'out of stock':7,'sold out':7,'restock':7,'back in stock':7,'available':3,'availability':4,'stock':5}},
  about:{chip:'About HALONAP',words:{'about halonap':7,'who are you':6,'who runs':6,'who owns':6,'owner':4,'company':4,'brand':4,'where are you based':7,'where are you':4,'based':3,'uk company':5,'uk brand':5,'liverpool':5,'legit':5,'trust':4,'scam':5,'real company':6,'halonap mean':5,'what is halonap':8,'site safe':7,'is this site':5,'safe to buy':6,'safe to order':6,'who is behind':6,'halonap from':8,'real business':8,'who makes':7,'business':3,'made by':4}},
  inbox:{chip:"What's in the box",words:{'in the box':7,"what's included":7,'whats included':7,'what do i get':6,'comes with':5,'case':3,'pouch':4,'earplug*':5}},
  specs:{chip:'Size & details',words:{'dimension*':6,'measure*':5,'how big':5,'weight':5,'weigh*':6,'heavy':3,'cm':4,'specs':6,'specification*':6,'made in':5,'where is it made':6,'certif*':5,'100% blackout':6,'fully blackout':6,'cooling':5,'100 blackout':8,'size of':5,'size of the mask':8,'the size':4,'measurements':6}},
  compare:{chip:'Compared to others',words:{'compare*':6,'difference':5,'different from':6,'better than':6,'vs':4,'versus':5,'flat mask':6,'normal mask':5,'other masks':5,'why halonap':7,'why should i':5}},
  reviews:{chip:'Reviews',words:{'review*':6,'rating*':5,'stars':4,'what do people say':6,'customers say':6,'worth it':5,'any good':5,'happy with':5,'people happy':6,'any good reviews':6,'testimonials':6,'people like':6,'do people like':7}},
  vat:{chip:'VAT',words:{'vat':7,'tax':5,'invoice':5,'receipt':5}},
  privacy:{chip:'Privacy',words:{'privacy':7,'my data':6,'personal data':6,'gdpr':7,'delete my':5,'unsubscribe':6,'marketing email*':5}},
  contact:{chip:'Contact details',words:{'email':3,'phone number':5,'whatsapp':5,'contact':4,'number':2,'address':2,'opening hours':4,'your number':6,'phone':3,'call you':5,'reach you':5,'get in touch':6}}
 };

 function ctx(s){s=s||{};const price=Number.isInteger(s.price_pence)?s.price_pence:999;return {price,
  was:Number.isInteger(s.price_compare_at_pence)&&s.price_compare_at_pence>price?s.price_compare_at_pence:null,
  std:Number.isInteger(s.standard_delivery_pence)?s.standard_delivery_pence:299,
  exp:Number.isInteger(s.express_delivery_pence)?s.express_delivery_pence:399,
  free:Number.isInteger(s.free_delivery_threshold_pence)?s.free_delivery_threshold_pence:price*2}}

 const ANSWERS={
  greet:()=>'Hello! How can I help today? Ask me about delivery, returns, your order or the mask, or tap a topic below.',
  thanks:()=>'You’re welcome! Sleep well. If there’s anything else, just ask.',
  late:c=>'Sorry your order hasn’t arrived yet. UK Standard delivery usually takes about 3 business days (Express 1–2) after dispatch, and we email your tracking number when it ships. If it’s later than that, type “talk to a person” with your order number and we’ll chase it straight away.',
  track:()=>'When your order is dispatched we email you the tracking number (check your spam folder too). Standard delivery then takes about 3 business days. Can’t find the email? Type “talk to a person” and we’ll look it up.',
  delivery:c=>'UK Standard delivery is '+money(c.std)+' (about 3 business days) and free on orders of '+money(c.free)+' or more, so 2 masks ship free. UK Express is '+money(c.exp)+' (1–2 business days). Times are estimates and can vary around weekends and bank holidays.',
  abroad:()=>'At the moment we ship within the United Kingdom only, so we can’t deliver abroad yet.',
  returns:()=>'You can return an unused mask in its original packaging within 30 days of delivery for a refund. For hygiene reasons we can’t take back masks that have been opened or worn unless they’re faulty. Email hello@halonap.com with your order number to start. We refund within 14 days of receiving it. Full details: halonap.com/returns.html',
  faulty:()=>'Sorry about that! If your mask is faulty, damaged or the wrong item, we’ll put it right and pay the return postage, even if it’s been opened. Email hello@halonap.com with your order number and a photo, or type “talk to a person”.',
  change:()=>'To change or cancel an order, please type “talk to a person” with your order number as soon as possible. We can usually help if it hasn’t been dispatched yet. You also have a 14-day right to cancel after delivery.',
  price:c=>'The HALONAP 3D Contoured Sleep Mask is '+money(c.price)+' per mask'+(c.was?', down from '+money(c.was):'')+', in Black, Pink or Grey. Delivery is free on orders of '+money(c.free)+' or more.',
  code:()=>'If you have a discount code, you can enter it on the secure payment page at checkout (look for “Add promotion code”). The discount shows before you pay.',
  payment:()=>'You pay securely at checkout through Stripe using a debit or credit card. Depending on your device and browser, Apple Pay or Google Pay may also be offered there. We never see your full card details.',
  product:()=>'It’s a 3D contoured sleep mask: the shaped eye cups sit away from your eyes so there’s room to blink and for lashes, the adjustable strap fits most heads, and the design blocks light for sleep at home, naps or travel.',
  material:()=>'Good question. For exact fabric and filling details (for example if you have sensitive skin or allergies), type “talk to a person” and we’ll confirm for you.',
  cleaning:()=>'Hand wash gently in cold water (up to 30°C), then air dry flat. Please don’t iron it.',
  colours:c=>'You can choose Black, Pink or Grey, all '+money(c.price)+'.',
  account:()=>'Use “Sign In” at the top of the page to log in or create an account. If you’ve forgotten your password, choose “Forgot password” there and we’ll email you a reset link.',
  sleep:()=>'A few things that help: keep a regular bedtime, avoid screens and bright light for the last hour, keep the room cool and dark, and cut caffeine after lunch. A contoured mask like HALONAP keeps light out without pressing on your eyes, which helps for naps, shift work and travel. If poor sleep goes on for weeks, it’s worth talking to your GP.',
  warranty:()=>'You have your full UK consumer-law rights if your mask is faulty, damaged or not as described, and we’ll put it right. We don’t advertise an extra fixed-term warranty. If there’s a problem, email hello@halonap.com with your order number and a short description (a photo helps).',
  gift:c=>'It makes a lovely gift for anyone who travels, naps or works shifts, at '+money(c.price)+' in Black, Pink or Grey, and 2 masks ship free. For gift wrapping or a gift message, please ask the team (type “talk to a person” or email hello@halonap.com) as I can’t confirm that here.',
  stock:()=>'If you can add a colour to your bag on the product page, it’s in stock and ready to ship. For restock dates of a sold-out colour, type “talk to a person” or email hello@halonap.com.',
  about:()=>'HALONAP is a UK sleep brand, “Made for switching off”. It’s run by Ashvin Vattaparamban as a sole trader based at 81 Henry Street, Liverpool, L1 5BU. We sell one thing and focus on doing it well: the HALONAP 3D Contoured Sleep Mask. Questions any time at hello@halonap.com.',
  inbox:()=>'In the box you get one HALONAP 3D sleep eye mask in the colour you chose. Nothing else is listed as included, so if you’re after earplugs or a pouch, I can’t promise those.',
  specs:()=>'The mask has sculpted 3D eye pockets, an adjustable strap, a soft-feel finish and a design that reduces unwanted light. Exact measurements, weight, fabric and where it’s made aren’t listed on our website yet. Type “talk to a person” or email hello@halonap.com and the team will confirm.',
  compare:()=>'Compared with basic flat masks, HALONAP has 3D contoured eye pockets that give your eyes and lashes room instead of pressing on them, plus an adjustable strap, a soft-feel finish and a travel-friendly design. (General comparison only: other masks vary.)',
  reviews:()=>'Customers rate it highly. Reviewers mention it feels soft and comfortable, the adjustable strap makes it easy to wear and it blocks out light well. You can read every review, or write your own, in the Reviews section of our homepage.',
  vat:()=>'HALONAP isn’t registered for VAT, so there’s no VAT on our prices. Your order confirmation email shows what you paid. If you need a receipt, email hello@halonap.com with your order number.',
  privacy:()=>'We only collect what we need to run the shop (like your name, email, address and order), under UK GDPR. Card payments are handled securely by Stripe. To ask about or delete your data, email hello@halonap.com with “Privacy” in the subject. Full details: halonap.com/privacy.html',
  contact:()=>'You can email us at hello@halonap.com or message us on WhatsApp (button above). Or type “talk to a person” to chat with the team now.'
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
