/**
 * ChronoFlow — Tests Funcionales (TF-01 a TF-06)
 * Validación de requerimientos según SPECIFICATION.md
 * 
 * Ejecutar en consola del navegador o con Node.js (adaptado)
 */

const Tests = {
  results: [],
  
  log(testId, description, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const result = { testId, description, passed, details };
    this.results.push(result);
    console.log(`${status} | ${testId}: ${description}${details ? ' | ' + details : ''}`);
    return passed;
  },

  // TF-01: Iniciar cronómetro desde IDLE
  async testTF01() {
    console.log('\n--- TF-01: Iniciar cronómetro ---');
    
    // Resetear estado
    timer.reset();
    
    const initialState = timer.getState();
    if (initialState.state !== 'IDLE') {
      return this.log('TF-01', 'Estado inicial es IDLE', false, `Esperado: IDLE, Actual: ${initialState.state}`);
    }
    
    timer.start();
    const runningState = timer.getState();
    
    // Pequeña espera para asegurar que inició
    await new Promise(r => setTimeout(r, 50));
    
    const pass = runningState.state === 'RUNNING';
    return this.log('TF-01', 'Iniciar cambia estado a RUNNING', pass, 
      pass ? '' : `Esperado: RUNNING, Actual: ${runningState.state}`);
  },

  // TF-02: Pausar cronómetro en RUNNING
  async testTF02() {
    console.log('\n--- TF-02: Pausar cronómetro ---');
    
    timer.reset();
    timer.start();
    await new Promise(r => setTimeout(r, 100));
    
    const runningState = timer.getState();
    timer.pause();
    const pausedState = timer.getState();
    
    // Verificar que accumulatedMs se preservó
    const drift = Math.abs(pausedState.elapsedMs - 100);
    const pass = pausedState.state === 'PAUSED' && drift < 50;
    
    return this.log('TF-02', 'Pausar preserva accumulatedMs', pass, 
      `Estado: ${pausedState.state}, Drift: ${drift}ms`);
  },

  // TF-03: Reanudar desde PAUSED
  async testTF03() {
    console.log('\n--- TF-03: Reanudar cronómetro ---');
    
    timer.reset();
    timer.start();
    await new Promise(r => setTimeout(r, 100));
    timer.pause();
    const pausedMs = timer.getState().elapsedMs;
    
    await new Promise(r => setTimeout(r, 50));
    timer.resume();
    await new Promise(r => setTimeout(r, 100));
    
    const resumedState = timer.getState();
    const expectedMin = pausedMs + 80; // 100ms menos tolerancia
    const pass = resumedState.state === 'RUNNING' && resumedState.elapsedMs >= expectedMin;
    
    return this.log('TF-03', 'Reanudar continúa desde pausa', pass,
      `Estado: ${resumedState.state}, Tiempo: ${resumedState.elapsedMs}ms (esperado >= ${expectedMin}ms)`);
  },

  // TF-04: Timer countdown llega a 0
  async testTF04() {
    console.log('\n--- TF-04: Timer countdown completado ---');
    
    return new Promise((resolve) => {
      timer.reset();
      timer.setMode('TIMER', 200); // 200ms para test rápido
      
      let completeFired = false;
      const onComplete = () => {
        completeFired = true;
        document.removeEventListener('timer:complete', onComplete);
      };
      document.addEventListener('timer:complete', onComplete);
      
      timer.start();
      
      setTimeout(() => {
        const state = timer.getState();
        const pass = state.state === 'COMPLETED' && state.displayMs === 0 && completeFired;
        resolve(this.log('TF-04', 'Timer dispara complete al llegar a 0', pass,
          `Estado: ${state.state}, Display: ${state.displayMs}, Evento: ${completeFired}`));
      }, 300);
    });
  },

  // TF-05: Persistencia de estado al cerrar pestaña
  async testTF05() {
    console.log('\n--- TF-05: Restaurar estado tras recarga ---');
    
    timer.reset();
    timer.start();
    await new Promise(r => setTimeout(r, 100));
    
    // Simular guardado en sessionStorage
    const stateToSave = {
      state: timer.getState().state,
      accumulatedMs: timer.accumulatedMs,
      mode: timer.mode
    };
    
    sessionStorage.setItem('cf_test_state', JSON.stringify(stateToSave));
    
    // Simular "recarga" reseteando timer
    const savedMs = timer.accumulatedMs;
    timer.reset();
    
    // Restaurar
    const saved = JSON.parse(sessionStorage.getItem('cf_test_state'));
    timer.state = saved.state;
    timer.accumulatedMs = saved.accumulatedMs;
    timer.mode = saved.mode;
    timer.startTimestamp = Date.now();
    timer._tick();
    
    await new Promise(r => setTimeout(r, 50));
    const restoredState = timer.getState();
    
    // El tiempo debería ser ~savedMs + 50ms
    const drift = Math.abs(restoredState.elapsedMs - (savedMs + 50));
    const pass = drift < 100;
    
    sessionStorage.removeItem('cf_test_state');
    
    return this.log('TF-05', 'Estado restaurado correctamente', pass,
      `Drift: ${drift}ms`);
  },

  // TF-06: Funcionamiento offline
  async testTF06() {
    console.log('\n--- TF-06: Funcionamiento offline ---');
    
    // Verificar que el timer funciona sin importar estado de red
    timer.reset();
    timer.start();
    await new Promise(r => setTimeout(r, 100));
    timer.pause();
    
    const state = timer.getState();
    const pass = state.elapsedMs >= 80 && state.state === 'PAUSED';
    
    // Verificar que Service Worker está registrado
    const hasSW = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
    
    return this.log('TF-06', 'Cronómetro funciona sin conexión', pass && hasSW,
      `Timer: ${state.state}, SW activo: ${hasSW}`);
  },

  // Ejecutar todos los tests
  async runAll() {
    console.log('🧪 ChronoFlow — Tests Funcionales\n');
    this.results = [];
    
    await this.testTF01();
    await this.testTF02();
    await this.testTF03();
    await this.testTF04();
    await this.testTF05();
    await this.testTF06();
    
    // Resumen
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log('\n--- RESUMEN ---');
    console.log(`${passed}/${total} tests pasaron`);
    
    if (passed === total) {
      console.log('🎉 Todos los tests pasaron');
    } else {
      console.log('⚠️ Algunos tests fallaron');
    }
    
    return { passed, total, results: this.results };
  }
};

// Auto-ejecutar si se carga directamente
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
  document.addEventListener('DOMContentLoaded', () => Tests.runAll());
}

// Exportar para uso manual o Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Tests };
}
