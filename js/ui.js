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
      timerConfig: document.getElementById('timer-config'),
      pomodoroConfig: document.getElementById('pomodoro-config'),
      timerMin: document.getElementById('timer-min'),
      timerSec: document.getElementById('timer-sec'),
      app: document.getElementById('app')
    };

    this._bindEvents();
    this._bindAria();
    this._updateConfigVisibility('stopwatch');
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
        const state = timer.getState().state;
        if (state === 'PAUSED') {
          timer.resume();
        } else {
          // Configurar tiempo objetivo antes de iniciar
          this._configureTimerTarget();
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
        this._updateConfigVisibility(e.target.value);
        this._updateDisplayForMode(mode);
      });
    }

    // Botones de Pomodoro
    const pomodoroButtons = document.querySelectorAll('.btn-pomodoro');
    pomodoroButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pomodoroButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

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
              this._configureTimerTarget();
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
   * Configura el tiempo objetivo según el modo y los inputs.
   * @private
   */
  _configureTimerTarget() {
    const mode = timer.mode;
    
    if (mode === 'TIMER') {
      const min = parseInt(this.elements.timerMin?.value || '0', 10);
      const sec = parseInt(this.elements.timerSec?.value || '0', 10);
      const targetMs = (min * 60 + sec) * 1000;
      timer.targetMs = targetMs;
    } else if (mode === 'POMODORO') {
      const activeBtn = document.querySelector('.btn-pomodoro.active');
      const min = parseInt(activeBtn?.dataset.min || '25', 10);
      timer.targetMs = min * 60 * 1000;
    }
  },

  /**
   * Actualiza la visibilidad de las secciones de configuración.
   * @private
   * @param {string} mode — modo seleccionado (stopwatch/timer/pomodoro)
   */
  _updateConfigVisibility(mode) {
    const { timerConfig, pomodoroConfig } = this.elements;
    
    if (timerConfig) {
      timerConfig.classList.toggle('hidden', mode !== 'timer');
    }
    if (pomodoroConfig) {
      pomodoroConfig.classList.toggle('hidden', mode !== 'pomodoro');
    }
  },

  /**
   * Actualiza el display inicial según el modo.
   * @private
   * @param {string} mode — modo seleccionado
   */
  _updateDisplayForMode(mode) {
    if (mode === 'TIMER') {
      const min = parseInt(this.elements.timerMin?.value || '0', 10);
      const sec = parseInt(this.elements.timerSec?.value || '0', 10);
      const ms = (min * 60 + sec) * 1000;
      this.updateDisplay(ms);
    } else if (mode === 'POMODORO') {
      const activeBtn = document.querySelector('.btn-pomodoro.active');
      const min = parseInt(activeBtn?.dataset.min || '25', 10);
      this.updateDisplay(min * 60 * 1000);
    } else {
      this.updateDisplay(0);
    }
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
