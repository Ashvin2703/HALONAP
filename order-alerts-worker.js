self.addEventListener('push', event => {
 const data=event.data.json();
 if(data.kind==='chat'){
  // Live chat: same tag + renotify makes each repeat ring and vibrate again until someone answers.
  event.waitUntil(self.registration.showNotification('HALONAP Live Chat · Customer waiting',{
   body:data.body,icon:'/halonap-o-192.png',badge:'/halonap-o-96.png',tag:'chat-'+data.id,renotify:true,requireInteraction:true,
   vibrate:[400,200,400,200,400],data:{chat:data.id},actions:[{action:'answer',title:'Answer'}]
  }));
  return;
 }
 const {id,body}=data;
 event.waitUntil(self.registration.showNotification('HALONAP Orders',{
  body,icon:'/halonap-o-192.png',tag:id || 'setup',data:{id},
  actions:id?[{action:'view',title:'View order'}]:[]
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const chat=event.notification.data?.chat;
 if(chat){event.waitUntil(clients.openWindow('/admin.html?chat='+encodeURIComponent(chat)+'#live-chat'));return}
 const id=event.notification.data?.id;
 event.waitUntil(clients.openWindow('/admin.html'+(id?'?order='+encodeURIComponent(id):'')));
});
