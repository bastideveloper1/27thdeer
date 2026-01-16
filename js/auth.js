// Sistema simple de autenticación para páginas protegidas!
(function() {
    'use strict';
    
    // Configuración
    const AUTH_CONFIG = {
        password: '27thdeer2025', // Cambia esta contraseña
        protectedPages: ['/tienda'],
        sessionTimeout: 30 * 60 * 1000 // 30 minutos en milisegundos
    };
    
    // Función para verificar si la página está protegida
    function isProtectedPage() {
        const currentPath = window.location.pathname;
        return AUTH_CONFIG.protectedPages.includes(currentPath);
    }
    
    // Función para verificar si el usuario está autenticado
    function isAuthenticated() {
        const authData = localStorage.getItem('authData');
        if (!authData) return false;
        
        const data = JSON.parse(authData);
        const now = Date.now();
        
        // Verificar que no haya expirado
        return data.expires > now;
    }
    
    // Función para mostrar modal de autenticación
    function showAuthModal() {
        // Crear modal si no existe
        if (!document.getElementById('authModal')) {
            const modal = document.createElement('div');
            modal.id = 'authModal';
            modal.innerHTML = `
                <div class="auth-modal-overlay">
                    <div class="auth-modal">
                        <div class="auth-header">
                            <h3>🔒 Página Protegida</h3>
                            <p>Esta página requiere contraseña para acceder</p>
                        </div>
                        <div class="auth-body">
                            <input type="password" id="authPassword" placeholder="Ingrese contraseña" />
                            <button id="authSubmit">Acceder</button>
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
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                
                .auth-modal {
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                }
                
                .auth-header h3 {
                    margin: 0 0 1rem 0;
                    color: #333;
                }
                
                .auth-header p {
                    margin: 0 0 1.5rem 0;
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .auth-body input {
                    width: 100%;
                    padding: 0.8rem;
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                    box-sizing: border-box;
                }
                
                .auth-body input:focus {
                    outline: none;
                    border-color: #007bff;
                }
                
                .auth-body button {
                    width: 100%;
                    padding: 0.8rem;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                
                .auth-body button:hover {
                    background: #0056b3;
                }
                
                .auth-error {
                    color: #dc3545;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    min-height: 20px;
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(modal);
            
            // Agregar evento al botón
            document.getElementById('authSubmit').addEventListener('click', authenticate);
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
    
    // Función para autenticar
    function authenticate() {
        const password = document.getElementById('authPassword').value;
        const errorDiv = document.getElementById('authError');
        
        if (password === AUTH_CONFIG.password) {
            // Guardar sesión
            const authData = {
                authenticated: true,
                expires: Date.now() + AUTH_CONFIG.sessionTimeout
            };
            localStorage.setItem('authData', JSON.stringify(authData));
            
            // Eliminar modal
            document.getElementById('authModal').remove();
            
            // Recargar página para mostrar contenido
            window.location.reload();
        } else {
            errorDiv.textContent = '❌ Contraseña incorrecta';
            document.getElementById('authPassword').value = '';
            document.getElementById('authPassword').focus();
        }
    }
    
    // Función para cerrar sesión
    function logout() {
        localStorage.removeItem('authData');
        window.location.reload();
    }
    
    // Función principal de verificación
    function checkAuth() {
        if (isProtectedPage() && !isAuthenticated()) {
            showAuthModal();
            return false;
        }
        return true;
    }
    
    // Hacer logout disponible globalmente
    window.authLogout = logout;
    
    // Verificar autenticación cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        checkAuth();
    });
    
})();
