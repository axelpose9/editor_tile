export default class ShapeTool {
    constructor(canvasController, getSelectedTiles, tileSize, tilesheet) {
        this.canvasController = canvasController;
        this.canvas = canvasController.canvas;
        this.ctx = this.canvas.getContext('2d');

        this.getSelectedTiles = getSelectedTiles;
        this.tileSize = tileSize;
        this.tilesheet = tilesheet;

        this.selectedShape = 'rectangle';
        this.isDrawing = false;
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: 0, y: 0 };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.draw = this.draw.bind(this);
    }
    
    enable() {
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);

        this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.onTouchEnd);

        this.isDrawing = false;
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: 0, y: 0 };
        this.canvasController.redraw();
        console.log('✏️ ShapeTool habilitado');
    }

    disable() {
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);

        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
        this.canvas.removeEventListener('touchend', this.onTouchEnd);
        
        this.isDrawing = false;
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: 0, y: 0 };
        this.canvasController.redraw();
    }
    
    setShape(shape) {
        this.selectedShape = shape;
    }

    onMouseDown(e) { this.onInputStart(e); }
    onMouseMove(e) { this.onInputMove(e); }
    onMouseUp(e) { this.onInputEnd(e); }

    onTouchStart(e) { 
        if (e.touches.length === 1) {
            e.preventDefault();
            this.onInputStart(e.touches[0]); 
        }
    }

    onTouchMove(e) { 
        if (e.touches.length === 1) {
            e.preventDefault();
            this.onInputMove(e.touches[0]); 
        }
    }

    onTouchEnd(e) {
        if (e.touches.length === 0) {
            this.onInputEnd();
        }
    }

    onInputStart(e) {
        if (!this.getSelectedTiles().length) {
            console.warn('Selecciona un tile primero para usar la herramienta de forma.');
            return;
        }
        this.isDrawing = true;
        this.startPos = this.getTransformedPos(e);
        this.endPos = this.startPos;
    }

    onInputMove(e) {
        if (!this.isDrawing) return;
        this.endPos = this.getTransformedPos(e);
        this.canvasController.redraw();
    }

    onInputEnd() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        this.drawFinalShape();
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: 0, y: 0 };
        this.canvasController.redraw();
    }
    
    drawFinalShape() {
        const selectedTiles = this.getSelectedTiles();
        if (!selectedTiles || selectedTiles.length === 0) return;
    
        const tileInfo = selectedTiles[0];
        const newTile = {
            image: this.tilesheet,
            sx: tileInfo.x * this.tileSize,
            sy: tileInfo.y * this.tileSize,
            size: this.tileSize
        };
    
        const startCol = Math.floor(this.startPos.x / this.tileSize);
        const startRow = Math.floor(this.startPos.y / this.tileSize);
        const endCol = Math.floor(this.endPos.x / this.tileSize);
        const endRow = Math.floor(this.endPos.y / this.tileSize);
    
        const drawTileFunc = (c, r) => {
            if (this.canvasController.inBounds(c, r)) {
                this.canvasController.setTile(c, r, newTile);
            }
        };
    
        switch (this.selectedShape) {
            case 'line':
                this.drawLine(startCol, startRow, endCol, endRow, drawTileFunc);
                break;
            case 'rectangle':
                this.drawRectangle(startCol, startRow, endCol, endRow, drawTileFunc);
                break;
            case 'circle':
                this.drawCircle(startCol, startRow, endCol, endRow, drawTileFunc);
                break;
        }
    }
    
    drawRectangle(startCol, startRow, endCol, endRow, drawFunc) {
        const minX = Math.min(startCol, endCol);
        const maxX = Math.max(startCol, endCol);
        const minY = Math.min(startRow, endRow);
        const maxY = Math.max(startRow, endRow);

        for (let r = minY; r <= maxY; r++) {
            for (let c = minX; c <= maxX; c++) {
                drawFunc(c, r);
            }
        }
    }

    drawCircle(startCol, startRow, endCol, endRow, drawFunc) {
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        
        const centerX = minCol + Math.floor((maxCol - minCol) / 2);
        const centerY = minRow + Math.floor((maxRow - minRow) / 2);
        
        const radiusX = Math.floor(Math.abs(maxCol - minCol) / 2);
        const radiusY = Math.floor(Math.abs(maxRow - minRow) / 2);

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const dx = c - centerX;
                const dy = r - centerY;
                
                if (radiusX === 0 && radiusY === 0) {
                    if (dx === 0 && dy === 0) {
                        drawFunc(c, r);
                    }
                    continue;
                } else if (radiusX === 0) {
                    if (dx === 0 && (dy * dy) / (radiusY * radiusY) <= 1) {
                        drawFunc(c, r);
                    }
                    continue;
                } else if (radiusY === 0) {
                    if ((dx * dx) / (radiusX * radiusX) <= 1 && dy === 0) {
                        drawFunc(c, r);
                    }
                    continue;
                }
                
                if (((dx * dx) / (radiusX * radiusX)) + ((dy * dy) / (radiusY * radiusY)) <= 1) {
                    drawFunc(c, r);
                }
            }
        }
    }

    drawLine(x0, y0, x1, y1, drawFunc) {
        let dx = Math.abs(x1 - x0);
        let dy = -Math.abs(y1 - y0);
        let sx = x0 < x1 ? 1 : -1;
        let sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;

        while (true) {
            drawFunc(x0, y0);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) {
                err += dy;
                x0 += sx;
            }
            if (e2 <= dx) {
                err += dx;
                y0 += sy;
            }
        }
    }
    
    // --- Métodos de Ayuda para el Dibujo y la Previsualización ---
    
    draw() {
        if (!this.isDrawing) return;
        
        this.ctx.save();
        
        this.ctx.translate(this.canvasController.panX, this.canvasController.panY);
        this.ctx.scale(this.canvasController.scale, this.canvasController.scale);
        
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 2 / this.canvasController.scale;
        this.ctx.setLineDash([5 / this.canvasController.scale, 5 / this.canvasController.scale]);

        const startX = this.startPos.x;
        const startY = this.startPos.y;
        const endX = this.endPos.x;
        const endY = this.endPos.y;
        
        const width = endX - startX;
        const height = endY - startY;

        switch (this.selectedShape) {
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                break;
            case 'rectangle':
            case 'circle':
                this.ctx.strokeRect(startX, startY, width, height);
                break;
        }
        
        this.ctx.restore();
    }
    
    getTransformedPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        return this.canvasController.getTransformedPoint(clientX, clientY);
    }
}