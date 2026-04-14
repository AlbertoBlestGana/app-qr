let nombre="";
let apellido="";

let equipo="";
let curso="";

let paso="equipo";

let escaneando=false;

let qr;

const beep = new Audio("https://www.soundjay.com/buttons/beep-07.wav");

/* SERVICE WORKER */

if("serviceWorker" in navigator){
navigator.serviceWorker.register("service-worker.js");
}

/* LOGIN */

function guardarUsuario(){

nombre=document.getElementById("nombre").value.trim();
apellido=document.getElementById("apellido").value.trim();

if(!nombre || !apellido){
alert("Completa datos");
return;
}

localStorage.setItem("usuario",JSON.stringify({nombre,apellido}));

iniciarApp();

}

function cambiarUsuario(){

localStorage.removeItem("usuario");
location.reload();

}

/* APP */

function iniciarApp(){

const user=JSON.parse(localStorage.getItem("usuario"));

if(!user) return;

nombre=user.nombre;
apellido=user.apellido;

document.getElementById("login").style.display="none";
document.getElementById("app").style.display="block";

document.getElementById("usuario").innerText=`👤 ${nombre} ${apellido}`;

cargarHistorial();

iniciarEscaneo();

}

/* INICIAR ESCANEO */

async function iniciarEscaneo(){

qr = new Html5Qrcode("reader");

try{

await qr.start(
{ facingMode:"environment" },
{ fps:10, qrbox:{width:250,height:250} },
(text)=>procesarQR(text)
);

}catch{

const devices = await Html5Qrcode.getCameras();

let cameraId=devices[0].id;

for(let d of devices){

let label=d.label.toLowerCase();

if(label.includes("back")||label.includes("rear")||label.includes("environment")){
cameraId=d.id;
break;
}

}

await qr.start(
cameraId,
{ fps:10, qrbox:{width:250,height:250} },
(text)=>procesarQR(text)
);

}

}

/* PROCESAR QR */

async function procesarQR(text){

if(escaneando) return;

escaneando=true;

beep.play();

/* ESCANEA EQUIPO */

if(paso==="equipo"){

equipo=text;

document.getElementById("resultado").innerText="Equipo: "+equipo;

document.getElementById("btnSiguiente").style.display="inline-block";

await qr.pause(true);

}

/* ESCANEA CURSO */

else{

curso=text;

document.getElementById("resultado").innerText=`Equipo: ${equipo} | Curso: ${curso}`;

guardarRegistro();

paso="equipo";

equipo="";
curso="";

document.getElementById("btnSiguiente").style.display="none";

await qr.pause(true);

}

setTimeout(()=>escaneando=false,500);

}

/* BOTON SIGUIENTE */

async function siguientePaso(){

paso="curso";

document.getElementById("resultado").innerText="Escanea el curso";

document.getElementById("btnSiguiente").style.display="none";

await qr.resume();

}

/* GUARDAR */

function guardarRegistro(){

let registros=JSON.parse(localStorage.getItem("registros"))||[];

registros.push({
nombre,
apellido,
equipo,
curso,
fecha:new Date().toLocaleString()
});

localStorage.setItem("registros",JSON.stringify(registros));

cargarHistorial();

}

/* HISTORIAL */

function cargarHistorial(){

let registros=JSON.parse(localStorage.getItem("registros"))||[];

let html="";

registros.slice(-10).reverse().forEach(r=>{

html+=`<div>${r.nombre} ${r.apellido} | 📦 ${r.equipo} | 🎓 ${r.curso}</div>`;

});

document.getElementById("historial").innerHTML=html;

document.getElementById("contador").innerText="Escaneados: "+registros.length;

}

/* DESHACER */

function deshacer(){

let registros=JSON.parse(localStorage.getItem("registros"))||[];

if(registros.length===0){
alert("Nada que deshacer");
return;
}

registros.pop();

localStorage.setItem("registros",JSON.stringify(registros));

cargarHistorial();

}

/* EXPORTAR EXCEL MEJOR FORMATEADO */

function exportarExcel(){

let registros = JSON.parse(localStorage.getItem("registros")) || [];

if(registros.length===0){
alert("No hay registros");
return;
}

/* FORMATEAR DATOS */

let datos = registros.map(r => ({
Nombre: r.nombre,
Apellido: r.apellido,
Equipo: r.equipo,
Curso: r.curso,
Fecha: r.fecha
}));

let ws = XLSX.utils.json_to_sheet(datos);

/* ANCHO COLUMNAS */

ws["!cols"] = [
{ wch:18 },
{ wch:18 },
{ wch:15 },
{ wch:20 },
{ wch:22 }
];

/* WRAP TEXT */

Object.keys(ws).forEach(cell => {

if(cell[0] === "!") return;

if(!ws[cell].s) ws[cell].s = {};

ws[cell].s = {
alignment:{
wrapText:true,
vertical:"center",
horizontal:"center"
}
};

});

/* LIBRO */

let wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb, ws, "Registro");

/* NOMBRE ARCHIVO */

let fecha = new Date()
.toISOString()
.replace(/[:.]/g,"-");

/* EXPORTAR */

XLSX.writeFile(wb,"registro-"+fecha+".xlsx");

}

/* FINALIZAR */

function finalizarRegistro(){

if(!confirm("Exportar Excel y comenzar nuevo registro?")) return;

exportarExcel();

localStorage.removeItem("registros");

document.getElementById("resultado").innerText="";

paso="equipo";

cargarHistorial();

alert("Registro exportado y nuevo iniciado");

}

/* AUTO LOGIN */

window.onload=()=>{

if(localStorage.getItem("usuario")){
iniciarApp();
}

};
