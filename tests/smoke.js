/**
 * ChronoFlow — Smoke tests del runtime actual.
 * Ejecutar en la consola del navegador con la app cargada.
 */

const SmokeTests = {
  results: [],

  log(testId, description, passed, details = '') {
    const result = { testId, description, passed, details };
    this.results.push(result);
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${testId}: ${description}${details ? ` | ${details}` : ''}`);
    return passed;
  },

  async testTimerStateFlow() {
    timer.reset();

    const initial = timer.getState();
    timer.start();
    await this.wait(60);
    timer.pause();
    const paused = timer.getState();
    timer.reset();
    const reset = timer.getState();

    const pass =
      initial.state === 'IDLE' &&
      paused.state === 'PAUSED' &&
      paused.elapsedMs > 0 &&
      reset.state === 'IDLE' &&
      reset.displayMs === 0;

    return this.log(
      'SM-01',
      'Timer inicia, pausa y resetea en la ruta activa',
      pass,
      `initial=${initial.state}, paused=${paused.state}, reset=${reset.state}`
    );
  },

  async testWallClockLabelBinding() {
    const input = document.getElementById('timer-label');
    const label = document.getElementById('wallclock-label');

    if (!input || !label) {
      return this.log('SM-02', 'Binding de label disponible', false, 'Faltan elementos DOM');
    }

    input.value = 'Smoke label';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const pass = label.textContent === 'Smoke label';
    return this.log('SM-02', 'El label del wall clock refleja el input activo', pass);
  },

  async testTimezoneSelectorsPresent() {
    const primary = document.getElementById('timezone-primary');
    const secondary = document.getElementById('timezone-secondary');

    const pass =
      Boolean(primary) &&
      Boolean(secondary) &&
      primary.options.length >= 6 &&
      secondary.options.length >= 6;

    return this.log('SM-03', 'Los selectores de zona horaria están presentes', pass);
  },

  async testCountdownCompletion() {
    return new Promise((resolve) => {
      const minInput = document.getElementById('timer-min');
      const secInput = document.getElementById('timer-sec');

      if (!minInput || !secInput) {
        resolve(this.log('SM-04', 'Countdown completo emite estado esperado', false, 'Faltan inputs'));
        return;
      }

      const onComplete = () => {
        document.removeEventListener('timer:complete', onComplete);
        const state = timer.getState();
        timer.reset();
        resolve(
          this.log(
            'SM-04',
            'Countdown completa en la ruta activa',
            state.state === 'COMPLETED' && state.displayMs === 0,
            `state=${state.state}, displayMs=${state.displayMs}`
          )
        );
      };

      document.addEventListener('timer:complete', onComplete, { once: true });

      timer.reset();
      minInput.value = '0';
      secInput.value = '1';
      timer.targetMs = 1000;
      timer.start();
    });
  },

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async runAll() {
    console.log('ChronoFlow smoke tests');
    this.results = [];

    await this.testTimerStateFlow();
    await this.testWallClockLabelBinding();
    await this.testTimezoneSelectorsPresent();
    await this.testCountdownCompletion();

    const passed = this.results.filter((result) => result.passed).length;
    const total = this.results.length;
    console.log(`Resultado: ${passed}/${total}`);
    return { passed, total, results: this.results };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SmokeTests };
}
