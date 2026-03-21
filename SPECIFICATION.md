# Especificación: ChronoFlow

## Documento de Especificación (SDD)
**Versión**: 1.2
**Fecha**: 2026-03-21
**Estado**: Aprobado
**Rama**: main

---

## 1. Visión y Propósito

### 1.1 Resumen Ejecutivo
ChronoFlow es un cronómetro web progresivo (PWA) diseñado para marcar tiempos de actividades sin fricción. Prioriza simplicidad, velocidad de acceso y funcionamiento offline.

### 1.2 Propósito del Proyecto (Meta-SDD)
Este proyecto documenta y establece un **proceso metodológico de Specification-Driven Development (SDD) en la era de la IA**. El sistema es el vehículo, la metodología es el objetivo principal.

### 1.3 Filosofía de Diseño
- **Cero fricción**: Abrir y usar inmediatamente
- **Offline-first**: Funciona sin conexión
- **Mobile-native feel**: Comportamiento de app nativa
- **Elegante pero simple**: Sin características innecesarias

---

## 2. Requerimientos Funcionales

### RF-01: Cronómetro Principal
**Prioridad**: Alta | **Estado**: Required

| ID | Descripción | Criterio de Aceptación (Given/When/Then) |
|----|-------------|------------------------------------------|
| RF-01.1 | Iniciar cronómetro | **Given** timer en estado IDLE, **When** usuario presiona "Iniciar", **Then** estado cambia a RUNNING y el contador incrementa cada 10ms |
| RF-01.2 | Pausar cronómetro | **Given** timer en estado RUNNING, **When** usuario presiona "Pausar", **Then** estado cambia a PAUSED, contador se congela, `accumulatedMs` preserva valor |
| RF-01.3 | Reanudar cronómetro | **Given** timer en estado PAUSED, **When** usuario presiona "Reanudar", **Then** estado cambia a RUNNING, contador continúa desde `accumulatedMs` |
| RF-01.4 | Detener/Reset | **Given** timer en estado RUNNING o PAUSED, **When** usuario presiona "Reset", **Then** estado cambia a IDLE, display muestra 00:00:00.00, `accumulatedMs = 0` |
| RF-01.5 | Visualización | **Given** timer en cualquier estado, **Then** display muestra formato `HH:MM:SS.cc` (centésimas), con fuente ≥ 48px en mobile |
| RF-01.6 | Precisión | **Given** cronómetro corriendo 1 hora, **Then** drift máximo ≤ ±50ms medido contra `Date.now()` |

### RF-02: Notificaciones y Alertas
**Prioridad**: Alta | **Estado**: Required

| ID | Descripción | Criterio de Aceptación (Given/When/Then) |
|----|-------------|------------------------------------------|
| RF-02.1 | Sonido de alerta | **Given** timer countdown llega a 0, **When** `soundEnabled = true`, **Then** Web Audio API reproduce tono de 440Hz durante 1s |
| RF-02.2 | Notificación push | **Given** permiso de notificaciones otorgado y app en background, **When** timer llega a 0, **Then** Service Worker envía `showNotification` con título "ChronoFlow" y cuerpo descriptivo |
| RF-02.3 | Vibración | **Given** dispositivo móvil con API de vibración, **When** timer llega a 0, **Then** `navigator.vibrate([200, 100, 200])` |
| RF-02.4 | Alerta visual | **Given** timer countdown llega a 0, **Then** display cambia color de fondo a `--color-alert` con animación pulse de 2s |

### RF-03: Modos de Operación
**Prioridad**: Media | **Estado**: Required

| ID | Descripción | Criterio de Aceptación (Given/When/Then) |
|----|-------------|------------------------------------------|
| RF-03.1 | Cronómetro (stopwatch) | **Given** modo = STOPWATCH, **When** usuario inicia, **Then** `elapsedMs` incrementa desde 0 sin límite superior |
| RF-03.2 | Timer countdown | **Given** modo = TIMER con `targetMs` configurado, **When** usuario inicia, **Then** display muestra `targetMs - elapsedMs` y llega exactamente a 00:00:00.00 |
| RF-03.3 | Pomodoro preset | **Given** modo = POMODORO, **When** ciclo de trabajo (25min) termina, **Then** automáticamente inicia ciclo de descanso (5min) con alerta entre cada fase |
| RF-03.4 | Presets personalizables | **Given** usuario guarda preset con nombre y minutos, **Then** aparece en la lista de presets y persiste en `localStorage` tras recargar |
| RF-03.5 | Configuración de tiempo countdown | **Given** modo = TIMER o POMODORO, **When** usuario selecciona modo, **Then** aparecen inputs para configurar min/seg (TIMER) o selector de fases 25/5/15min (POMODORO) |

