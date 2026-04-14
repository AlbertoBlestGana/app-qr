const CACHE_NAME="qr-app-v5";

self.addEventListener("install",e=>{
self.skipWaiting();
});

self.addEventListener("activate",event=>{
event.waitUntil(
caches.keys().then(keys=>{
return Promise.all(
keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
);
})
);
self.clients.claim();
});

self.addEventListener("fetch",event=>{
event.respondWith(
fetch(event.request).catch(()=>caches.match(event.request))
);
});
