/**
 * @fileoverview Modo Reloj Digital de Pared con Dual Timezone
 * Pantalla completa estilo reloj digital profesional
 * 
 * @module plugins/WallClock
 * @version 2.0.0
 * @implements RF-09, RF-10
 */

/**
 * Gestiona el modo reloj digital de pared con soporte dual timezone.
 * 
 * Características:
 * - Pantalla completa responsive
 * - Dígitos grandes estilo LED
 * - Controles flotantes semitransparentes
 * - Dual timezone display (principal + secundaria)
 * - Selector de zonas horarias LATAM
 * 
 * @class WallClock
 */
class WallClock {
  _elements = {};
  _startTime = null;
  _endTime = null;
  
  // Zonas horarias
  _primaryTimezone = 'America/Bogota';
  _secondaryTimezone = 'America/Mexico_City';
  
  // Mapeo de zonas horarias con nombres completos y banderas
  _timezoneMap = {
    'America/Bogota': { code: 'COL', offset: -5, name: 'COLOMBIA', flag: '🇨🇴' },
    'America/Mexico_City': { code: 'CDMX', offset: -6, name: 'MÉXICO', flag: '🇲🇽' },
    'America/Argentina/Buenos_Aires': { code: 'ARG', offset: -3, name: 'ARGENTINA', flag: '🇦🇷' },
    'America/Santiago': { code: 'CHI', offset: -4, name: 'CHILE', flag: '🇨🇱' },
    'America/Lima': { code: 'PER', offset: -5, name: 'PERÚ', flag: '🇵🇪' },
    'America/Sao_Paulo': { code: 'BRA', offset: -3, name: 'BRASIL', flag: '🇧🇷' }
  };

  // Banderas de países (para actualizar DOM)
  _flagElements = {
    primary: null,
    secondary: null
  };

  init() {
    this._loadTimezonePreference();
    this._cacheElements();
    this._bindEvents();
    this._updateDisplay(0);
    this._updateStatus('IDLE');
    this._resetFixedTimes();
    this._updateTimezoneDisplay(); // Actualizar banderas al inicio
    console.log('[WallClock] Inicializado con Dual Timezone');
  }

  _cacheElements() {
    this._elements = {
      container: document.getElementById('wallclock-mode'),
      btnStart: document.getElementById('wallclock-btn-start'),
      btnPause: document.getElementById('wallclock-btn-pause'),
      btnReset: document.getElementById('wallclock-btn-reset'),
      digitH1: document.querySelector('.digit-h1'),
      digitH2: document.querySelector('.digit-h2'),
      digitM1: document.querySelector('.digit-m1'),
      digitM2: document.querySelector('.digit-m2'),
      digitS1: document.querySelector('.digit-s1'),
      digitS2: document.querySelector('.digit-s2'),
      label: document.getElementById('wallclock-label'),
      status: document.getElementById('wallclock-status'),
      
      // Dual timezone elements (nuevo layout dos columnas)
      currentTimePrimary: document.getElementById('wallclock-current-primary'),
      endTimePrimary: document.getElementById('wallclock-endtime-primary'),
      currentTimeSecondary: document.getElementById('wallclock-current-secondary'),
      endTimeSecondary: document.getElementById('wallclock-endtime-secondary'),
      countryPrimary: document.getElementById('country-primary'),
      countrySecondary: document.getElementById('country-secondary'),
      timezonePrimarySelect: document.getElementById('timezone-primary'),
      timezoneSecondarySelect: document.getElementById('timezone-secondary'),
      
      // Config
      timerMin: document.getElementById('timer-min'),
      timerSec: document.getElementById('timer-sec'),
      timerLabelInput: document.getElementById('timer-label')
    };
  }

  _loadTimezonePreference() {
    const savedPrimary = localStorage.getItem('cf_primary_timezone');
    const savedSecondary = localStorage.getItem('cf_secondary_timezone');
    
    if (savedPrimary && this._timezoneMap[savedPrimary]) {
      this._primaryTimezone = savedPrimary;
    }
    if (savedSecondary && this._timezoneMap[savedSecondary]) {
      this._secondaryTimezone = savedSecondary;
    }
  }