### RF-04: Historial y Sesiones (Fase 2)
**Prioridad**: Baja | **Estado**: Optional

| ID | Descripción | Criterio de Aceptación (Given/When/Then) |
|----|-------------|------------------------------------------|
| RF-04.1 | Guardar sesión | **Given** timer en estado STOPPED, **When** usuario confirma guardar, **Then** objeto `TimerSession` se persiste en IndexedDB con `id`, `duration`, `type`, `createdAt` |
| RF-04.2 | Lista de sesiones | **Given** historial con ≥ 1 sesión, **When** usuario abre vista historial, **Then** sesiones se muestran en orden cronológico descendente |
| RF-04.3 | Estadísticas básicas | **Given** ≥ 1 sesión guardada, **Then** panel muestra: tiempo total acumulado, duración promedio, conteo de sesiones completadas |
| RF-04.4 | Exportar datos | **Given** usuario solicita exportar, **Then** descarga archivo `chronoflow-export-YYYY-MM-DD.csv` con columnas: id, type, label, duration, createdAt |

### RF-05: Múltiples Timers (Fase 3)
**Prioridad**: Baja | **Estado**: Nice-to-have

| ID | Descripción | Criterio de Aceptación (Given/When/Then) |
|----|-------------|------------------------------------------|
| RF-05.1 | Crear timers múltiples | **Given** usuario presiona "+ Timer", **When** cuenta actual < 4, **Then** se agrega nuevo timer en estado IDLE con ID único |
| RF-05.2 | Visualización múltiple | **Given** ≥ 2 timers activos, **Then** layout cambia a grid 2x2, cada timer muestra su estado independiente |
| RF-05.3 | Labels por timer | **Given** timer creado, **When** usuario edita label, **Then** label máximo 30 caracteres se muestra sobre el display |

### RF-06: Label Configurable del Timer
**Prioridad**: Media | **Estado**: Required

| ID | Descripción | Criterio de Aceptación (Given/When/Then) |
|----|-------------|------------------------------------------|
| RF-06.1 | Input de etiqueta | **Given** timer en cualquier estado, **When** usuario ve la UI, **Then** hay un campo de texto editable sobre el display para describir el timer |
| RF-06.2 | Persistencia del label | **Given** usuario escribe un label, **When** cierra y reabre la app, **Then** el label se restaura desde localStorage |
| RF-06.3 | Uso en notificaciones | **Given** timer countdown llega a 0 con label configurado, **When** se dispara alerta, **Then** el mensaje incluye el label: "¡{label} completado!" |

### RF-07: Información de Hora de Finalización
**Prioridad**: Media | **Estado**: Required

| ID | Descripción | Criterio de Aceptación (Given/When/Then) |
|----|-------------|------------------------------------------|
| RF-07.1 | Hora actual | **Given** modo = TIMER o POMODORO, **When** usuario ve la UI, **Then** muestra "Ahora: HH:MM" actualizado cada segundo |
| RF-07.2 | Hora de término estimada | **Given** modo countdown con tiempo configurado, **When** usuario ve la UI, **Then** muestra "Termina: HH:MM" calculado como hora actual + tiempo restante |
| RF-07.3 | Actualización dinámica | **Given** timer está corriendo, **When** pasa el tiempo, **Then** la hora de término se recalcula en tiempo real |
| RF-07.4 | Oculto en stopwatch | **Given** modo = STOPWATCH, **Then** la sección de información de hora no se muestra |

---

## 3. Requerimientos No-Funcionales

