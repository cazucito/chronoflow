/**
 * @fileoverview Plugin del motor del cronómetro.
 * Implementa máquina de estados finitos con precisión garantizada.
 * 
 * @module plugins/TimerPlugin
 * @version 2.0.0
 * @extends BasePlugin
 */

import { BasePlugin, onEvent } from '../core/PluginInterface.js';

/**
 * Estados posibles del timer.
 * @readonly
 * @enum {string}
 */
export const TimerState = Object.freeze({
  /** Estado inicial, timer listo pero no iniciado */
  IDLE: 'IDLE',
  /** Timer corriendo, tiempo incrementando */
  RUNNING: 'RUNNING',
  /** Timer pausado, tiempo congelado */
  PAUSED: 'PAUSED',
  /** Countdown completado, esperando reset */
  COMPLETED: 'COMPLETED'
});

/**
 * Modos de operación del timer.
 * @readonly
 * @enum {string}
 */
export const TimerMode = Object.freeze({
  /** Cronómetro ascendente sin límite */
  STOPWATCH: 'STOPWATCH',
  /** Cuenta regresiva con tiempo objetivo */
  TIMER: 'TIMER',
  /** Ciclos de trabajo/descanso */
  POMODORO: 'POMODORO'
});

/**
 * @typedef {Object} TimerStateSnapshot
 * @property {TimerState} state - Estado actual
 * @property {TimerMode} mode - Modo de operación
 * @property {number} elapsedMs - Tiempo transcurrido total
 * @property {number} displayMs - Tiempo a mostrar (diferente en countdown)
 * @property {number} targetMs - Tiempo objetivo (para countdown)
 * @property {number} timestamp - Timestamp del snapshot
 */

/**
 * @typedef {Object} TimerConfig
 * @property {number} [tickInterval=16] - Intervalo mínimo entre ticks (ms)
 * @property {boolean} [highPrecision=false] - Usar performance.now() en lugar de Date.now()
 * @property {boolean} [allowNegative=false] - Permitir valores negativos en countdown
 */

/**
 * Plugin principal del motor de tiempo.
 * 
 * Responsabilidades:
 * - Gestión de estado del timer (máquina de estados)
 * - Cálculo de tiempo con precisión garantizada
 * - Emisión de eventos de cambio de estado
 * - Soporte para múltiples modos (stopwatch, countdown)
 * 
 * @class TimerPlugin
 * @extends BasePlugin
 * 
 * @example
 * // Crear e inicializar
 * const timer = new TimerPlugin({ eventBus, logger });
 * await timer.init();
 * 
 * // Usar
 * timer.start();
 * timer.pause();
 * timer.resume();
 * timer.reset();
 * 
 * // Cambiar modo
 * timer.setMode(TimerMode.TIMER, 5 * 60 * 1000); // 5 minutos
 */
export class TimerPlugin extends BasePlugin {
  /** @type {string} */
  static name = 'TimerPlugin';
  
  /** @type {string} */
  static version = '2.0.0';
  
  /** @type {string[]} */
  static dependencies = ['EventBus', 'Logger'];
  
  /** @type {boolean} */
  static critical = true;

  /**
   * Estado actual del timer.
   * @type {TimerState}
   * @private
   */
  _state = TimerState.IDLE;

  /**
   * Modo de operación actual.
   * @type {TimerMode}
   * @private
   */
  _mode = TimerMode.STOPWATCH;

  /**
   * Tiempo acumulado en pausas anteriores.
   * @type {number}
   * @private
   */
  _accumulatedMs = 0;

  /**
   * Timestamp cuando se inició el timer actual.
   * @type {number}
   * @private
   */
  _startTimestamp = 0;

  /**
   * Tiempo objetivo para countdown (ms).
   * @type {number}
   * @private
   */
  _targetMs = 0;

  /**
   * ID del requestAnimationFrame.
   * @type {number|null}
   * @private
   */
  _rafId = null;

  /**
   * Configuración del timer.
   * @type {TimerConfig}
   * @private
   */
  _config = {
    tickInterval: 16,
    highPrecision: false,
    allowNegative: false
  };

  /**
   * Historial de estados (para debugging).
   * @type {Array<{state: TimerState, timestamp: number}>}
   * @private
   */
  _stateHistory = [];

  /**
   * Métricas de rendimiento.
   * @type {Object}
   * @private
   */
  _metrics = {
    ticks: 0,
    stateChanges: 0,
    totalRunTime: 0
  };

  /**
   * @param {Object} deps - Dependencias inyectadas
   * @param {IEventBus} deps.eventBus - Bus de eventos
   * @param {ILogger} deps.logger - Logger
   * @param {Object} [deps.config] - Configuración
   */
  constructor(deps) {
    super(deps);
    
    this._config = { ...this._config, ...deps.config?.timer };
    
    this._logger.info(`[${this.name}] Constructor. Config:`, this._config);
  }

