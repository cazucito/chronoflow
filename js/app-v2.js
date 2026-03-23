/**
 * @fileoverview Entry point de ChronoFlow v2.0.
 * Inicializa el Core con todos los plugins.
 * 
 * @module app
 * @version 2.0.0
 */

import { Core, getCore } from './core/Core.js';
import { TimerPlugin } from './plugins/TimerPlugin.js';

// Plugins adicionales (placeholders - se implementarían completos)
class UIPlugin {
  static name = 'UIPlugin';
  static dependencies = ['TimerPlugin', 'EventBus'];
  
  constructor(deps) {
    this.events = deps.eventBus;
    this.timer = deps.timerPlugin;
    this.logger = deps.logger;
    this.elements = {};
  }
  
  async init() {
    this._cacheElements();
    this._bindEvents();
    this._bindTimerEvents();
    this.logger.info('[UI] Inicializado');
  }
  
  async start() {
    this._updateDisplay(0);
    this.logger.info('[UI] Renderizado inicial');
  }
  
  _cacheElements() {
    this.elements = {
      display: document.getElementById('time-display'),
      btnStart: document.getElementById('btn-start'),
      btnPause: document.getElementById('btn-pause'),
      btnReset: document.getElementById('btn-reset'),
      modeSelector: document.getElementById('timer-mode')
    };
  }
  
  _bindEvents() {
    this.elements.btnStart?.addEventListener('click', () => {
      const state = this.timer.getState().state;
      if (state === 'PAUSED') {
        this.timer.resume();
      } else {
        this.timer.start();
      }
    });
    
    this.elements.btnPause?.addEventListener('click', () => this.timer.pause());
    this.elements.btnReset?.addEventListener('click', () => this.timer.reset());
    
    this.elements.modeSelector?.addEventListener('change', (e) => {
      const mode = e.target.value.toUpperCase();
      this.timer.setMode(mode);
    });
  }
  
  _bindTimerEvents() {
    this.events.on('timer:tick', (data) => {
      this._updateDisplay(data.displayMs);
    });
    
    this.events.on('timer:stateChanged', (data) => {
      this._updateButtons(data.to);
    });
  }
  
  _updateDisplay(ms) {
    if (!this.elements.display) return;
    const formatted = this._formatTime(ms);
    this.elements.display.textContent = formatted;
  }
  
  _formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    const pad = (n) => String(n).padStart(2, '0');
    
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
  }
  
  _updateButtons(state) {
    const { btnStart, btnPause } = this.elements;
    if (!btnStart || !btnPause) return;
    
    switch (state) {
      case 'IDLE':
        btnStart.disabled = false;
        btnStart.textContent = 'Iniciar';
        btnPause.disabled = true;
        break;
      case 'RUNNING':
        btnStart.disabled = true;
        btnPause.disabled = false;
        break;
      case 'PAUSED':
        btnStart.disabled = false;
        btnStart.textContent = 'Reanudar';
        btnPause.disabled = true;
        break;
      case 'COMPLETED':
        btnStart.disabled = true;
        btnPause.disabled = true;
        break;
    }
  }
}

class ThemePlugin {
  static name = 'ThemePlugin';
  static dependencies = ['EventBus'];
  
  constructor(deps) {
    this.events = deps.eventBus;
    this.logger = deps.logger;
    this.currentTheme = 'minimal';
  }
  
  async init() {
    this._loadSavedTheme();
    this._bindUI();
    this.logger.info('[Theme] Inicializado');
  }
  
  _loadSavedTheme() {
    const saved = localStorage.getItem('cf_theme');
    if (saved) {
      this.setTheme(saved);
    }
  }
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('cf_theme', theme);
    this.events.emit('theme:changed', { theme });
  }
  
  _bindUI() {
    const selector = document.getElementById('theme-select');
    if (selector) {
      selector.value = this.currentTheme;
      selector.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
      });
    }
  }
}

class StoragePlugin {
  static name = 'StoragePlugin';
  
  constructor(deps) {
    this.logger = deps.logger;
    this.prefix = 'cf_';
  }
  
  async get(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      this.logger.error('[Storage] Error leyendo:', key, e);
      return null;
    }
  }
  
  async set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      this.logger.error('[Storage] Error guardando:', key, e);
      return false;
    }
  }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa la aplicación ChronoFlow.
 * 
 * @async
 * @returns {Promise<Core>}
 */
async function bootstrap() {
  console.log('🚀 ChronoFlow v2.0 - Iniciando...');
  
  // Configuración
  const config = {
    version: '2.0.0',
    debug: location.hostname === 'localhost',
    environment: location.hostname === 'localhost' ? 'development' : 'production'
  };
  
  // Crear Core
  const core = new Core(config);
  
  // Registrar plugins en orden de dependencias
  core
    .use(StoragePlugin, { priority: 100 })  // Primero (otros dependen de storage)
    .use(TimerPlugin, { priority: 90 })     // Segundo (core functionality)
    .use(ThemePlugin, { priority: 50 })     // UI visual
    .use(UIPlugin, { priority: 10 });       // UI principal
  
  // Iniciar aplicación
  try {
    await core.start();
    
    // Exponer para debugging (solo en dev)
    if (config.debug) {
      window.ChronoFlow = {
        core,
        timer: core.getPlugin('TimerPlugin'),
        events: core.getEventBus(),
        container: core.getContainer()
      };
      console.log('ChronoFlow disponible en window.ChronoFlow');
    }
    
    return core;
    
  } catch (error) {
    console.error('❌ Error iniciando ChronoFlow:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1>⚠️ Error al iniciar ChronoFlow</h1>
        <p>${error.message}</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 10px; overflow: auto;">
${error.stack}
        </pre>
      </div>
    `;
    throw error;
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Manejar recarga de página (guardar estado)
window.addEventListener('beforeunload', () => {
  const core = getCore();
  core?.getPlugin('TimerPlugin')?._persistState?.();
});

export { bootstrap };
