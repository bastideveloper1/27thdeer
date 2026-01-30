// Router simple para SPA
(function() {
    
    // Rutas disponibles
    const routes = {
        '/': 'index.html',
        '/acerca': 'pages/acerca.html',
        '/proyectos': 'pages/proyectos.html', 
        '/contacto': 'pages/contacto.html',
        '/tienda': 'tiendaPages/tienda.html'
    };
    
    // Cargar página
    function loadPage(path) {
        // Verificar autenticación para páginas protegidas
        if (path === '/tienda' && !checkAuth()) {
            // Mostrar modal de autenticación
            showAuthModal();
            return;
        }
        
        const file = routes[path];
        if (!file) return;
        
        fetch(file)
            .then(res => res.text())
            .then(html => {
                // Para tienda, cargar main + agregar elementos especiales
                if (path === '/tienda') {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    
                    // Ocultar navbar principal de forma más agresiva
                    const mainNav = document.querySelector('.subtle-nav');
                    if (mainNav) {
                        mainNav.style.display = 'none';
                        mainNav.style.visibility = 'hidden';
                        mainNav.style.opacity = '0';
                        mainNav.style.height = '0';
                        mainNav.style.overflow = 'hidden';
                    }
                    
                    // Cargar main content
                    const newMain = temp.querySelector('main');
                    const currentMain = document.querySelector('main');
                    
                    if (newMain && currentMain) {
                        currentMain.innerHTML = newMain.innerHTML;
                    }
                    
                    // Agregar header profesional de tienda ANTES del main
                    if (currentMain) {
                        document.body.insertBefore(addTiendaHeader(), currentMain);
                    } else {
                        document.body.appendChild(addTiendaHeader());
                    }
                    
                    // Agregar botón Salir de Demo
                    addDemoExitButton();
                    
                    // Agregar footer de tienda
                    addTiendaFooter();
                    
                } else {
                    // Para otras páginas, solo cargar main
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    const newMain = temp.querySelector('main');
                    const currentMain = document.querySelector('main');
                    
                    if (newMain && currentMain) {
                        currentMain.innerHTML = newMain.innerHTML;
                    }
                    
                    // Mostrar navbar principal para otras páginas
                    const mainNav = document.querySelector('.subtle-nav');
                    if (mainNav) {
                        mainNav.style.display = 'flex';
                    }
                    
                    // Remover elementos especiales de tienda
                    removeTiendaElements();
                }
                
                // Actualizar el título de la página
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const title = temp.querySelector('title')?.textContent || '27thDeer';
                document.title = title;
                
                // Aplicar CSS específico para tienda
                if (path === '/tienda') {
                    applyTiendaStyles();
                } else {
                    removeTiendaStyles();
                }
                
                // Actualizar la URL en el navegador
                history.pushState({}, '', path);
                
                // Actualizar navbar activo
                updateActiveLink(path);
            });
    }
    
    // Agregar header profesional de tienda
    function addTiendaHeader() {
        // Remover si existe
        const existing = document.querySelector('.tienda-header');
        if (existing) existing.remove();
        
        // Crear header profesional
        const header = document.createElement('header');
        header.className = 'tienda-header';
        header.innerHTML = `
            <div class="header-container">
                <!-- Logo de Tienda -->
                <div class="tienda-logo">
                    <img src="../imgTienda/logotipotiendaWhite.png" alt="Logo Tienda" class="tienda-logo-img">
                </div>
                
                <!-- Barra de Búsqueda -->
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Buscar productos...">
                    <button class="search-btn">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
                
                <!-- Categorías y Cuenta -->
                <div class="header-actions">
                    <!-- Menú Desplegable de Categorías -->
                    <div class="dropdown">
                        <button class="dropdown-btn">
                            Categorías <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-content">
                            <a href="#" class="category-item">
                                <i class="fas fa-magic"></i> Elementos Mágicos
                            </a>
                            <a href="#" class="category-item">
                                <i class="fas fa-dragon"></i> Criaturas Fantásticas
                            </a>
                            <a href="#" class="category-item">
                                <i class="fas fa-hat-wizard"></i> Artefactos Antiguos
                            </a>
                        </div>
                    </div>
                    
                    <!-- Inicio de Sesión -->
                    <a href="#" class="auth-link login-link">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </a>
                    
                    <!-- Mi Cuenta -->
                    <a href="#" class="auth-link account-link">
                        <i class="fas fa-user"></i> Mi Cuenta
                    </a>
                    
                    <!-- Carrito de Compras -->
                    <a href="#" class="cart-link">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count">0</span>
                    </a>
                </div>
            </div>
        `;
        return header; // Devolver el elemento en lugar de agregarlo
    }
    
    // Agregar botón Salir de Demo
    function addDemoExitButton() {
        // Remover si existe
        const existing = document.querySelector('.demo-exit');
        if (existing) existing.remove();
        
        // Crear botón
        const demoExit = document.createElement('div');
        demoExit.className = 'demo-exit';
        demoExit.innerHTML = `
            <a href="/" class="demo-exit-btn">
                <i class="fas fa-sign-out-alt"></i>
                Salir de Demo
            </a>
        `;
        document.body.appendChild(demoExit);
    }
    
    // Agregar footer de tienda
    function addTiendaFooter() {
        // Remover si existe
        const existing = document.querySelector('.tienda-footer');
        if (existing) existing.remove();
        
        // Crear footer
        const footer = document.createElement('footer');
        footer.className = 'tienda-footer';
        footer.innerHTML = `
            <div class="social-icons">
                <a href="https://www.facebook.com/bastian.enrique.876515" target="_blank" class="social-icon">
                    <i class="fab fa-facebook-f"></i>
                </a>
                <a href="https://instagram.com/itsbasti_an" target="_blank" class="social-icon">
                    <i class="fab fa-instagram"></i>
                </a>
                <a href="https://www.youtube.com/@27thdeer" target="_blank" class="social-icon">
                    <i class="fab fa-youtube"></i>
                </a>
            </div>
            <p class="footer-text">© 2025 27thDeer - Tienda Online</p>
        `;
        document.body.appendChild(footer);
    }
    
    // Remover elementos especiales de tienda
    function removeTiendaElements() {
        const demoExit = document.querySelector('.demo-exit');
        if (demoExit) demoExit.remove();
        
        const tiendaFooter = document.querySelector('.tienda-footer');
        if (tiendaFooter) tiendaFooter.remove();
        
        const tiendaHeader = document.querySelector('.tienda-header');
        if (tiendaHeader) tiendaHeader.remove();
        
        // Restaurar navbar principal
        const mainNav = document.querySelector('.subtle-nav');
        if (mainNav) {
            mainNav.style.display = 'flex';
        }
    }
    
    // Mostrar modal de autenticación
    function showAuthModal() {
        // Crear modal si no existe
        if (!document.getElementById('authModal')) {
            const modal = document.createElement('div');
            modal.id = 'authModal';
            modal.innerHTML = `
                <div class="auth-modal-overlay">
                    <div class="auth-modal">
                        <div class="auth-header">
                            <img src="img/whiteLogo2.png" alt="27thDeer Logo" class="auth-logo" />
                            <h3>🔒 Página Protegida</h3>
                            <p>Esta página requiere contraseña para acceder</p>
                        </div>
                        <div class="auth-body">
                            <input type="password" id="authPassword" placeholder="Ingrese contraseña" />
                            <div class="auth-buttons">
                                <button id="authSubmit">Acceder</button>
                                <button id="authCancel" class="cancel-btn">Cancelar</button>
                            </div>
                            <div id="authError" class="auth-error"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Agregar estilos
            const style = document.createElement('style');
            style.textContent = `
                .auth-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    backdrop-filter: blur(10px);
                }
                
                .auth-modal {
                    background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
                    border: 2px solid transparent;
                    background-image: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%), 
                                      linear-gradient(145deg, #ffd700, #ffed4e);
                    background-origin: border-box;
                    background-clip: padding-box, border-box;
                    border-radius: 15px;
                    box-shadow: 
                        0 0 30px rgba(255, 215, 0, 0.3),
                        0 20px 60px rgba(0, 0, 0, 0.5),
                        inset 0 0 20px rgba(255, 215, 0, 0.1);
                    max-width: 450px;
                    width: 90%;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    animation: authGlow 2s ease-in-out infinite alternate;
                }
                
                .auth-modal::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #ffd700, #ffed4e, #ffd700, #ffed4e);
                    border-radius: 15px;
                    z-index: -1;
                    animation: borderGlow 3s linear infinite;
                }
                
                @keyframes authGlow {
                    0% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.1); }
                    50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.5), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(255, 215, 0, 0.2); }
                    100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.1); }
                }
                
                @keyframes borderGlow {
                    0% { opacity: 0.8; }
                    50% { opacity: 1; }
                    100% { opacity: 0.8; }
                }
                
                .auth-logo {
                    width: 180px;
                    height: 180px;
                    margin-bottom: 0.8rem;
                    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8));
                    animation: logoFloat 3s ease-in-out infinite;
                    object-fit: contain;
                    border-radius: 0;
                }
                
                @keyframes logoFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                .auth-header h3 {
                    margin: 0 0 0.5rem 0;
                    color: #ffd700;
                    font-size: 1.2rem;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                    font-weight: 600;
                }
                
                .auth-header p {
                    margin: 0 0 0.8rem 0;
                    color: #ccc;
                    font-size: 0.8rem;
                }
                
                .auth-body input {
                    width: 80%;
                    padding: 0.8rem;
                    border: 2px solid rgba(255, 215, 0, 0.3);
                    border-radius: 8px;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                    box-sizing: border-box;
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    transition: all 0.3s ease;
                }
                
                .auth-body input:focus {
                    outline: none;
                    border-color: #ffd700;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .auth-body input::placeholder {
                    color: #888;
                }
                
                .auth-body button {
                    width: 45%;
                    padding: 0.7rem;
                    background: linear-gradient(45deg, #ffd700, #ffed4e);
                    color: #1a1a1a;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
                    transform: scale(1);
                    transform-origin: center;
                }
                
                .auth-body button:hover {
                    background: linear-gradient(45deg, #ffed4e, #ffd700);
                    transform: translateY(-1px) scale(1.02);
                    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
                }
                
                .auth-body button:active {
                    transform: translateY(0px) scale(0.98);
                    box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
                }
                
                .cancel-btn {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    color: #fff;
                    margin-left: 4%;
                    width: 45%;
                    padding: 0.7rem;
                    font-size: 0.85rem;
                    border-radius: 8px;
                    transform: scale(1);
                    transform-origin: center;
                }
                
                .cancel-btn:hover {
                    background: linear-gradient(45deg, #495057, #343a40);
                    transform: translateY(-1px) scale(1.02);
                }
                
                .cancel-btn:active {
                    transform: translateY(0px) scale(0.98);
                }
                
                .auth-buttons {
                    display: flex;
                    gap: 3%;
                    margin-bottom: 1rem;
                    justify-content: center;
                }
                
                .auth-error {
                    color: #ff6b6b;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    min-height: 20px;
                    background: rgba(255, 107, 107, 0.1);
                    border-radius: 5px;
                    padding: 0.5rem;
                    border: 1px solid rgba(255, 107, 107, 0.2);
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(modal);
            
            // Agregar eventos
            document.getElementById('authSubmit').addEventListener('click', authenticate);
            document.getElementById('authCancel').addEventListener('click', cancelAuth);
            document.getElementById('authPassword').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    authenticate();
                }
            });
            
            // Enfocar en el input de contraseña
            setTimeout(() => {
                document.getElementById('authPassword').focus();
            }, 100);
        }
    }
    
    // Función para cancelar autenticación
    function cancelAuth() {
        // Eliminar modal
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.remove();
        }
        
        // NO redirigir, solo cerrar el modal
        // El usuario permanece en la página actual
    }
    
    // Función para autenticar
    function authenticate() {
        const password = document.getElementById('authPassword').value;
        const errorDiv = document.getElementById('authError');
        
        if (password === '27thdeer2025') {
            // Guardar sesión
            const authData = {
                authenticated: true,
                expires: Date.now() + (30 * 60 * 1000) // 30 minutos
            };
            localStorage.setItem('authData', JSON.stringify(authData));
            
            // Eliminar modal
            const modal = document.getElementById('authModal');
            if (modal) {
                modal.remove();
            }
            
            // Cargar la página tienda
            loadPage('/tienda');
        } else {
            errorDiv.textContent = '❌ Contraseña incorrecta';
            document.getElementById('authPassword').value = '';
            document.getElementById('authPassword').focus();
        }
    }
    
    // Verificar autenticación
    function checkAuth() {
        const authData = localStorage.getItem('authData');
        if (!authData) return false;
        
        const data = JSON.parse(authData);
        const now = Date.now();
        return data.expires > now;
    }
    
    // Aplicar estilos específicos para tienda
    function applyTiendaStyles() {
        // Crear o actualizar estilos para tienda
        let tiendaStyle = document.getElementById('tienda-dynamic-styles');
        if (!tiendaStyle) {
            tiendaStyle = document.createElement('style');
            tiendaStyle.id = 'tienda-dynamic-styles';
            document.head.appendChild(tiendaStyle);
        }
        
        tiendaStyle.textContent = `
            body {
                background: #ffffff !important;
                color: #000000 !important;
                padding-top: 0 !important;
                margin-top: 0 !important;
            }
            main {
                background: #ffffff !important;
                margin-top: 0 !important;
                padding-top: 20px !important;
                clear: both !important;
            }
            h1 {
                color: #000000 !important;
            }
            /* Asegurar orden correcto de elementos */
            .tienda-header {
                position: relative !important;
                z-index: 1000 !important;
                display: block !important;
                width: 100% !important;
            }
            main {
                position: relative !important;
                z-index: 999 !important;
                display: block !important;
                width: 100% !important;
            }
            /* Ocultar navbar principal en tienda */
            .subtle-nav:not(.tienda-header .subtle-nav) {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
            }
            /* Ocultar contador de visitas en tienda */
            .visit-counter {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
            }
            /* FORZAR navbar rojo con letras blancas - ANCHO COMPLETO */
            .tienda-header {
                background: linear-gradient(90deg, #dc3545 0%, #c82333 100%) !important;
                padding: 3px 20px 5px 20px !important;    /* Un poco más de padding superior */
                height: 50px !important;         /* Aumentado desde 45px */
                min-height: 50px !important;     /* Altura mínima */
                max-height: 50px !important;     /* Altura máxima */
                box-shadow: 0 2px 10px rgba(220, 53, 69, 0.3) !important;
                position: sticky !important;
                top: 0 !important;
                z-index: 1000 !important;
                width: 100% !important;
                box-sizing: border-box !important;
                overflow: hidden !important;      /* Evitar que se agrande */
            }
            .subtle-nav a {
                color: #ffffff !important;
                text-decoration: none !important;
                margin: 0 12px !important;
                font-size: 13px !important;
                font-weight: 300 !important;
                letter-spacing: 0.5px !important;
                transition: all 0.3s ease !important;
                opacity: 0.9 !important;
            }
            .subtle-nav a:hover {
                color: #ffffff !important;
                opacity: 1 !important;
                transform: translateY(-1px) !important;
                text-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
            }
            .subtle-nav a.active {
                color: #ffffff !important;
                font-weight: 400 !important;
                opacity: 1 !important;
                border-bottom: 1px solid #ffffff !important;
                padding-bottom: 2px !important;
            }
            .subtle-nav .divider {
                color: rgba(255, 255, 255, 0.6) !important;
                margin: 0 8px !important;
                font-size: 12px !important;
            }
            /* Botón Salir de Demo - Esquina Izquierda */
            .demo-exit {
                position: fixed !important;
                top: 80px !important;    /* Bajado desde 20px */
                left: 20px !important;
                z-index: 1001 !important;
            }
            .demo-exit-btn {
                display: inline-flex !important;
                align-items: center !important;
                gap: 8px !important;
                background: linear-gradient(135deg, #ff6b6b 0%, #dc3545 100%) !important;
                color: #ffffff !important;
                text-decoration: none !important;
                padding: 10px 16px !important;
                border-radius: 8px !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3) !important;
                transition: all 0.3s ease !important;
                border: 2px solid transparent !important;
            }
            .demo-exit-btn:hover {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
                color: #ffffff !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 16px rgba(220, 53, 69, 0.4) !important;
                text-decoration: none !important;
            }
            .demo-exit-btn:active {
                transform: translateY(0px) !important;
                box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3) !important;
            }
            .demo-exit-btn i {
                font-size: 14px !important;
            }
            /* Header Profesional de Tienda */
            .tienda-header {
                background: linear-gradient(90deg, #dc3545 0%, #c82333 100%) !important;
                padding: 15px 20px !important;
                box-shadow: 0 2px 10px rgba(220, 53, 69, 0.3) !important;
                position: sticky !important;
                top: 0 !important;
                z-index: 1000 !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .header-container {
                display: flex !important;
                align-items: flex-start !important;        /* Alineado hacia arriba */
                justify-content: space-between !important;
                max-width: 1200px !important;
                margin: 0 auto !important;
                gap: 15px !important;               /* Reducido desde 20px */
                padding-top: 0px !important;         /* Sin padding superior - pegado al borde */
            }
            .tienda-logo h1 {
                color: #ffffff !important;
                font-size: 24px !important;
                font-weight: 700 !important;
                margin: 0 !important;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
                white-space: nowrap !important;
            }
            .tienda-logo-img {
                height: 40px !important;        /* Aumentado para header de 50px */
                max-width: 100px !important;    /* Un poco más grande */
                object-fit: contain !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
                margin-top: 0px !important;      /* Sin margen superior */
            }
            .search-container {
                display: flex !important;
                align-items: center !important;
                background: rgba(255, 255, 255, 0.15) !important;
                border-radius: 12px !important;        /* Reducido para header bajo */
                padding: 4px 12px !important;         /* Más padding horizontal */
                flex: 1 !important;
                max-width: 300px !important;         /* Aumentado desde 250px */
                height: 40px !important;              /* Aumentado para header de 50px */
                margin-top: 0px !important;          /* Sin margen superior */
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
            }
            .search-input {
                background: transparent !important;
                border: none !important;
                color: #ffffff !important;
                font-size: 14px !important;
                flex: 1 !important;
                outline: none !important;
                padding: 0 !important;
            }
            .search-input::placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
            }
            .search-btn {
                background: transparent !important;
                border: none !important;
                color: #ffffff !important;
                cursor: pointer !important;
                padding: 5px !important;
                border-radius: 50% !important;
                transition: all 0.3s ease !important;
            }
            .search-btn:hover {
                background: rgba(255, 255, 255, 0.2) !important;
            }
            .header-actions {
                display: flex !important;
                align-items: center !important;
                gap: 15px !important;
            }
            .dropdown {
                position: relative !important;
            }
            .dropdown-btn {
                background: rgba(255, 255, 255, 0.15) !important;
                color: #ffffff !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                padding: 4px 10px !important;         /* Un poco más de padding */
                border-radius: 3px !important;        /* Ultra fino */
                cursor: pointer !important;
                font-size: 11px !important;            /* Reducido más */
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;                 /* Reducido gap */
                height: 40px !important;              /* Aumentado para header de 50px */
                margin-top: 0px !important;          /* Sin margen superior */
                transition: all 0.3s ease !important;
                backdrop-filter: blur(10px) !important;
            }
            .dropdown-btn:hover {
                background: rgba(255, 255, 255, 0.25) !important;
                transform: translateY(-1px) !important;
            }
            .dropdown-content {
                display: none !important;
                position: absolute !important;
                top: 100% !important;
                left: 0 !important;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
                min-width: 200px !important;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
                border-radius: 8px !important;
                margin-top: 5px !important;
                overflow: hidden !important;
                z-index: 1001 !important;
            }
            .dropdown:hover .dropdown-content {
                display: block !important;
            }
            .category-item {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                padding: 12px 15px !important;
                color: #333333 !important;
                text-decoration: none !important;
                transition: all 0.3s ease !important;
                border-bottom: 1px solid rgba(0,0,0,0.05) !important;
            }
            .category-item:last-child {
                border-bottom: none !important;
            }
            .category-item:hover {
                background: linear-gradient(90deg, #dc3545 0%, #c82333 100%) !important;
                color: #ffffff !important;
            }
            .category-item i {
                width: 20px !important;
                text-align: center !important;
            }
            .auth-link {
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;                 /* Reducido gap */
                color: #ffffff !important;
                text-decoration: none !important;
                font-size: 11px !important;            /* Reducido más */
                padding: 4px 8px !important;          /* Un poco más de padding */
                border-radius: 3px !important;        /* Ultra fino */
                height: 40px !important;              /* Aumentado para header de 50px */
                margin-top: 0px !important;          /* Sin margen superior */
                transition: all 0.3s ease !important;
                background: rgba(255, 255, 255, 0.1) !important;
            }
            .auth-link:hover {
                background: rgba(255, 255, 255, 0.2) !important;
                transform: translateY(-1px) !important;
                color: #ffffff !important;
            }
            .cart-link {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                color: #ffffff !important;
                text-decoration: none !important;
                font-size: 13px !important;            /* Reducido más */
                padding: 4px 8px !important;          /* Un poco más de padding */
                border-radius: 3px !important;        /* Ultra fino */
                height: 40px !important;              /* Aumentado para header de 50px */
                margin-top: 0px !important;          /* Sin margen superior */
                transition: all 0.3s ease !important;
                background: rgba(255, 255, 255, 0.1) !important;
            }
            .cart-link:hover {
                background: rgba(255, 255, 255, 0.2) !important;
                transform: translateY(-1px) !important;
                color: #ffffff !important;
            }
            .cart-count {
                position: absolute !important;
                top: 5px !important;
                right: 5px !important;
                background: #ffd700 !important;
                color: #000000 !important;
                font-size: 10px !important;
                font-weight: bold !important;
                padding: 2px 5px !important;
                border-radius: 10px !important;
                min-width: 16px !important;
                text-align: center !important;
            }
            /* Footer para Tienda - ROJO */
            .tienda-footer {
                background: linear-gradient(90deg, #dc3545 0%, #c82333 100%) !important;
                color: #ffffff !important;
                padding: 20px !important;
                text-align: center !important;
                border-top: 1px solid #a02530 !important;
                margin-top: auto !important;
            }
            .tienda-footer .social-icons {
                margin-bottom: 15px !important;
            }
            .tienda-footer .social-icon {
                color: #ffffff !important;
                font-size: 20px !important;
                margin: 0 15px !important;
                text-decoration: none !important;
                transition: all 0.3s ease !important;
                opacity: 0.8 !important;
            }
            .tienda-footer .social-icon:hover {
                color: #ffffff !important;
                opacity: 1 !important;
                transform: translateY(-2px) !important;
                text-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
            }
            .tienda-footer .footer-text {
                color: #ffffff !important;
                font-size: 14px !important;
                margin: 0 !important;
                opacity: 0.9 !important;
            }
            /* Footer eliminado - solo para otros footers */
            footer:not(.tienda-footer) {
                display: none !important;
            }
            .footer-text:not(.tienda-footer .footer-text) {
                display: none !important;
            }
            .social-icons:not(.tienda-footer .social-icons) {
                display: none !important;
            }
            .social-icon:not(.tienda-footer .social-icon) {
                display: none !important;
            }
        `;
    }
    
    // Remover estilos específicos de tienda
    function removeTiendaStyles() {
        const tiendaStyle = document.getElementById('tienda-dynamic-styles');
        if (tiendaStyle) {
            tiendaStyle.remove();
        }
    }
    
    // Actualizar link activo en navbar
    function updateActiveLink(activePath) {
        // Quitar clase active de todos los links
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Agregar clase active al link correspondiente
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === activePath) {
                link.classList.add('active');
            }
        });
    }
    
    // Inicializar clicks
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Solo procesar rutas limpias (empiezan con /)
                if (href.startsWith('/') && !href.endsWith('.html')) {
                    e.preventDefault();
                    loadPage(href);
                }
            });
        });
    });
    
})();
