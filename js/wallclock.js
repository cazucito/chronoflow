/**
 * @fileoverview Modo Reloj Digital de Pared (Wall Clock Mode)
 * Pantalla completa estilo reloj digital profesional
 * 
 * @module plugins/WallClock
 * @version 1.0.0
 * @implements RF-09
 */

/**
 * @typedef {Object} WallClockElements
 * @property {HTMLElement} container - Contenedor principal del modo
 * @property {HTMLElement} btnToggle - Botón para activar modo
 * @property {HTMLElement} btnClose - Botón para cerrar modo
 * @property {HTMLElement} btnStart - Botón iniciar
 * @property {HTMLElement} btnPause - Botón pausar
 * @property {HTMLElement} btnReset - Botón resetear
 * @property {NodeList} digits - Dígitos del display (8 elementos)
 * @property {HTMLElement} centi1 - Primer dígito de centésimas
 * @property {HTMLElement} centi2 - Segundo dígito de centésimas
 * @property {HTMLElement} label - Label del timer
 * @property {HTMLElement} currentTime - Hora actual
 * @property {HTMLElement} endTime - Hora de finalización
 * @property {HTMLElement} status - Indicador de estado
 */

/**
 * Gestiona el modo reloj digital de pared.
 * 
 * Características:
 * - Pantalla completa responsive
 * - Dígitos grandes estilo LED
 * - Controles flotantes semitransparentes
 * - Información secundaria (hora actual, fin, label)
 * - Transiciones suaves
 * 
 * @class WallClock
 * @example
 * const wallClock = new WallClock();
 * wallClock.init();
 * 
 * // Activar
 * wallClock.show();
 * 
 * // Desactivar
 * wallClock.hide();
 */
class WallClock {
  /**
   * @type {WallClockElements}
   * @private
   */
  _elements = {};

  /**
   * Estado activo del modo
   * @type {boolean}
   * @private
   */
  _isActive = false;

  /**
   * Hora de inicio del timer (fija)
   * @type {Date|null}
   * @private
   */
  _startTime = null;

  /**
   * Hora de finalización calculada (fija)
   * @type {Date|null}
   * @private
   */
  _endTime = null;

  /**
   * Callback para actualizar display
   * @type {Function|null}
   * @private
   */
  _updateCallback = null;

  /**
   * Inicializa el modo reloj.
   * Cachea elementos DOM y binda eventos.
   */
  init() {
    this._cacheElements();
    this._bindEvents();
    this._startClockUpdate();
    
    console.log('[WallClock] Inicializado');
  }

  /**
   * Muestra el modo reloj (fullscreen).
   * @param {Object} [options] - Opciones
   * @param {number} [options.displayMs=0] - Tiempo inicial a mostrar
   * @param {string} [options.label=''] - Label del timer
   * @param {string} [options.state='IDLE'] - Estado del timer
   */
  show(options = {}) {
    this._isActive = true;
    
    // Actualizar valores iniciales
    this._updateDisplay(options.displayMs || 0);
    this._updateLabel(options.label || '');
    this._updateStatus(options.state || 'IDLE');
    
    // Si el timer ya está corriendo al abrir, calcular tiempos fijos
    if (options.state === 'RUNNING' || options.state === 'PAUSED' || options.state === 'COMPLETED') {
      if (!this._startTime) {
        this._setStartTime();
      }
    } else {
      this._resetFixedTimes();
    }
    
    // Mostrar contenedor
    this._elements.container.classList.remove('hidden');
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Guardar preferencia
    localStorage.setItem('cf_wallclock_active', 'true');
    
    console.log('[WallClock] Modo activado');
  }

  /**
   * Oculta el modo reloj y vuelve a la UI normal.
   */
  hide() {
    this._isActive = false;
    
    // Ocultar contenedor
    this._elements.container.classList.add('hidden');
    
    // Restaurar scroll
    document.body.style.overflow = '';
    
    // Guardar preferencia
    localStorage.setItem('cf_wallclock_active', 'false');
    
    console.log('[WallClock] Modo desactivado');
  }

  /**
   * Actualiza el display del tiempo.
   * @param {number} displayMs - Milisegundos a mostrar
   */
  updateDisplay(displayMs) {
    if (!this._isActive) return;
    
    this._updateDisplay(displayMs);
    // No actualizamos _updateEndTime() aquí porque los tiempos son fijos
    // Se establecen una vez al iniciar el timer via _setStartTime()
  }

  /**
   * Actualiza el label mostrado.
   * @param {string} label - Texto del label
   */
  updateLabel(label) {
    if (!this._isActive) return;
    this._updateLabel(label);
  }

  /**
   * Actualiza el estado visual.
   * @param {string} state - Estado (IDLE, RUNNING, PAUSED, COMPLETED)
   */
  updateStatus(state) {
    if (!this._isActive) return;
    this._updateStatus(state);
  }

  /**
   * Verifica si el modo está activo.
   * @returns {boolean}
   */
  get isActive() {
    return this._isActive;
  }

