//TileSheetController.js
export default class LienzoController {
    constructor(canvas, canvasController) {
        this.canvas = canvas;
        this.canvasController = canvasController;

        this.scale = 1.0;
        this.rotation = 0;
        this.lastDistance = null;
        this.lastAngle = null;

        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = null;
        this.lastPanY = null;

        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // These are the new events for panning
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        this.canvas.addEventListener('gesturestart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleMouseDown(e) {
        if (e.button === 1) { // Middle mouse button
            e.preventDefault();
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
        }
    }

    handleMouseUp(e) {
        if (e.button === 1) {
            e.preventDefault();
            this.isPanning = false;
        }
    }

    handleMouseMove(e) {
        if (this.isPanning) {
            const dx = e.clientX - this.lastPanX;
            const dy = e.clientY - this.lastPanY;

            this.panX += dx;
            this.panY += dy;

            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;

            this.canvasController.applyPan(this.panX, this.panY);
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        
        if (e.ctrlKey) {
            this.rotation += delta * 5;
            this.rotation = this.rotation % 360;
        } else {
            const newScale = this.scale + delta * 0.1;
            this.scale = Math.max(0.1, Math.min(newScale, 5.0));
        }
        
        this.canvasController.applyTransformations(this.scale, this.rotation);
    }
    
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            this.lastDistance = this.getTouchDistance(e);
            this.lastAngle = this.getTouchAngle(e);
            
            this.lastPanX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            this.lastPanY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            
            const currentDistance = this.getTouchDistance(e);
            if (this.lastDistance !== null) {
                const deltaDistance = currentDistance - this.lastDistance;
                const newScale = this.scale + deltaDistance * 0.005;
                this.scale = Math.max(0.1, Math.min(newScale, 5.0));
            }
            this.lastDistance = currentDistance;

            const currentAngle = this.getTouchAngle(e);
            if (this.lastAngle !== null) {
                const deltaAngle = currentAngle - this.lastAngle;
                this.rotation += deltaAngle;
            }
            this.lastAngle = currentAngle;
            
            const currentPanX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const currentPanY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            if (this.lastPanX !== null && this.lastPanY !== null) {
                const dx = currentPanX - this.lastPanX;
                const dy = currentPanY - this.lastPanY;
                this.panX += dx;
                this.panY += dy;
            }
            this.lastPanX = currentPanX;
            this.lastPanY = currentPanY;

            this.canvasController.applyTransformations(this.scale, this.rotation);
            this.canvasController.applyPan(this.panX, this.panY);
        }
    }

    handleTouchEnd() {
        this.lastDistance = null;
        this.lastAngle = null;
        
        this.lastPanX = null;
        this.lastPanY = null;
    }

    getTouchDistance(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getTouchAngle(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }
}