### RNF-01: Rendimiento
| Métrica | Umbral | Herramienta de medición |
|---------|--------|-------------------------|
| First Contentful Paint | < 1s en 3G | Lighthouse |
| Time to Interactive | < 2s en 3G | Lighthouse |
| Uso de memoria activa | < 50MB | Chrome DevTools |
| Bundle size (gzipped) | < 100KB | Webpack Bundle Analyzer / `wc -c` |
| Lighthouse score | ≥ 90 en todas las categorías | Lighthouse CI |

### RNF-02: Compatibilidad
- **Navegadores**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Móviles**: iOS 13+, Android 8+
- **Responsive**: De 320px (móvil) hasta 1920px (desktop)

### RNF-03: Offline y PWA
- **Service Worker**: Cache de assets (Cache-First para estáticos, Network-First para dinámicos)
- **Manifest**: `name`, `short_name`, `icons` (192x192, 512x512), `display: standalone`, `start_url`
- **Estado persistente**: `localStorage` guarda modo y presets; IndexedDB guarda sesiones

### RNF-04: Accesibilidad
- **WCAG 2.1**: Nivel AA mínimo
- **Teclado**: `Space` = iniciar/pausar, `R` = reset, `Tab` para todos los controles interactivos
- **ARIA**: `role="timer"` en display, `aria-live="polite"` para actualizaciones de estado
- **Contraste**: Ratio mínimo 4.5:1 (texto normal), 3:1 (texto grande)
- **Touch targets**: Mínimo 44×44px en mobile

### RNF-05: Seguridad y Privacidad
- **Datos**: Todo local (localStorage/IndexedDB), cero telemetría
- **HTTPS**: Requerido (PWA + Push API lo exigen)
- **Sin terceros**: No CDNs externos, no analytics, no cookies de terceros
- **CSP**: Content-Security-Policy header con `default-src 'self'`

---

## 4. Máquina de Estados del Timer

### 4.1 Estados Válidos

```
IDLE ──[start]──► RUNNING ──[pause]──► PAUSED
  ▲                  │                    │
  │                  │ [reset]            │ [reset]
  │◄─────────────────┘                    │
  │◄──────────────────────────────────────┘
  │
  └── (estado inicial / post-reset)

RUNNING ──[reach zero / countdown]──► COMPLETED
COMPLETED ──[reset]──► IDLE
```

### 4.2 Transiciones de Estado

| Estado actual | Evento | Estado siguiente | Efecto secundario |
|---------------|--------|-----------------|-------------------|
| IDLE | `start` | RUNNING | `startTimestamp = Date.now()`, iniciar `requestAnimationFrame` loop |
| RUNNING | `pause` | PAUSED | `accumulatedMs += Date.now() - startTimestamp`, cancelar RAF |
| PAUSED | `resume` | RUNNING | `startTimestamp = Date.now()`, reiniciar RAF |
| RUNNING | `reset` | IDLE | Cancelar RAF, `accumulatedMs = 0`, actualizar display |
| PAUSED | `reset` | IDLE | `accumulatedMs = 0`, actualizar display |
| RUNNING | `zero_reached` | COMPLETED | Disparar alertas (RF-02.1, RF-02.2, RF-02.3, RF-02.4) |
| COMPLETED | `reset` | IDLE | Limpiar alertas visuales |

### 4.3 Invariantes de Estado

- **INV-01**: `accumulatedMs ≥ 0` en todo momento
- **INV-02**: El RAF loop **solo** corre en estado RUNNING
- **INV-03**: En modo TIMER: `displayMs = max(0, targetMs - elapsedMs)` — nunca negativo
- **INV-04**: Cambios de estado **siempre** actualizan `aria-live` del display

---

## 5. Contratos de Módulos

### 5.1 `timer.js` — Motor del cronómetro

```javascript
// Contrato público del módulo timer

/**
 * @module timer
 * Responsabilidad única: cálculo y estado del tiempo.
 * NO manipula DOM directamente. Emite eventos para ui.js.
 */

// Tipos de estado
type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
type TimerMode  = 'STOPWATCH' | 'TIMER' | 'POMODORO'

// API pública
timer.start()     // IDLE/PAUSED → RUNNING
timer.pause()     // RUNNING → PAUSED
timer.reset()     // cualquier estado → IDLE
timer.setMode(mode: TimerMode, targetMs?: number)
timer.getState(): { state: TimerState, elapsedMs: number, displayMs: number }

// Eventos emitidos (CustomEvent en document)
'timer:tick'      // { elapsedMs, displayMs } — cada frame RAF
'timer:statechange' // { from, to }
'timer:complete'  // { elapsedMs } — solo en modo TIMER/POMODORO
```

