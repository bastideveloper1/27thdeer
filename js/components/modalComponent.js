import { DOMUtils } from '../utils/domUtils.js';

// Componente para manejar modales
export class ModalComponent {
    constructor(modalElement, messageElement, closeElement) {
        this.modalElement = modalElement;
        this.messageElement = messageElement;
        this.closeElement = closeElement;
        this.isVisible = false;
    }

    // Mostrar modal con mensaje
    show(message) {
        if (this.messageElement) {
            DOMUtils.setText(this.messageElement, message);
        }
        DOMUtils.addClass(this.modalElement, 'visible');
        this.isVisible = true;
    }

    // Ocultar modal
    hide() {
        DOMUtils.removeClass(this.modalElement, 'visible');
        this.isVisible = false;
    }

    // Configurar event listeners
    setupEventListeners() {
        if (this.closeElement) {
            DOMUtils.addEventListener(this.closeElement, 'click', () => this.hide());
        }
        DOMUtils.addEventListener(this.modalElement, 'click', (event) => {
            if (event.target === this.modalElement) this.hide();
        });
    }
}
