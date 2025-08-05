export default class LienzoController {
    /**
     * @param {HTMLCanvasElement} canvas El elemento canvas.
     * @param {CanvasController} canvasController La instancia del controlador principal del canvas.
     */
    constructor(canvas, canvasController) {
        this.canvas = canvas;
        this.canvasCtrl = canvasController;
        this.isPanning = false;
        // Variable para el pan con dos dedos
        this.isTwoFingerPanning = false;
        this.lastX = null;
        this.lastY = null;
        this.lastTouchDistance = null;

        // Opciones de zoom
        this.minScale = 0.1;
        this.maxScale = 5.0;
        this.zoomSensitivity = 0.0005;

        // Bindea los manejadores de eventos al objeto de la clase
        this.handleWheel = this.handleWheel.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.setupEvents();
    }

    /**
     * Configura los escuchadores de eventos para las interacciones del usuario.
     */
    setupEvents() {
        this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        window.addEventListener('touchend', this.handleTouchEnd);

        // Previene el zoom nativo del navegador en dispositivos táctiles
        this.canvas.addEventListener('gesturestart', (e) => e.preventDefault());
    }

    /**
     * Maneja el evento de la rueda del mouse para el zoom.
     * @param {WheelEvent} e El evento de la rueda del mouse.
     */
    handleWheel(e) {
        e.preventDefault();

        const oldScale = this.canvasCtrl.scale;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - this.canvasCtrl.panX) / oldScale;
        const worldY = (mouseY - this.canvasCtrl.panY) / oldScale;

        const zoomFactor = 1 + e.deltaY * -this.zoomSensitivity;
        const newScale = oldScale * zoomFactor;
        
        this.canvasCtrl.scale = Math.max(this.minScale, Math.min(newScale, this.maxScale));

        this.canvasCtrl.panX = mouseX - worldX * this.canvasCtrl.scale;
        this.canvasCtrl.panY = mouseY - worldY * this.canvasCtrl.scale;

        this.canvasCtrl.redraw();
    }
    
    /**
     * Inicia el paneo del lienzo al presionar el botón del medio del mouse.
     * @param {MouseEvent} e El evento del mouse.
     */
    handleMouseDown(e) {
        if (e.button === 1) { // Clic del medio
            e.preventDefault();
            this.isPanning = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    /**
     * Finaliza el paneo del lienzo al soltar el botón del mouse.
     * @param {MouseEvent} e El evento del mouse.
     */
    handleMouseUp(e) {
        if (e.button === 1) {
            this.isPanning = false;
            this.canvas.style.cursor = 'grab';
        }
    }

    /**
     * Maneja el movimiento del mouse para actualizar el paneo.
     * @param {MouseEvent} e El evento del mouse.
     */
    handleMouseMove(e) {
        if (this.isPanning) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            this.canvasCtrl.panX += dx;
            this.canvasCtrl.panY += dy;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvasCtrl.redraw();
        }
    }
    
    /**
     * Inicia el paneo y zoom táctil con dos dedos.
     * @param {TouchEvent} e El evento táctil.
     */
    handleTouchStart(e) {
        e.preventDefault(); // Previene el comportamiento por defecto del navegador

        // Manejo exclusivo de dos dedos (zoom y pan)
        if (e.touches.length === 2) {
            this.isTwoFingerPanning = true;
            this.isPanning = false; // Desactiva el pan de un dedo si estuviera activo
            this.lastTouchDistance = this.getTouchDistance(e);
            this.lastX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            this.lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
        // Si hay solo un dedo o más de dos, no hacemos nada de pan o zoom
        else {
            this.isTwoFingerPanning = false;
            this.isPanning = false;
        }
    }

    /**
     * Maneja el movimiento táctil para actualizar el zoom y el paneo.
     * @param {TouchEvent} e El evento táctil.
     */
    handleTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 2 && this.isTwoFingerPanning) {
            const oldScale = this.canvasCtrl.scale;
            const rect = this.canvas.getBoundingClientRect();
            
            // Calcula el punto medio de los toques actuales
            const touchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const touchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            // --- Lógica del Paneo ---
            const dx = touchCenterX - this.lastX;
            const dy = touchCenterY - this.lastY;

            this.canvasCtrl.panX += dx;
            this.canvasCtrl.panY += dy;

            // --- Lógica del Zoom ---
            const currentDistance = this.getTouchDistance(e);
            if (this.lastTouchDistance !== null && this.lastTouchDistance !== 0) {
                const scaleFactor = currentDistance / this.lastTouchDistance;
                const newScale = Math.max(this.minScale, Math.min(oldScale * scaleFactor, this.maxScale));
                
                // Mantiene el centro del zoom
                const midpointX = touchCenterX - rect.left;
                const midpointY = touchCenterY - rect.top;

                const worldX = (midpointX - this.canvasCtrl.panX) / oldScale;
                const worldY = (midpointY - this.canvasCtrl.panY) / oldScale;

                this.canvasCtrl.scale = newScale;
                this.canvasCtrl.panX = midpointX - worldX * newScale;
                this.canvasCtrl.panY = midpointY - worldY * newScale;
            }

            // Actualiza los valores para el siguiente movimiento
            this.lastTouchDistance = currentDistance;
            this.lastX = touchCenterX;
            this.lastY = touchCenterY;

            this.canvasCtrl.redraw();
        }
    }

    /**
     * Finaliza los gestos táctiles.
     */
    handleTouchEnd() {
        this.isPanning = false; // El pan con mouse se resetea
        this.isTwoFingerPanning = false; // El pan de dos dedos también
        this.lastTouchDistance = null;
        this.lastX = null;
        this.lastY = null;
    }

    /**
     * Calcula la distancia entre dos toques táctiles.
     * @param {TouchEvent} e El evento táctil.
     * @returns {number} La distancia entre los dos toques.
     */
    getTouchDistance(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}