  /**
   * Inicializa el plugin.
   * @async
   */
  async init() {
    await super.init();
    
    // Restaurar estado previo si existe
    const savedState = await this._storage?.get('timer:state');
    if (savedState) {
      this._restoreState(savedState);
    }
    
    this._logger.info(`[${this.name}] Inicializado en modo ${this._mode}`);
  }

  /**
   * Inicia el timer.
   * 
   * Transiciones válidas:
   * - IDLE → RUNNING
   * - PAUSED → RUNNING
   * 
   * @throws {Error} Si el estado actual no permite iniciar
   * 
   * @example
   * timer.start(); // Inicia desde IDLE
   * timer.pause();
   * timer.start(); // Reanuda desde PAUSED (alias de resume)
   */
  start() {
    const validStates = [TimerState.IDLE, TimerState.PAUSED];
    
    if (!validStates.includes(this._state)) {
      throw new Error(
        `No se puede iniciar desde estado "${this._state}". ` +
        `Estados válidos: ${validStates.join(', ')}`
      );
    }

    const fromState = this._state;
    
    // Iniciar timing
    this._startTimestamp = this._getTimestamp();
    this._state = TimerState.RUNNING;
    
    // Iniciar loop
    this._tick();
    
    this._recordStateChange(fromState, this._state);
    this._emitStateChange(fromState, this._state);
    
    this._logger.debug(`[${this.name}] ${fromState} → RUNNING`);
  }

  /**
   * Pausa el timer.
   * 
   * Transición: RUNNING → PAUSED
   * 
   * @throws {Error} Si no está en estado RUNNING
   */
  pause() {
    if (this._state !== TimerState.RUNNING) {
      throw new Error(`No se puede pausar desde estado "${this._state}"`);
    }

    // Calcular tiempo transcurrido en esta sesión
    const sessionTime = this._getTimestamp() - this._startTimestamp;
    this._accumulatedMs += sessionTime;
    
    // Detener loop
    this._cancelTick();
    
    const fromState = this._state;
    this._state = TimerState.PAUSED;
    
    this._recordStateChange(fromState, this._state);
    this._emitStateChange(fromState, this._state);
    
    this._logger.debug(`[${this.name}] RUNNING → PAUSED. Accumulated: ${this._accumulatedMs}ms`);
  }

  /**
   * Reanuda el timer desde pausa.
   * Alias de start() para claridad semántica.
   */
  resume() {
    if (this._state !== TimerState.PAUSED) {
      throw new Error(`No se puede reanudar desde estado "${this._state}"`);
    }
    this.start();
  }

  /**
   * Resetea el timer a estado inicial.
   * 
   * Válido desde cualquier estado.
   * Limpia tiempo acumulado y vuelve a IDLE.
   */
  reset() {
    const fromState = this._state;
    
    // Detener loop si está corriendo
    this._cancelTick();
    
    // Calcular tiempo total de ejecución
    if (fromState === TimerState.RUNNING) {
      const sessionTime = this._getTimestamp() - this._startTimestamp;
      this._metrics.totalRunTime += this._accumulatedMs + sessionTime;
    } else {
      this._metrics.totalRunTime += this._accumulatedMs;
    }
    
    // Resetear estado
    this._accumulatedMs = 0;
    this._startTimestamp = 0;
    this._state = TimerState.IDLE;
    
    this._recordStateChange(fromState, this._state);
    this._emitStateChange(fromState, this._state);
    
    // Emitir tick con valores en cero
    this._emitTick({
      elapsedMs: 0,
      displayMs: this.getDisplayMs(0)
    });
    
    this._logger.debug(`[${this.name}] ${fromState} → IDLE (reset)`);
  }

  /**
   * Cambia el modo de operación.
   * 
   * @param {TimerMode} mode - Nuevo modo
   * @param {number} [targetMs=0] - Tiempo objetivo para countdown
   * 
   * @example
   * // Modo cronómetro
   * timer.setMode(TimerMode.STOPWATCH);
   * 
   * // Modo countdown 5 minutos
   * timer.setMode(TimerMode.TIMER, 5 * 60 * 1000);
   */
  setMode(mode, targetMs = 0) {
    if (!Object.values(TimerMode).includes(mode)) {
      throw new TypeError(`Modo inválido: "${mode}"`);
    }

    const oldMode = this._mode;
    this._mode = mode;
    this._targetMs = Math.max(0, targetMs);
    
    // Resetear si cambiamos de modo
    if (this._state !== TimerState.IDLE) {
      this.reset();
    }
    
    this._eventBus?.emit('timer:modeChanged', {
      from: oldMode,
      to: mode,
      targetMs: this._targetMs
    });
    
    this._logger.info(`[${this.name}] Modo cambiado: ${oldMode} → ${mode}`);
  }

  /**
   * Obtiene snapshot completo del estado.
   * @returns {TimerStateSnapshot}
   */
  getState() {
    const elapsedMs = this._calculateElapsedMs();
    
    return {
      state: this._state,
      mode: this._mode,
      elapsedMs,
      displayMs: this.getDisplayMs(elapsedMs),
      targetMs: this._targetMs,
      timestamp: Date.now()
    };
  }