### 5.2 `storage.js` — Persistencia local

```javascript
// Contrato público del módulo storage

/**
 * @module storage
 * Responsabilidad única: leer/escribir datos locales.
 * Abstrae localStorage y IndexedDB. Maneja errores de cuota.
 */

// localStorage — síncrono, datos pequeños
storage.getPreferences(): UserPreferences
storage.setPreferences(prefs: Partial<UserPreferences>): void
storage.getPresets(): Preset[]
storage.savePreset(preset: Preset): void
storage.deletePreset(id: string): void

// IndexedDB — asíncrono, historial de sesiones
storage.saveSession(session: TimerSession): Promise<void>
storage.getSessions(limit?: number): Promise<TimerSession[]>
storage.exportSessions(): Promise<Blob>  // CSV

// Error handling: todos los métodos capturan QuotaExceededError
// y emiten 'storage:quota_exceeded' en document
```

### 5.3 `notifications.js` — Alertas

```javascript
// Contrato público del módulo notifications

/**
 * @module notifications
 * Responsabilidad única: gestionar alertas al usuario.
 * Requiere permiso explícito antes de activar push.
 */

notifications.requestPermission(): Promise<'granted'|'denied'|'default'>
notifications.sendAlert(message: string): void  // visual + audio + vibración
notifications.scheduleTimerEnd(delayMs: number, label: string): void
notifications.cancelScheduled(): void
```

### 5.4 `ui.js` — Manipulación DOM

```javascript
// Contrato público del módulo ui

/**
 * @module ui
 * Responsabilidad única: actualizar el DOM.
 * Escucha eventos de timer.js, NO contiene lógica de negocio.
 */

ui.updateDisplay(displayMs: number): void
ui.setButtonState(state: TimerState): void  // habilita/deshabilita botones
ui.showModeSelector(currentMode: TimerMode): void
ui.renderPresets(presets: Preset[]): void
```

---

## 6. Modelo de Datos

### 6.1 TimerSession (IndexedDB)
```javascript
{
  id: string,           // UUID v4
  type: TimerMode,      // 'STOPWATCH' | 'TIMER' | 'POMODORO'
  label: string,        // máx 30 chars, puede estar vacío
  startTime: string,    // ISO 8601
  endTime: string,      // ISO 8601 (null si fue reseteado sin completar)
  duration: number,     // milisegundos efectivos (no incluye pauses)
  completed: boolean,   // true solo si llegó a 0 (modo TIMER/POMODORO)
  createdAt: string     // ISO 8601
}
```

### 6.2 UserPreferences (localStorage key: `cf_prefs`)
```javascript
{
  soundEnabled: boolean,       // default: true
  vibrationEnabled: boolean,   // default: true
  notificationsEnabled: boolean, // default: false (requiere permiso)
  defaultMode: TimerMode,      // default: 'STOPWATCH'
  theme: 'light' | 'dark' | 'auto', // default: 'auto'
  presets: Preset[]
}
```

### 6.3 Preset (dentro de UserPreferences)
```javascript
{
  id: string,      // UUID v4
  name: string,    // máx 20 chars
  minutes: number, // 1–1440
  seconds: number  // 0–59
}
```

---

## 7. Manejo de Errores y Casos Borde

| Caso | Comportamiento esperado |
|------|------------------------|
| RAF no disponible | Fallback a `setInterval(fn, 16)` |
| `localStorage` lleno (QuotaExceededError) | Toast "Almacenamiento lleno. Exporta o limpia el historial." |
| Permiso de notificaciones denegado | Ocultar opción de notificaciones en config; no volver a solicitar |
| App se cierra con timer RUNNING | Al reabrir: calcular tiempo transcurrido con `Date.now() - savedStartTimestamp` y restaurar estado RUNNING |
| `targetMs` = 0 en modo TIMER | Validar en UI antes de `timer.start()`, mostrar error inline |
| Más de 4 timers intentados | Botón "+ Timer" se deshabilita al llegar a 4 |
| Vibration API no disponible | `try/catch` silencioso, no afectar flujo |

