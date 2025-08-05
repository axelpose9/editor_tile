export default class FillTool {
    constructor(canvasController, getSelectedTiles, tileSize, tilesheet) {
        this.canvasController = canvasController;
        this.canvas = canvasController.canvas;
        this.ctx = this.canvas.getContext('2d');
        
        // ¡Importante! Guardamos los datos pasados desde main.js
        this.getSelectedTiles = getSelectedTiles;
        this.tilesheet = tilesheet;
        this.tileSize = tileSize;
        
        this.onClick = this.onClick.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
    }
    
    enable() {
        // Ahora la herramienta ya tiene los datos, solo verificamos su existencia.
        if (!this.getSelectedTiles() || !this.tilesheet) {
            console.warn("No hay tiles seleccionados o tilesheet cargado.");
            return;
        }
        
        this.canvas.addEventListener('click', this.onClick);
        this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
        console.log('🪣 FillTool habilitado');
    }

    disable() {
        this.canvas.removeEventListener('click', this.onClick);
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        console.log('🪣 FillTool deshabilitado');
    }

    onClick(e) {
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.fill(pos.col, pos.row);
    }

    onTouchStart(e) {
        e.preventDefault();
        const t = e.touches[0];
        const pos = this.getCanvasPos(t.clientX, t.clientY);
        this.fill(pos.col, pos.row);
    }

    getCanvasPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        return { col, row };
    }

    fill(startCol, startRow) {
        // Usamos la función de la clase para obtener los tiles.
        const selected = this.getSelectedTiles();
        if (!selected || selected.length === 0 || !this.tilesheet) {
            console.warn('No hay tile seleccionado o tilesheet cargado');
            return;
        }

        const selectedTileInfo = selected[0];
        
        const newTile = {
            image: this.tilesheet,
            sx: selectedTileInfo.x * this.tileSize,
            sy: selectedTileInfo.y * this.tileSize,
            size: this.tileSize
        };
        
        const startTile = this.canvasController.getTile(startCol, startRow);

        if (
            (startTile && 
            newTile.image === startTile.image &&
            newTile.sx === startTile.sx &&
            newTile.sy === startTile.sy) ||
            (!startTile && !newTile) // Caso para rellenar con tile 'null'
        ) {
            return;
        }
        
        const stack = [{ col: startCol, row: startRow }];
        const visited = new Set();
        
        while (stack.length > 0) {
            const { col, row } = stack.pop();
            const key = `${col},${row}`;

            if (visited.has(key) || !this.canvasController.inBounds(col, row)) {
                continue;
            }
            visited.add(key);

            const currentTile = this.canvasController.getTile(col, row);
            
            const isSameTile = (currentTile === startTile) || 
                               (currentTile === null && startTile === null) ||
                               (currentTile && startTile && 
                                currentTile.image === startTile.image &&
                                currentTile.sx === startTile.sx &&
                                currentTile.sy === startTile.sy);

            if (isSameTile) {
                // Usamos setTile, que se encarga de actualizar la grilla.
                this.canvasController.setTile(col, row, newTile);

                stack.push(
                    { col: col + 1, row },
                    { col: col - 1, row },
                    { col, row: row + 1 },
                    { col, row: row - 1 }
                );
            }
        }
        
        this.canvasController.redraw();
        
        console.log(`🪣 Relleno completado desde (${startCol}, ${startRow})`);
    }
}