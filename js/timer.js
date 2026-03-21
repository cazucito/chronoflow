/**
 * @module timer
 * Motor del cronómetro — máquina de estados con precisión ±50ms/hora.
 * Responsabilidad única: cálculo y estado del tiempo.
 * NO manipula DOM. Emite eventos para ui.js.
 */

// Tipos de estado
const TimerState = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
};

const TimerMode = {
  STOPWATCH: 'STOPWATCH',
  TIMER: 'TIMER',
  POMODORO: 'POMODORO'
};

class Timer {
  constructor() {
    this.state = TimerState.IDLE;
    this.mode = TimerMode.STOPWATCH;
    this.accumulatedMs = 0;
    this.startTimestamp = 0;
    this.targetMs = 0;
    this.rafId = null;
  }

  /**
   * Inicia el cronómetro desde IDLE o PAUSED.
   * @emits timer:statechange { from, to }
   */
  start() {
    if (this.state === TimerState.IDLE || this.state === TimerState.PAUSED) {
      const fromState = this.state;
      this.startTimestamp = Date.now();
      this.state = TimerState.RUNNING;
      this._emit('timer:statechange', { from: fromState, to: this.state });
      this._tick();
    }
  }

  /**
   * Pausa el cronómetro en RUNNING.
   * @emits timer:statechange { from, to }
   */
  pause() {
    if (this.state === TimerState.RUNNING) {
      this.accumulatedMs += Date.now() - this.startTimestamp;
      this._cancelTick();
      this.state = TimerState.PAUSED;
      this._emit('timer:statechange', { from: TimerState.RUNNING, to: this.state });
    }
  }

  /**
   * Reanuda desde PAUSED (alias de start).
   */
  resume() {
    this.start();
  }

  /**
   * Resetea a estado IDLE.
   * @emits timer:statechange { from, to }
   */
  reset() {
    this._cancelTick();
    const fromState = this.state;
    this.accumulatedMs = 0;
    this.startTimestamp = 0;
    this.state = TimerState.IDLE;
    this._emit('timer:statechange', { from: fromState, to: this.state });
    this._emit('timer:tick', { elapsedMs: 0, displayMs: this.getDisplayMs() });
  }

  /**
   * Cambia modo de operación.
   * @param {TimerMode} mode — STOPWATCH, TIMER, POMODORO
   * @param {number} [targetMs] — tiempo objetivo para TIMER/POMODORO
   */
  setMode(mode, targetMs = 0) {
    this.mode = mode;
    this.targetMs = targetMs;
    if (this.state !== TimerState.IDLE) {
      this.reset();
    }
  }

  /**
   * Obtiene estado actual.
   * @returns {{ state: TimerState, elapsedMs: number, displayMs: number }}
   */
  getState() {
    let elapsedMs = this.accumulatedMs;
    if (this.state === TimerState.RUNNING) {
      elapsedMs += Date.now() - this.startTimestamp;
    }
    return {
      state: this.state,
      elapsedMs,
      displayMs: this.getDisplayMs(elapsedMs)
    };
  }

  /**
   * Calcula valor a mostrar según modo.
   * @param {number} [elapsedMs] — tiempo transcurrido
   * @returns {number} — milisegundos para mostrar
   */
  getDisplayMs(elapsedMs = this.accumulatedMs) {
    if (this.state === TimerState.RUNNING) {
      elapsedMs += Date.now() - this.startTimestamp;
    }
    
    if (this.mode === TimerMode.STOPWATCH) {
      return elapsedMs;
    }
    
    // RF-01.6: Nunca mostrar valores negativos
    return Math.max(0, this.targetMs - elapsedMs);
  }

  /**
   * Loop de actualización — requestAnimationFrame.
   * @private
   * @emits timer:tick { elapsedMs, displayMs }
   * @emits timer:complete { elapsedMs } — solo en modo TIMER/POMODORO
   */
  _tick() {
    if (this.state !== TimerState.RUNNING) return;

    const elapsedMs = this.accumulatedMs + (Date.now() - this.startTimestamp);
    const displayMs = this.mode === TimerMode.STOPWATCH 
      ? elapsedMs 
      : Math.max(0, this.targetMs - elapsedMs);

    this._emit('timer:tick', { elapsedMs, displayMs });

    // RF-02: Detectar finalización en modo countdown
    if (this.mode !== TimerMode.STOPWATCH && displayMs === 0 && elapsedMs >= this.targetMs) {
      this._complete(elapsedMs);
      return;
    }

    this.rafId = requestAnimationFrame(() => this._tick());
  }

  /**
   * Finaliza timer countdown.
   * @private
   * @emits timer:complete { elapsedMs }
   */
  _complete(elapsedMs) {
    this._cancelTick();
    const fromState = this.state;
    this.state = TimerState.COMPLETED;
    this.accumulatedMs = elapsedMs;
    this._emit('timer:statechange', { from: fromState, to: this.state });
    this._emit('timer:complete', { elapsedMs });
  }

  /**
   * Cancela RAF loop.
   * @private
   */
  _cancelTick() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Emite evento personalizado.
   * @private
   * @param {string} name — nombre del evento
   * @param {*} detail — datos del evento
   */
  _emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

// Exportar singleton
const timer = new Timer();

// Exportar para testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Timer, TimerState, TimerMode, timer };
}
