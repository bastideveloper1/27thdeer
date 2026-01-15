// Router simple para SPA
(function() {
    
    // Rutas disponibles
    const routes = {
        '/': 'index.html',
        '/acerca': 'pages/acerca.html',
        '/proyectos': 'pages/proyectos.html', 
        '/contacto': 'pages/contacto.html',
        '/tienda': 'pages/tienda.html'
    };
    
    // Cargar página
    function loadPage(path) {
        const file = routes[path];
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
                    
                    // Actualizar el título de la página
                    const title = temp.querySelector('title')?.textContent || '27thDeer';
                    document.title = title;
                    
                    // Actualizar la URL en el navegador
                    history.pushState({}, '', path);
                    
                    // Actualizar navbar activo
                    updateActiveLink(path);
                }
            });
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
