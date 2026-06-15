// Router simple para SPA
(function() {
    
    // Rutas disponibles
    const routes = {
        '/': '/pages/index.html',
        '/proyectos': '/proyectos/proyectos.html',
        '/todo_popcorn': '/pages/todo_popcorn.html'
    };
    
    function normalizeRoute(path) {
        if (!path) return '/';
        const normalized = path.replace(/^#/, '').replace(/\/$/, '') || '/';
        return normalized;
    }

    function getCurrentRoute() {
        if (window.location.hash) {
            return normalizeRoute(window.location.hash.slice(1));
        }
        return normalizeRoute(window.location.pathname);
    }

    // Cargar página
    function loadPage(path) {
        // Normalizar ruta (remover trailing slash)
        let normalizedPath = normalizeRoute(path);
        
        const file = routes[normalizedPath];
        if (!file) return;
        
        fetch(file)
            .then(res => res.text())
            .then(html => {
                // Extraer solo el contenido main
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const newMain = temp.querySelector('main');
                const currentMain = document.querySelector('main');
                
                if (newMain && currentMain) {
                    currentMain.innerHTML = newMain.innerHTML;

                    // Eliminar scripts inyectados anteriormente para evitar acumulación
                    document.querySelectorAll('script[data-router-injected]').forEach(old => old.remove());

                    // Ejecutar scripts incluidos en el HTML cargado (scripts inline o con src)
                    // Al insertar HTML con innerHTML los <script> no se ejecutan, así que los clonamos y los añadimos al body.
                    const scripts = temp.querySelectorAll('script');
                    scripts.forEach(oldScript => {
                        try {
                            const s = document.createElement('script');
                            if (oldScript.src) {
                                s.src = oldScript.src;
                                s.async = false;
                            } else {
                                s.textContent = oldScript.textContent;
                            }
                            s.dataset.routerInjected = '1';
                            document.body.appendChild(s);
                        } catch (e) {
                            console.warn('Error ejecutando script inyectado', e);
                        }
                    });

                    const title = temp.querySelector('title')?.textContent || '27thDeer';
                    document.title = title;
                    
                    // Actualizar la URL usando hash para evitar recargar rutas físicas
                    if (window.location.hash !== '#' + normalizedPath) {
                        window.location.hash = normalizedPath;
                    }
                    
                    // Actualizar navbar activo
                    updateActiveLink(normalizedPath);
                    
                    // Iniciar efectos específicos de la página (ej. typewriter)
                    try { initTypewriter(); } catch (e) { /* no-op */ }
                }
            });
    }
    
    // Exponer utilidades globales para que los index.html de las subcarpetas puedan usarlas
    window.loadPage = loadPage;
    window.getCurrentRoute = getCurrentRoute;

    window.addEventListener('hashchange', function() {
        loadPage(getCurrentRoute());
    });

    // Typewriter initializer: si existe elemento con id 'homeTypewriter', lo escribe por líneas
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function initTypewriter() {
        const container = document.getElementById('homeTypewriter');
        if (!container) return;

        // Si ya fue inicializado, evitar reiniciar
        if (container.dataset.initiated === '1') return;
        container.dataset.initiated = '1';

        const raw = Array.from(container.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        // separar en frases por puntuación (manteniendo el signo)
        const sentences = raw.match(/[^.!?]+[.!?]*/g) || [raw];

        container.innerHTML = '';
        for (let s = 0; s < sentences.length; s++) {
            const sentence = sentences[s].trim();
            const p = document.createElement('span');
            p.className = 'type-line';
            container.appendChild(p);

            p.classList.add('active');
            for (let i = 1; i <= sentence.length; i++) {
                p.textContent = sentence.slice(0, i);
                await sleep(100 + Math.random() * 80); // más lento por carácter (160-240ms)
            }
            p.classList.remove('active');
            await sleep(1500 + Math.random() * 500); // pausa entre frases (1.5-2s)
        }

        // mostrar autor si existe originalmente
        await sleep(3000);
        const authorSpan = document.createElement('span');
        authorSpan.className = 'author';
        authorSpan.textContent = container.dataset.author || '- Crónicas Marcianas, Ray Bradbury';
        container.appendChild(authorSpan);
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
            // Nota: la página "Tienda" se ha deshabilitado; no se redirige.
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
    
    // Actualizar link activo en navbar
    function updateActiveLink(activePath) {
        // Quitar clase active de todos los links
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Agregar clase active al link correspondiente
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === activePath || href === '#' + activePath) {
                link.classList.add('active');
            }
        });
    }
    
    // Inicializar clicks
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (!href) return;
                const routePath = href.startsWith('#') ? href.slice(1) : href;
                
                // Solo procesar rutas limpias (empiezan con / o #/)
                if ((href.startsWith('#/') || (href.startsWith('/') && !href.endsWith('.html')))) {
                    e.preventDefault();
                    loadPage(routePath);
                }
            });
        });

        // Cargar la página inicial según el hash o la ruta actual
        loadPage(getCurrentRoute());
    });
    
})();
