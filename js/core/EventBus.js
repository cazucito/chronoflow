/**
 * @fileoverview Bus de eventos centralizado tipo Pub/Sub.
 * Permite comunicación desacoplada entre componentes.
 * 
 * @module core/EventBus
 * @version 2.0.0
 * @see {@link https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern}
 */

/**
 * @typedef {Object} EventSubscription
 * @property {string} id - Identificador único de la suscripción
 * @property {string} event - Nombre del evento
 * @property {Function} handler - Función manejadora
 * @property {Object} [options] - Opciones de suscripción
 * @property {boolean} [options.once=false] - Ejecutar solo una vez
 * @property {number} [options.priority=0] - Prioridad (mayor = primero)
 */

/**
 * @typedef {Object} EventPayload
 * @property {string} type - Tipo de evento
 * @property {*} data - Datos del evento
 * @property {number} timestamp - Timestamp de emisión
 * @property {string} [source] - Origen del evento
 */

/**
 * Bus de eventos implementando patrón Publish/Subscribe.
 * 
 * Características:
 * - Suscripciones tipadas
 * - Priorización de handlers
 * - Middleware para transformación
 * - Métricas de rendimiento
 * - Debugging con historial
 * 
 * @class EventBus
 * @example
 * const bus = new EventBus();
 * 
 * // Suscribir
 * const unsub = bus.on('timer:tick', (data) => {
 *   console.log('Tick:', data.displayMs);
 * });
 * 
 * // Publicar
 * bus.emit('timer:tick', { displayMs: 1000 });
 * 
 * // Cancelar suscripción
 * unsub();
 */
export class EventBus {
  /**
   * @type {Map<string, Set<EventSubscription>>}
   * @private
   */
  _subscriptions = new Map();

  /**
   * @type {Map<string, Function>}
   * @private
   */
   _middleware = new Map();

  /**
   * @type {Array<EventPayload>}
   * @private
   */
  _history = [];

  /**
   * @type {Object}
   * @private
   */
  _metrics = {
    eventsEmitted: 0,
    eventsHandled: 0,
    errors: 0
  };

  /**
   * @type {boolean}
   * @private
   */
  _debug = false;

  /**
   * @type {number}
   * @private
   */
  _maxHistory = 100;

  /**
   * @param {Object} [options] - Opciones de configuración
   * @param {boolean} [options.debug=false] - Modo debug
   * @param {number} [options.maxHistory=100] - Tamaño máximo del historial
   */
  constructor(options = {}) {
    this._debug = options.debug || false;
    this._maxHistory = options.maxHistory || 100;
    
    if (this._debug) {
      console.log('[EventBus] Inicializado en modo debug');
    }
  }

  /**
   * Suscribe un handler a un evento.
   * 
   * @param {string} event - Nombre del evento (usa : para namespacing)
   * @param {Function} handler - Función a ejecutar
   * @param {Object} [options] - Opciones
   * @param {boolean} [options.once=false] - Ejecutar solo una vez
   * @param {number} [options.priority=0] - Prioridad del handler
   * @returns {Function} Función para cancelar suscripción
   * 
   * @example
   * // Suscripción simple
   * bus.on('timer:tick', console.log);
   * 
   * // Suscripción priorit
   * bus.on('timer:tick', highPriorityHandler, { priority: 10 });
   * 
   * // Suscripción única
   * bus.on('timer:completed', cleanup, { once: true });
   */
  on(event, handler, options = {}) {
    if (typeof event !== 'string' || !event) {
      throw new TypeError('Evento debe ser string no vacío');
    }
    
    if (typeof handler !== 'function') {
      throw new TypeError('Handler debe ser función');
    }

    const subscription = {
      id: this._generateId(),
      event,
      handler,
      options: {
        once: options.once || false,
        priority: options.priority || 0
      }
    };

    if (!this._subscriptions.has(event)) {
      this._subscriptions.set(event, new Set());
    }

    this._subscriptions.get(event).add(subscription);
    
    // Ordenar por prioridad
    this._sortSubscriptions(event);

    if (this._debug) {
      console.log(`[EventBus] Suscrito a "${event}" (${subscription.id})`);
    }

    // Retornar función de unsuscribe
    return () => this.off(event, subscription.id);
  }

  /**
   * Suscribe un handler que se ejecuta una sola vez.
   * 
   * @param {string} event - Nombre del evento
   * @param {Function} handler - Función a ejecutar
   * @param {Object} [options] - Opciones adicionales
   * @returns {Function} Función para cancelar
   */
  once(event, handler, options = {}) {
    return this.on(event, handler, { ...options, once: true });
  }

  /**
   * Cancela una suscripción.
   * 
   * @param {string} event - Nombre del evento
   * @param {string} [subscriptionId] - ID específico (si no se provee, remueve todos)
   * @returns {boolean} True si se removió algo
   */
  off(event, subscriptionId) {
    const subs = this._subscriptions.get(event);
    if (!subs) return false;

    if (subscriptionId) {
      const sub = Array.from(subs).find(s => s.id === subscriptionId);
      if (sub) {
        subs.delete(sub);
        if (this._debug) {
          console.log(`[EventBus] Desuscrito "${event}" (${subscriptionId})`);
        }
        return true;
      }
    } else {
      const count = subs.size;
      subs.clear();
      if (this._debug) {
        console.log(`[EventBus] Desuscritos todos de "${event}" (${count})`);
      }
      return count > 0;
    }

    return false;
  }

