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
      timerLabel: document.getElementById('timer-label'),
      timeInfo: document.getElementById('time-info'),
      currentTime: document.getElementById('current-time'),
      endTime: document.getElementById('end-time'),
      themeSelect: document.getElementById('theme-select'),
      customThemeConfig: document.getElementById('custom-theme-config'),
      customPrimary: document.getElementById('custom-primary'),
      customBg: document.getElementById('custom-bg'),
      customText: document.getElementById('custom-text'),
      customRadius: document.getElementById('custom-radius'),
      customRadiusValue: document.getElementById('custom-radius-value'),
      btnSaveCustom: document.getElementById('btn-save-custom'),
      app: document.getElementById('app')
    };

    this._bindEvents();
    this._bindAria();
    this._updateConfigVisibility('stopwatch');
    this._startTimeInfoUpdates();
    this._initTheme();
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
    
    // Actualizar hora de fin en tiempo real
    this._updateEndTime();
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
        // Actualizar hora de fin al cambiar de modo
        setTimeout(() => this._updateEndTime(), 0);
      });
    }

    // Botones de Pomodoro
    const pomodoroButtons = document.querySelectorAll('.btn-pomodoro');
    pomodoroButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pomodoroButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Actualizar hora de fin al cambiar fase
        this._updateEndTime();
      });
    });

    // Actualizar hora de fin cuando cambian los inputs de tiempo
    if (this.elements.timerMin) {
      this.elements.timerMin.addEventListener('input', () => this._updateEndTime());
      this.elements.timerMin.addEventListener('change', () => this._updateEndTime());
    }
    if (this.elements.timerSec) {
      this.elements.timerSec.addEventListener('input', () => this._updateEndTime());
      this.elements.timerSec.addEventListener('change', () => this._updateEndTime());
    }

    // Selector de temas
    if (this.elements.themeSelect) {
      this.elements.themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        this._applyTheme(theme);
        this._updateThemeConfigVisibility(theme);
      });
    }

    // Configuración de tema personalizado
    if (this.elements.customRadius) {
      this.elements.customRadius.addEventListener('input', (e) => {
        if (this.elements.customRadiusValue) {
          this.elements.customRadiusValue.textContent = `${e.target.value}px`;
        }
      });
    }

    if (this.elements.btnSaveCustom) {
      this.elements.btnSaveCustom.addEventListener('click', () => {
        const config = {
          primary: this.elements.customPrimary?.value || '#4CAF50',
          background: this.elements.customBg?.value || '#ffffff',
          text: this.elements.customText?.value || '#212121',
          radius: parseInt(this.elements.customRadius?.value || '8', 10)
        };
        Storage.setCustomTheme(config);
        this._applyCustomThemeVars();
      });
    }

    // Actualizar custom theme en tiempo real al cambiar inputs
    ['customPrimary', 'customBg', 'customText', 'customRadius'].forEach(id => {
      if (this.elements[id]) {
        this.elements[id].addEventListener('input', () => {
          if (Storage.getTheme() === 'custom') {
            this._applyCustomThemeVars();
          }
        });
      }
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
    const { timerConfig, pomodoroConfig, timeInfo } = this.elements;

    if (timerConfig) {
      timerConfig.classList.toggle('hidden', mode !== 'timer');
    }
    if (pomodoroConfig) {
      pomodoroConfig.classList.toggle('hidden', mode !== 'pomodoro');
    }
    // Mostrar info de tiempo solo en modos countdown
    if (timeInfo) {
      const showTimeInfo = mode === 'timer' || mode === 'pomodoro';
      timeInfo.classList.toggle('hidden', !showTimeInfo);
      // Actualizar hora de fin después de que el DOM se actualice
      if (showTimeInfo) {
        requestAnimationFrame(() => this._updateEndTime());
      }
    }
  },

  /**
   * Inicia actualizaciones periódicas de la información de tiempo.
   * @private
   */
  _startTimeInfoUpdates() {
    // Actualizar hora actual cada segundo
    setInterval(() => {
      this._updateCurrentTime();
      this._updateEndTime();
    }, 1000);
    
    // Actualizar inmediatamente
    this._updateCurrentTime();
    this._updateEndTime();
  },

  /**
   * Actualiza la hora actual mostrada.
   * @private
   */
  _updateCurrentTime() {
    if (!this.elements.currentTime) return;
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.elements.currentTime.textContent = `${hours}:${minutes}`;
  },

  /**
   * Actualiza la hora de finalización estimada.
   * @private
   */
  _updateEndTime() {
    if (!this.elements.endTime) return;

    const state = timer.getState();
    const mode = timer.mode;

    // Solo mostrar en modos countdown
    if (mode !== 'TIMER' && mode !== 'POMODORO') {
      this.elements.endTime.textContent = '--:--';
      return;
    }

    let remainingMs = 0;

    // Si está corriendo o pausado, usar el tiempo restante del estado
    if (state.state === 'RUNNING' || state.state === 'PAUSED') {
      remainingMs = state.displayMs;
    } else {
      // En IDLE, calcular desde los inputs
      if (mode === 'TIMER') {
        const min = parseInt(this.elements.timerMin?.value || '0', 10);
        const sec = parseInt(this.elements.timerSec?.value || '0', 10);
        remainingMs = (min * 60 + sec) * 1000;
      } else if (mode === 'POMODORO') {
        const activeBtn = document.querySelector('.btn-pomodoro.active');
        const min = parseInt(activeBtn?.dataset.min || '25', 10);
        remainingMs = min * 60 * 1000;
      }
    }

    // Calcular y mostrar hora de fin si hay tiempo válido
    if (remainingMs > 0) {
      const endTime = new Date(Date.now() + remainingMs);
      const hours = String(endTime.getHours()).padStart(2, '0');
      const minutes = String(endTime.getMinutes()).padStart(2, '0');
      this.elements.endTime.textContent = `${hours}:${minutes}`;
    } else {
      this.elements.endTime.textContent = '--:--';
    }
  },

  /**
   * Obtiene el label configurado por el usuario.
   * @returns {string} — label del timer
   */
  getTimerLabel() {
    return this.elements.timerLabel?.value?.trim() || '';
  },

  /**
   * Establece el label del timer.
   * @param {string} label — texto del label
   */
  setTimerLabel(label) {
    if (this.elements.timerLabel) {
      this.elements.timerLabel.value = label;
    }
  },

  /**
   * Inicializa el tema visual.
   * @private
   */
  _initTheme() {
    const savedTheme = Storage.getTheme();
    this._applyTheme(savedTheme);
    
    if (this.elements.themeSelect) {
      this.elements.themeSelect.value = savedTheme;
    }
    
    // Cargar config custom si aplica
    if (savedTheme === 'custom') {
      this._loadCustomThemeConfig();
    }
  },

  /**
   * Aplica un tema visual.
   * @private
   * @param {string} theme — nombre del tema
   */
  _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Si es custom, aplicar variables CSS
    if (theme === 'custom') {
      this._applyCustomThemeVars();
    }
    
    // Guardar preferencia
    Storage.setTheme(theme);
  },

  /**
   * Carga configuración del tema personalizado.
   * @private
   */
  _loadCustomThemeConfig() {
    const config = Storage.getCustomTheme();
    
    if (this.elements.customPrimary) {
      this.elements.customPrimary.value = config.primary;
    }
    if (this.elements.customBg) {
      this.elements.customBg.value = config.background;
    }
    if (this.elements.customText) {
      this.elements.customText.value = config.text;
    }
    if (this.elements.customRadius) {
      this.elements.customRadius.value = config.radius;
    }
    if (this.elements.customRadiusValue) {
      this.elements.customRadiusValue.textContent = `${config.radius}px`;
    }
    
    this._applyCustomThemeVars();
  },

  /**
   * Aplica variables CSS del tema personalizado.
   * @private
   */
  _applyCustomThemeVars() {
    const config = Storage.getCustomTheme();
    const root = document.documentElement;
    
    root.style.setProperty('--custom-primary', config.primary);
    root.style.setProperty('--custom-primary-dark', this._darkenColor(config.primary, 20));
    root.style.setProperty('--custom-primary-light', this._lightenColor(config.primary, 20));
    root.style.setProperty('--custom-bg', config.background);
    root.style.setProperty('--custom-surface', this._lightenColor(config.background, 5));
    root.style.setProperty('--custom-text', config.text);
    root.style.setProperty('--custom-text-secondary', this._lightenColor(config.text, 40));
    root.style.setProperty('--custom-border', this._lightenColor(config.background, 10));
    root.style.setProperty('--custom-radius', `${config.radius}px`);
  },

  /**
   * Oscurece un color hexadecimal.
   * @private
   * @param {string} color — color hex
   * @param {number} percent — porcentaje
   * @returns {string} — color oscurecido
   */
  _darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  },

  /**
   * Aclara un color hexadecimal.
   * @private
   * @param {string} color — color hex
   * @param {number} percent — porcentaje
   * @returns {string} — color aclarado
   */
  _lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min((num >> 16) + amt, 255);
    const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
    const B = Math.min((num & 0x0000FF) + amt, 255);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  },

  /**
   * Muestra/oculta configuración de tema personalizado.
   * @private
   * @param {string} theme — tema seleccionado
   */
  _updateThemeConfigVisibility(theme) {
    if (this.elements.customThemeConfig) {
      this.elements.customThemeConfig.classList.toggle('hidden', theme !== 'custom');
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
    // Actualizar hora de fin también
    this._updateEndTime();
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