  _bindEvents() {
    // Controles del timer
    this._elements.btnStart?.addEventListener('click', () => {
      const state = timer?.getState?.().state;
      if (state === 'PAUSED') {
        timer.resume();
      } else {
        this._configureTimerFromInputs();
        timer.start();
      }
    });

    this._elements.btnPause?.addEventListener('click', () => timer.pause());
    this._elements.btnReset?.addEventListener('click', () => timer.reset());

    // Label
    this._elements.timerLabelInput?.addEventListener('input', () => {
      this._updateLabel(this._elements.timerLabelInput.value);
    });

    // Selector de zona horaria primaria
    this._elements.timezonePrimarySelect?.addEventListener('change', (e) => {
      this._primaryTimezone = e.target.value;
      localStorage.setItem('cf_primary_timezone', this._primaryTimezone);
      this._updateTimezoneDisplay();
    });

    // Selector de zona horaria secundaria
    this._elements.timezoneSecondarySelect?.addEventListener('change', (e) => {
      this._secondaryTimezone = e.target.value;
      localStorage.setItem('cf_secondary_timezone', this._secondaryTimezone);
      this._updateTimezoneDisplay();
    });

    // Eventos del timer
    document.addEventListener('timer:tick', (e) => {
      this._updateDisplay(e.detail.displayMs);
    });

    document.addEventListener('timer:statechange', (e) => {
      const newState = e.detail.to;
      const fromState = e.detail.from;

      this._updateStatus(newState);
      this._updateControls(newState);

      if (newState === 'RUNNING' && fromState === 'IDLE') {
        this._setStartTime();
        if (this._elements.timerLabelInput) {
          localStorage.setItem('cf_timer_label', this._elements.timerLabelInput.value);
        }
      }

      if (newState === 'IDLE') {
        this._resetFixedTimes();
      }
    });

    document.addEventListener('timer:complete', () => {
      this._updateStatus('COMPLETED');
      this._updateControls('COMPLETED');
    });
  }

  _configureTimerFromInputs() {
    const min = parseInt(this._elements.timerMin?.value || '0', 10);
    const sec = parseInt(this._elements.timerSec?.value || '0', 10);
    timer.targetMs = (min * 60 + sec) * 1000;
  }

  _setStartTime() {
    this._startTime = new Date();
    const min = parseInt(this._elements.timerMin?.value || '0', 10);
    const sec = parseInt(this._elements.timerSec?.value || '0', 10);
    const durationMs = (min * 60 + sec) * 1000;

    if (durationMs > 0) {
      this._endTime = new Date(this._startTime.getTime() + durationMs);
    }

    this._updateFixedTimes();
  }

  _updateFixedTimes() {
    if (!this._startTime || !this._endTime) return;

    // Actualizar nombres de países y banderas
    const primaryInfo = this._timezoneMap[this._primaryTimezone];
    const secondaryInfo = this._timezoneMap[this._secondaryTimezone];

    if (this._elements.countryPrimary) {
      this._elements.countryPrimary.textContent = primaryInfo.name;
    }
    if (this._elements.countrySecondary) {
      this._elements.countrySecondary.textContent = secondaryInfo.name;
    }
    
    // Actualizar banderas
    const primaryFlagEl = document.querySelector('.country-flag');
    const secondaryFlagEl = document.querySelector('.country-flag-secondary');
    
    if (primaryFlagEl && primaryInfo) {
      primaryFlagEl.textContent = primaryInfo.flag;
    }
    if (secondaryFlagEl && secondaryInfo) {
      secondaryFlagEl.textContent = secondaryInfo.flag;
    }

    // Calcular horas para zona primaria
    const primaryStart = this._convertToTimezone(this._startTime, this._primaryTimezone);
    const primaryEnd = this._convertToTimezone(this._endTime, this._primaryTimezone);

    if (this._elements.currentTimePrimary) {
      this._elements.currentTimePrimary.textContent = this._formatTimeForDisplay(primaryStart);
    }
    if (this._elements.endTimePrimary) {
      this._elements.endTimePrimary.textContent = this._formatTimeForDisplay(primaryEnd);
    }

    // Calcular horas para zona secundaria
    const secondaryStart = this._convertToTimezone(this._startTime, this._secondaryTimezone);
    const secondaryEnd = this._convertToTimezone(this._endTime, this._secondaryTimezone);

    if (this._elements.currentTimeSecondary) {
      this._elements.currentTimeSecondary.textContent = this._formatTimeForDisplay(secondaryStart);
    }
    if (this._elements.endTimeSecondary) {
      this._elements.endTimeSecondary.textContent = this._formatTimeForDisplay(secondaryEnd);
    }
  }

