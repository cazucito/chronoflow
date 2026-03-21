/**
 * @module app
 * Punto de entrada de la aplicación.
 * Inicializa módulos y maneja el ciclo de vida de la app.
 */

const App = {
  /**
   * Inicializa la aplicación.
   */
  init() {
    console.log('ChronoFlow v1.0 — Iniciando');

    // Cargar preferencias guardadas
    this._loadPreferences();

    // Vincular eventos globales
    this._bindGlobalEvents();

    // Escuchar cambios de estado del timer para actualizar UI
    this._bindTimerEvents();

    // Mostrar tiempo configurado inicialmente
    this._updateDisplayForCurrentMode();

    console.log('ChronoFlow — Listo');
  },

  /**
   * Carga preferencias del usuario.
   * @private
   */
  _loadPreferences() {
    const prefs = Storage.getPreferences();
    
    // Aplicar tema
    this._applyTheme(prefs.theme);
    
    // Aplicar modo por defecto
    if (prefs.defaultMode && timer) {
      timer.setMode(prefs.defaultMode);
      UI.showModeSelector(prefs.defaultMode);
    }
  },

  /**
   * Aplica tema visual.
   * @private
   * @param {string} theme — 'light', 'dark', 'auto'
   */
  _applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      // Seguir preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  },

  /**
   * Vincula eventos globales.
   * @private
   */
  _bindGlobalEvents() {
    // Escuchar cambios de preferencia de color del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const prefs = Storage.getPreferences();
      if (prefs.theme === 'auto') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });

    // Antes de cerrar — guardar estado del timer si está corriendo
    window.addEventListener('beforeunload', () => {
      const state = timer.getState();
      if (state.state === 'RUNNING') {
        sessionStorage.setItem('cf_timer_state', JSON.stringify({
          state: state.state,
          accumulatedMs: timer.accumulatedMs,
          startTimestamp: timer.startTimestamp,
          mode: timer.mode,
          targetMs: timer.targetMs,
          savedAt: Date.now()
        }));
      }
    });

    // Al cargar — restaurar estado si existe
    this._restoreTimerState();
  },

  /**
   * Restaura estado del timer si se cerró la app mientras corría.
   * @private
   */
  _restoreTimerState() {
    try {
      const saved = sessionStorage.getItem('cf_timer_state');
      if (!saved) return;

      const data = JSON.parse(saved);
      sessionStorage.removeItem('cf_timer_state');

      // Verificar que no haya pasado demasiado tiempo (opcional)
      const timeSinceSave = Date.now() - data.savedAt;
      console.log(`Timer restaurado después de ${Math.floor(timeSinceSave / 1000)}s`);

      // Restaurar estado interno del timer
      timer.state = data.state;
      timer.accumulatedMs = data.accumulatedMs;
      timer.startTimestamp = Date.now(); // Nuevo timestamp
      timer.mode = data.mode;
      timer.targetMs = data.targetMs;

      // Actualizar UI
      UI.setButtonState(data.state);
      UI.showModeSelector(data.mode);

      // Reiniciar el loop
      timer._tick();
    } catch (e) {
      console.warn('App: Error restaurando estado del timer', e);
    }
  },

  /**
   * Vincula eventos del timer a la UI.
   * @private
   */
  _bindTimerEvents() {
    // Actualizar display en cada tick
    document.addEventListener('timer:tick', (e) => {
      UI.updateDisplay(e.detail.displayMs);
    });

    // Actualizar botones en cambio de estado
    document.addEventListener('timer:statechange', (e) => {
      UI.setButtonState(e.detail.to);
      
      // Al resetear, mostrar tiempo configurado para TIMER/POMODORO
      if (e.detail.to === 'IDLE') {
        this._updateDisplayForCurrentMode();
      }
    });

    // Guardar sesión al completar (para Fase 3)
    document.addEventListener('timer:complete', async (e) => {
      console.log('Timer completado:', e.detail);
      
      // Fase 3: Guardar en IndexedDB
      // const session = { ... }
      // await HistoryDB.saveSession(session);
    });
  },

  /**
   * Actualiza el display según el modo actual y configuración.
   * @private
   */
  _updateDisplayForCurrentMode() {
    const mode = timer.mode;
    
    if (mode === 'TIMER') {
      const min = parseInt(document.getElementById('timer-min')?.value || '0', 10);
      const sec = parseInt(document.getElementById('timer-sec')?.value || '0', 10);
      UI.updateDisplay((min * 60 + sec) * 1000);
    } else if (mode === 'POMODORO') {
      const activeBtn = document.querySelector('.btn-pomodoro.active');
      const min = parseInt(activeBtn?.dataset.min || '25', 10);
      UI.updateDisplay(min * 60 * 1000);
    } else {
      UI.updateDisplay(0);
    }
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Exportar para testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App };
}