  /**
   * Emite un evento a todos los suscriptores.
   * 
   * @param {string} event - Nombre del evento
   * @param {*} [data] - Datos a pasar a los handlers
   * @param {Object} [options] - Opciones de emisión
   * @param {boolean} [options.async=false] - Ejecutar handlers asíncronamente
   * @param {string} [options.source] - Origen del evento
   * @returns {Promise<Array>} Resultados de los handlers
   * 
   * @example
   * // Emisión síncrona
   * bus.emit('timer:tick', { displayMs: 1000 });
   * 
   * // Emisión asíncrona
   * await bus.emit('timer:completed', data, { async: true });
   */
  emit(event, data, options = {}) {
    const subs = this._subscriptions.get(event);
    
    const payload = {
      type: event,
      data,
      timestamp: Date.now(),
      source: options.source || 'unknown'
    };

    // Guardar en historial
    this._addToHistory(payload);
    
    this._metrics.eventsEmitted++;

    if (this._debug) {
      console.log(`[EventBus] Emitiendo "${event}":`, data);
    }

    if (!subs || subs.size === 0) {
      return Promise.resolve([]);
    }

    const results = [];
    const toRemove = [];

    for (const sub of subs) {
      try {
        // Aplicar middleware
        const transformedData = this._applyMiddleware(event, payload.data);
        
        let result;
        if (options.async) {
          result = Promise.resolve(sub.handler(transformedData, payload));
        } else {
          result = sub.handler(transformedData, payload);
        }
        
        results.push(result);
        this._metrics.eventsHandled++;

        // Marcar para remover si es once
        if (sub.options.once) {
          toRemove.push(sub);
        }
      } catch (error) {
        this._metrics.errors++;
        console.error(`[EventBus] Error en handler de "${event}":`, error);
        this.emit('eventbus:error', { event, error, handler: sub.id });
      }
    }

    // Remover suscripciones once
    toRemove.forEach(sub => subs.delete(sub));

    return options.async ? Promise.all(results) : results;
  }

  /**
   * Emite un evento asíncronamente (sin bloquear).
   * 
   * @param {string} event - Nombre del evento
   * @param {*} [data] - Datos a pasar
   * @returns {void}
   */
  emitAsync(event, data) {
    setTimeout(() => this.emit(event, data), 0);
  }

  /**
   * Registra middleware para un evento.
   * 
   * @param {string} event - Nombre del evento
   * @param {Function} middleware - Función transformadora (data) => newData
   */
  use(event, middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware debe ser función');
    }
    this._middleware.set(event, middleware);
  }

  /**
   * Obtiene el historial de eventos.
   * 
   * @param {Object} [filter] - Filtros
   * @param {string} [filter.event] - Filtrar por tipo de evento
   * @param {number} [filter.limit] - Límite de resultados
   * @returns {Array<EventPayload>} Historial filtrado
   */
  getHistory(filter = {}) {
    let history = [...this._history];
    
    if (filter.event) {
      history = history.filter(h => h.type === filter.event);
    }
    
    if (filter.limit) {
      history = history.slice(-filter.limit);
    }
    
    return history;
  }

  /**
   * Obtiene métricas del bus de eventos.
   * 
   * @returns {Object} Métricas
   */
  getMetrics() {
    return {
      ...this._metrics,
      subscriptions: this._getSubscriptionCount(),
      historySize: this._history.length
    };
  }

  /**
   * Limpia todas las suscripciones y estado.
   */
  clear() {
    this._subscriptions.clear();
    this._middleware.clear();
    this._history = [];
    Object.keys(this._metrics).forEach(k => this._metrics[k] = 0);
  }

  /**
   * @private
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * @private
   */
  _sortSubscriptions(event) {
    const subs = this._subscriptions.get(event);
    if (!subs) return;
    
    const sorted = Array.from(subs).sort((a, b) => 
      b.options.priority - a.options.priority
    );
    
    this._subscriptions.set(event, new Set(sorted));
  }

  /**
   * @private
   */
  _applyMiddleware(event, data) {
    const middleware = this._middleware.get(event);
    return middleware ? middleware(data) : data;
  }

  /**
   * @private
   */
  _addToHistory(payload) {
    this._history.push(payload);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
  }

  /**
   * @private
   */
  _getSubscriptionCount() {
    let count = 0;
    for (const subs of this._subscriptions.values()) {
      count += subs.size;
    }
    return count;
  }
}

// Singleton para la aplicación
let globalBus = null;

/**
 * Obtiene la instancia global del EventBus.
 * @param {Object} [options] - Opciones (solo en primera llamada)
 * @returns {EventBus}
 */
export function getEventBus(options) {
  if (!globalBus) {
    globalBus = new EventBus(options);
  }
  return globalBus;
}

/**
 * Resetea la instancia global (útil para testing).
 */
export function resetEventBus() {
  globalBus = null;
}
