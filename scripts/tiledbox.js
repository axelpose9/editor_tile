// TileBox.js

export default class TileBox {
  constructor(tileBox, settings) {
    this.tileBox = tileBox;
    this.tileSize = settings.tileSize || 16;
    this.scale = 3;
    this.tilesheet = null;
    this.img = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.dragging = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.panning = false;
    this.panStart = { x: 0, y: 0 };
    this.panOffsetStart = { x: 0, y: 0 };
    this.mouseMoved = false;

    this.mode = 'preview';

    this.selectionSize = {
        width: settings.selectionWidth || 1,
        height: settings.selectionHeight || 1,
    };
    
    // Almacena el tile seleccionado
    this.selectedTile = null;


    this.init();
  }

  init() {
    this.tileBox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.mode === 'preview') {
        this.expand();
      }
    });

    document.addEventListener('click', () => {
      if (this.mode === 'expanded') {
        this.contract();
      }
    });

    this.loadStyles();
  }

  loadStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './scripts/tiledbox.css';
    document.head.appendChild(link);
  }

  loadImage(file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				this.tileBox.innerHTML = '';
				this.img = img;
				this.tilesheet = img;
				this.showThumbnail();
				this.enableDrawingTools();
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
  }

  enableDrawingTools() {
      console.log('Herramientas de dibujo habilitadas');
  }

  showThumbnail() {
    this.mode = 'preview';
    this.contract();
    this.tileBox.innerHTML = '';
    this.img.classList.add('thumbnail');
    this.tileBox.appendChild(this.img);
  }

  expand() {
	  if (!this.tilesheet) return;
	  this.mode = 'expanded';
	  this.tileBox.classList.add('expanded');

	  const fixedSize = 250;
	  this.canvas.width = fixedSize;
	  this.canvas.height = fixedSize;

	  this.canvas.style.width = '100%';
	  this.canvas.style.height = '100%';

	  this.tileBox.innerHTML = '';
	  this.tileBox.appendChild(this.canvas);
	  this.addZoomButtons();

	  this.selectionStart = null;
	  this.selectionEnd = null;

	  this.bindCanvasEvents();
	  this.draw();
  }

  zoomIn() {
	  this.scale = Math.min(this.scale + 0.5, 5);
	  this.resizeCanvas();
	  this.draw();
  }

  zoomOut() {
	  this.scale = Math.max(this.scale - 0.5, 1);
	  this.resizeCanvas();
	  this.draw();
  }

  resizeCanvas() {
	  if (!this.tilesheet) return;
	  this.canvas.width = this.tilesheet.width * this.scale;
	  this.canvas.height = this.tilesheet.height * this.scale;
	  this.canvas.style.width = `${this.canvas.width}px`;
	  this.canvas.style.height = `${this.canvas.height}px`;
  }

  addZoomButtons() {
	  const zoomControls = document.createElement('div');
	  zoomControls.className = 'zoom-controls';

	  const zoomInBtn = document.createElement('button');
	  zoomInBtn.className = 'zoom-btn';
	  zoomInBtn.textContent = '+';

	  const zoomOutBtn = document.createElement('button');
	  zoomOutBtn.className = 'zoom-btn';
	  zoomOutBtn.textContent = '−';

	  zoomControls.appendChild(zoomInBtn);
	  zoomControls.appendChild(zoomOutBtn);
	  this.tileBox.appendChild(zoomControls);

	  zoomInBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		this.changeZoom(1.2);
	  });

	  zoomOutBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		this.changeZoom(1 / 1.2);
	  });
  }

  changeZoom(factor) {
	  this.scale *= factor;
	  this.draw();
  }

  contract() {
    if (this.mode === 'expanded') this.showThumbnail();
    this.tileBox.classList.remove('expanded');
  }

  bindCanvasEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        
        if (e.button === 1 || e.shiftKey) {
            this.panning = true;
            this.mouseMoved = false;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.panOffsetStart = { x: this.offsetX, y: this.offsetY };
            this.tileBox.style.cursor = 'grabbing';
        } else if (e.button === 0) {
            this.panning = false;
            this.mouseMoved = false;
            const pos = this.getMouseTilePos(e);
            this.selectionStart = pos;
            this.selectionEnd = pos;
            this.draw();
        }
    });

    this.canvas.addEventListener('mousemove', (e) => {
        if (this.panning) {
            const dx = e.clientX - this.panStart.x;
            const dy = e.clientY - this.panStart.y;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                this.mouseMoved = true;
            }
            this.offsetX = this.panOffsetStart.x + dx;
            this.offsetY = this.panOffsetStart.y + dy;
            this.draw();
        } else if (this.selectionStart && e.buttons === 1) {
            const pos = this.getMouseTilePos(e);
            this.selectionEnd = pos;
            this.draw();
        }
    });

    this.canvas.addEventListener('mouseup', (e) => {
        if (this.panning) {
            this.panning = false;
            this.tileBox.style.cursor = 'grab';
        }
        if (this.selectionStart && this.selectionEnd && !this.mouseMoved) {
            const selected = this.getSelectedTiles();
            this.selectedTile = selected;
            console.log("Tile seleccionado:", selected);
            this.draw();
        }
    });

    // === LÓGICA DE ZOOM CON LA RUEDA DEL MOUSE (restaurada) ===
    this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
        this.changeZoom(zoomFactor);
    });
    
    // Compatibilidad táctil
    this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            this.panning = true;
            const t = e.touches[0];
            this.panStart = { x: t.clientX, y: t.clientY };
            this.panOffsetStart = { x: this.offsetX, y: this.offsetY };
        }
    });

    this.canvas.addEventListener('touchmove', (e) => {
        if (!this.panning || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        // === LA LÍNEA A CORREGIR ===
        // Aquí usabas panOffsetStart.y, lo que rompía el cálculo
        const dx = t.clientX - this.panStart.x;
        const dy = t.clientY - this.panStart.y;
        this.offsetX = this.panOffsetStart.x + dx;
        this.offsetY = this.panOffsetStart.y + dy;
        this.draw();
    });

    this.canvas.addEventListener('touchend', () => {
        this.panning = false;
    });
  }
  


  getSelectedTiles() {
	  if (!this.selectionStart) return [];

	  const x = this.selectionStart.x;
	  const y = this.selectionStart.y;
	  const tiles = [];

	  for (let j = 0; j < this.selectionSize.height; j++) {
		for (let i = 0; i < this.selectionSize.width; i++) {
		  tiles.push({ x: x + i, y: y + j });
		}
	  }
	  return tiles;
  }

  getMouseTilePos(e) {
	  const rect = this.canvas.getBoundingClientRect();
	  const clickX = e.clientX - rect.left;
	  const clickY = e.clientY - rect.top;

	  const canvasX = (clickX - this.offsetX) / this.scale;
	  const canvasY = (clickY - this.offsetY) / this.scale;

	  const tileX = Math.floor(canvasX / this.tileSize);
	  const tileY = Math.floor(canvasY / this.tileSize);

	  return { x: tileX, y: tileY };
  }

  draw() {
	  if (!this.tilesheet) return;

	  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

	  this.ctx.save();
	  this.ctx.translate(this.offsetX, this.offsetY);
	  this.ctx.scale(this.scale, this.scale);
	  this.ctx.drawImage(this.tilesheet, 0, 0);
	  this.ctx.restore();

	  this.drawGrid();
	  this.drawSelection();
  }

  drawGrid() {
	  if (!this.tilesheet) return;

	  const cols = Math.ceil(this.tilesheet.width / this.tileSize);
	  const rows = Math.ceil(this.tilesheet.height / this.tileSize);

	  this.ctx.strokeStyle = '#ccc';
	  this.ctx.lineWidth = 1 / this.scale;

	  this.ctx.save();
	  this.ctx.translate(this.offsetX, this.offsetY);
	  this.ctx.scale(this.scale, this.scale);

	  for (let x = 0; x <= cols; x++) {
		const xPos = x * this.tileSize;
		this.ctx.beginPath();
		this.ctx.moveTo(xPos, 0);
		this.ctx.lineTo(xPos, this.tilesheet.height);
		this.ctx.stroke();
	  }

	  for (let y = 0; y <= rows; y++) {
		const yPos = y * this.tileSize;
		this.ctx.beginPath();
		this.ctx.moveTo(0, yPos);
		this.ctx.lineTo(this.tilesheet.width, yPos);
		this.ctx.stroke();
	  }

	  this.ctx.restore();
  }

  drawSelection() {
    if (!this.selectionStart) return;

    const x = this.selectionStart.x;
    const y = this.selectionStart.y;
    
    const cols = this.selectionSize.width;
    const rows = this.selectionSize.height;

    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.strokeStyle = 'blue';
    this.ctx.lineWidth = 2 / this.scale;
    this.ctx.strokeRect(
        x * this.tileSize,
        y * this.tileSize,
        cols * this.tileSize,
        rows * this.tileSize
    );

    this.ctx.restore();
  }

  updateSelectionSize(width, height) {
      if (width < 1 || height < 1) {
          console.error("El tamaño de la selección debe ser al menos 1x1.");
          return;
      }
      this.selectionSize = { width, height };
      this.draw();
  }
}