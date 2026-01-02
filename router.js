// Routing para URLs limpias sin .html
(function() {
    'use strict';
    
    // Mapeo de rutas limpias a archivos HTML
    const routes = {
        '/': 'index.html',
        '/acerca': 'acerca.html',
        '/proyectos': 'proyectos.html',
        '/contacto': 'contacto.html'
    };
    
    // Obtener la ruta actual
    const currentPath = window.location.pathname;
    
    // Si estamos en la raíz, no hacer nada
    if (currentPath === '/' || currentPath.endsWith('/index.html')) {
        return;
    }
    
    // Si la ruta termina en .html, redirigir a la versión limpia
    if (currentPath.endsWith('.html')) {
        const cleanPath = currentPath.replace('.html', '').replace('/index', '');
        window.history.replaceState({}, '', cleanPath);
        return;
    }
    
    // Si la ruta está en nuestro mapa pero no existe el archivo, redirigir
    if (routes[currentPath]) {
        // Verificar si el archivo existe antes de redirigir
        fetch(routes[currentPath], { method: 'HEAD' })
            .then(response => {
                if (!response.ok) {
                    // Si el archivo no existe, redirigir a la versión con .html
                    window.location.href = routes[currentPath];
                }
            })
            .catch(() => {
                // Si hay error, redirigir a la versión con .html
                window.location.href = routes[currentPath];
            });
    }
    
    // Manejar clics en enlaces internos
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }
        
        // Convertir rutas relativas a absolutas
        let cleanHref = href;
        if (href.startsWith('./')) {
            cleanHref = href.substring(2);
        }
        
        // Si es una ruta limpia, prevenir navegación y usar history API
        if (routes['/' + cleanHref]) {
            e.preventDefault();
            window.history.pushState({}, '', '/' + cleanHref);
            
            // Cargar el contenido dinámicamente
            loadPage('/' + cleanHref);
        }
    });
    
    // Función para cargar páginas dinámicamente
    function loadPage(path) {
        const htmlFile = routes[path];
        if (!htmlFile) return;
        
        fetch(htmlFile)
            .then(response => response.text())
            .then(html => {
                // Extraer el contenido del main
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newMain = doc.querySelector('main');
                const currentMain = document.querySelector('main');
                
                if (newMain && currentMain) {
                    currentMain.innerHTML = newMain.innerHTML;
                    
                    // Actualizar título
                    document.title = doc.title;
                    
                    // Actualizar navegación activa
                    updateActiveNav(path);
                    
                    // Scroll al inicio
                    window.scrollTo(0, 0);
                }
            })
            .catch(error => {
                console.error('Error cargando página:', error);
                // Si hay error, redirigir al archivo HTML
                window.location.href = htmlFile;
            });
    }
    
    // Actualizar navegación activa
    function updateActiveNav(currentPath) {
        const navLinks = document.querySelectorAll('.subtle-nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '/' && href === '/')) {
                link.classList.add('active');
            }
        });
    }
    
    // Manejar navegación con botones del navegador
    window.addEventListener('popstate', function() {
        const path = window.location.pathname;
        if (routes[path]) {
            loadPage(path);
        }
    });
})();
