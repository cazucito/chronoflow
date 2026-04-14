# ChronoFlow ⏱️

**Cronómetro web progresivo (PWA)** diseñado para marcar tiempos de actividades sin fricción.

[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen)](https://cazucito.github.io/chronoflow/)
[![Versión](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/cazucito/chronoflow/releases/tag/v1.0.0)
[![Método](https://img.shields.io/badge/methodology-SDD-orange)](./docs/METHODOLOGY.md)

> **Este proyecto es un ejercicio de Specification-Driven Development (SDD)** en la era de la IA.  
> El sistema es el vehículo, la metodología es el objetivo.

---

## 🎯 Roadmap del Proyecto

El desarrollo sigue **3 fases** definidas en la [especificación](./docs/SPECIFICATION.md):

### ✅ Fase 1: MVP Core (COMPLETADA)

Cronómetro funcional con precisión y PWA básica.

| Feature | Estado | Descripción |
|---------|--------|-------------|
| RF-01 | ✅ | Cronómetro principal (iniciar, pausar, reanudar, reset) |
| RF-02.1 | ✅ | Alertas sonoras con Web Audio API |
| RF-08 | ✅ | Temas visuales (5 temas implementados) |
| RF-09 | ✅ | Modo Wall Clock (interfaz actual) |
| RNF-01-05 | ✅ | PWA completa: SW, iconos, offline-first |

**Entregable:** Timer funcional, instalable, modo reloj de pared fullscreen.

---

### 🔄 Fase 2: UX Avanzada (75% completada)

Notificaciones, modos adicionales y refinamiento de UX.

| Feature | Estado | Descripción |
|---------|--------|-------------|
| RF-02.2 | 🔄 | Notificaciones push en background |
| RF-03 | 📋 | Modo Pomodoro con alternancia automática |
| RF-06 | ✅ | Labels configurables (parcial) |
| RF-07 | ✅ | Información de hora inicio/término (parcial) |
| RF-09.8 | 📋 | Persistencia de modo reloj |
| RNF-06 | 📋 | Lighthouse 90+ |
| RNF-07 | 📋 | WCAG 2.1 AA compliance |

**Entregable:** Timer + Pomodoro, notificaciones completas, UX pulida.

---

### 📋 Fase 3: Historial y Extras (PENDIENTE)

Persistencia avanzada y análisis de uso.

| Feature | Estado | Descripción |
|---------|--------|-------------|
| RF-04 | 📋 | Historial de sesiones en IndexedDB |
| RF-05 | 📋 | Múltiples timers simultáneos |
| RF-10 | ✅ | Dual Timezone Display (ya implementado) |
| RNF-04 | 📋 | Export de datos a CSV/JSON |
| RNF-08 | 📋 | Tests E2E completos |

**Entregable:** Historial completo, estadísticas, exportación de datos.

---

## 🏗️ Runtime Actual (v1.0.0)

```
chronoflow/
├── index.html          # UI principal (Wall Clock Mode)
├── sw.js               # Service Worker (offline-first)
├── manifest.json       # PWA manifest
├── js/
│   ├── timer.js        # Motor de tiempo + máquina de estados
│   ├── wallclock.js    # Controlador de UI
│   ├── storage.js      # Persistencia local
│   └── notifications.js # Audio/vibración
├── css/
│   ├── main.css        # Estilos base
│   └── wallclock.css   # Estilos modo reloj
└── assets/
    └── icons/          # Iconos PWA (192x192, 512x512)
```

### Componentes Activos

- **`timer.js`** — Motor de tiempo con `requestAnimationFrame`, emite eventos `CustomEvent`
- **`wallclock.js`** — Controlador UI, gestiona display y controles
- **`storage.js`** — `localStorage` para preferencias (IndexedDB en Fase 3)
- **`notifications.js`** — Web Audio API y vibración

---

## 📋 Convenciones del Proyecto

### Estructura de Commits (OBLIGATORIO)

Todo commit debe ser trazable a la especificación:

```
[Fase X][RF-XX.Y]: Descripción breve del cambio

- Implementa RF-XX.Y: descripción detallada
- Tests: descripción de tests añadidos
- Actualiza docs/CHANGELOG.md
```

**Ejemplos válidos:**
```
[Fase 1][RF-01.1]: Implementar inicio de cronómetro con RAF

- Implementa RF-01.1: transición IDLE → RUNNING
- Tests TF-01: verifica precisión del timer
- Actualiza CHANGELOG.md

[Fase 2][RF-02.1]: Agregar alerta Web Audio al completar

- Implementa RF-02.1: tono 440Hz, 1 segundo
- Respeta RNF-05: sin dependencias externas
```

**Prohibido:** Commits sin referencia a RF/RNF (`fix bug`, `update`, `wip`).

---

### Convenciones de Código (OBLIGATORIO)

#### 1. Trazabilidad Obligatoria

Cada función debe referenciar el requerimiento que implementa:

```javascript
// RF-01.2: Pausar cronómetro — RUNNING → PAUSED
function pauseTimer() {
  // implementation
}

// RNF-03: Cachear assets estáticos en SW
self.addEventListener('install', (event) => {
  // implementation
});
```

#### 2. Prohibiciones Absolutas

- ❌ **Nunca** implementar features no documentadas en `docs/SPECIFICATION.md`
- ❌ **Nunca** usar frameworks JS (React, Vue, etc.) — [ADR-001](./docs/DECISIONS.md)
- ❌ **Nunca** hacer llamadas a APIs externas — todo es offline-first
- ❌ **Nunca** modificar API pública sin actualizar §5 de la spec
- ❌ **Nunca** silenciar errores sin emitir evento o log

#### 3. Obligaciones

- ✅ **Siempre** leer `docs/SPECIFICATION.md` antes de escribir código
- ✅ **Siempre** actualizar `docs/CHANGELOG.md` en el mismo commit
- ✅ **Siempre** respetar contratos de módulos definidos en la spec
- ✅ **Siempre** mantener la máquina de estados del §4 como fuente de verdad

#### 4. Stack Autorizado

| Tecnología | Uso |
|------------|-----|
| Vanilla JS (ES2020+) | Toda la lógica |
| CSS3 + Custom Properties | Estilos |
| Service Worker API | Cache + offline |
| Web Audio API | Alertas sonoras |
| Push API | Notificaciones background |
| localStorage/IndexedDB | Persistencia |

**Sin npm. Sin node_modules. Sin frameworks.**

---

## 📚 Documentación

### Documentos Esenciales

| Documento | Propósito | Debe leerse antes de... |
|-----------|-----------|------------------------|
| [docs/SPECIFICATION.md](./docs/SPECIFICATION.md) | **Contrato completo** con todos los RF/RNF | Escribir cualquier código |
| [AGENTS.md](./AGENTS.md) | Contrato de comportamiento para agentes IA | Usar IA para desarrollar |
| [docs/METHODOLOGY.md](./docs/METHODOLOGY.md) | Guía SDD: cómo trabajar con este repo | Contribuir al proyecto |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitectura vigente del runtime | Modificar código existente |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | ADRs: decisiones arquitectónicas tomadas | Proponer cambios de arquitectura |

### Documentos de Seguimiento

| Documento | Propósito |
|-----------|-----------|
| [docs/TODO.md](./docs/TODO.md) | Tareas pendientes y backlog |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Historial de cambios versionados |
| [docs/README.md](./docs/README.md) | Índice de documentación |

---

## 🚀 Uso Rápido

### Instalación Local

```bash
# Clonar
git clone https://github.com/cazucito/chronoflow.git
cd chronoflow

# Servir localmente
python3 -m http.server 8000

# Abrir en navegador
open http://localhost:8000
```

### Instalación como PWA

**Android (Chrome):**
1. Visita https://cazucito.github.io/chronoflow/
2. Menú → "Add to Home Screen"

**iOS (Safari):**
1. Visita la URL
2. Share → "Add to Home Screen"

**Desktop (Chrome/Edge):**
1. Visita la URL
2. Click en el ícono de instalación en la barra de direcciones

---

## 🧪 Testing

Los tests están en `tests/smoke.js` y validan el runtime actual:

```bash
# Abrir el navegador y verificar consola
# Los smoke tests se ejecutan automáticamente al cargar
```

Para tests E2E completos (Fase 3):
- Pendiente de implementación

---

## 🤝 Contribuir

### Flujo de Trabajo SDD

1. **Leer** `docs/SPECIFICATION.md` completa
2. **Identificar** el RF/RNF a implementar
3. **Verificar** que no está ya en `docs/TODO.md` como completado
4. **Implementar** siguiendo convenciones de código
5. **Commitear** con formato `[Fase X][RF-XX.Y]: ...`
6. **Actualizar** `docs/CHANGELOG.md`
7. **Actualizar** `docs/TODO.md` si aplica

### Casos No Cubiertos

Si encuentras un caso no especificado:

1. **DETENTE** — no implementes soluciones ad-hoc
2. **DOCUMENTA** — describe el caso y opciones posibles
3. **PROPÓN** — sugiere actualizar la spec
4. **ESPERA** — no avances hasta confirmar

---

## 📜 Licencia

MIT © 2026 — ChronoFlow

---

<p align="center">
  <em>Construido con el enfoque SDD: Specification First, Code Second.</em>
</p>
