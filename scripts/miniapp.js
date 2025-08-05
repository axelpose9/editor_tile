// miniapp.js

function ajustarComoApp() {
	const estilo = document.createElement("style");
	estilo.innerHTML = `
		html, body {
			margin: 0;
			padding: 0;
			background: #000;
			color: #fff;
			font-family: sans-serif;
			overflow: hidden;
			height: 100%;
			touch-action: manipulation;
			-webkit-user-select: none;
			user-select: none;
			-webkit-tap-highlight-color: transparent;
		}
	`;
	document.head.appendChild(estilo);
}

function evitarZoom() {
	const meta = document.createElement("meta");
	meta.name = "viewport";
	meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
	document.head.appendChild(meta);
}

function desactivarSeleccion() {
	document.body.style.userSelect = "none";
	document.body.style.webkitUserSelect = "none";
}

function pantallaCompleta() {
	if (document.documentElement.requestFullscreen) {
		document.documentElement.requestFullscreen();
	}
}

function fijarOrientacion(orientacion = 'portrait') {
	if (screen.orientation && screen.orientation.lock) {
		screen.orientation.lock(orientacion).catch(() => {});
	}
}

function vibrar(ms = 200) {
	if (navigator.vibrate) navigator.vibrate(ms);
}

function esDispositivoMovil() {
	return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
}

function entrarPantallaCompleta() {
	let el = document.documentElement;
	if (el.requestFullscreen) el.requestFullscreen();
	else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}



