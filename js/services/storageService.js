import { config } from '../config/config.js';

// Servicio para manejar LocalStorage
export class StorageService {
    constructor() {
        this.prefix = config.storage.prefix;
    }

    // Generar clave con prefijo
    _getKey(key) {
        return `${this.prefix}${key}`;
    }

    // Guardar datos en LocalStorage
    save(key, data) {
        try {
            const fullKey = this._getKey(key);
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error al guardar en LocalStorage:', e);
            return false;
        }
    }

    // Cargar datos desde LocalStorage
    load(key) {
        try {
            const fullKey = this._getKey(key);
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error al cargar desde LocalStorage:', e);
            return null;
        }
    }

    // Eliminar datos de LocalStorage
    remove(key) {
        try {
            const fullKey = this._getKey(key);
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            console.error('Error al eliminar de LocalStorage:', e);
            return false;
        }
    }

    // Verificar si existe una clave
    exists(key) {
        const fullKey = this._getKey(key);
        return localStorage.getItem(fullKey) !== null;
    }

    // Limpiar todos los datos de la aplicación
    clear() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('Error al limpiar LocalStorage:', e);
            return false;
        }
    }
}
