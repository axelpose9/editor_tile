export default class SelectionTool {
    constructor(canvasController) {
        this.canvasController = canvasController;
        this.canvas = canvasController.canvas;
        this.ctx = canvasController.ctx;
        this.tileSize = canvasController.tileSize;
        
        this.isSelecting = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isFirstDrag = true;
        
        this.selectedTiles = [];
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
        this.originalSelectionRect = { x: 0, y: 0, width: 0, height: 0 };
        this.dragStartSelectionRect = null;
        this.tilesToMove = [];
        this.hiddenTiles = [];

        this.boundMouseDown = this.handleMouseDown.bind(this);
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseUp = this.handleMouseUp.bind(this);

        this.boundTouchStart = this.handleTouchStart.bind(this);
        this.boundTouchMove = this.handleTouchMove.bind(this);
        this.boundTouchEnd = this.handleTouchEnd.bind(this);
    }
    
    enable() {
        this.canvas.addEventListener('mousedown', this.boundMouseDown);
        this.canvas.addEventListener('mousemove', this.boundMouseMove);
        this.canvas.addEventListener('mouseup', this.boundMouseUp);
        
        this.canvas.addEventListener('touchstart', this.boundTouchStart);
        this.canvas.addEventListener('touchmove', this.boundTouchMove);
        this.canvas.addEventListener('touchend', this.boundTouchEnd);

        this.canvas.style.cursor = 'crosshair';
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
        this.selectedTiles = [];
        this.isFirstDrag = true;
        this.canvasController.redraw(); 
    }

    disable() {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
        this.canvas.removeEventListener('mousemove', this.boundMouseMove);
        this.canvas.removeEventListener('mouseup', this.boundMouseUp);
        
        this.canvas.removeEventListener('touchstart', this.boundTouchStart);
        this.canvas.removeEventListener('touchmove', this.boundTouchMove);
        this.canvas.removeEventListener('touchend', this.boundTouchEnd);

        this.canvas.style.cursor = 'default';
        
        this.commitTilesToGrid();
        
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
        this.selectedTiles = [];
        this.tilesToMove = [];
        this.isFirstDrag = true;
        this.canvasController.redraw();
    }
    
    // --- Nuevo método para obtener la posición del mouse en el lienzo ---
    getCanvasMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        const mouseX = (clientX - rect.left - this.canvasController.panX) / this.canvasController.scale;
        const mouseY = (clientY - rect.top - this.canvasController.panY) / this.canvasController.scale;
        return { x: mouseX, y: mouseY };
    }

    commitTilesToGrid() {
        if (this.tilesToMove.length > 0) {
            const finalSnapX = Math.round(this.selectionRect.x / this.tileSize) * this.tileSize;
            const finalSnapY = Math.round(this.selectionRect.y / this.tileSize) * this.tileSize;
            
            this.tilesToMove.forEach(tileData => {
                const relativeX = tileData.col * this.tileSize - this.originalSelectionRect.x;
                const relativeY = tileData.row * this.tileSize - this.originalSelectionRect.y;

                const newCol = Math.floor((finalSnapX + relativeX) / this.tileSize);
                const newRow = Math.floor((finalSnapY + relativeY) / this.tileSize);

                if (this.canvasController.inBounds(newCol, newRow)) {
                    this.canvasController.grid[newRow][newCol] = tileData.tile;
                }
            });
            this.tilesToMove = [];
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.handleMouseDown(e);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.handleMouseMove(e);
        }
    }

    handleTouchEnd(e) {
        this.handleMouseUp(e);
    }

    handleMouseDown(e) {
        const { x: mouseX, y: mouseY } = this.getCanvasMousePosition(e);
        
        const isClickInsideSelection = this.selectedTiles.length > 0 &&
            mouseX >= this.selectionRect.x && mouseX <= this.selectionRect.x + this.selectionRect.width &&
            mouseY >= this.selectionRect.y && mouseY <= this.selectionRect.y + this.selectionRect.height;
        
        if (isClickInsideSelection) {
            this.isDragging = true;
            this.dragOffset = { x: mouseX - this.selectionRect.x, y: mouseY - this.selectionRect.y };
            this.dragStartSelectionRect = { ...this.selectionRect };
            
            if (this.isFirstDrag) {
                const startCol = Math.floor(this.originalSelectionRect.x / this.tileSize);
                const startRow = Math.floor(this.originalSelectionRect.y / this.tileSize);
                const endCol = startCol + Math.floor(this.originalSelectionRect.width / this.tileSize);
                const endRow = startRow + Math.floor(this.originalSelectionRect.height / this.tileSize);
                
                this.tilesToMove = [];
                for (let r = startRow; r < endRow; r++) {
                    for (let c = startCol; c < endCol; c++) {
                        if (this.canvasController.inBounds(c, r) && this.canvasController.grid[r][c]) {
                            this.tilesToMove.push({
                                col: c,
                                row: r,
                                tile: this.canvasController.grid[r][c]
                            });
                            this.canvasController.grid[r][c] = null;
                        }
                    }
                }
                this.isFirstDrag = false;
            }
        } else {
            this.commitTilesToGrid();
            this.selectedTiles = [];
            this.isSelecting = true;
            this.selectionRect = {
                x: Math.floor(mouseX / this.tileSize) * this.tileSize,
                y: Math.floor(mouseY / this.tileSize) * this.tileSize,
                width: 0,
                height: 0
            };
            this.originalSelectionRect = { ...this.selectionRect };
            this.isFirstDrag = true;
        }
    }

    handleMouseMove(e) {
        if (!this.isSelecting && !this.isDragging) return;

        const { x: mouseX, y: mouseY } = this.getCanvasMousePosition(e);

        if (this.isSelecting) {
            const startX = this.originalSelectionRect.x;
            const startY = this.originalSelectionRect.y;
            const endX = Math.floor(mouseX / this.tileSize) * this.tileSize;
            const endY = Math.floor(mouseY / this.tileSize) * this.tileSize;

            this.selectionRect.x = Math.min(startX, endX);
            this.selectionRect.y = Math.min(startY, endY);
            this.selectionRect.width = Math.abs(startX - endX) + this.tileSize;
            this.selectionRect.height = Math.abs(startY - endY) + this.tileSize;
        }

        if (this.isDragging) {
            this.selectionRect.x = mouseX - this.dragOffset.x;
            this.selectionRect.y = mouseY - this.dragOffset.y;  
        }
        
        this.canvasController.redraw();
    }

    handleMouseUp() {
        if (this.isSelecting) {
            this.isSelecting = false;
            
            if (this.selectionRect.width > 0 && this.selectionRect.height > 0) {
                const startCol = Math.floor(this.selectionRect.x / this.tileSize);
                const startRow = Math.floor(this.selectionRect.y / this.tileSize);
                const endCol = startCol + Math.floor(this.selectionRect.width / this.tileSize);
                const endRow = startRow + Math.floor(this.selectionRect.height / this.tileSize);
                
                this.selectedTiles = [];
                for (let r = startRow; r < endRow; r++) {
                    for (let c = startCol; c < endCol; c++) {
                        if (this.canvasController.inBounds(c, r) && this.canvasController.grid[r][c]) {
                            this.selectedTiles.push({
                                originalX: c * this.tileSize,
                                originalY: r * this.tileSize,
                                tile: this.canvasController.grid[r][c]
                            });
                        }
                    }
                }
                this.originalSelectionRect = { ...this.selectionRect };
            } else {
                this.selectedTiles = [];
                this.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
                this.originalSelectionRect = { x: 0, y: 0, width: 0, height: 0 };
            }
        }

        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'crosshair';

            // Snap de la selección a la grilla después de mover
            const finalSnapX = Math.round(this.selectionRect.x / this.tileSize) * this.tileSize;
            const finalSnapY = Math.round(this.selectionRect.y / this.tileSize) * this.tileSize;
            
            this.selectionRect = {
                x: finalSnapX,
                y: finalSnapY,
                width: this.originalSelectionRect.width,
                height: this.originalSelectionRect.height
            };
            this.canvasController.redraw();
        }
    }
    
    draw() {
        this.ctx.save();
        this.ctx.translate(this.canvasController.panX, this.canvasController.panY);
        this.ctx.scale(this.canvasController.scale, this.canvasController.scale);
        if (this.canvasController.rotation !== 0) {
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate(this.canvasController.rotation * Math.PI / 180);
            this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        }

        if (this.isSelecting || this.selectedTiles.length > 0) {
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 2 / this.canvasController.scale; // Línea con grosor constante
            this.ctx.setLineDash([5 / this.canvasController.scale, 5 / this.canvasController.scale]);
            this.ctx.strokeRect(
                this.selectionRect.x, 
                this.selectionRect.y, 
                this.selectionRect.width, 
                this.selectionRect.height
            );
            this.ctx.setLineDash([]);
        }

        if (this.tilesToMove.length > 0) {
            this.tilesToMove.forEach(tileData => {
                const relativeX = tileData.col * this.tileSize - this.originalSelectionRect.x;
                const relativeY = tileData.row * this.tileSize - this.originalSelectionRect.y;
                
                this.ctx.drawImage(
                    tileData.tile.image,
                    tileData.tile.sx, tileData.tile.sy, this.tileSize, this.tileSize,
                    this.selectionRect.x + relativeX,
                    this.selectionRect.y + relativeY,
                    this.tileSize,
                    this.tileSize
                );
            });
        }
        this.ctx.restore();
    }
}