  /**
   * Cachea referencias a elementos DOM.
   * @private
   */
  _cacheElements() {
    this._elements = {
      container: document.getElementById('wallclock-mode'),
      btnToggle: document.getElementById('btn-toggle-wallclock'),
      btnClose: document.getElementById('btn-close-wallclock'),
      btnStart: document.getElementById('wallclock-btn-start'),
      btnPause: document.getElementById('wallclock-btn-pause'),
      btnReset: document.getElementById('wallclock-btn-reset'),
      
      // Dígitos: H1 H2 : M1 M2 : S1 S2
      digitH1: document.querySelector('.digit-h1'),
      digitH2: document.querySelector('.digit-h2'),
      digitM1: document.querySelector('.digit-m1'),
      digitM2: document.querySelector('.digit-m2'),
      digitS1: document.querySelector('.digit-s1'),
      digitS2: document.querySelector('.digit-s2'),
      
      // Centésimas
      centi1: document.querySelector('.digit-cs1'),
      centi2: document.querySelector('.digit-cs2'),
      
      // Info
      label: document.getElementById('wallclock-label'),
      currentTime: document.getElementById('wallclock-current'),
      endTime: document.getElementById('wallclock-endtime'),
      status: document.getElementById('wallclock-status'),
      completion: document.getElementById('wallclock-completion')
    };
  }