  _convertToTimezone(date, timezone) {
    // Crear una copia de la fecha
    const d = new Date(date);
    
    // Obtener el offset de la zona horaria destino
    const tzInfo = this._timezoneMap[timezone];
    if (!tzInfo) return d;

    // Calcular la hora en la zona destino
    // Usamos el offset directamente para simplificar
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + (tzInfo.offset * 3600000));
    
    return targetTime;
  }

  _formatTimeForDisplay(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  _resetFixedTimes() {
    this._startTime = null;
    this._endTime = null;
    
    ['currentTimePrimary', 'endTimePrimary', 'currentTimeSecondary', 'endTimeSecondary'].forEach(id => {
      if (this._elements[id]) {
        this._elements[id].textContent = '--:--';
      }
    });
  }

  _updateTimezoneDisplay() {
    // Actualizar selectores
    if (this._elements.timezonePrimarySelect) {
      this._elements.timezonePrimarySelect.value = this._primaryTimezone;
    }
    if (this._elements.timezoneSecondarySelect) {
      this._elements.timezoneSecondarySelect.value = this._secondaryTimezone;
    }
    
    // Actualizar banderas en el DOM
    const primaryInfo = this._timezoneMap[this._primaryTimezone];
    const secondaryInfo = this._timezoneMap[this._secondaryTimezone];
    
    // Buscar y actualizar elementos de bandera
    const primaryFlagEl = document.querySelector('.country-flag');
    const secondaryFlagEl = document.querySelector('.country-flag-secondary');
    
    if (primaryFlagEl && primaryInfo) {
      primaryFlagEl.textContent = primaryInfo.flag;
    }
    if (secondaryFlagEl && secondaryInfo) {
      secondaryFlagEl.textContent = secondaryInfo.flag;
    }
    
    this._updateFixedTimes();
  }

  _updateDisplay(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    this._setDigit(this._elements.digitH1, Math.floor(hours / 10));
    this._setDigit(this._elements.digitH2, hours % 10);
    this._setDigit(this._elements.digitM1, Math.floor(minutes / 10));
    this._setDigit(this._elements.digitM2, minutes % 10);
    this._setDigit(this._elements.digitS1, Math.floor(seconds / 10));
    this._setDigit(this._elements.digitS2, seconds % 10);
  }

  _setDigit(element, value) {
    if (element) element.textContent = value;
  }

  _updateLabel(label) {
    if (this._elements.label) {
      this._elements.label.textContent = label;
    }
  }

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
    
    if (this._elements.container) {
      this._elements.container.setAttribute('data-state', state.toLowerCase());
    }
  }

  _updateControls(state) {
    const isRunning = state === 'RUNNING';
    
    if (this._elements.btnStart) {
      this._elements.btnStart.classList.toggle('hidden', isRunning);
    }
    if (this._elements.btnPause) {
      this._elements.btnPause.classList.toggle('hidden', !isRunning);
    }
  }
}

// Singleton
const wallClock = new WallClock();

// Inicializar
function initWallClock() {
  if (typeof timer === 'undefined') {
    console.error('[WallClock] Error: timer no está definido');
    return;
  }
  wallClock.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWallClock);
} else {
  initWallClock();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WallClock, wallClock };
}