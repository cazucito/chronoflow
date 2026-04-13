# AGENTS.md — ChronoFlow

## Contrato de Comportamiento para Agentes IA

Este archivo define las reglas que **cualquier agente IA** (Claude, GPT, Gemini, etc.) debe seguir al trabajar en este repositorio. Es un contrato, no una sugerencia.

---

## 1. Orden de Lectura Obligatorio

Antes de cualquier acción, leer en este orden:

1. `SPECIFICATION.md` — **SIEMPRE** primero. Es el contrato de lo que se construye.
2. `docs/METHODOLOGY.md` — Entender el proceso SDD antes de implementar.
3. `README.md` — Estado actual del proyecto.
4. `docs/TODO.md` — Qué está en curso y qué sigue.
5. `docs/DECISIONS.md` — Decisiones arquitectónicas ya tomadas (no reabrir sin justificación).

**Regla**: Si no has leído la spec completa, no escribas código.

---

## 2. Reglas de Implementación SDD

### 2.1 Trazabilidad obligatoria
Cada función, clase o bloque de código significativo debe referenciar el requerimiento que implementa:

```javascript
// RF-01.2: Pausar cronómetro — RUNNING → PAUSED, preservar accumulatedMs
function pauseTimer() { ... }

// RNF-03: Offline — cachear todos los assets estáticos
self.addEventListener('install', (event) => { ... });
```

### 2.2 Prohibiciones absolutas
- **Nunca** implementar features no documentadas en `SPECIFICATION.md`
- **Nunca** modificar la API pública de un módulo sin actualizar §5 de la spec
- **Nunca** silenciar errores sin al menos emitir un evento o log estructurado
- **Nunca** usar frameworks JS (React, Vue, etc.) — ver ADR-001 en `docs/DECISIONS.md`
- **Nunca** hacer llamadas a APIs externas — todo es offline-first

### 2.3 Obligaciones
- **Siempre** actualizar `docs/CHANGELOG.md` en el mismo commit que código nuevo
- **Siempre** respetar los contratos de módulos definidos en §5 de la spec
- **Siempre** preguntar al usuario antes de agregar algo no especificado
- **Siempre** mantener la máquina de estados del §4 de la spec como fuente de verdad

---

## 3. Protocolo para Casos No Cubiertos

Si durante la implementación encuentras un caso no cubierto por la spec:

```
1. DETENTE — no implementes soluciones ad-hoc
2. DOCUMENTA — describe el caso y las opciones posibles
3. PROPÓN — sugiere actualizar la spec con el nuevo caso
4. ESPERA — no avances hasta confirmar con el usuario
```

**Ejemplo de respuesta correcta**:
> "El RF-03.3 (Pomodoro) no especifica qué pasa si el usuario pausa durante el descanso automático. Propongo agregar RF-03.3.1: **Given** modo POMODORO en fase BREAK, **When** usuario pausa, **Then** el descanso se congela y puede reanudarse. ¿Confirmas para actualizar la spec?"

---

## 4. Estructura de Commits

Los commits deben ser trazables a la spec:

```
[Fase X][RF-XX.Y]: Descripción breve del cambio

- Implementa RF-XX.Y: descripción
- Tests para RF-XX.Y: descripción del test
- Actualiza CHANGELOG.md con entrada v1.x.y
```

**Ejemplos válidos**:
```
[Fase 1][RF-01.1]: Implement stopwatch start with RAF loop

- Implementa RF-01.1: iniciar cronómetro con requestAnimationFrame
- Tests TF-01: verifica transición IDLE → RUNNING
- Actualiza CHANGELOG.md

[Fase 2][RF-02.1]: Add Web Audio API alert on timer complete

- Implementa RF-02.1: tono 440Hz, 1 segundo al llegar a 0
- Respeta RNF-05: sin dependencias externas de audio
```

**Ejemplos inválidos**:
```
fix bug                        ← sin trazabilidad
add stuff                      ← sin trazabilidad
implement timer (no RF ref)    ← sin trazabilidad
```

---

## 5. Reglas por Módulo

### `timer.js`
- Responsabilidad única: cálculo de tiempo y máquina de estados
- **NO** manipular DOM directamente
- **NO** llamar a `storage.js` o `notifications.js` directamente
- Comunicarse con otros módulos **únicamente** mediante `CustomEvent` en `document`

