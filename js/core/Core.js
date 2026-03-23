/**
 * @fileoverview Core - Orquestador central de ChronoFlow.
 * Gestiona el ciclo de vida de la aplicación y coordina plugins.
 * 
 * @module core/Core
 * @version 2.0.0
 * @requires PluginInterface
 * @requires EventBus
 * @requires DIContainer
 */

import { BasePlugin, PluginInitError } from './PluginInterface.js';
import { EventBus, getEventBus } from './EventBus.js';
import { DIContainer, getContainer } from './DIContainer.js';

/**
 * @typedef {Object} CoreConfig
 * @property {string} version - Versión de la aplicación
 * @property {string} environment - 'development' | 'production' | 'testing'
 * @property {boolean} debug - Modo debug
 * @property {Object} features - Flags de características
 */

/**
 * @typedef {Object} CoreState
 * @property {'created'|'initializing'|'running'|'stopping'|'stopped'|'error'} status
 * @property {number} startTime - Timestamp de inicio
 * @property {Map<string, BasePlugin>} plugins - Plugins registrados
 * @property {Error|null} lastError - Último error
 */

/**
 * Orquestador central de ChronoFlow.
 * 
 * Responsabilidades:
 * - Inicializar y configurar el sistema
 * - Registrar y gestionar plugins
 * - Orquestar el ciclo de vida de la app
 * - Manejar errores globales
 * - Proveer logging centralizado
 * 
 * @class Core
 * @example
 * const core = new Core({ debug: true });
 * 
 * await core
 *   .use(TimerPlugin)
 *   .use(UIPlugin)
 *   .use(StoragePlugin)
 *   .start();
 */
export class Core {
  /**
   * @type {CoreConfig}
   * @private
   */
  _config = {
    version: '2.0.0',
    environment: 'production',
    debug: false,
    features: {}
  };

  /**
   * @type {CoreState}
   * @private
   */
  _state = {
    status: 'created',
    startTime: 0,
    plugins: new Map(),
    lastError: null
  };

  /**
   * @type {EventBus}
   * @private
   */
  _eventBus;

  /**
   * @type {DIContainer}
   * @private
   */
  _container;

  /**
   * @type {Array<{plugin: Function, priority: number}>}
   * @private
   */
  _pluginQueue = [];

  /**
   * @param {Partial<CoreConfig>} [config] - Configuración
   */
  constructor(config = {}) {
    this._config = { ...this._config, ...config };
    
    // Inicializar sistema de eventos
    this._eventBus = getEventBus({ debug: this._config.debug });
    
    // Inicializar contenedor DI
    this._container = getContainer();
    
    // Registrar servicios core en DI
    this._registerCoreServices();
    
    // Bind error handlers
    this._bindErrorHandlers();
    
    this._log('Core creado', 'info');
  }

  /**
   * Registra un plugin para ser iniciado.
   * 
   * @param {typeof BasePlugin} PluginClass - Clase del plugin
   * @param {Object} [options] - Opciones
   * @param {number} [options.priority=0] - Prioridad de carga (mayor = primero)
   * @returns {Core} this para chaining
   * 
   * @example
   * core.use(TimerPlugin, { priority: 10 });
   * core.use(UIPlugin);
   */
  use(PluginClass, options = {}) {
    if (!(PluginClass.prototype instanceof BasePlugin)) {
      throw new TypeError('Plugin debe extender BasePlugin');
    }

    this._pluginQueue.push({
      plugin: PluginClass,
      priority: options.priority || 0
    });

    // Ordenar por prioridad
    this._pluginQueue.sort((a, b) => b.priority - a.priority);

    this._log(`Plugin "${PluginClass.name}" encolado (priority: ${options.priority || 0})`);
    
    return this;
  }

  /**
   * Inicializa y arranca la aplicación.
   * 
   * @async
   * @returns {Promise<Core>} this para chaining
   * @throws {PluginInitError} Si falla la inicialización
   * 
   * @example
   * try {
   *   await core.start();
   *   console.log('App iniciada');
   * } catch (err) {
   *   console.error('Fallo al iniciar:', err);
   * }
   */
  async start() {
    if (this._state.status === 'running') {
      this._log('Core ya está corriendo', 'warn');
      return this;
    }

    this._state.status = 'initializing';
    this._state.startTime = Date.now();

    this._log('Iniciando ChronoFlow v' + this._config.version);
    this._eventBus.emit('app:starting', { version: this._config.version });

    try {
      // 1. Cargar plugins en orden de dependencias
      await this._loadPlugins();

      // 2. Inicializar cada plugin
      await this._initializePlugins();

      // 3. Iniciar plugins
      await this._startPlugins();

      this._state.status = 'running';
      
      const initTime = Date.now() - this._state.startTime;
      this._log(`ChronoFlow iniciado en ${initTime}ms`);
      
      this._eventBus.emit('app:ready', {
        version: this._config.version,
        initTime,
        plugins: Array.from(this._state.plugins.keys())
      });

    } catch (error) {
      this._state.status = 'error';
      this._state.lastError = error;
      this._log('Error al iniciar: ' + error.message, 'error');
      this._eventBus.emit('app:error', { error });
      throw error;
    }

    return this;
  }

