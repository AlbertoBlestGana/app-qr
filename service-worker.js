const CACHE="qr-registro-v4"

const ASSETS=[
"./",
"./index.html",
"./app.js",
"./manifest.json",
"./logo.png"
]

self.addEventListener("install",e=>{

e.waitUntil(
caches.open(CACHE).then(cache=>{
return cache.addAll(ASSETS)
})
)

self.skipWaiting()

})

self.addEventListener("activate",e=>{

e.waitUntil(
caches.keys().then(keys=>{
return Promise.all(
keys.map(key=>{
if(key!==CACHE){
return caches.delete(key)
}
})
)
})
)

self.clients.claim()

})

self.addEventListener("fetch",e=>{

e.respondWith(
caches.match(e.request).then(res=>{
return res || fetch(e.request)
})
)

})
