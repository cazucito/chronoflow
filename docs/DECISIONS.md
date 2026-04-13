# Architecture Decision Records — ChronoFlow

Este archivo registra las decisiones arquitectónicas significativas del proyecto usando el formato ADR estándar (Michael Nygard).

Cada ADR documenta: contexto, decisión, justificación, consecuencias y alternativas consideradas.

---

## ADR-001: Vanilla JS sobre Frameworks

**Fecha**: 2026-03-19
**Estado**: Aceptado
**Deciders**: Equipo ChronoFlow

### Contexto
Al iniciar el proyecto se evaluó qué stack usar para el frontend. Las opciones principales eran: React, Vue 3, Svelte y Vanilla JS (ES2020+). ChronoFlow es un cronómetro PWA de funcionalidad acotada, sin estado global complejo ni muchos componentes reutilizables.

### Decisión
**Vanilla JS (ES2020+)** con módulos ES nativos. Sin transpiladores, sin bundler obligatorio.

### Justificación
- **Bundle size**: objetivo < 100KB gzipped. React añade ~45KB, Vue ~34KB, Svelte ~4KB de runtime base — Vanilla JS: 0KB de overhead.
- **Complejidad no necesaria**: Virtual DOM y reactividad son overhead para un UI con 5-6 elementos interactivos.
- **Dependencias = vectores de riesgo**: cada `npm install` agrega superficie de ataque. Sin `node_modules`, sin CVEs de supply chain.
- **Longevidad**: Vanilla JS no se depreca ni rompe por updates de framework.
- **Aprendizaje del proceso SDD**: el objetivo secundario del proyecto es documentar metodología; Vanilla JS maximiza visibilidad de decisiones técnicas.

### Consecuencias
**Positivas**:
- Bundle mínimo, TTI < 2s en 3G sin optimización especial
- Sin `node_modules`, instalación instantánea del repo
- Código portable, sin lock-in de framework

**Negativas**:
- Más código boilerplate para manipulación DOM que con framework reactivo
- Sin ecosistema de componentes reutilizables
- Gestión manual de eventos entre módulos (compensada con `CustomEvent`)

### Alternativas descartadas
- **Svelte**: compila a Vanilla JS, overhead mínimo. Descartado por añadir un paso de build y una curva de aprendizaje extra innecesaria para este scope.
- **React**: overhead de bundle y virtual DOM injustificado para este proyecto.
- **Vue 3**: similar a React en justificación de descarte.

---

## ADR-002: Offline-First con localStorage/IndexedDB

**Fecha**: 2026-03-19
**Estado**: Aceptado
**Deciders**: Equipo ChronoFlow

### Contexto
Se necesitaba decidir dónde persisten los datos del usuario: preferencias, presets de tiempo, historial de sesiones. Las opciones eran: backend propio, Firebase/Supabase (BaaS), o almacenamiento local (localStorage + IndexedDB).

### Decisión
**Almacenamiento local exclusivo**: `localStorage` para preferencias y presets, `IndexedDB` para historial de sesiones. Sin backend. Sin sync entre dispositivos.

### Justificación
- **Privacidad por diseño**: los datos de tiempo de actividades son potencialmente sensibles. Al no salir del dispositivo, se elimina el riesgo de exposición.
- **Cero costos operativos**: sin servidor, sin base de datos, sin facturas mensuales.
- **Disponibilidad offline real**: no hay "modo offline degradado" — la app funciona 100% sin red en todo momento.
- **Simplicidad de arquitectura**: elimina autenticación, autorización, API design, deployment, monitoring.
- **GDPR/privacidad trivial**: sin datos en servidor, sin política de privacidad compleja.

### Consecuencias
**Positivas**:
- App funciona en modo avión desde el primer uso
- Instalación como PWA con comportamiento nativo completo
- Sin backend que mantener, sin downtime

**Negativas**:
- No hay sync entre dispositivos (teléfono y laptop tienen datos separados)
- Los datos se pierden si el usuario limpia el storage del navegador
- Sin backup automático (mitigado con export a CSV en Fase 3)

### Alternativas descartadas
- **Firebase Realtime Database**: sync en tiempo real, pero añade dependencia externa, requiere auth, y viola el principio de privacidad.
- **Supabase**: similar a Firebase, mismos problemas.
- **Backend propio (REST API)**: máximo control, pero requiere infraestructura, mantenimiento y auth — scope fuera del objetivo del proyecto.
- **CRDTs + P2P sync**: técnicamente elegante pero excesivamente complejo para este scope.

---

## ADR-003: PWA sobre Apps Nativas

**Fecha**: 2026-03-19
**Estado**: Aceptado
**Deciders**: Equipo ChronoFlow

### Contexto
Para un cronómetro que se usa en mobile principalmente, se evaluó si construir apps nativas (iOS/Android), un wrapper (React Native, Flutter, Capacitor) o una PWA.

### Decisión
**PWA (Progressive Web App)** con Service Worker y Web App Manifest.

