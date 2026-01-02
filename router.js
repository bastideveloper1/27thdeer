// Router para URLs limpias sin .html
(function() {
    'use strict';
    
    // Mapeo de rutas limpias a archivos HTML
    const routes = {
        '/': 'index.html',
        '/acerca': 'pages/acerca.html',
        '/proyectos': 'pages/proyectos.html',
        '/contacto': 'pages/contacto.html'
    };
    
    // Función para obtener la ruta actual
    function getCurrentPath() {
        const pathname = window.location.pathname;
        
        // Si estamos en pages/, extraer la ruta limpia
        if (pathname.includes('/pages/')) {
            const pathParts = pathname.split('/pages/');
            if (pathParts.length > 1) {
                const pageName = pathParts[1].replace('.html', '');
                if (pageName === 'index') {
                    return '/';
                }
                return '/' + pageName;
            }
        }
        
        // Si estamos en la raíz, usar la ruta normal
        return pathname.replace(/\/$/, '') || '/';
    }
    
    // Función para cargar página dinámicamente
    function loadPage(path, addToHistory = true) {
        const htmlFile = routes[path];
        if (!htmlFile) {
            // Si no hay ruta, redirigir al inicio
            window.location.href = '/';
            return;
        }
        
        // Determinar la ruta base para fetch
        const basePath = window.location.pathname.includes('/pages/') ? '../' : '';
        const fetchUrl = basePath + htmlFile;
        
        fetch(fetchUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Archivo no encontrado');
                }
                return response.text();
            })
            .then(html => {
                // Parsear HTML y extraer contenido
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Actualizar título
                document.title = doc.title;
                
                // Reemplazar el contenido main completamente
                const newMain = doc.querySelector('main');
                const currentMain = document.querySelector('main');
                if (newMain && currentMain) {
                    // Reemplazar todo el main con su contenido completo
                    currentMain.outerHTML = newMain.outerHTML;
                    
                    // Forzar recalculo de layout
                    const newMainElement = document.querySelector('main');
                    if (newMainElement) {
                        newMainElement.style.display = 'none';
                        newMainElement.offsetHeight; // Trigger reflow
                        newMainElement.style.display = '';
                        
                        // Forzar scroll al inicio
                        window.scrollTo(0, 0);
                        
                        // Forzar recalculo de altura
                        document.body.offsetHeight;
                    }
                }
                
                // Actualizar navegación activa
                updateActiveNav(path);
                
                // Actualizar URL en el navegador (sin recargar)
                if (addToHistory && path !== window.location.pathname) {
                    window.history.pushState({ path: path }, '', path);
                }
                
                // Re-inicializar scripts si es necesario
                reinitializeScripts();
            })
            .catch(error => {
                console.error('Error cargando página:', error);
                // Si hay error, redirigir al archivo HTML directamente
                window.location.href = htmlFile;
            });
    }
    
    // Actualizar navegación activa
    function updateActiveNav(currentPath) {
        const navLinks = document.querySelectorAll('.subtle-nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            // Convertir href a ruta limpia para comparar
            let cleanHref = href;
            if (href === 'index.html') {
                cleanHref = '/';
            } else if (href.endsWith('.html')) {
                cleanHref = '/' + href.replace('.html', '');
            }
            
            if (cleanHref === currentPath) {
                link.classList.add('active');
            }
        });
    }
    
    // Re-inicializar scripts (para Bootstrap modal, etc.)
    function reinitializeScripts() {
        // Esperar un poco más para que el DOM se actualice completamente
        setTimeout(() => {
            // Si hay modales Bootstrap, re-inicializar
            if (typeof bootstrap !== 'undefined') {
                // Limpiar modales existentes
                const existingModals = document.querySelectorAll('.modal');
                existingModals.forEach(modal => modal.remove());
                
                // Agregar modal si estamos en proyectos
                if (window.location.pathname.includes('proyectos')) {
                    const modalHTML = `
                        <div class="modal fade" id="linkUnavailableModal" tabindex="-1" aria-labelledby="linkUnavailableModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content site-modal">
                                    <div class="modal-body site-modal-body">
                                        <img src="img/whiteLogo2.png" alt="27thDeer Logo" class="site-modal-logo">
                                        <p class="site-modal-title" id="linkUnavailableModalLabel">Enlace no disponible</p>
                                        <p class="site-modal-text">Por el momento no está disponible el enlace.</p>
                                        <button type="button" class="btn site-modal-ok" data-bs-dismiss="modal">OK</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.insertAdjacentHTML('beforeend', modalHTML);
                }
            }
            
            // Re-inicializar eventos de navegación
            initializeNavigationEvents();
            
            // Forzar otro reflow para asegurar layout
            document.body.offsetHeight;
        }, 50); // Aumentado a 50ms para asegurar que el DOM esté completamente actualizado
    }
    
    // Inicializar eventos de navegación
    function initializeNavigationEvents() {
        // Remover eventos existentes para evitar duplicación
        const navLinks = document.querySelectorAll('.subtle-nav a');
        navLinks.forEach(link => {
            // Clonar el enlace para eliminar eventos antiguos
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });
        
        // Agregar nuevos eventos
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    return;
                }
                
                e.preventDefault();
                
                // Convertir href a ruta limpia
                let cleanPath = href;
                if (href === 'index.html') {
                    cleanPath = '/';
                } else if (href.endsWith('.html')) {
                    cleanPath = '/' + href.replace('.html', '');
                }
                
                // Cargar página
                loadPage(cleanPath);
            });
        });
    }
    
    // Manejar clics en enlaces
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }
        
        e.preventDefault();
        
        // Convertir href a ruta limpia
        let cleanPath = href;
        if (href === 'index.html') {
            cleanPath = '/';
        } else if (href.endsWith('.html')) {
            cleanPath = '/' + href.replace('.html', '');
        }
        
        // Cargar página
        loadPage(cleanPath);
    });
    
    // Manejar navegación con botones del navegador
    window.addEventListener('popstate', function(e) {
        const path = e.state?.path || getCurrentPath();
        loadPage(path, false);
    });
    
    // Inicialización al cargar la página
    function initialize() {
        const currentPath = getCurrentPath();
        
        // Inicializar eventos de navegación
        initializeNavigationEvents();
        
        // Si estamos en la raíz (/), asegurarnos de que todo funcione correctamente
        if (currentPath === '/' || window.location.pathname.endsWith('index.html')) {
            // Actualizar navegación activa
            updateActiveNav('/');
            return;
        }
        
        // Si estamos en pages/, no hacer carga dinámica (ya estamos en la página correcta)
        if (window.location.pathname.includes('/pages/')) {
            // Solo actualizar navegación activa
            updateActiveNav(currentPath);
            return;
        }
        
        // Si estamos en una ruta limpia que existe en nuestro mapa
        if (routes[currentPath]) {
            // Cargar el contenido dinámicamente
            loadPage(currentPath, false);
        }
    }
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
