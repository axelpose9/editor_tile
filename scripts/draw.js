export default class FreeDrawTool {
    constructor(canvasController, getSelectedTiles, tileSize, tilesheet) {
        this.canvasController = canvasController;
        this.canvas = canvasController.canvas;
        this.ctx = canvasController.ctx;

        // Almacenamos la información de los tiles recibida desde main.js
        this.getSelectedTiles = getSelectedTiles;
        this.tileSize = tileSize;
        this.tilesheet = tilesheet;

        if (!this.ctx) {
            console.error('No se pudo obtener el contexto 2D del canvas');
        }

        this.drawing = false;

        // Método de evento: Maneja el MouseDown, MouseMove, MouseUp y Touch
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
    }

    enable() {
        // Añadimos los manejadores de eventos
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('touchstart', this.onTouchStart);
        this.canvas.addEventListener('touchmove', this.onTouchMove);
        window.addEventListener('touchend', this.onTouchEnd);
        console.log('Event listeners para FreeDrawTool añadidos.');
    }

    disable() {
        // Eliminamos los manejadores de eventos
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);
        console.log('Event listeners para FreeDrawTool eliminados.');
    }

    onMouseDown(e) {
        this.drawing = true;
        this.drawAt(e);
    }

    onMouseMove(e) {
        if (!this.drawing) return;
        this.drawAt(e);
    }

    onMouseUp() {
        this.drawing = false;
    }

    onTouchStart(e) {
        e.preventDefault();
        this.drawing = true;
        this.drawAt(e.touches[0]);
    }

    onTouchMove(e) {
        if (!this.drawing) return;
        this.drawAt(e.touches[0]);
    }

    onTouchEnd() {
        this.drawing = false;
    }

    drawAt(e) {
        const selectedTiles = this.getSelectedTiles();
        if (!selectedTiles || selectedTiles.length === 0) {
            console.warn('No hay tiles seleccionados. No se puede dibujar.');
            return;
        }
        if (!this.tilesheet || !this.tilesheet.complete) {
            console.error('El tilesheet no se ha cargado completamente.');
            return;
        }

        const tileInfo = selectedTiles[0];
        const tileSize = this.tileSize;

        const pos = this.getMousePos(e);

        // --- LÓGICA DE CÁLCULO MEJORADA ---
        // Usamos el método getTransformedPoint del CanvasController para
        // obtener las coordenadas del mouse ya ajustadas para todas las transformaciones.
        const transformedPoint = this.canvasController.getTransformedPoint(pos.x, pos.y);

        // Calculamos las posiciones de la celda de tile en la cuadrícula
        const col = Math.floor(transformedPoint.x / tileSize);
        const row = Math.floor(transformedPoint.y / tileSize);

        // Verificamos que las coordenadas estén dentro de los límites de la cuadrícula
        if (!this.canvasController.inBounds(col, row)) {
            return;
        }

        // Llamamos al método setTile del CanvasController
        this.canvasController.setTile(col, row, {
            image: this.tilesheet,
            sx: tileInfo.x * tileSize,
            sy: tileInfo.y * tileSize,
            size: tileSize
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}