### Justificación
- **Un codebase, todas las plataformas**: iOS, Android, Windows, macOS, Linux — misma base de código.
- **Distribución sin fricción**: URL directa, sin app stores, sin review process, actualizaciones instantáneas.
- **Performance suficiente**: Web APIs modernas (Push, Vibration, Audio, Storage) cubren el 100% de los requerimientos.
- **Instalable**: `display: standalone` da comportamiento de app nativa al instalarse.
- **Capacidades requeridas disponibles**: Service Worker (offline), Push API (notificaciones), Web Audio API (sonidos), Vibration API (haptics) — todo estándar W3C.

### Consecuencias
**Positivas**:
- Un solo equipo mantiene una sola codebase
- Deploy = subir archivos estáticos (GitHub Pages, Netlify, etc.)
- Actualizaciones sin pasar por app store

**Negativas**:
- **iOS limitaciones**: Safari restringe Web Push (mejorado en iOS 16.4+, pero aún no paridad con Android)
- **Vibration API**: no disponible en iOS Safari
- Sin acceso a APIs nativas avanzadas (HealthKit, Siri, widgets de home screen)

### Mitigación de limitaciones iOS
- Vibración: degradación graciosa con `try/catch` silencioso
- Push en iOS: verificar `Notification.permission` y mostrar UI de "instala la app para notificaciones" en dispositivos iOS < 16.4

### Alternativas descartadas
- **React Native**: un codebase pero requiere compilar, publicar en stores, aprender el ecosistema RN — demasiado overhead.
- **Flutter**: mismo argumento que React Native, más Dart como lenguaje adicional.
- **Capacitor / Cordova**: wrappers web que añaden complejidad de build sin beneficio claro para este scope.
- **Apps nativas separadas (Swift + Kotlin)**: dos codebases, cuatro veces el esfuerzo, fuera de scope.

---

## ADR-004: requestAnimationFrame para el Loop del Timer

**Fecha**: 2026-03-20
**Estado**: Aceptado
**Deciders**: Equipo ChronoFlow

### Contexto
Para actualizar el display del cronómetro, se evaluó cómo implementar el loop de actualización: `setInterval`, `setTimeout` recursivo, o `requestAnimationFrame` (RAF).

### Decisión
**`requestAnimationFrame`** para el loop visual, con `Date.now()` como fuente de verdad para el tiempo (no contadores acumulativos de ticks).

### Justificación
- **Precisión**: `setInterval(fn, 10)` no garantiza ejecución exactamente cada 10ms. El browser puede throttlear timers en tabs en background. RAF sincroniza con el repaint del browser — si el frame tarda más, el siguiente frame corrige.
- **No throttling en foreground**: RAF corre a ~60fps en foreground, suficiente para actualización centesimal.
- **`Date.now()` como oracle**: el tiempo real siempre se calcula como `Date.now() - startTimestamp + accumulatedMs`, no como suma de ticks. Esto elimina el drift acumulativo.
- **Pausa natural en background**: RAF se pausa automáticamente cuando el tab no es visible — correcto para el display, pero el tiempo se recalcula correctamente al volver al foreground.

```javascript
// Patrón correcto — RF-01.6: precisión ±50ms/hora
function tick() {
  const elapsedMs = accumulatedMs + (Date.now() - startTimestamp);
  updateDisplay(elapsedMs); // siempre basado en Date.now()
  rafId = requestAnimationFrame(tick);
}
```

### Consecuencias
**Positivas**:
- Drift < ±50ms/hora (cumple RF-01.6)
- No acumula error con el tiempo
- El browser gestiona el throttling automáticamente

**Negativas**:
- RAF se pausa en tabs en background (mitigado: el tiempo real se calcula con `Date.now()` al volver)
- Requiere fallback a `setInterval(fn, 16)` si RAF no está disponible (browsers muy antiguos)

### Alternativas descartadas
- **`setInterval(fn, 10)`**: subject a throttling, acumula error, menos eficiente que RAF.
- **Web Workers con `setInterval`**: mayor precisión en background, pero complejidad injustificada para este scope.
- **`performance.now()`**: mayor precisión sub-milisegundo, pero `Date.now()` es suficiente para el umbral de ±50ms/hora del RF-01.6.

---

## Plantilla para Nuevos ADRs

```markdown
## ADR-XXX: [Título de la decisión]

**Fecha**: YYYY-MM-DD
**Estado**: Propuesto | Aceptado | Deprecado | Reemplazado por ADR-YYY
**Deciders**: [Quién tomó la decisión]

### Contexto
[¿Qué problema o necesidad motivó esta decisión? ¿Cuál era el contexto?]

### Decisión
[La decisión tomada, en una oración clara]

### Justificación
[Por qué esta opción sobre las demás. Criterios usados.]

### Consecuencias
**Positivas**: [Beneficios]
**Negativas**: [Trade-offs o limitaciones aceptadas]

### Alternativas descartadas
[Otras opciones evaluadas y por qué se descartaron]
```

---

*Los ADRs son inmutables una vez en estado "Aceptado". Para revertir una decisión, crear un nuevo ADR que la reemplace, marcando el original como "Reemplazado por ADR-XXX".*
