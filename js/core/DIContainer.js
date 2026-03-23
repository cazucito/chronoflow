/**
 * @fileoverview Contenedor de Inyección de Dependencias (DI Container).
 * Gestiona el registro, resolución y ciclo de vida de dependencias.
 * 
 * @module core/DIContainer
 * @version 2.0.0
 * @see {@link https://en.wikipedia.org/wiki/Dependency_injection}
 */

/**
 * @typedef {Object} ServiceDefinition
 * @property {*} instance - Instancia del servicio
 * @property {Function} [factory] - Fábrica para crear instancia
 * @property {string[]} [dependencies] - Nombres de dependencias
 * @property {'singleton'|'transient'|'scoped'} [lifecycle='singleton'] - Ciclo de vida
 */

/**
 * Contenedor de Inyección de Dependencias.
 * 
 * Soporta tres ciclos de vida:
 * - **singleton**: Una instancia para toda la aplicación
 * - **transient**: Nueva instancia en cada resolución
 * - **scoped**: Una instancia por scope (ej: request, sesión)
 * 
 * @class DIContainer
 * @example
 * const container = new DIContainer();
 * 
 * // Registrar servicio
 * container.register('logger', ConsoleLogger);
 * 
 * // Registrar con fábrica
 * container.register('timer', (c) => new TimerPlugin({
 *   logger: c.resolve('logger')
 * }));
 * 
 * // Resolver
 * const timer = container.resolve('timer');
 */
export class DIContainer {
  /**
   * @type {Map<string, ServiceDefinition>}
   * @private
   */
  _services = new Map();

  /**
   * @type {Map<string, *>}
   * @private
   */
  _singletons = new Map();

  /**
   * @type {Map<string, *>}
   * @private
   */
  _scoped = new Map();

  /**
   * @type {DIContainer|null}
   * @private
   */
  _parent = null;

  /**
   * @param {DIContainer} [parent] - Contenedor padre (herencia)
   */
  constructor(parent = null) {
    this._parent = parent;
  }

  /**
   * Registra un servicio en el contenedor.
   * 
   * @param {string} name - Nombre único del servicio
   * @param {Function|*} factory - Clase, función fábrica o instancia
   * @param {Object} [options] - Opciones de registro
   * @param {string[]} [options.dependencies=[]] - Nombres de dependencias
   * @param {'singleton'|'transient'|'scoped'} [options.lifecycle='singleton'] - Ciclo de vida
   * @returns {DIContainer} this para chaining
   * 
   * @example
   * // Como clase
   * container.register('logger', Logger);
   * 
   * // Como fábrica
   * container.register('config', () => loadConfig());
   * 
   * // Como instancia
   * container.register('bus', new EventBus());
   * 
   * // Con dependencias
   * container.register('timer', Timer, {
   *   dependencies: ['logger', 'bus'],
   *   lifecycle: 'singleton'
   * });
   */
  register(name, factory, options = {}) {
    if (typeof name !== 'string' || !name) {
      throw new TypeError('Nombre debe ser string no vacío');
    }

    const definition = {
      factory,
      dependencies: options.dependencies || [],
      lifecycle: options.lifecycle || 'singleton'
    };

    this._services.set(name, definition);
    return this;
  }

  /**
   * Registra un valor constante (instancia ya creada).
   * 
   * @param {string} name - Nombre del servicio
   * @param {*} value - Valor constante
   * @returns {DIContainer} this para chaining
   */
  registerConstant(name, value) {
    this._singletons.set(name, value);
    return this;
  }