---

## 8. Flujo de Usuario (User Stories)

### US-01: Inicio Rápido
> Como usuario, quiero abrir la app y presionar un botón para empezar a cronometrar inmediatamente.

**Flujo**:
1. Usuario abre app (estado: IDLE, modo: STOPWATCH por defecto)
2. Pantalla muestra 00:00:00.00
3. Presiona "Iniciar" (o `Space`)
4. Timer pasa a RUNNING
5. Tiempo total desde apertura: < 3 segundos

### US-02: Timer Pomodoro
> Como estudiante, quiero configurar 25 minutos de estudio y que me avise cuando termine.

**Flujo**:
1. Selecciona modo "Pomodoro" (preset: 25min trabajo / 5min descanso)
2. Presiona "Iniciar"
3. Timer muestra 25:00 contando regresivamente
4. App puede ir a background
5. Al llegar a 0:00: alerta visual + sonido + push notification + vibración
6. Automáticamente inicia temporizador de descanso de 5min
7. Al finalizar descanso: nueva alerta, regresa a ciclo de trabajo

### US-03: Instalación como App
> Como usuario móvil, quiero instalar la app en mi home screen para acceso rápido.

**Flujo**:
1. Usuario visita sitio en Chrome/Safari
2. Navegador muestra install prompt (o usuario lo activa manualmente)
3. Usuario acepta
4. Icono aparece en home screen
5. Al abrir: `display: standalone`, sin browser chrome, splash screen

### US-04: Uso Offline
> Como usuario, quiero poder usar el cronómetro aunque no tenga internet.

**Flujo**:
1. Usuario visitó la app previamente (Service Worker cacheó assets)
2. Activa modo avión
3. App carga desde cache
4. Cronómetro funciona normalmente
5. Historial guarda en IndexedDB
6. Al recuperar conexión: no hay sync necesario (offline-first completo)

---

## 9. Estrategia de Implementación por Fases

### Fase 1: MVP Core (Semana 1-2)
**Definition of Done**:
- [ ] Cronómetro stopwatch: iniciar, pausar, reanudar, reset
- [ ] Timer countdown con input de tiempo
- [ ] Service Worker básico (cache assets)
- [ ] Manifest.json (instalable)
- [ ] Diseño responsive 320px–1920px
- [ ] Tests TF-01 a TF-05 pasando
- [ ] Lighthouse ≥ 80 en todas las categorías

### Fase 2: Notificaciones y UX (Semana 3)
**Definition of Done**:
- [ ] Web Push notifications funcionando en background
- [ ] Web Audio API: tono de alerta
- [ ] Modo Pomodoro con alternancia automática
- [ ] Presets configurables persistidos
- [ ] Themes light/dark/auto
- [ ] Lighthouse ≥ 90 en todas las categorías
- [ ] Accesibilidad WCAG 2.1 AA

### Fase 3: Historial y Extras (Semana 4)
**Definition of Done**:
- [ ] IndexedDB para persistencia de sesiones
- [ ] Vista historial con estadísticas
- [ ] Export a CSV funcional
- [ ] Múltiples timers (hasta 4 simultáneos)
- [ ] Tests E2E con Playwright o similar

---

## 10. Testing y Validación

### 10.1 Tests Funcionales

| ID | Escenario (Given/When/Then) | Resultado esperado |
|----|----------------------------|--------------------|
| TF-01 | **Given** IDLE, **When** start, **Then** estado RUNNING | `timer.getState().state === 'RUNNING'` |
| TF-02 | **Given** RUNNING 10s, **When** pause, **Then** `accumulatedMs ≈ 10000` | Drift < 100ms |
| TF-03 | **Given** PAUSED, **When** resume after 5s, **Then** tiempo continúa desde pausa | No pierde tiempo de pausa |
| TF-04 | **Given** TIMER 60s, **When** llega a 0, **Then** dispara `timer:complete` | Evento recibido exactamente 1 vez |
| TF-05 | **Given** RUNNING, cerrar pestaña y reabrir, **Then** restaura estado | `accumulatedMs` reconstruido correctamente |
| TF-06 | **Given** modo offline, **When** app carga, **Then** funciona desde cache | No hay errores de red |

