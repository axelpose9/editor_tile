// select.js
export class SelectionTool {
    constructor(canvasController) {
        this.canvasController = canvasController;
        this.canvas = canvasController.canvas;
        this.ctx = canvasController.ctx;
        this.tileSize = canvasController.tileSize;
        
        this.isSelecting = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.selectedTiles = [];
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
        this.originalSelectionRect = { x: 0, y: 0, width: 0, height: 0 };
        this.dragStartSelectionRect = null;

        this.boundMouseDown = this.handleMouseDown.bind(this);
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseUp = this.handleMouseUp.bind(this);
    }
    
    enable() {
        this.canvas.addEventListener('mousedown', this.boundMouseDown);
        this.canvas.addEventListener('mousemove', this.boundMouseMove);
        this.canvas.addEventListener('mouseup', this.boundMouseUp);
        this.canvas.style.cursor = 'crosshair';
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
        this.selectedTiles = [];
    }

    disable() {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
        this.canvas.removeEventListener('mousemove', this.boundMouseMove);
        this.canvas.removeEventListener('mouseup', this.boundMouseUp);
        this.canvas.style.cursor = 'default';
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
        this.selectedTiles = [];
        this.canvasController.redraw();
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Comprobar si el clic fue dentro de una selección existente para arrastrarla
        if (this.selectedTiles.length > 0 &&
            mouseX >= this.selectionRect.x && mouseX <= this.selectionRect.x + this.selectionRect.width &&
            mouseY >= this.selectionRect.y && mouseY <= this.selectionRect.y + this.selectionRect.height) {
            
            this.isDragging = true;
            this.dragOffset = { x: mouseX - this.selectionRect.x, y: mouseY - this.selectionRect.y };
            this.dragStartSelectionRect = { ...this.selectionRect };
            this.canvas.style.cursor = 'grabbing';
            
            // "Cortar" los tiles de la grilla para que se vean movidos
            const startCol = Math.floor(this.originalSelectionRect.x / this.tileSize);
            const startRow = Math.floor(this.originalSelectionRect.y / this.tileSize);
            const endCol = startCol + Math.floor(this.originalSelectionRect.width / this.tileSize);
            const endRow = startRow + Math.floor(this.originalSelectionRect.height / this.tileSize);
            for (let r = startRow; r < endRow; r++) {
                for (let c = startCol; c < endCol; c++) {
                    if (this.canvasController.inBounds(c, r)) {
                        this.canvasController.grid[r][c] = null;
                    }
                }
            }
        } else {
            // Empezar una nueva selección, limpiando la anterior
            this.selectedTiles = [];
            this.isSelecting = true;
            this.selectionRect = {
                x: Math.floor(mouseX / this.tileSize) * this.tileSize,
                y: Math.floor(mouseY / this.tileSize) * this.tileSize,
                width: 0,
                height: 0
            };
        }
        this.canvasController.redraw();
    }

    handleMouseMove(e) {
        if (!this.isSelecting && !this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.isSelecting) {
            const startX = this.selectionRect.x;
            const startY = this.selectionRect.y;
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

            const finalSnapX = Math.round(this.selectionRect.x / this.tileSize) * this.tileSize;
            const finalSnapY = Math.round(this.selectionRect.y / this.tileSize) * this.tileSize;
            
            // Colocar los tiles en su nueva posición
            this.selectedTiles.forEach(tile => {
                const relativeX = tile.originalX - this.originalSelectionRect.x;
                const relativeY = tile.originalY - this.originalSelectionRect.y;
                
                const newCol = Math.floor((finalSnapX + relativeX) / this.tileSize);
                const newRow = Math.floor((finalSnapY + relativeY) / this.tileSize);

                if (this.canvasController.inBounds(newCol, newRow)) {
                     this.canvasController.grid[newRow][newCol] = tile.tile;
                }
            });
            
            // Actualizar el estado para futuras acciones de arrastre
            this.selectionRect = {
                x: finalSnapX,
                y: finalSnapY,
                width: this.originalSelectionRect.width,
                height: this.originalSelectionRect.height
            };
            this.originalSelectionRect = { ...this.selectionRect };
        }
        this.canvasController.redraw();
    }
    
    draw() {
        // Dibuja el recuadro de selección
        if (this.selectedTiles.length > 0 || this.isSelecting) {
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height);
            this.ctx.setLineDash([]);
        }
        
        // Dibuja los tiles que se están arrastrando
        if (this.isDragging) {
            this.selectedTiles.forEach(tile => {
                const relativeX = tile.originalX - this.originalSelectionRect.x;
                const relativeY = tile.originalY - this.originalSelectionRect.y;
                this.ctx.drawImage(
                    tile.tile.image,
                    tile.tile.sx, tile.tile.sy, this.tileSize, this.tileSize,
                    this.selectionRect.x + relativeX,
                    this.selectionRect.y + relativeY,
                    this.tileSize,
                    this.tileSize
                );
            });
        }
    }
}