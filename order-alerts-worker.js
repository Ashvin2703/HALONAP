self.addEventListener('push', event => {
 const {id,body}=event.data.json();
 event.waitUntil(self.registration.showNotification('HALONAP Orders',{
  body,icon:'/halonap-o-192.png',tag:id || 'setup',data:{id},
  actions:id?[{action:'view',title:'View order'}]:[]
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const id=event.notification.data?.id;
 event.waitUntil(clients.openWindow('/admin.html'+(id?'?order='+encodeURIComponent(id):'')));
});
