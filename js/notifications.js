/**
 * @module notifications
 * Gestión de alertas al usuario.
 * Responsabilidad única: gestionar alertas.
 * Requiere permiso explícito antes de activar push.
 */

const Notifications = {
  // Estado de permisos
  permission: 'default',
  
  // Audio context para Web Audio API
  audioContext: null,

  /**
   * Inicializa el módulo.
   */
  init() {
    this.permission = Notification.permission;
    this._initAudio();
    this._bindEvents();
  },

  /**
   * Solicita permiso de notificaciones.
   * @returns {Promise<'granted'|'denied'|'default'>}
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications: API no soportada');
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      
      if (this.permission === 'granted') {
        Storage.setPreferences({ notificationsEnabled: true });
      }
      
      return this.permission;
    } catch (e) {
      console.error('Notifications: Error solicitando permiso', e);
      return 'denied';
    }
  },

  /**
   * Envía alerta completa (visual + audio + vibración + push).
   * @param {string} message — mensaje de la alerta
   * @param {string} [title='ChronoFlow'] — título de la notificación
   */
  sendAlert(message, title = 'ChronoFlow') {
    const prefs = Storage.getPreferences();

    // Alerta visual (CSS animation) — manejada por UI
    document.dispatchEvent(new CustomEvent('notification:visual', { 
      detail: { message } 
    }));

    // Audio (RF-02.1)
    if (prefs.soundEnabled) {
      this._playTone(440, 1000); // 440Hz, 1 segundo
    }

    // Vibración (RF-02.3)
    if (prefs.vibrationEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {
        // Silencioso en iOS Safari
      }
    }

    // Push notification (RF-02.2)
    if (prefs.notificationsEnabled && this.permission === 'granted') {
      this._sendPush(title, message);
    }
  },

  /**
   * Programa alerta para cuando termine timer.
   * @param {number} delayMs — milisegundos hasta la alerta
   * @param {string} label — etiqueta del timer
   */
  scheduleTimerEnd(delayMs, label) {
    // Usar setTimeout simple — en Fase 2 se mejorará con Service Worker
    const timeoutId = setTimeout(() => {
      this.sendAlert(`¡${label || 'Timer'} completado!`);
    }, delayMs);

    // Guardar referencia para poder cancelar
    this._scheduledTimeout = timeoutId;
  },

  /**
   * Cancela alerta programada.
   */
  cancelScheduled() {
    if (this._scheduledTimeout) {
      clearTimeout(this._scheduledTimeout);
      this._scheduledTimeout = null;
    }
  },

  /**
   * Inicializa Web Audio API.
   * @private
   */
  _initAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn('Notifications: Web Audio API no soportada');
      return;
    }

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  },

  /**
   * Reproduce tono usando Web Audio API.
   * @private
   * @param {number} frequency — frecuencia en Hz
   * @param {number} duration — duración en ms
   */
  _playTone(frequency, duration) {
    if (!this.audioContext) return;

    try {
      // Reanudar contexto si está suspendido (política de autoplay)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Notifications: Error reproduciendo audio', e);
    }
  },

  /**
   * Envía notificación push.
   * @private
   * @param {string} title — título
   * @param {string} body — cuerpo
   */
  _sendPush(title, body) {
    if (!('Notification' in window)) return;

    try {
      new Notification(title, {
        body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-192x192.png',
        tag: 'chronoflow-timer-complete',
        requireInteraction: false
      });
    } catch (e) {
      console.warn('Notifications: Error enviando push', e);
    }
  },

  /**
   * Vincula eventos del timer.
   * @private
   */
  _bindEvents() {
    // Escuchar cuando el timer se completa
    document.addEventListener('timer:complete', (e) => {
      this.sendAlert('¡Tiempo completado!');
    });
  }
};

// Inicializar al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Notifications.init());
} else {
  Notifications.init();
}

// Exportar para testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Notifications };
}
