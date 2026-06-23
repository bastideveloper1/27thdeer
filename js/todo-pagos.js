(function() {
    'use strict';

    // Utilidades DOM
    const DOMUtils = {
        getElement(id) {
            return document.getElementById(id);
        },
        setValue(element, value) {
            if (element) element.value = value;
        },
        getValue(element) {
            return element ? element.value : '';
        },
        setText(element, text) {
            if (element) element.textContent = text;
        },
        setHTML(element, html) {
            if (element) element.innerHTML = html;
        },
        addClass(element, className) {
            if (element) element.classList.add(className);
        },
        removeClass(element, className) {
            if (element) element.classList.remove(className);
        },
        addEventListener(element, event, handler) {
            if (element) element.addEventListener(event, handler);
        }
    };

    // Modal de alerta
    const AlertModal = {
        element: null,
        messageElement: null,
        closeBtn: null,

        init() {
            this.element = DOMUtils.getElement('alertModal');
            this.messageElement = DOMUtils.getElement('alertMessage');
            this.closeBtn = DOMUtils.getElement('alertCloseBtn');

            if (this.closeBtn) {
                DOMUtils.addEventListener(this.closeBtn, 'click', () => this.hide());
            }
        },

        show(message) {
            if (this.messageElement) {
                DOMUtils.setText(this.messageElement, message);
            }
            if (this.element) {
                DOMUtils.addClass(this.element, 'visible');
            }
        },

        hide() {
            if (this.element) {
                DOMUtils.removeClass(this.element, 'visible');
            }
        }
    };

    // Servicio de almacenamiento
    const StorageService = {
        STORAGE_KEY: 'todoPagos_history',

        saveHistory(config) {
            let history = this.getHistory();
            history.unshift(config);
            if (history.length > 5) {
                history = history.slice(0, 5);
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        },

        getHistory() {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        },

        getLastConfig() {
            const history = this.getHistory();
            return history.length > 0 ? history[0] : null;
        }
    };

    // Aplicación principal
    const TodoPagosApp = {
        currentInstallments: [],

        init() {
            AlertModal.init();
            this.bindEvents();
            this.loadHistory();
            this.setTodayAsDefaultDate();
            this.updatePreview();
        },

        setTodayAsDefaultDate() {
            const startDateInput = DOMUtils.getElement('startDate');
            if (startDateInput && !DOMUtils.getValue(startDateInput)) {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                DOMUtils.setValue(startDateInput, `${year}-${month}-${day}`);
            }
        },

        bindEvents() {
            const generateBtn = DOMUtils.getElement('generateBtn');
            const clearBtn = DOMUtils.getElement('clearBtn');
            const copyBtn = DOMUtils.getElement('copyBtn');
            const loadLastBtn = DOMUtils.getElement('loadLastBtn');
            const closeOutputModal = DOMUtils.getElement('closeOutputModal');
            const copyMain = DOMUtils.getElement('copyMain');
            const datePosition = DOMUtils.getElement('datePosition');

            if (generateBtn) {
                DOMUtils.addEventListener(generateBtn, 'click', () => this.generateInstallments());
            }

            if (clearBtn) {
                DOMUtils.addEventListener(clearBtn, 'click', () => this.clearForm());
            }

            if (copyBtn) {
                DOMUtils.addEventListener(copyBtn, 'click', () => this.copyToClipboard());
            }

            if (loadLastBtn) {
                DOMUtils.addEventListener(loadLastBtn, 'click', () => this.loadLastConfig());
            }

            if (closeOutputModal) {
                DOMUtils.addEventListener(closeOutputModal, 'click', () => this.closeOutputModal());
            }

            if (copyMain) {
                DOMUtils.addEventListener(copyMain, 'click', () => this.copyFromModal());
            }

            if (datePosition) {
                DOMUtils.addEventListener(datePosition, 'change', () => this.updatePreview());
            }
        },

        validateForm() {
            const amount = parseFloat(DOMUtils.getValue(DOMUtils.getElement('amount')));
            const product = DOMUtils.getValue(DOMUtils.getElement('product')).trim();
            const installments = parseInt(DOMUtils.getValue(DOMUtils.getElement('installments')));

            if (!amount || amount <= 0) {
                AlertModal.show('El monto debe ser un número positivo');
                return false;
            }

            if (amount > 1000000000) {
                AlertModal.show('El monto máximo es $1.000.000.000');
                return false;
            }

            if (!product) {
                AlertModal.show('El producto es requerido');
                return false;
            }

            if (!installments || installments < 1 || installments > 36) {
                AlertModal.show('El número de cuotas debe estar entre 1 y 36');
                return false;
            }

            return true;
        },

        generateInstallments() {
            if (!this.validateForm()) {
                return;
            }

            const amount = parseFloat(DOMUtils.getValue(DOMUtils.getElement('amount')));
            const product = DOMUtils.getValue(DOMUtils.getElement('product')).trim();
            const store = DOMUtils.getValue(DOMUtils.getElement('store')).trim();
            const installments = parseInt(DOMUtils.getValue(DOMUtils.getElement('installments')));
            const person = DOMUtils.getValue(DOMUtils.getElement('person')).trim();
            const startDate = DOMUtils.getValue(DOMUtils.getElement('startDate'));
            const datePosition = DOMUtils.getValue(DOMUtils.getElement('datePosition')) || 'start';

            // Calcular total automáticamente
            const total = amount * installments;

            this.currentInstallments = [];

            // Calcular fecha base
            let baseDate = null;
            if (startDate) {
                baseDate = new Date(startDate + 'T00:00:00');
            }

            for (let i = 1; i <= installments; i++) {
                // Calcular fecha de la cuota
                let installmentDate = null;
                if (baseDate) {
                    installmentDate = new Date(baseDate);
                    installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
                }

                // Saldo: para la primera cuota es el total, luego se resta el monto
                const balance = total - (amount * (i - 1));
                const installment = {
                    number: i,
                    total: installments,
                    amount: amount,
                    product: product,
                    store: store,
                    person: person,
                    balance: balance,
                    date: installmentDate,
                    datePosition: datePosition
                };
                this.currentInstallments.push(installment);
            }

            this.updatePreview();
            
            // Pequeño retraso para asegurar que el DOM esté actualizado
            setTimeout(() => {
                this.showOutputModal();
            }, 50);
            
            this.saveConfig({
                amount,
                product,
                store,
                installments,
                person,
                startDate,
                datePosition
            });
            this.loadHistory();
        },

        formatNumber(num) {
            if (num === undefined || num === null) return '0';
            return num.toLocaleString('es-CL');
        },

        formatInstallment(installment) {
            const personPart = installment.person ? ` - 👤 ${installment.person}` : '';
            const storePart = installment.store ? ` (${installment.store})` : '';
            
            // Formatear fecha si existe
            let datePart = '';
            if (installment.date) {
                const year = installment.date.getFullYear();
                const month = String(installment.date.getMonth() + 1).padStart(2, '0');
                const day = String(installment.date.getDate()).padStart(2, '0');
                datePart = `${year}-${month}-${day}`;
            }

            const mainPart = `💰 $${this.formatNumber(installment.amount)} CLP - Cuota ${installment.number}/${installment.total} - 🛒 ${installment.product}${storePart}${personPart} | Saldo: $${this.formatNumber(installment.balance)}`;

            if (datePart) {
                if (installment.datePosition === 'start') {
                    return `${datePart} - ${mainPart}`;
                } else {
                    return `${mainPart} - ${datePart}`;
                }
            }

            return mainPart;
        },

        updatePreview() {
            const previewElement = DOMUtils.getElement('previewContent');
            if (!previewElement) {
                console.error('previewElement no encontrado');
                return;
            }

            // Leer la posición de fecha actual del selector
            const datePositionSelect = DOMUtils.getElement('datePosition');
            const currentDatePosition = datePositionSelect ? DOMUtils.getValue(datePositionSelect) : 'start';

            // Mostrar siempre un ejemplo genérico
            const exampleInstallments = [
                {
                    number: 1,
                    total: 6,
                    amount: 50000,
                    product: 'Piano digital Yamaha',
                    store: 'Music Store Santiago',
                    person: 'Juan Pérez',
                    balance: 300000,
                    date: new Date('2024-06-15'),
                    datePosition: currentDatePosition
                },
                {
                    number: 2,
                    total: 6,
                    amount: 50000,
                    product: 'Piano digital Yamaha',
                    store: 'Music Store Santiago',
                    person: 'Juan Pérez',
                    balance: 250000,
                    date: new Date('2024-07-15'),
                    datePosition: currentDatePosition
                },
                {
                    number: 3,
                    total: 6,
                    amount: 50000,
                    product: 'Piano digital Yamaha',
                    store: 'Music Store Santiago',
                    person: 'Juan Pérez',
                    balance: 200000,
                    date: new Date('2024-08-15'),
                    datePosition: currentDatePosition
                }
            ];

            const previewText = exampleInstallments
                .map(installment => this.formatInstallment(installment))
                .join('\n');

            const exampleNote = '\n\n... (ejemplo: mostrando las primeras 3 cuotas)';

            DOMUtils.setText(previewElement, previewText + exampleNote);
            DOMUtils.removeClass(previewElement, 'preview-placeholder');
        },

        copyToClipboard() {
            if (this.currentInstallments.length === 0) {
                AlertModal.show('No hay cuotas generadas para copiar');
                return;
            }

            const text = this.currentInstallments
                .map(installment => this.formatInstallment(installment))
                .join('\n');

            try {
                navigator.clipboard.writeText(text);
                AlertModal.show('Cuotas copiadas al portapapeles');
            } catch (error) {
                AlertModal.show('Error al copiar al portapapeles');
            }
        },

        showOutputModal() {
            const outputModal = DOMUtils.getElement('outputModal');
            const mainTaskModal = DOMUtils.getElement('mainTaskModal');
            
            console.log('showOutputModal - currentInstallments:', this.currentInstallments.length);
            console.log('showOutputModal - outputModal:', outputModal);
            console.log('showOutputModal - mainTaskModal:', mainTaskModal);
            
            if (mainTaskModal && this.currentInstallments.length > 0) {
                const text = this.currentInstallments
                    .map(installment => this.formatInstallment(installment))
                    .join('\n');
                DOMUtils.setValue(mainTaskModal, text);
                console.log('showOutputModal - text set');
            }
            
            if (outputModal) {
                DOMUtils.addClass(outputModal, 'visible');
                console.log('showOutputModal - modal visible class added');
                
                // Verificar estilos computados
                const computedStyle = window.getComputedStyle(outputModal);
                console.log('showOutputModal - computed display:', computedStyle.display);
                console.log('showOutputModal - computed visibility:', computedStyle.visibility);
                console.log('showOutputModal - computed opacity:', computedStyle.opacity);
                console.log('showOutputModal - computed z-index:', computedStyle.zIndex);
            }
        },

        closeOutputModal() {
            const outputModal = DOMUtils.getElement('outputModal');
            if (outputModal) {
                DOMUtils.removeClass(outputModal, 'visible');
            }
        },

        copyFromModal() {
            const mainTaskModal = DOMUtils.getElement('mainTaskModal');
            console.log('copyFromModal - mainTaskModal:', mainTaskModal);
            console.log('copyFromModal - value:', mainTaskModal ? mainTaskModal.value : 'N/A');
            
            if (mainTaskModal && mainTaskModal.value) {
                // Método alternativo usando selección de texto
                mainTaskModal.select();
                mainTaskModal.setSelectionRange(0, 99999); // Para móviles
                
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        AlertModal.show('Cuotas copiadas al portapapeles');
                    } else {
                        AlertModal.show('Error al copiar al portapapeles');
                    }
                } catch (error) {
                    console.error('Error al copiar:', error);
                    AlertModal.show('Error al copiar al portapapeles: ' + error.message);
                }
                
                // Deseleccionar
                mainTaskModal.setSelectionRange(0, 0);
            } else {
                AlertModal.show('No hay texto para copiar');
            }
        },

        clearForm() {
            DOMUtils.setValue(DOMUtils.getElement('amount'), '');
            DOMUtils.setValue(DOMUtils.getElement('product'), '');
            DOMUtils.setValue(DOMUtils.getElement('installments'), '');
            DOMUtils.setValue(DOMUtils.getElement('store'), '');
            DOMUtils.setValue(DOMUtils.getElement('person'), '');
            DOMUtils.setValue(DOMUtils.getElement('startDate'), '');
            DOMUtils.setValue(DOMUtils.getElement('datePosition'), 'start');
            
            this.currentInstallments = [];
            this.updatePreview();
        },

        saveConfig(config) {
            StorageService.saveHistory(config);
        },

        loadHistory() {
            const historyList = DOMUtils.getElement('historyList');
            if (!historyList) return;

            const history = StorageService.getHistory();

            if (history.length === 0) {
                DOMUtils.setText(historyList, '<p class="no-history">No hay configuraciones guardadas</p>');
                return;
            }

            let html = '';
            history.forEach((config, index) => {
                const total = config.total || (config.amount * config.installments);
                html += `
                    <div class="history-item" data-index="${index}">
                        <div class="history-item-title">${config.product} - ${config.store || 'Sin tienda'}</div>
                        <div class="history-item-details">
                            $${this.formatNumber(config.amount)} CLP | ${config.installments} cuotas | Total: $${this.formatNumber(total)} CLP
                        </div>
                    </div>
                `;
            });

            DOMUtils.setHTML(historyList, html);

            // Agregar eventos click a los items de historial
            const historyItems = historyList.querySelectorAll('.history-item');
            historyItems.forEach(item => {
                DOMUtils.addEventListener(item, 'click', () => {
                    const index = parseInt(item.dataset.index);
                    this.loadConfigByIndex(index);
                });
            });
        },

        loadLastConfig() {
            const lastConfig = StorageService.getLastConfig();
            if (!lastConfig) {
                AlertModal.show('No hay configuración anterior guardada');
                return;
            }

            this.loadConfig(lastConfig);
            AlertModal.show('Última configuración cargada');
        },

        loadConfigByIndex(index) {
            const history = StorageService.getHistory();
            if (index >= 0 && index < history.length) {
                this.loadConfig(history[index]);
                AlertModal.show('Configuración cargada');
            }
        },

        loadConfig(config) {
            DOMUtils.setValue(DOMUtils.getElement('amount'), config.amount);
            DOMUtils.setValue(DOMUtils.getElement('product'), config.product);
            DOMUtils.setValue(DOMUtils.getElement('installments'), config.installments);
            DOMUtils.setValue(DOMUtils.getElement('store'), config.store || '');
            DOMUtils.setValue(DOMUtils.getElement('person'), config.person || '');
            DOMUtils.setValue(DOMUtils.getElement('startDate'), config.startDate || '');
            DOMUtils.setValue(DOMUtils.getElement('datePosition'), config.datePosition || 'start');
        }
    };

    // Inicializar cuando el DOM esté listo
    function initTodoPagos() {
        TodoPagosApp.init();
    }

    // Exponer función globalmente para que el router pueda llamarla
    window.initTodoPagos = initTodoPagos;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initTodoPagos());
    } else {
        initTodoPagos();
    }
})();
