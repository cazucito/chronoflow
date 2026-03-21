/**
 * @module storage
 * Persistencia local — abstrae localStorage e IndexedDB.
 * Responsabilidad única: leer/escribir datos locales.
 */

const Storage = {
  // Keys para localStorage
  KEYS: {
    PREFS: 'cf_prefs',
    PRESETS: 'cf_presets',
    LAST_LABEL: 'cf_last_label',
    THEME: 'cf_theme',
    CUSTOM_THEME: 'cf_custom_theme'
  },

  // Configuración por defecto
  DEFAULT_PREFS: {
    soundEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: false,
    defaultMode: 'STOPWATCH',
    theme: 'auto'
  },

  /**
   * Obtiene preferencias del usuario.
   * @returns {UserPreferences}
   */
  getPreferences() {
    try {
      const stored = localStorage.getItem(this.KEYS.PREFS);
      return stored ? { ...this.DEFAULT_PREFS, ...JSON.parse(stored) } : this.DEFAULT_PREFS;
    } catch (e) {
      console.warn('Storage: Error leyendo preferencias', e);
      return this.DEFAULT_PREFS;
    }
  },

  /**
   * Guarda preferencias del usuario.
   * @param {Partial<UserPreferences>} prefs — preferencias a guardar
   */
  setPreferences(prefs) {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(this.KEYS.PREFS, JSON.stringify(updated));
    } catch (e) {
      this._handleQuotaError(e, 'guardar preferencias');
    }
  },

  /**
   * Obtiene presets guardados.
   * @returns {Preset[]}
   */
  getPresets() {
    try {
      const stored = localStorage.getItem(this.KEYS.PRESETS);
      return stored ? JSON.parse(stored) : this._getDefaultPresets();
    } catch (e) {
      console.warn('Storage: Error leyendo presets', e);
      return this._getDefaultPresets();
    }
  },

  /**
   * Guarda un preset.
   * @param {Preset} preset — preset a guardar
   */
  savePreset(preset) {
    try {
      const presets = this.getPresets();
      const existingIndex = presets.findIndex(p => p.id === preset.id);
      
      if (existingIndex >= 0) {
        presets[existingIndex] = preset;
      } else {
        presets.push(preset);
      }
      
      localStorage.setItem(this.KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      this._handleQuotaError(e, 'guardar preset');
    }
  },

  /**
   * Elimina un preset.
   * @param {string} id — ID del preset a eliminar
   */
  deletePreset(id) {
    try {
      const presets = this.getPresets().filter(p => p.id !== id);
      localStorage.setItem(this.KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      this._handleQuotaError(e, 'eliminar preset');
    }
  },

  /**
   * Presets por defecto del sistema.
   * @private
   * @returns {Preset[]}
   */
  _getDefaultPresets() {
    return [
      { id: 'pomodoro-work', name: 'Pomodoro', minutes: 25, seconds: 0, system: true },
      { id: 'pomodoro-break', name: 'Descanso Corto', minutes: 5, seconds: 0, system: true },
      { id: 'pomodoro-long-break', name: 'Descanso Largo', minutes: 15, seconds: 0, system: true }
    ];
  },

  /**
   * Maneja errores de cuota excedida.
   * @private
   * @param {Error} error — error capturado
   * @param {string} context — contexto de la operación
   */
  _handleQuotaError(error, context) {
    const isQuotaError = error.name === 'QuotaExceededError' || 
                        (error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    
    if (isQuotaError) {
      console.error(`Storage: Almacenamiento lleno al ${context}`);
      document.dispatchEvent(new CustomEvent('storage:quota_exceeded', { 
        detail: { context, message: 'Almacenamiento lleno. Exporta o limpia el historial.' }
      }));
    } else {
      console.error(`Storage: Error al ${context}`, error);
    }
  },

  /**
   * Obtiene el último label usado.
   * @returns {string}
   */
  getLastLabel() {
    try {
      return localStorage.getItem(this.KEYS.LAST_LABEL) || '';
    } catch (e) {
      return '';
    }
  },

  /**
   * Guarda el último label usado.
   * @param {string} label — label a guardar
   */
  setLastLabel(label) {
    try {
      localStorage.setItem(this.KEYS.LAST_LABEL, label);
    } catch (e) {
      // Silencioso — no es crítico
    }
  },

  /**
   * Obtiene el tema guardado.
   * @returns {string} — nombre del tema
   */
  getTheme() {
    try {
      return localStorage.getItem(this.KEYS.THEME) || 'minimal';
    } catch (e) {
      return 'minimal';
    }
  },

  /**
   * Guarda el tema seleccionado.
   * @param {string} theme — nombre del tema
   */
  setTheme(theme) {
    try {
      localStorage.setItem(this.KEYS.THEME, theme);
    } catch (e) {
      // Silencioso
    }
  },

  /**
   * Obtiene configuración de tema personalizado.
   * @returns {Object} — config del tema custom
   */
  getCustomTheme() {
    try {
      const stored = localStorage.getItem(this.KEYS.CUSTOM_THEME);
      return stored ? JSON.parse(stored) : this._getDefaultCustomTheme();
    } catch (e) {
      return this._getDefaultCustomTheme();
    }
  },

  /**
   * Guarda configuración de tema personalizado.
   * @param {Object} config — config del tema
   */
  setCustomTheme(config) {
    try {
      localStorage.setItem(this.KEYS.CUSTOM_THEME, JSON.stringify(config));
    } catch (e) {
      // Silencioso
    }
  },

  /**
   * Configuración por defecto del tema personalizado.
   * @private
   * @returns {Object}
   */
  _getDefaultCustomTheme() {
    return {
      primary: '#4CAF50',
      background: '#ffffff',
      text: '#212121',
      radius: 8
    };
  }
};

// IndexedDB para historial (Fase 3) — placeholder
const HistoryDB = {
  DB_NAME: 'ChronoFlowDB',
  DB_VERSION: 1,
  STORE_NAME: 'sessions',

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  },

  async saveSession(session) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// Exportar para testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Storage, HistoryDB };
}
