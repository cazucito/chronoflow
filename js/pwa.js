/**
 * @module pwa
 * Service Worker registration y manejo de actualizaciones.
 * Responsabilidad única: gestionar el ciclo de vida del SW.
 */

const PWA = {
  swRegistration: null,

  /**
   * Inicializa la PWA — registra Service Worker.
   */
  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('PWA: Service Worker no soportado');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('PWA: Service Worker registrado', this.swRegistration.scope);

      this._handleUpdates();
    } catch (error) {
      console.error('PWA: Error registrando Service Worker', error);
    }
  },

  /**
   * Maneja actualizaciones del Service Worker.
   * @private
   */
  _handleUpdates() {
    if (!this.swRegistration) return;

    this.swRegistration.addEventListener('updatefound', () => {
      const newWorker = this.swRegistration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nueva versión disponible
          console.log('PWA: Nueva versión disponible');
          document.dispatchEvent(new CustomEvent('pwa:update-available'));
        }
      });
    });
  },

  /**
   * Fuerza actualización del Service Worker.
   */
  async update() {
    if (!this.swRegistration) return;
    await this.swRegistration.update();
  },

  /**
   * Verifica si la app está instalada.
   * @returns {boolean}
   */
  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }
};

// Inicializar al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PWA.init());
} else {
  PWA.init();
}

// Exportar para testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PWA };
}
