// Utilidades para operaciones del DOM
export const DOMUtils = {
    // Obtener elemento por ID
    getElement(id) {
        return document.getElementById(id);
    },

    // Obtener elementos por selector
    getElements(selector) {
        return document.querySelectorAll(selector);
    },

    // Agregar clase a elemento
    addClass(element, className) {
        if (element) element.classList.add(className);
    },

    // Remover clase de elemento
    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },

    // Toggle clase de elemento
    toggleClass(element, className, force) {
        if (element) element.classList.toggle(className, force);
    },

    // Verificar si elemento tiene clase
    hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    },

    // Establecer texto de elemento
    setText(element, text) {
        if (element) element.textContent = text;
    },

    // Establecer HTML de elemento
    setHTML(element, html) {
        if (element) element.innerHTML = html;
    },

    // Establecer valor de elemento
    setValue(element, value) {
        if (element) element.value = value;
    },

    // Obtener valor de elemento
    getValue(element) {
        return element ? element.value : null;
    },

    // Establecer atributo de elemento
    setAttribute(element, name, value) {
        if (element) element.setAttribute(name, value);
    },

    // Obtener atributo de elemento
    getAttribute(element, name) {
        return element ? element.getAttribute(name) : null;
    },

    // Mostrar elemento
    show(element, display = 'block') {
        if (element) element.style.display = display;
    },

    // Ocultar elemento
    hide(element) {
        if (element) element.style.display = 'none';
    },

    // Agregar event listener
    addEventListener(element, event, handler, options) {
        if (element) element.addEventListener(event, handler, options);
    },

    // Remover event listener
    removeEventListener(element, event, handler, options) {
        if (element) element.removeEventListener(event, handler, options);
    },

    // Crear elemento
    createElement(tag, attributes = {}, text = '') {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        if (text) element.textContent = text;
        return element;
    },

    // Agregar hijo a elemento
    appendChild(parent, child) {
        if (parent && child) parent.appendChild(child);
    },

    // Remover hijo de elemento
    removeChild(parent, child) {
        if (parent && child) parent.removeChild(child);
    },

    // Limpiar hijos de elemento
    clearChildren(element) {
        if (element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    }
};