### `ui.js`
- Responsabilidad única: actualizar DOM
- **NO** contener lógica de negocio
- **NO** calcular tiempo ni estados
- Solo escuchar eventos de `timer.js` y renderizar

### `storage.js`
- Capturar **siempre** `QuotaExceededError`
- Emitir `storage:quota_exceeded` en `document` si ocurre
- Nunca lanzar excepciones no capturadas al caller

### `notifications.js`
- Verificar permiso antes de cada `showNotification`
- Si permiso = 'denied': no solicitar de nuevo, solo ocultar UI de notificaciones
- Proveer fallback visual si audio/notificaciones no están disponibles

### `sw.js`
- Cache-First para assets estáticos (`/css/**`, `/js/**`, `/assets/**`)
- Network-First para `index.html` (garantizar actualizaciones)
- Versionar el cache name: `cf-cache-v1`, `cf-cache-v2`, etc.

---

## 6. Gestión de Estado

La máquina de estados del §4 de la spec es el árbitro de toda lógica:

```javascript
// CORRECTO: transición explícita según spec §4.2
function handlePause() {
  if (timerState !== 'RUNNING') return; // guard de transición
  accumulatedMs += Date.now() - startTimestamp;
  timerState = 'PAUSED';
  cancelAnimationFrame(rafId);
  document.dispatchEvent(new CustomEvent('timer:statechange', {
    detail: { from: 'RUNNING', to: 'PAUSED' }
  }));
}

// INCORRECTO: transición sin guardia, rompe invariantes
function handlePause() {
  timerRunning = false; // ← no usa la máquina de estados
}
```

---

## 7. Stack Autorizado

Solo usar tecnologías listadas en §4.1 de la spec:

| Tecnología | Uso autorizado |
|------------|----------------|
| Vanilla JS (ES2020+) | Toda la lógica de la app |
| CSS3 + Custom Properties | Todos los estilos |
| Service Worker API | Cache + Push offline |
| Web Audio API | Sonidos de alerta |
| Push API + Notifications API | Notificaciones background |
| localStorage | Preferencias y presets |
| IndexedDB | Historial de sesiones |

**No autorizado** sin actualizar la spec y `docs/DECISIONS.md`:
- Cualquier framework JS (React, Vue, Svelte, etc.)
- npm packages / node_modules
- CDNs externos
- Cualquier backend o API externa

---

## 8. Testing

Antes de marcar cualquier RF como implementado:

```
- [ ] Test funcional (TF-XX) pasa según spec §10.1
- [ ] No hay errores en consola del navegador
- [ ] Comportamiento correcto en Chrome, Firefox, Safari
- [ ] Lighthouse score no decrementó respecto al baseline
```

Para RF de accesibilidad:
```
- [ ] Navegación con teclado funciona
- [ ] axe-core no reporta violaciones WCAG AA
- [ ] Touch targets ≥ 44×44px
```

---

## 9. Decisiones Ya Tomadas (No Reabrir)

Ver `docs/DECISIONS.md` para el razonamiento completo de:

| Decisión | Veredicto |
|----------|-----------|
| Framework JS | Vanilla JS — no frameworks |
| Backend | Ninguno — offline-first con localStorage/IndexedDB |
| Distribución | PWA — no apps nativas |
| Analytics | Ninguno — privacidad total |
| Dependencias externas | Ninguna |

Para proponer un cambio a cualquiera de estas decisiones:
1. Abrir discusión con el usuario
2. Si se aprueba, crear nuevo ADR en `docs/DECISIONS.md`
3. Actualizar spec si el cambio afecta RFs o RNFs
4. Solo entonces implementar

---

## 10. Responsabilidades Explícitas del Agente

| Situación | Acción requerida |
|-----------|-----------------|
| Feature solicitada no está en spec | Proponer actualizar spec primero |
| Bug que requiere cambiar interfaz de módulo | Actualizar §5 de spec en el mismo commit |
| Caso borde no cubierto | Documentar y esperar confirmación |
| RNF de performance en riesgo | Alertar antes de continuar, proponer solución |
| Conflicto entre RFs | Escalar al usuario, no resolver silenciosamente |
| Necesidad de dependencia externa | Proponer ADR, esperar aprobación |
