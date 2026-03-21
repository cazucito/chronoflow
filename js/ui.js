/**
 * @module ui
 * Manipulación del DOM y actualización de interfaz.
 * Responsabilidad única: actualizar el DOM.
 * Escucha eventos de timer.js, NO contiene lógica de negocio.
 */

const UI = {
  // Referencias a elementos DOM
  elements: {},

  /**
   * Inicializa referencias a elementos DOM.
   */
  init() {
    this.elements = {
      display: document.getElementById('time-display'),
      btnStart: document.getElementById('btn-start'),
      btnPause: document.getElementById('btn-pause'),
      btnReset: document.getElementById('btn-reset'),
      modeSelector: document.getElementById('timer-mode'),
      app: document.getElementById('app')
    };

    this._bindEvents();
    this._bindAria();
  },

  /**
   * Actualiza el display del tiempo.
   * @param {number} displayMs — milisegundos a mostrar
   */
  updateDisplay(displayMs) {
    if (!this.elements.display) return;
    
    const formatted = this._formatTime(displayMs);
    this.elements.display.textContent = formatted;
    
    // RF-04.4: Actualizar aria-live para screen readers
    this.elements.display.setAttribute('aria-label', `${formatted} transcurridos`);
  },

  /**
   * Actualiza estado de botones según estado del timer.
   * @param {string} state — TimerState (IDLE, RUNNING, PAUSED, COMPLETED)
   */
  setButtonState(state) {
    const { btnStart, btnPause, btnReset } = this.elements;
    if (!btnStart || !btnPause || !btnReset) return;

    switch (state) {
      case 'IDLE':
        btnStart.disabled = false;
        btnStart.textContent = 'Iniciar';
        btnPause.disabled = true;
        btnReset.disabled = false;
        this._removeAlertState();
        break;
      
      case 'RUNNING':
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnPause.textContent = 'Pausar';
        btnReset.disabled = false;
        break;
      
      case 'PAUSED':
        btnStart.disabled = false;
        btnStart.textContent = 'Reanudar';
        btnPause.disabled = true;
        btnReset.disabled = false;
        break;
      
      case 'COMPLETED':
        btnStart.disabled = true;
        btnPause.disabled = true;
        btnReset.disabled = false;
        this._setAlertState();
        break;
    }
  },

  /**
   * Muestra selector de modo.
   * @param {string} currentMode — modo actual
   */
  showModeSelector(currentMode) {
    if (this.elements.modeSelector) {
      this.elements.modeSelector.value = currentMode.toLowerCase();
    }
  },

  /**
   * Activa estado de alerta visual (RF-02.4).
   * @private
   */
  _setAlertState() {
    if (this.elements.app) {
      this.elements.app.classList.add('alert-active');
    }
    if (this.elements.display) {
      this.elements.display.classList.add('pulse');
    }
  },

  /**
   * Desactiva estado de alerta visual.
   * @private
   */
  _removeAlertState() {
    if (this.elements.app) {
      this.elements.app.classList.remove('alert-active');
    }
    if (this.elements.display) {
      this.elements.display.classList.remove('pulse');
    }
  },

  /**
   * Formatea milisegundos a HH:MM:SS.cc
   * @param {number} ms — milisegundos
   * @returns {string} — tiempo formateado
   */
  _formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (n) => String(n).padStart(2, '0');
    
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  },

  /**
   * Vincula eventos del DOM al timer.
   * @private
   */
  _bindEvents() {
    const { btnStart, btnPause, btnReset, modeSelector } = this.elements;

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (timer.getState().state === 'PAUSED') {
          timer.resume();
        } else {
          timer.start();
        }
      });
    }

    if (btnPause) {
      btnPause.addEventListener('click', () => timer.pause());
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => timer.reset());
    }

    if (modeSelector) {
      modeSelector.addEventListener('change', (e) => {
        const mode = e.target.value.toUpperCase();
        timer.setMode(mode);
      });
    }

    // Atajos de teclado (RF-04)
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          const state = timer.getState().state;
          if (state === 'RUNNING') {
            timer.pause();
          } else if (state === 'IDLE' || state === 'PAUSED') {
            if (state === 'PAUSED') {
              timer.resume();
            } else {
              timer.start();
            }
          }
          break;
        case 'KeyR':
          e.preventDefault();
          timer.reset();
          break;
      }
    });
  },

  /**
   * Configura atributos ARIA para accesibilidad.
   * @private
   */
  _bindAria() {
    const { display, btnStart, btnPause, btnReset } = this.elements;

    if (display) {
      display.setAttribute('role', 'timer');
      display.setAttribute('aria-live', 'polite');
      display.setAttribute('aria-atomic', 'true');
    }

    if (btnStart) {
      btnStart.setAttribute('aria-label', 'Iniciar cronómetro');
    }

    if (btnPause) {
      btnPause.setAttribute('aria-label', 'Pausar cronómetro');
    }

    if (btnReset) {
      btnReset.setAttribute('aria-label', 'Reiniciar cronómetro');
    }
  }
};

// Inicializar al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => UI.init());
} else {
  UI.init();
}

// Exportar para testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UI };
}