  /**
   * Vincula eventos del modo reloj.
   * @private
   */
  _bindEvents() {
    // Toggle modo reloj
    this._elements.btnToggle?.addEventListener('click', () => {
      const state = timer?.getState?.() || { displayMs: 0, state: 'IDLE' };
      const label = UI?.getTimerLabel?.() || '';
      
      this.show({
        displayMs: state.displayMs,
        label,
        state: state.state
      });
    });

    // Cerrar modo reloj
    this._elements.btnClose?.addEventListener('click', () => {
      this.hide();
    });

    // Tecla ESC para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isActive) {
        this.hide();
      }
    });

    // Controles del timer
    this._elements.btnStart?.addEventListener('click', () => {
      if (timer?.getState?.().state === 'PAUSED') {
        timer.resume();
      } else {
        // Configurar tiempo si es necesario
        if (UI?._configureTimerTarget) {
          UI._configureTimerTarget();
        }
        timer.start();
      }
    });

    this._elements.btnPause?.addEventListener('click', () => {
      timer.pause();
    });

    this._elements.btnReset?.addEventListener('click', () => {
      timer.reset();
    });

    // Escuchar eventos del timer
    document.addEventListener('timer:tick', (e) => {
      this.updateDisplay(e.detail.displayMs);
    });

    document.addEventListener('timer:statechange', (e) => {
      const newState = e.detail.to;
      const fromState = e.detail.from;
      
      this.updateStatus(newState);
      this._updateControls(newState);
      
      // Establecer tiempos fijos al iniciar (IDLE/PAUSED → RUNNING)
      if (newState === 'RUNNING' && (fromState === 'IDLE' || fromState === 'PAUSED')) {
        if (fromState === 'IDLE') {
          // Solo establecer tiempos fijos si venimos de IDLE (nuevo inicio)
          this._setStartTime();
        }
      }
      
      // Resetear tiempos al volver a IDLE
      if (newState === 'IDLE') {
        this._resetFixedTimes();
      }
    });

    document.addEventListener('timer:complete', () => {
      this.updateStatus('COMPLETED');
      this._updateControls('COMPLETED');
      // La hora de término ya está calculada desde el inicio
    });
  }

  /**
   * Actualiza los dígitos del display.
   * @private
   * @param {number} ms - Milisegundos
   */
  _updateDisplay(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);

    // Actualizar dígitos - siempre mostrar todos, incluyendo horas en 00
    this._setDigit(this._elements.digitH1, Math.floor(hours / 10));
    this._setDigit(this._elements.digitH2, hours % 10);
    this._setDigit(this._elements.digitM1, Math.floor(minutes / 10));
    this._setDigit(this._elements.digitM2, minutes % 10);
    this._setDigit(this._elements.digitS1, Math.floor(seconds / 10));
    this._setDigit(this._elements.digitS2, seconds % 10);

    // Actualizar centésimas
    if (this._elements.centi1) {
      this._elements.centi1.textContent = Math.floor(centis / 10);
    }
    if (this._elements.centi2) {
      this._elements.centi2.textContent = centis % 10;
    }
  }

  /**
   * Establece el texto de un dígito.
   * @private
   * @param {HTMLElement} element - Elemento dígito
   * @param {number} value - Valor (0-9)
   */
  _setDigit(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Actualiza el label mostrado.
   * @private
   * @param {string} label
   */
  _updateLabel(label) {
    if (this._elements.label) {
      this._elements.label.textContent = label;
    }
  }

  /**
   * Actualiza el estado visual.
   * @private
   * @param {string} state
   */
  _updateStatus(state) {
    if (this._elements.status) {
      this._elements.status.setAttribute('data-state', state.toLowerCase());
      
      const labels = {
        idle: 'Listo',
        running: 'Corriendo',
        paused: 'Pausado',
        completed: '¡Completado!'
      };
      
      this._elements.status.textContent = labels[state.toLowerCase()] || state;
    }
    
    // Actualizar atributo en el contenedor para estilos CSS
    if (this._elements.container) {
      this._elements.container.setAttribute('data-state', state.toLowerCase());
    }
    
    // Mostrar/ocultar animación de completado
    const completionEl = document.getElementById('wallclock-completion');
    if (completionEl) {
      if (state === 'COMPLETED') {
        completionEl.classList.add('active');
        // Reproducir sonido si está habilitado
        this._playCompletionSound();
      } else {
        completionEl.classList.remove('active');
      }
    }
  }
  
  /**
   * Reproduce sonido de completado.
   * @private
   */
  _playCompletionSound() {
    try {
      // Usar el sistema de notificaciones si está disponible
      if (window.Notifications && typeof Notifications.sendAlert === 'function') {
        // El sonido ya se maneja en notifications.js
      }
    } catch (e) {
      // Silencioso si no hay sonido
    }
  }

  /**
   * Actualiza visibilidad de controles según estado.
   * @private
   * @param {string} state
   */
  _updateControls(state) {
    const isRunning = state === 'RUNNING';
    
    if (this._elements.btnStart) {
      this._elements.btnStart.classList.toggle('hidden', isRunning);
    }
    if (this._elements.btnPause) {
      this._elements.btnPause.classList.toggle('hidden', !isRunning);
    }
  }

  /**
   * Actualiza la hora de finalización.
   * Usa los valores fijos establecidos al inicio.
   * @private
   */
  _updateEndTime() {
    // Este método ya no recalcula - usa los valores fijos
    // Los tiempos se establecen una vez al iniciar via _setStartTime()
    this._updateFixedTimes();
  }

  /**
   * Establece la hora de inicio y calcula hora de término.
   * Se llama cuando el timer se inicia.
   * @private
   */
  _setStartTime() {
    this._startTime = new Date();
    
    // Calcular hora de término basada en tiempo configurado
    const mode = timer?.mode;
    let durationMs = 0;
    
    if (mode === 'TIMER') {
      const min = parseInt(document.getElementById('timer-min')?.value || '0', 10);
      const sec = parseInt(document.getElementById('timer-sec')?.value || '0', 10);
      durationMs = (min * 60 + sec) * 1000;
    } else if (mode === 'POMODORO') {
      const activeBtn = document.querySelector('.btn-pomodoro.active');
      const min = parseInt(activeBtn?.dataset.min || '25', 10);
      durationMs = min * 60 * 1000;
    }
    
    if (durationMs > 0) {
      this._endTime = new Date(this._startTime.getTime() + durationMs);
    }
    
    // Actualizar display con valores fijos
    this._updateFixedTimes();
  }

  /**
   * Actualiza los tiempos fijos de inicio y término en la UI.
   * @private
   */
  _updateFixedTimes() {
    // Mostrar hora de inicio
    if (this._elements.currentTime && this._startTime) {
      const hours = String(this._startTime.getHours()).padStart(2, '0');
      const minutes = String(this._startTime.getMinutes()).padStart(2, '0');
      this._elements.currentTime.textContent = `${hours}:${minutes}`;
    }
    
    // Mostrar hora de término
    if (this._elements.endTime && this._endTime) {
      const hours = String(this._endTime.getHours()).padStart(2, '0');
      const minutes = String(this._endTime.getMinutes()).padStart(2, '0');
      this._elements.endTime.textContent = `${hours}:${minutes}`;
    }
  }

  /**
   * Resetea los tiempos fijos.
   * @private
   */
  _resetFixedTimes() {
    this._startTime = null;
    this._endTime = null;
    
    if (this._elements.currentTime) {
      this._elements.currentTime.textContent = '--:--';
    }
    if (this._elements.endTime) {
      this._elements.endTime.textContent = '--:--';
    }
  }

  /**
   * Inicia actualización del reloj de sistema.
   * @private
   */
  _startClockUpdate() {
    // Ya no actualizamos la hora de inicio en tiempo real
    // Los valores son fijos establecidos al iniciar el timer
  }

  /**
   * Restaura el modo si estaba activo.
   * Llama esto al iniciar la app.
   */
  restore() {
    const wasActive = localStorage.getItem('cf_wallclock_active') === 'true';
    if (wasActive) {
      // Esperar a que todo esté listo
      setTimeout(() => {
        const state = timer?.getState?.() || { displayMs: 0, state: 'IDLE' };
        const label = UI?.getTimerLabel?.() || '';
        this.show({
          displayMs: state.displayMs,
          label,
          state: state.state
        });
      }, 500);
    }
  }
}

// Singleton
const wallClock = new WallClock();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    wallClock.init();
    wallClock.restore();
  });
} else {
  wallClock.init();
  wallClock.restore();
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WallClock, wallClock };
}