  /**
   * Calcula tiempo a mostrar en display.
   * 
   * - Stopwatch: tiempo transcurrido
   * - Timer/Pomodoro: tiempo restante (nunca negativo)
   * 
   * @param {number} [elapsedMs] - Tiempo transcurrido (calcula si no se provee)
   * @returns {number} Milisegundos para mostrar
   */
  getDisplayMs(elapsedMs = this._calculateElapsedMs()) {
    if (this._mode === TimerMode.STOPWATCH) {
      return elapsedMs;
    }
    
    // Modos countdown: mostrar tiempo restante
    const remaining = this._targetMs - elapsedMs;
    return this._config.allowNegative ? remaining : Math.max(0, remaining);
  }

  /**
   * Verifica si el timer está corriendo.
   * @returns {boolean}
   */
  get isRunning() {
    return this._state === TimerState.RUNNING;
  }

  /**
   * Obtiene métricas de rendimiento.
   * @returns {Object}
   */
  getMetrics() {
    return {
      ...this._metrics,
      currentState: this._state,
      stateHistoryLength: this._stateHistory.length
    };
  }

  /**
   * Loop principal de actualización.
   * Usa requestAnimationFrame para precisión visual.
   * @private
   */
  _tick() {
    if (this._state !== TimerState.RUNNING) return;

    const elapsedMs = this._calculateElapsedMs();
    const displayMs = this.getDisplayMs(elapsedMs);

    this._emitTick({ elapsedMs, displayMs });

    // Detectar finalización en modos countdown
    if (this._mode !== TimerMode.STOPWATCH && displayMs === 0) {
      this._complete(elapsedMs);
      return;
    }

    // Continuar loop
    this._rafId = requestAnimationFrame(() => this._tick());
    this._metrics.ticks++;
  }

  /**
   * Marca el timer como completado.
   * @private
   */
  _complete(elapsedMs) {
    this._cancelTick();
    
    const fromState = this._state;
    this._state = TimerState.COMPLETED;
    this._accumulatedMs = elapsedMs;
    
    this._recordStateChange(fromState, this._state);
    this._emitStateChange(fromState, this._state);
    
    this._eventBus?.emit('timer:completed', {
      elapsedMs,
      mode: this._mode,
      targetMs: this._targetMs
    });
    
    this._logger.info(`[${this.name}] Completado: ${elapsedMs}ms`);
  }

  /**
   * Calcula tiempo transcurrido total.
   * @private
   */
  _calculateElapsedMs() {
    let elapsed = this._accumulatedMs;
    
    if (this._state === TimerState.RUNNING) {
      elapsed += this._getTimestamp() - this._startTimestamp;
    }
    
    return elapsed;
  }

  /**
   * Obtiene timestamp actual.
   * @private
   */
  _getTimestamp() {
    return this._config.highPrecision 
      ? performance.now() 
      : Date.now();
  }

  /**
   * Cancela el RAF loop.
   * @private
   */
  _cancelTick() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Emite evento de cambio de estado.
   * @private
   */
  _emitStateChange(from, to) {
    this._eventBus?.emit('timer:stateChanged', {
      from,
      to,
      timestamp: Date.now(),
      elapsedMs: this._accumulatedMs
    });
  }

  /**
   * Emite evento de tick.
   * @private
   */
  _emitTick(data) {
    this._eventBus?.emit('timer:tick', {
      ...data,
      timestamp: Date.now()
    });
  }

  /**
   * Registra cambio de estado en historial.
   * @private
   */
  _recordStateChange(from, to) {
    this._stateHistory.push({
      from,
      to,
      timestamp: Date.now()
    });
    this._metrics.stateChanges++;
    
    // Limitar historial
    if (this._stateHistory.length > 100) {
      this._stateHistory.shift();
    }
  }

  /**
   * Restaura estado desde persistencia.
   * @private
   */
  _restoreState(savedState) {
    // Solo restaurar si no pasó mucho tiempo (opcional)
    const maxRestoreTime = 5 * 60 * 1000; // 5 minutos
    const timeSinceSave = Date.now() - savedState.timestamp;
    
    if (timeSinceSave > maxRestoreTime) {
      this._logger.warn(`[${this.name}] Estado guardado muy antiguo, ignorando`);
      return;
    }
    
    this._mode = savedState.mode;
    this._targetMs = savedState.targetMs;
    
    this._logger.info(`[${this.name}] Estado restaurado: ${this._mode}`);
  }

  /**
   * Guarda estado actual en persistencia.
   * @private
   */
  async _persistState() {
    const state = this.getState();
    await this._storage?.set('timer:state', state);
  }

  /**
   * Limpieza al destruir el plugin.
   */
  destroy() {
    this._cancelTick();
    this._persistState();
    this._stateHistory = [];
    super.destroy();
  }
}

export default TimerPlugin;
