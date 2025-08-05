export default class CanvasController {
    /**
     * @param {HTMLCanvasElement} canvas El elemento <canvas> del DOM.
     * @param {object} config La configuración inicial del lienzo.
     * @param {string} config.tileSize El tamaño de cada tile en píxeles.
     * @param {string} config.canvasWidth El ancho total del lienzo en tiles.
     * @param {string} config.canvasHeight El alto total del lienzo en tiles.
     * @param {string} config.canvasColor El color de fondo del lienzo.
     * @param {string} config.gridColor El color de las líneas de la cuadrícula.
     */
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Convierte las configuraciones a números
        this.tileSize = parseInt(config.tileSize, 10);
        this.canvasColor = config.canvasColor;
        this.gridColor = config.gridColor;

        // Propiedades de la vista
        this.showGrid = true;
        this.activeTool = null;
        this.scale = 1.0;
        this.rotation = 0;
        this.panX = 0;
        this.panY = 0;

        // Almacenamos las dimensiones lógicas de la cuadrícula
        this.cols = parseInt(config.canvasWidth, 10);
        this.rows = parseInt(config.canvasHeight, 10);
        this.initialWidth = this.cols * this.tileSize;
        this.initialHeight = this.rows * this.tileSize;
        
        // Inicializamos la cuadrícula con el tamaño correcto
        this.grid = Array.from({ length: this.rows }, () =>
            Array(this.cols).fill(null)
        );
    }

    /**
     * Redimensiona el canvas y su cuadrícula interna al tamaño del contenedor.
     * @param {number} newWidth El nuevo ancho del canvas en píxeles.
     * @param {number} newHeight El nuevo alto del canvas en píxeles.
     */
    resizeCanvasToFitContainer(newWidth, newHeight) {
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.redraw();
    }
    
    /**
     * Obtiene las coordenadas de la celda de la cuadrícula a partir de un evento del ratón.
     * @param {MouseEvent} e El evento del ratón.
     * @returns {{col: number, row: number}} Las coordenadas de la celda.
     */
    getTileCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const transformedX = (clientX - this.panX) / this.scale;
        const transformedY = (clientY - this.panY) / this.scale;
        
        const col = Math.floor(transformedX / this.tileSize);
        const row = Math.floor(transformedY / this.tileSize);
        
        return { col, row };
    }

    getTransformedPoint(x, y) {
        return {
            x: (x - this.panX) / this.scale,
            y: (y - this.panY) / this.scale
        };
    }

    setActiveTool(tool) {
        this.activeTool = tool;
    }

    applyTransformations(scale, rotation) {
        this.scale = scale;
        this.rotation = rotation;
        this.redraw();
    }
    
    applyPan(panX, panY) {
        this.panX = panX;
        this.panY = panY;
        this.redraw();
    }

    redraw() {
        this.ctx.save();
        
        // Limpiamos todo el lienzo físico
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Aplicamos las transformaciones de la vista
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reseteamos las transformaciones previas
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(this.panX / this.scale, this.panY / this.scale);
        this.ctx.rotate(this.rotation * Math.PI / 180);

        // Dibujamos el fondo del lienzo LÓGICO (el tamaño de la cuadrícula)
        this.ctx.fillStyle = this.canvasColor;
        this.ctx.fillRect(0, 0, this.initialWidth, this.initialHeight); 

        // Dibujamos los tiles según la cuadrícula
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    this.ctx.drawImage(
                        tile.image,
                        tile.sx, tile.sy, this.tileSize, this.tileSize,
                        col * this.tileSize,
                        row * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }

        // Si está activada, dibujamos la cuadrícula
        if (this.showGrid) this.drawGrid();

        // Si hay una herramienta activa que necesita dibujar, la llamamos
        if (this.activeTool && this.activeTool.draw) {
            this.activeTool.draw();
        }

        this.ctx.restore();
    }

    drawGrid() {
        const size = this.tileSize;
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 0.5 / this.scale;
        
        // Dibujar líneas verticales sobre el lienzo LÓGICO
        for (let x = 0; x <= this.initialWidth; x += size) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.initialHeight);
            this.ctx.stroke();
        }
        
        // Dibujar líneas horizontales sobre el lienzo LÓGICO
        for (let y = 0; y <= this.initialHeight; y += size) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.initialWidth, y);
            this.ctx.stroke();
        }
    }

    inBounds(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    setTile(col, row, tile) {
        if (!this.inBounds(col, row)) return;
        this.grid[row][col] = tile;
        this.redraw();
    }

    clearTile(col, row) {
        if (!this.inBounds(col, row)) return;
        this.grid[row][col] = null;
        this.redraw();
    }

    getTile(col, row) {
        if (!this.inBounds(col, row)) return null;
        return this.grid[row][col];
    }

    saveState() {
        const serializedGrid = this.grid.map(row =>
            row.map(tile => {
                if (tile) {
                    return {
                        sx: tile.sx,
                        sy: tile.sy
                    };
                }
                return null;
            })
        );
        localStorage.setItem('canvasState', JSON.stringify(serializedGrid));
        console.log('Estado del lienzo guardado.');
    }

    loadState(tilesheetImage) {
        const savedState = localStorage.getItem('canvasState');
        if (savedState) {
            const serializedGrid = JSON.parse(savedState);
            this.grid = serializedGrid.map(row =>
                row.map(tileData => {
                    if (tileData) {
                        return {
                            image: tilesheetImage,
                            sx: tileData.sx,
                            sy: tileData.sy
                        };
                    }
                    return null;
                })
            );
            this.cols = this.grid[0] ? this.grid[0].length : 0;
            this.rows = this.grid.length;
            this.redraw();
            console.log('Estado del lienzo cargado.');
            return true;
        }
        console.warn('No se encontró ningún estado de lienzo guardado.');
        return false;
    }
}
