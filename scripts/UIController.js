import TileSheetController from './TileSheetController.js';

export default class UIController {
    constructor() {
        this.activeDropdown = null;

        this.setupEvents();
        
        // Listener global para cerrar menús al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (this.activeDropdown) {
                const dropdownElement = document.getElementById(this.activeDropdown);
                const button = document.getElementById(this.activeDropdown.replace('Menu', 'Tool'));

                if (dropdownElement && !dropdownElement.contains(e.target) && !button.contains(e.target)) {
                    this.closeDropdown();
                }
            }
        });
    }

    setupEvents() {
        const menuBtn = document.getElementById('openMenu');
        const drawer = document.getElementById('menuDrawer');
        const overlay = document.getElementById('overlay');

        if (!menuBtn || !drawer || !overlay) {
            console.warn('Faltan elementos del menú principal');
            return;
        }

        menuBtn.addEventListener('click', () => {
            const isOpen = drawer.classList.contains('open');
            drawer.classList.toggle('open', !isOpen);
            overlay.classList.toggle('visible', !isOpen);
        });

        overlay.addEventListener('click', () => {
            drawer.classList.remove('open');
            overlay.classList.remove('visible');
        });
    }
    
    toggleDropdown(menuId) {
        const dropdown = document.getElementById(menuId);
        
        if (!dropdown) return;
        
        if (this.activeDropdown === menuId) {
            this.closeDropdown();
        } else {
            if (this.activeDropdown) {
                this.closeDropdown();
            }
            dropdown.classList.add('show');
            this.activeDropdown = menuId;
        }
    }
    
    closeDropdown() {
        if (this.activeDropdown) {
            const dropdown = document.getElementById(this.activeDropdown);
            if (dropdown) {
                dropdown.classList.remove('show');
            }
            this.activeDropdown = null;
        }
    }
}