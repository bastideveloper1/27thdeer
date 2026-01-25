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
                    
                    // Cargar main content
                    const newMain = temp.querySelector('main');
                    const currentMain = document.querySelector('main');
                    
                    if (newMain && currentMain) {
                        currentMain.innerHTML = newMain.innerHTML;
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
            }
            main {
                background: #ffffff !important;
            }
            h1 {
                color: #000000 !important;
            }
            /* FORZAR navbar rojo con letras blancas - ANCHO COMPLETO */
            .subtle-nav {
                background: linear-gradient(90deg, #dc3545 0%, #c82333 100%) !important;
                padding: 8px 20px !important;
                text-align: center !important;
                border-bottom: 1px solid #a02530 !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3) !important;
                position: sticky !important;
                top: 0 !important;
                z-index: 1000 !important;
                width: 100% !important;
                left: 0 !important;
                right: 0 !important;
                margin: 0 !important;
                box-sizing: border-box !important;
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
                top: 60px !important;
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