  /**
   * Detiene la aplicación de forma graceful.
   * 
   * @async
   * @param {Object} [options] - Opciones
   * @param {boolean} [options.force=false] - Forzar detención inmediata
   * @returns {Promise<void>}
   */
  async stop(options = {}) {
    if (this._state.status !== 'running') return;

    this._state.status = 'stopping';
    this._log('Deteniendo aplicación...');
    this._eventBus.emit('app:stopping');

    // Detener plugins en orden inverso
    const plugins = Array.from(this._state.plugins.values()).reverse();
    
    for (const plugin of plugins) {
      try {
        await plugin.stop(options);
      } catch (error) {
        this._log(`Error deteniendo ${plugin.name}: ${error.message}`, 'error');
      }
    }

    this._state.status = 'stopped';
    this._log('Aplicación detenida');
    this._eventBus.emit('app:stopped');
  }

  /**
   * Destruye la aplicación y libera recursos.
   */
  dispose() {
    this._log('Destruyendo aplicación...');
    
    for (const plugin of this._state.plugins.values()) {
      try {
        plugin.destroy();
      } catch (error) {
        console.error(`Error destruyendo ${plugin.name}:`, error);
      }
    }

    this._state.plugins.clear();
    this._container.dispose();
    
    this._log('Aplicación destruida');
  }

  /**
   * Obtiene un plugin por nombre.
   * 
   * @param {string} name - Nombre del plugin
   * @returns {BasePlugin|undefined}
   */
  getPlugin(name) {
    return this._state.plugins.get(name);
  }

  /**
   * Obtiene el bus de eventos.
   * @returns {EventBus}
   */
  getEventBus() {
    return this._eventBus;
  }

  /**
   * Obtiene el contenedor DI.
   * @returns {DIContainer}
   */
  getContainer() {
    return this._container;
  }

  /**
   * Obtiene información de estado.
   * @returns {CoreState}
   */
  getState() {
    return {
      ...this._state,
      plugins: Array.from(this._state.plugins.keys())
    };
  }

  /**
   * Registra servicios core en el contenedor DI.
   * @private
   */
  _registerCoreServices() {
    this._container
      .registerConstant('config', this._config)
      .registerConstant('eventBus', this._eventBus)
      .registerConstant('container', this._container)
      .registerConstant('core', this);
    
    // Logger factory
    this._container.register('logger', () => ({
      debug: (...args) => this._config.debug && console.log('[DEBUG]', ...args),
      info: (...args) => console.log('[INFO]', ...args),
      warn: (...args) => console.warn('[WARN]', ...args),
      error: (...args) => console.error('[ERROR]', ...args)
    }), { lifecycle: 'singleton' });
  }

  /**
   * Carga plugins en orden de dependencias.
   * @private
   */
  async _loadPlugins() {
    this._log(`Cargando ${this._pluginQueue.length} plugins...`);

    // Detectar dependencias circulares
    for (const { plugin } of this._pluginQueue) {
      for (const dep of plugin.dependencies || []) {
        const hasDep = this._pluginQueue.some(p => p.plugin.name === dep);
        if (!hasDep) {
          throw new PluginInitError(
            plugin.name,
            `Dependencia "${dep}" no encontrada`
          );
        }
      }
    }

    // Crear instancias en orden
    for (const { plugin: PluginClass } of this._pluginQueue) {
      const name = PluginClass.name;
      
      if (this._state.plugins.has(name)) continue;

      // Resolver dependencias del plugin
      const deps = {};
      for (const depName of PluginClass.dependencies || []) {
        deps[this._camelCase(depName)] = this._resolvePluginDependency(depName);
      }

      // Añadir servicios core
      deps.config = this._config;
      deps.eventBus = this._eventBus;
      deps.logger = this._container.resolve('logger');
      deps.storage = this._container.resolve('storage');

      // Crear instancia
      const instance = new PluginClass(deps);
      
      this._state.plugins.set(name, instance);
      this._container.registerConstant(name, instance);
      
      this._log(`Plugin "${name}" instanciado`);
    }
  }

  /**
   * Inicializa todos los plugins.
   * @private
   */
  async _initializePlugins() {
    for (const [name, plugin] of this._state.plugins) {
      this._log(`Inicializando "${name}"...`);
      await plugin.init();
    }
  }

  /**
   * Inicia todos los plugins.
   * @private
   */
  async _startPlugins() {
    for (const [name, plugin] of this._state.plugins) {
      this._log(`Iniciando "${name}"...`);
      await plugin.start();
    }
  }

  /**
   * Resuelve una dependencia de plugin.
   * @private
   */
  _resolvePluginDependency(name) {
    const plugin = this._state.plugins.get(name);
    if (plugin) return plugin;
    
    // Buscar en contenedor
    if (this._container.has(name)) {
      return this._container.resolve(name);
    }
    
    throw new Error(`Dependencia "${name}" no disponible`);
  }

  /**
   * Convierte nombre a camelCase.
   * @private
   */
  _camelCase(str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '');
  }

  /**
   * Logging interno.
   * @private
   */
  _log(message, level = 'info') {
    const prefix = '[Core]';
    if (level === 'debug' && !this._config.debug) return;
    
    console[level](prefix, message);
  }

  /**
   * Binding de manejadores de error.
   * @private
   */
  _bindErrorHandlers() {
    // Errores no capturados
    window.addEventListener('error', (event) => {
      this._eventBus.emit('app:uncaught-error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        error: event.error
      });
    });

    // Promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      this._eventBus.emit('app:unhandled-rejection', {
        reason: event.reason
      });
    });
  }
}

// Singleton global
let globalCore = null;

/**
 * Obtiene o crea el Core global.
 * @param {Object} [config] - Configuración (solo primera vez)
 * @returns {Core}
 */
export function getCore(config) {
  if (!globalCore) {
    globalCore = new Core(config);
  }
  return globalCore;
}

/**
 * Destruye el Core global.
 */
export function destroyCore() {
  globalCore?.dispose();
  globalCore = null;
}
