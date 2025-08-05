import UIController from './UIController.js';
import TileBox from './tiledbox.js';
import CanvasController from './CanvasController.js';
import FreeDrawTool from './draw.js';
import EraseTool from './erase.js';
import FillTool from './fill.js';
import SelectionTool from './select.js';
import ShapeTool from './shapes.js';
import { asignarFuncion, asignarClick } from './domUtils.js';
import LienzoController from './lienzo.js';
// Importa SOLO la función setupDropperTool del módulo dropper.js
import { setupDropperTool } from './dropper.js';

window.addEventListener('DOMContentLoaded', () => {
    const uiCtrl = new UIController();
    const canvas = document.getElementById('canvas');
    const workspace = document.getElementById('workspace');
    let canvasCtrl = null;
    let activeTool = null;
    let tileBox = null;
    let lienzoController = null;

    const selectionWidthInput = document.getElementById('selectionWidth');
    const selectionHeightInput = document.getElementById('selectionHeight');

    function resizeCanvas() {
        const parentWidth = workspace.clientWidth;
        const parentHeight = workspace.clientHeight;

        if (canvasCtrl) {
            canvasCtrl.resizeCanvasToFitContainer(parentWidth, parentHeight);
            
            let panX = 0;
            let panY = 0;
            
            if (canvasCtrl.initialWidth < parentWidth) {
                panX = (parentWidth - canvasCtrl.initialWidth) / 2;
            }

            if (canvasCtrl.initialHeight < parentHeight) {
                panY = (parentHeight - canvasCtrl.initialHeight) / 2;
            }
            
            canvasCtrl.applyPan(panX, panY);
            canvasCtrl.redraw();
        }
    }

    function loadAndSetupEditor() {
        const savedSettings = localStorage.getItem('appSettings');
        let appSettings = {};

        if (savedSettings) {
            appSettings = JSON.parse(savedSettings);
        } else {
            console.warn('No hay configuración guardada. Usando valores predeterminados.');
            appSettings = {
                tileSize: "16",
                canvasWidth: "50",
                canvasHeight: "50",
                canvasColor: "#36393f",
                gridColor: "#5d6168",
                selectionWidth: 1,
                selectionHeight: 1
            };
        }
        
        appSettings.tileSize = parseInt(appSettings.tileSize, 10);
        appSettings.canvasWidth = parseInt(appSettings.canvasWidth, 10);
        appSettings.canvasHeight = parseInt(appSettings.canvasHeight, 10);
        appSettings.selectionWidth = parseInt(appSettings.selectionWidth, 10);
        appSettings.selectionHeight = parseInt(appSettings.selectionHeight, 10);
        
        canvasCtrl = new CanvasController(canvas, appSettings);
        lienzoController = new LienzoController(canvas, canvasCtrl);

        const tileBoxElement = document.getElementById('tileBox');
        const tileInput = document.getElementById('tileInput');
        
        if (tileBoxElement && tileInput) {
            tileBox = new TileBox(tileBoxElement, appSettings);
            asignarFuncion({
                idInput: 'tileInput',
                idContenedor: 'tileBox',
                fn: (file) => tileBox.loadImage(file)
            });
            asignarClick('cargarTiled', () => tileInput.click());
        }

        if (selectionWidthInput && selectionHeightInput && tileBox) {
            selectionWidthInput.value = appSettings.selectionWidth;
            selectionHeightInput.value = appSettings.selectionHeight;
            
            selectionWidthInput.addEventListener('change', (e) => {
                const newWidth = parseInt(e.target.value, 10);
                if (!isNaN(newWidth) && newWidth > 0) {
                    tileBox.updateSelectionSize(newWidth, tileBox.selectionSize.height);
                }
            });

            selectionHeightInput.addEventListener('change', (e) => {
                const newHeight = parseInt(e.target.value, 10);
                if (!isNaN(newHeight) && newHeight > 0) {
                    tileBox.updateSelectionSize(tileBox.selectionSize.width, newHeight);
                }
            });
        }

        function setActiveTool(newTool) {
            if (activeTool && activeTool.disable) {
                activeTool.disable();
            }
            activeTool = newTool;
            if (activeTool && activeTool.enable) {
                activeTool.enable();
            }
            console.log('Herramienta activada:', newTool.constructor.name);
        }
        
        const getSelectedTilesCallback = () => tileBox?.getSelectedTiles?.() || [];
        const getTileSizeCallback = () => tileBox?.tileSize;
        const getTilesheetCallback = () => tileBox?.tilesheet;

        const validateTileSelection = () => {
            if (!tileBox || !tileBox.tilesheet) {
                console.warn('Carga una hoja de tiles primero.');
                return false;
            }
            if (getSelectedTilesCallback().length === 0) {
                console.warn('Selecciona un tile para dibujar.');
                return false;
            }
            return true;
        };
        
        // CORREGIDO: setupDropperTool ya no necesita el argumento 'workspace'.
        setupDropperTool(workspace,canvasCtrl, tileBox, setActiveTool);

        asignarClick('pencilTool', () => {
            if (!validateTileSelection()) return;
            const freeDrawTool = new FreeDrawTool(
                canvasCtrl,
                getSelectedTilesCallback,
                getTileSizeCallback(),
                getTilesheetCallback()
            );
            setActiveTool(freeDrawTool);
            console.log('✏️ Herramienta lápiz activada');
        });

        asignarClick('eraserTool', () => {
            const eraseTool = new EraseTool(canvasCtrl);
            setActiveTool(eraseTool);
            console.log('🧽 Herramienta borrar activada');
        });

        asignarClick('fillTool', () => {
            if (!validateTileSelection()) return;
            const fillTool = new FillTool(
                canvasCtrl,
                getSelectedTilesCallback,
                getTileSizeCallback(),
                getTilesheetCallback()
            );
            setActiveTool(fillTool);
            console.log('🪣 Herramienta rellenar activada');
        });

        asignarClick('selectTool', () => {
            const selectionTool = new SelectionTool(canvasCtrl);
            setActiveTool(selectionTool);
            console.log('🖱️ Herramienta de selección activada');
        });
        
        asignarClick('shapeTool', () => {
            uiCtrl.toggleDropdown('shapeMenu');
        });

        const createShapeTool = (shapeType) => {
            if (!validateTileSelection()) return;
            
            const shapeTool = new ShapeTool(
                canvasCtrl,
                getSelectedTilesCallback,
                getTileSizeCallback(),
                getTilesheetCallback()
            );
            shapeTool.setShape(shapeType);
            setActiveTool(shapeTool);
            uiCtrl.closeDropdown('shapeMenu');
            console.log(`Herramienta de forma seleccionada: ${shapeType}`);
        };

        asignarClick('rectangleTool', () => createShapeTool('rectangle'));
        asignarClick('circleTool', () => createShapeTool('circle'));
        asignarClick('lineTool', () => createShapeTool('line'));

        asignarClick('toggleGrid', () => {
            canvasCtrl.showGrid = !canvasCtrl.showGrid;
            canvasCtrl.redraw();
            console.log(`Grilla ${canvasCtrl.showGrid ? 'activada' : 'desactivada'}.`);
        });

        const originalRedraw = canvasCtrl.redraw.bind(canvasCtrl);
        canvasCtrl.redraw = () => {
            originalRedraw();
            if (activeTool && activeTool.draw) {
                activeTool.draw();
            }
        };
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    loadAndSetupEditor();
    resizeCanvas();
});