  /**
   * Resuelve un servicio del contenedor.
   * 
   * @param {string} name - Nombre del servicio
   * @returns {*} Instancia del servicio
   * @throws {Error} Si el servicio no está registrado
   * 
   * @example
   * const logger = container.resolve('logger');
   * const timer = container.resolve('timer');
   */
  resolve(name) {
    // 1. Buscar en singletons cacheados
    if (this._singletons.has(name)) {
      return this._singletons.get(name);
    }

    // 2. Buscar en scoped
    if (this._scoped.has(name)) {
      return this._scoped.get(name);
    }

    // 3. Buscar definición
    const definition = this._services.get(name);
    if (!definition) {
      // Buscar en padre si existe
      if (this._parent) {
        return this._parent.resolve(name);
      }
      throw new Error(`Servicio "${name}" no registrado`);
    }

    // 4. Resolver dependencias
    const dependencies = definition.dependencies.map(dep => this.resolve(dep));

    // 5. Crear instancia según lifecycle
    let instance;
    
    if (typeof definition.factory === 'function') {
      // Es constructor o fábrica
      if (definition.factory.prototype && definition.factory.prototype.constructor) {
        // Constructor - usar new
        instance = new definition.factory(...dependencies);
      } else {
        // Fábrica - llamar función
        instance = definition.factory(this, ...dependencies);
      }
    } else {
      // Es valor literal
      instance = definition.factory;
    }

    // 6. Cachear si es singleton
    if (definition.lifecycle === 'singleton') {
      this._singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Verifica si un servicio está registrado.
   * 
   * @param {string} name - Nombre del servicio
   * @returns {boolean}
   */
  has(name) {
    return this._services.has(name) || 
           this._singletons.has(name) || 
           this._scoped.has(name) ||
           (this._parent?.has(name) || false);
  }

  /**
   * Crea un scope hijo.
   * Útil para request-specific dependencies.
   * 
   * @returns {DIContainer} Nuevo contenedor con este como padre
   */
  createScope() {
    return new DIContainer(this);
  }

  /**
   * Inyecta dependencias en un objeto existente.
   * Útil para migración de código legacy.
   * 
   * @param {Object} target - Objeto a inyectar
   * @param {Object.<string, string>} mapping - Mapa { prop: serviceName }
   * @returns {Object} El mismo objeto con dependencias inyectadas
   * 
   * @example
   * const myObj = {};
   * container.inject(myObj, {
   *   logger: 'logger',
   *   events: 'eventBus'
   * });
   * // myObj.logger y myObj.events ahora están disponibles
   */
  inject(target, mapping) {
    for (const [prop, serviceName] of Object.entries(mapping)) {
      Object.defineProperty(target, prop, {
        get: () => this.resolve(serviceName),
        enumerable: true,
        configurable: true
      });
    }
    return target;
  }

  /**
   * Construye un grafo de dependencias.
   * Útil para debugging y validación.
   * 
   * @returns {Object} Grafo de dependencias
   */
  getDependencyGraph() {
    const graph = {};
    
    for (const [name, def] of this._services) {
      graph[name] = {
        dependencies: def.dependencies,
        lifecycle: def.lifecycle,
        resolved: this._singletons.has(name)
      };
    }
    
    return graph;
  }

  /**
   * Detecta dependencias circulares.
   * 
   * @returns {string[][]} Array de ciclos encontrados
   */
  detectCircularDependencies() {
    const cycles = [];
    const visited = new Set();
    const path = [];

    const visit = (name) => {
      if (path.includes(name)) {
        const cycleStart = path.indexOf(name);
        cycles.push([...path.slice(cycleStart), name]);
        return;
      }

      if (visited.has(name)) return;

      const def = this._services.get(name);
      if (!def) return;

      visited.add(name);
      path.push(name);

      for (const dep of def.dependencies) {
        visit(dep);
      }

      path.pop();
    };

    for (const name of this._services.keys()) {
      visit(name);
    }

    return cycles;
  }

  /**
   * Limpia todas las instancias cacheadas.
   * Útil para testing.
   */
  clear() {
    this._singletons.clear();
    this._scoped.clear();
  }

  /**
   * Destruye el contenedor y libera recursos.
   */
  dispose() {
    // Llamar dispose en servicios si existe
    for (const instance of this._singletons.values()) {
      if (typeof instance.dispose === 'function') {
        instance.dispose();
      }
    }
    
    this.clear();
    this._services.clear();
  }
}

// Contenedor global de la aplicación
let globalContainer = null;

/**
 * Obtiene el contenedor DI global.
 * @returns {DIContainer}
 */
export function getContainer() {
  if (!globalContainer) {
    globalContainer = new DIContainer();
  }
  return globalContainer;
}

/**
 * Resetea el contenedor global.
 * Útil para testing.
 */
export function resetContainer() {
  globalContainer?.dispose();
  globalContainer = null;
}
