// scripts/dropper.js

/**
 * Función para inyectar los estilos CSS del botón flotante en el documento.
 */
function injectFloatingStyles() {
    const styleId = 'dropper-floating-styles';
    if (document.getElementById(styleId)) return;

	const css = `
		/* Estilos para el bot�n flotante del cuentagotas */
		.dropper-floating-button {
			position: absolute;
			bottom: 20px;
			left: 20px; /* <--- CAMBIADO A IZQUIERDA */
			z-index: 99;
			width: 50px;
			height: 50px;
			border-radius: 50%;
			background-color: #06b6d4;
			color: white;
			border: none;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 1.5rem;
			transition: background-color 0.3s ease, transform 0.2s ease;
		}
		
		.dropper-floating-button:hover {
			background-color: #0891b2;
			transform: scale(1.05);
		}
		
		.dropper-floating-button:active {
			transform: scale(0.95);
		}
	`;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Clase que define la lógica de la herramienta cuentagotas.
 * Contiene los métodos para habilitar y deshabilitar el comportamiento de la herramienta.
 */
class DropperTool {
    constructor(canvasController, tileBox) {
        this.canvasController = canvasController;
        this.canvas = canvasController.canvas;
        this.ctx = canvasController.ctx;
        this.tileBox = tileBox;
        this.boundMouseDown = this.handleMouseDown.bind(this);
    }

    enable() {
        this.canvas.addEventListener('mousedown', this.boundMouseDown);
        this.canvas.style.cursor = 'copy';
        console.log('💧 Herramienta cuentagotas activada');
    }

    disable() {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
        this.canvas.style.cursor = 'default';
        console.log('Herramienta cuentagotas desactivada');
    }

    handleMouseDown(e) {
        const { col, row } = this.canvasController.getTileCoordinates(e);
        
        if (this.canvasController.inBounds(col, row)) {
            const tileData = this.canvasController.grid[row][col];
            
            if (tileData) {
                this.tileBox.selectTile(tileData.x, tileData.y);
            }
        }
    }
}

/**
 * Función principal para configurar el botón del cuentagotas.
 * Inyecta los estilos, crea el botón y le asigna el evento de clic.
 */
export function setupDropperTool(workspace, canvasController, tileBox, setActiveTool) {
    // 1. Inyecta los estilos CSS del botón flotante
    injectFloatingStyles();

    // 2. Verifica si el contenedor del área de trabajo existe
    if (!workspace) {
        console.error('El contenedor de trabajo (workspace) no fue encontrado.');
        return;
    }

    // 3. Crea el botón
    const dropperButton = document.createElement('button');
    dropperButton.id = 'dropperTool';
    dropperButton.className = 'dropper-floating-button';
    dropperButton.innerHTML = '<i class="fas fa-eye-dropper"></i>';

    // 4. Añade el botón al contenedor del área de trabajo
    workspace.appendChild(dropperButton);

    // 5. Asigna el evento de clic
    dropperButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropperTool = new DropperTool(canvasController, tileBox);
        setActiveTool(dropperTool);
    });

    return dropperButton;
}
