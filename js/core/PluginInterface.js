/**
 * @fileoverview Interfaz base para todos los plugins de ChronoFlow.
 * Define el contrato que debe implementar cualquier plugin.
 * 
 * @module core/PluginInterface
 * @version 2.0.0
 * @license MIT
 */

/**
 * @typedef {Object} PluginDependencies
 * @property {IEventBus} eventBus - Bus de eventos para comunicación
 * @property {IStorage} storage - Capa de persistencia
 * @property {Object} config - Configuración global
 * @property {ILogger} logger - Sistema de logging
 */

/**
 * @typedef {Object} PluginMetadata
 * @property {string} name - Nombre único del plugin
 * @property {string} version - Versión semver
 * @property {string[]} dependencies - Nombres de plugins requeridos
 * @property {boolean} [critical=false] - Si es true, errores detienen la app
 */

/**
 * Interfaz base que todos los plugins deben implementar.
 * 
 * Proporciona el ciclo de vida estándar:
 * 1. Constructor: Inyección de dependencias
 * 2. init(): Configuración asíncrona
 * 3. start(): Inicio de operaciones
 * 4. stop(): Detención graceful
 * 5. destroy(): Limpieza de recursos
 * 
 * @abstract
 * @class BasePlugin
 * @example
 * class MyPlugin extends BasePlugin {
 *   static name = 'MyPlugin';
 *   static version = '1.0.0';
 *   static dependencies = ['EventBus'];
 *   
 *   constructor(deps) {
 *     super(deps);
 *     this.events = deps.eventBus;
 *   }
 *   
 *   async init() {
 *     this.events.on('app:ready', this.onReady.bind(this));
 *   }
 * }
 */
export class BasePlugin {
  /**
   * Nombre único del plugin. Debe ser definido por subclases.
   * @type {string}
   * @static
   * @abstract
   */
  static name = 'BasePlugin';

  /**
   * Versión del plugin en formato semver.
   * @type {string}
   * @static
   */
  static version = '2.0.0';

  /**
   * Lista de nombres de plugins que deben cargarse antes.
   * @type {string[]}
   * @static
   */
  static dependencies = [];

  /**
   * Indica si el plugin es crítico (fallo detiene la app).
   * @type {boolean}
   * @static
   */
  static critical = false;

  /**
   * Estado actual del plugin.
   * @type {'created'|'initializing'|'ready'|'running'|'stopped'|'error'}
   * @protected
   */
  _state = 'created';

  /**
   * Timestamp de creación del plugin.
   * @type {number}
   * @protected
   */
  _createdAt = Date.now();

  /**
   * @param {PluginDependencies} dependencies - Dependencias inyectadas
   */
  constructor(dependencies = {}) {
    if (new.target === BasePlugin) {
      throw new Error('BasePlugin es abstracta. No puede instanciarse directamente.');
    }

    /**
     * @type {IEventBus}
     * @protected
     */
    this._eventBus = dependencies.eventBus;
    
    /**
     * @type {IStorage}
     * @protected
     */
    this._storage = dependencies.storage;
    
    /**
     * @type {Object}
     * @protected
     */
    this._config = dependencies.config || {};
    
    /**
     * @type {ILogger}
     * @protected
     */
    this._logger = dependencies.logger;

    this._state = 'created';
    
    this._logger?.debug(`[${this.constructor.name}] Plugin creado`);
  }

  /**
   * Obtiene el nombre del plugin.
   * @returns {string}
   */
  get name() {
    return this.constructor.name;
  }

  /**
   * Obtiene el estado actual del plugin.
   * @returns {string}
   */
  get state() {
    return this._state;
  }

  /**
   * Verifica si el plugin está listo para operar.
   * @returns {boolean}
   */
  get isReady() {
    return this._state === 'ready' || this._state === 'running';
  }

  /**
   * Inicialización asíncrona del plugin.
   * Se ejecuta una sola vez al cargar.
   * 
   * Aquí se debe:
   * - Registrar listeners de eventos
   * - Cargar estado persistente
   * - Validar configuración
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {PluginInitError} Si la inicialización falla
   */
  async init() {
    this._state = 'initializing';
    this._logger?.info(`[${this.name}] Inicializando...`);
    
    // Implementar en subclases
    
    this._state = 'ready';
    this._logger?.info(`[${this.name}] Inicializado`);
  }

  /**
   * Inicia las operaciones del plugin.
   * Se puede llamar múltiples veces (start → stop → start).
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {PluginStartError} Si no se puede iniciar
   */
  async start() {
    if (!this.isReady) {
      throw new Error(`[${this.name}] No está listo. Estado: ${this._state}`);
    }

    this._state = 'running';
    this._logger?.info(`[${this.name}] Iniciado`);
    
    this._eventBus?.emit(`plugin:${this.name}:started`, {
      timestamp: Date.now()
    });
  }

  /**
   * Detiene las operaciones del plugin de forma graceful.
   * 
   * @async
   * @param {Object} [options] - Opciones de detención
   * @param {boolean} [options.force=false] - Forzar detención inmediata
   * @returns {Promise<void>}
   */
  async stop(options = {}) {
    this._state = 'stopped';
    this._logger?.info(`[${this.name}] Detenido`);
    
    this._eventBus?.emit(`plugin:${this.name}:stopped`, {
      timestamp: Date.now(),
      force: options.force
    });
  }

  /**
   * Libera todos los recursos del plugin.
   * Se ejecuta al destruir la aplicación.
   * 
   * Aquí se debe:
   * - Remover listeners de eventos
   * - Limpiar timers/intervals
   * - Cerrar conexiones
   */
  destroy() {
    this._state = 'destroyed';
    this._logger?.debug(`[${this.name}] Destruido`);
  }

  /**
   * Maneja errores del plugin.
   * @param {Error} error - Error ocurrido
   * @param {string} [context] - Contexto donde ocurrió
   * @protected
   */
  _handleError(error, context = '') {
    this._state = 'error';
    
    const errorInfo = {
      plugin: this.name,
      context,
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    };

    this._logger?.error(`[${this.name}] Error${context ? ` en ${context}` : ''}:`, error);
    
    this._eventBus?.emit('plugin:error', errorInfo);
    
    if (this.constructor.critical) {
      this._eventBus?.emit('app:critical-error', errorInfo);
    }
  }
}

/**
 * Decorador para marcar un método como hook de evento.
 * @param {string} eventName - Nombre del evento a escuchar
 * @returns {Function} Decorador
 * @example
 * class MyPlugin extends BasePlugin {
 *   @onEvent('timer:completed')
 *   handleCompletion(data) {
 *     console.log('Completado:', data);
 *   }
 * }
 */
export function onEvent(eventName) {
  return function(target, propertyKey, descriptor) {
    if (!target._eventHooks) {
      target._eventHooks = [];
    }
    target._eventHooks.push({
      event: eventName,
      handler: propertyKey
    });
    return descriptor;
  };
}

/**
 * Error específico de inicialización de plugin.
 */
export class PluginInitError extends Error {
  constructor(pluginName, message) {
    super(`[${pluginName}] Error de inicialización: ${message}`);
    this.name = 'PluginInitError';
    this.pluginName = pluginName;
  }
}

/**
 * Error específico de inicio de plugin.
 */
export class PluginStartError extends Error {
  constructor(pluginName, message) {
    super(`[${pluginName}] Error al iniciar: ${message}`);
    this.name = 'PluginStartError';
    this.pluginName = pluginName;
  }
}