### 10.2 Tests de Rendimiento

| ID | Métrica | Umbral | Herramienta |
|----|---------|--------|-------------|
| TP-01 | First Contentful Paint | < 1s | Lighthouse |
| TP-02 | Time to Interactive | < 2s | Lighthouse |
| TP-03 | Drift del cronómetro en 1h | ≤ 50ms | Test automatizado con `Date.now()` |
| TP-04 | Memoria en uso continuo 1h | < 50MB | Chrome DevTools Memory |
| TP-05 | Bundle size gzipped | < 100KB | `gzip -c bundle.js \| wc -c` |

### 10.3 Tests de Accesibilidad
- Navegación completa con teclado (`Tab`, `Space`, `R`)
- VoiceOver/NVDA: display leído correctamente con `role="timer"`
- Contraste de colores: verificar con `axe-core` o Lighthouse
- Touch targets: todos los botones ≥ 44×44px

---

## 11. Estructura de Archivos

```
chronoflow/
├── index.html              # Entry point, shell de la app
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker (cache, offline, push)
├── css/
│   ├── main.css           # Estilos globales, variables CSS
│   ├── components.css     # Componentes UI (display, botones)
│   ├── themes.css         # Variables de tema (light/dark)
│   └── responsive.css     # Media queries
├── js/
│   ├── app.js             # Inicialización, wiring de módulos
│   ├── timer.js           # Lógica del cronómetro (máquina de estados)
│   ├── storage.js         # localStorage + IndexedDB
│   ├── notifications.js   # Push + audio + vibración
│   ├── ui.js              # Manipulación DOM (solo UI)
│   └── pwa.js             # Service Worker registration
├── assets/
│   ├── sounds/            # Alertas de audio (ogg + mp3 fallback)
│   ├── icons/             # Iconos PWA (72, 96, 128, 192, 512px)
│   └── screenshots/       # Para manifest (install prompt)
└── docs/
    ├── METHODOLOGY.md     # Proceso SDD documentado
    └── CHANGELOG.md       # Cambios versionados
```

---

## 12. Reglas de Negocio

| RB | Regla |
|----|-------|
| RB-01 | El timer **nunca** muestra valores negativos. En modo TIMER, `displayMs = max(0, targetMs - elapsedMs)` |
| RB-02 | El historial solo guarda sesiones con `duration ≥ 1000ms` (evita sesiones accidentales) |
| RB-03 | Los presets de usuario no pueden sobreescribir los presets del sistema (Pomodoro, Short Break) |
| RB-04 | El modo Pomodoro alterna automáticamente: máximo 4 ciclos de trabajo antes de descanso largo (15min) |
| RB-05 | El export CSV no incluye datos de otros dominios/sesiones; solo datos de `cf_sessions` en IndexedDB |
| RB-06 | Al detectar `prefers-reduced-motion`, las animaciones de alerta se deshabilitan |

---

## 13. Aprobación y Versionado

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-03-19 | OpenBot | Especificación inicial |
| 1.1 | 2026-03-20 | Claude | Máquina de estados, contratos de módulos, Given/When/Then, manejo de errores, reglas de negocio |
| 1.2 | 2026-03-21 | Claude | Agregados RF-03.5 (config tiempo countdown), RF-06 (label configurable), RF-07 (info hora fin) |

---

**Nota de Implementación**:
*Esta especificación es un contrato. El código debe cumplirla. Si surge una necesidad no cubierta, se actualiza la spec primero, luego el código.*

**Para la IA**:
- No implementar fuera de esta especificación
- Consultar al usuario antes de añadir features no documentadas
- Mantener trazabilidad: cada función mapea a un RF, RNF o RB
- Documentar desviaciones en `docs/CHANGELOG.md`
- Los contratos de módulo (§5) son la interfaz pública; respetar firmas exactas
