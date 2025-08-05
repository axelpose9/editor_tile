export default class EraseTool {
    constructor(canvasController) {
        this.canvasController = canvasController;
        this.canvas = canvasController.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = canvasController.tileSize;

        this.drawing = false;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
    }

    enable() {
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);

        this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.onTouchEnd);

        console.log('🧽 EraseTool habilitado');
    }

    disable() {
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);

        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
        this.canvas.removeEventListener('touchend', this.onTouchEnd);
    }
    
    onInputStart(e) {
        this.drawing = true;
        this.eraseAt(e);
    }

    onInputMove(e) {
        if (this.drawing) {
            this.eraseAt(e);
        }
    }

    onMouseUp() {
        this.drawing = false;
    }

    onMouseDown(e) {
        this.onInputStart(e);
    }

    onMouseMove(e) {
        this.onInputMove(e);
    }

    onTouchStart(e) {
        e.preventDefault();
        this.onInputStart(e.touches[0]);
    }

    onTouchMove(e) {
        e.preventDefault();
        this.onInputMove(e.touches[0]);
    }

    onTouchEnd() {
        this.onMouseUp();
    }

    eraseAt(inputEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = inputEvent.clientX - rect.left;
        const y = inputEvent.clientY - rect.top;

        // La línea corregida está aquí
        const transformedPoint = this.canvasController.getTransformedPoint(x, y);

        const col = Math.floor(transformedPoint.x / this.tileSize);
        const row = Math.floor(transformedPoint.y / this.tileSize);

        // Log de la grilla antes de borrar
        console.log('Grilla antes de borrar:', this.canvasController.grid);

        if (this.canvasController.inBounds(col, row)) {
            console.log(`Borrando tile en (${col}, ${row})`);
            this.canvasController.clearTile(col, row);
        }

        // Log de la grilla después de borrar
        console.log('Grilla después de borrar:', this.canvasController.grid);
    }
}