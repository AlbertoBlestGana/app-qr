let nombre=""
let equipo=""
let curso=""

let paso="equipo"

let qr=null
let scanning=false
let cooldown=false

const beep=new Audio("https://www.soundjay.com/buttons/beep-07.wav")

/* SERVICE WORKER */

if("serviceWorker" in navigator){
navigator.serviceWorker.register("service-worker.js")
}

/* PEDIR PERMISO DE CAMARA SOLO UNA VEZ */

async function prepararCamara(){

try{

const stream=await navigator.mediaDevices.getUserMedia({video:true})

stream.getTracks().forEach(track=>track.stop())

}catch(e){}

}

/* LOGIN */

function guardarUsuario(){

let nombreCompleto=document.getElementById("nombreCompleto").value.trim()

if(!nombreCompleto){
alert("Completa el nombre")
return
}

localStorage.setItem("usuario",JSON.stringify({nombreCompleto}))

iniciarApp()

}

/* SIGUIENTE ESTUDIANTE */

async function siguienteEstudiante(){

if(qr && scanning){
await qr.stop()
scanning=false
}

localStorage.removeItem("usuario")

document.getElementById("app").style.display="none"
document.getElementById("login").style.display="block"

document.getElementById("nombreCompleto").value=""
document.getElementById("resultado").innerText=""

paso="equipo"

}

/* APP */

function iniciarApp(){

const user=JSON.parse(localStorage.getItem("usuario"))

if(!user)return

nombre=user.nombreCompleto

document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

document.getElementById("usuario").innerText="👤 "+nombre

cargarHistorial()

setTimeout(()=>{
iniciarEscaneo()
},50)

}

/* ESCANEO */

async function iniciarEscaneo(){

if(scanning)return

qr=new Html5Qrcode("reader")

try{

await qr.start(
{facingMode:"environment"},
{fps:12,qrbox:{width:250,height:250}},
onScan
)

}catch{

const devices=await Html5Qrcode.getCameras()

let cam=devices[0].id

for(let d of devices){

let label=d.label.toLowerCase()

if(label.includes("back")||label.includes("rear")||label.includes("environment")){
cam=d.id
break
}

}

await qr.start(cam,{fps:12,qrbox:{width:250,height:250}},onScan)

}

scanning=true

}

async function detenerEscaneo(){

if(!scanning)return

await qr.stop()

scanning=false

}

/* SCAN */

async function onScan(text){

if(cooldown)return

cooldown=true

beep.play()

await detenerEscaneo()

if(paso==="equipo"){

equipo=text

document.getElementById("resultado").innerText="Equipo: "+equipo

document.getElementById("btnSiguiente").style.display="inline-block"

}else{

curso=text

document.getElementById("resultado").innerText=`Equipo: ${equipo} | Curso: ${curso}`

guardarRegistro()

paso="equipo"

equipo=""
curso=""

}

setTimeout(()=>cooldown=false,600)

}

/* SIGUIENTE */

function siguientePaso(){

paso="curso"

document.getElementById("resultado").innerText="Escanea el curso"

document.getElementById("btnSiguiente").style.display="none"

setTimeout(()=>iniciarEscaneo(),10)

}

/* GUARDAR */

function guardarRegistro(){

let registros=JSON.parse(localStorage.getItem("registros"))||[]

registros.push({
nombre,
equipo,
curso,
fecha:new Date().toLocaleString()
})

localStorage.setItem("registros",JSON.stringify(registros))

cargarHistorial()

}

/* HISTORIAL */

function cargarHistorial(){

let registros=JSON.parse(localStorage.getItem("registros"))||[]

let ultimos=registros.slice(-10).reverse()

let html=""

ultimos.forEach(r=>{
html+=`<div>${r.nombre} | 📦 ${r.equipo} | 🎓 ${r.curso}</div>`
})

document.getElementById("historial").innerHTML=html

document.getElementById("contador").innerText="Escaneados: "+registros.length

}

/* DESHACER */

function deshacer(){

let registros=JSON.parse(localStorage.getItem("registros"))||[]

if(!registros.length){
alert("Nada que deshacer")
return
}

registros.pop()

localStorage.setItem("registros",JSON.stringify(registros))

cargarHistorial()

}

/* EXCEL */

function exportarExcel(){

let registros=JSON.parse(localStorage.getItem("registros"))||[]

if(!registros.length){
alert("No hay registros")
return
}

let datos=registros.map(r=>({
Nombre:r.nombre,
Equipo:r.equipo,
Curso:r.curso,
Fecha:r.fecha
}))

let ws=XLSX.utils.json_to_sheet(datos)

ws["!cols"]=[
{wch:20},
{wch:15},
{wch:18},
{wch:22}
]

let wb=XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,ws,"Registro")

let fecha=new Date().toISOString().replace(/[:.]/g,"-")

XLSX.writeFile(wb,"registro-"+fecha+".xlsx")

}

/* FINALIZAR */

function finalizarRegistro(){

if(!confirm("Exportar Excel y limpiar registro?"))return

exportarExcel()

localStorage.removeItem("registros")

document.getElementById("resultado").innerText=""

paso="equipo"

cargarHistorial()

}

/* AUTO LOGIN */

window.onload=()=>{

prepararCamara()

if(localStorage.getItem("usuario")){
iniciarApp()
}

}
