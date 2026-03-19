# Especificación: ChronoFlow

## Documento de Especificación (SDD)
**Versión**: 1.0  
**Fecha**: 2026-03-19  
**Estado**: Draft → Aprobación  

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

| ID | Descripción | Criterio de Aceptación |
|----|-------------|------------------------|
| RF-01.1 | Iniciar cronómetro | Botón "Iniciar" comienza contador preciso (ms) |
| RF-01.2 | Pausar/Reanudar | Botón alterna entre pausar y continuar manteniendo tiempo acumulado |
| RF-01.3 | Detener/Reset | Botón detiene y ofrece: guardar sesión o descartar |
| RF-01.4 | Visualización clara | Display grande, legible, formato HH:MM:SS.ms |
| RF-01.5 | Precisión | Error máximo: ±50ms por hora de funcionamiento |

### RF-02: Notificaciones y Alertas
**Prioridad**: Alta | **Estado**: Required

| ID | Descripción | Criterio de Aceptación |
|----|-------------|------------------------|
| RF-02.1 | Sonido de alerta | Audio configurable al finalizar (si es timer countdown) |
| RF-02.2 | Notificación push | Web Push API cuando timer llega a cero (en background) |
| RF-02.3 | Vibración | Vibración del dispositivo al completar (si es móvil) |
| RF-02.4 | Visual alert | Cambio de color/pantalla cuando timer finaliza |

### RF-03: Modos de Operación
**Prioridad**: Media | **Estado**: Required

| ID | Descripción | Criterio de Aceptación |
|----|-------------|------------------------|
| RF-03.1 | Cronómetro (stopwatch) | Cuenta ascendente desde cero |
| RF-03.2 | Timer countdown | Cuenta regresiva desde tiempo configurado |
| RF-03.3 | Pomodoro preset | 25min trabajo / 5min descanso (alternancia automática) |
| RF-03.4 | Presets personalizables | Guardar configuraciones de tiempo habituales |

### RF-04: Historial y Sesiones (Opcional - Fase 2)
**Prioridad**: Baja | **Estado**: Optional

| ID | Descripción | Criterio de Aceptación |
|----|-------------|------------------------|
| RF-04.1 | Guardar sesión | Al detener, opción de guardar con nombre/tag |
| RF-04.2 | Lista de sesiones | Ver historial cronológico |
| RF-04.3 | Estadísticas básicas | Tiempo total, promedio, sesiones completadas |
| RF-04.4 | Exportar datos | CSV/JSON con historial |

### RF-05: Múltiples Timers (Extra - Fase 3)
**Prioridad**: Baja | **Estado**: Nice-to-have

| ID | Descripción | Criterio de Aceptación |
|----|-------------|------------------------|
| RF-05.1 | Crear timers múltiples | Hasta 4 timers simultáneos |
| RF-05.2 | Visualización múltiple | Grid o tabs para ver todos |
| RF-05.3 | Labels por timer | Nombre descriptivo para cada uno |

---

## 3. Requerimientos No-Funcionales

### RNF-01: Rendimiento
- **Tiempo de carga inicial**: < 2 segundos en 3G
- **Time to Interactive**: < 1 segundo
- **Uso de memoria**: < 50MB en navegador

### RNF-02: Compatibilidad
- **Navegadores**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Móviles**: iOS 13+, Android 8+
- **Responsive**: De 320px (móvil) hasta 1920px (desktop)

### RNF-03: Offline y PWA
- **Service Worker**: Cache de assets para funcionamiento offline
- **Manifest**: Instalable como app en móviles/desktop
- **Sync**: Guardar estado al cerrar, restaurar al abrir

### RNF-04: Accesibilidad
- **WCAG 2.1**: Nivel AA
- **Teclado**: Todo operable sin mouse
- **Screen readers**: ARIA labels apropiados
- **Contraste**: Ratio mínimo 4.5:1

### RNF-05: Seguridad y Privacidad
- **Datos**: Todo local (localStorage/IndexedDB), nada en servidor
- **HTTPS**: Requerido para PWA y push notifications
- **Sin tracking**: No analytics externos, no cookies de terceros

---

## 4. Arquitectura Técnica

### 4.1 Stack Tecnológico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Frontend | Vanilla JS (ES2020+) | Simplicidad, performance, sin dependencias |
| CSS | CSS3 + Variables | Moderno, mantenible, sin frameworks |
| Storage | localStorage/IndexedDB | Offline-first, privacidad, cero backend |
| PWA | Service Worker + Manifest | Instalación, offline, comportamiento nativo |
| Audio | Web Audio API | Sonidos sin dependencias externas |
| Notificaciones | Push API + Notifications API | Nativo del navegador |

### 4.2 Estructura de Archivos

```
chronoflow/
├── index.html              # Entry point, shell de la app
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker (cache, offline)
├── css/
│   ├── main.css           # Estilos globales
│   ├── components.css     # Componentes UI
│   ├── themes.css         # Variables de tema
│   └── responsive.css     # Media queries
├── js/
│   ├── app.js             # Inicialización
│   ├── timer.js           # Lógica del cronómetro
│   ├── storage.js         # localStorage/IndexedDB
│   ├── notifications.js   # Push + audio
│   ├── ui.js              # Manipulación DOM
│   └── pwa.js             # Service Worker registration
├── assets/
│   ├── sounds/            # Alert sounds (mp3/ogg)
│   ├── icons/             # Iconos PWA (192x192, 512x512)
│   └── screenshots/       # Para install prompt
└── docs/
    ├── SPECIFICATION.md   # Esta especificación
    └── CHANGELOG.md       # Cambios versionados
```

### 4.3 Interfaz de Usuario (Wireframes)

#### Vista Principal - Cronómetro
```
┌─────────────────────────────┐
│  [Icono] ChronoFlow         │
├─────────────────────────────┤
│                             │
│       00:00:00.00          │  ← Display grande
│                             │
├─────────────────────────────┤
│  [ Modo: Cronó ▼ ]          │  ← Selector de modo
├─────────────────────────────┤
│                             │
│     [   INICIAR   ]        │  ← Botón principal
│                             │
│  [ Pausar ]  [ Reset ]     │  ← Secundarios
│                             │
├─────────────────────────────┤
│  [Historial ▼]  [⚙ Config] │  ← Footer
└─────────────────────────────┘
```

#### Vista Principal - Timer (Countdown)
```
┌─────────────────────────────┐
│  [Icono] ChronoFlow         │
├─────────────────────────────┤
│  [ 25:00 ]  ← Input tiempo  │
│                             │
│       25:00.00             │  ← Display
│                             │
├─────────────────────────────┤
│  [ Pomodoro ] [ Custom ]   │  ← Presets
├─────────────────────────────┤
│     [   INICIAR   ]        │
│                             │
└─────────────────────────────┘
```

### 4.4 Modelo de Datos

```javascript
// Timer Session
{
  id: "uuid",
  type: "stopwatch" | "timer" | "pomodoro",
  label: "string",           // Descripción opcional
  startTime: "ISO8601",      // Inicio
  endTime: "ISO8601",        // Fin (null si no completó)
  duration: "number",        // Milisegundos
  completed: "boolean",      // Se completó o canceló
  createdAt: "ISO8601"
}

// User Preferences
{
  soundEnabled: "boolean",
  vibrationEnabled: "boolean",
  defaultMode: "stopwatch" | "timer" | "pomodoro",
  presets: [
    { name: "Pomodoro", minutes: 25 },
    { name: "Short Break", minutes: 5 }
  ],
  theme: "light" | "dark" | "auto"
}
```

---

## 5. Flujo de Usuario (User Stories)

### US-01: Inicio Rápido
> Como usuario, quiero abrir la app y presionar un botón para empezar a cronometrar inmediatamente.

**Flujo**:
1. Usuario abre app (o la tiene instalada)
2. Pantalla muestra 00:00:00.00
3. Presiona "Iniciar"
4. Cronómetro comienza
5. Tiempo total: < 3 segundos desde apertura

### US-02: Timer Pomodoro
> Como estudiante, quiero configurar 25 minutos de estudio y que me avise cuando termine.

**Flujo**:
1. Selecciona modo "Pomodoro"
2. Presiona "Iniciar"
3. Timer cuenta regresiva 25:00
4. App en background
5. Al llegar a 0:00, suena alerta + push notification
6. Ofrece iniciar descanso de 5 min

### US-03: Instalación como App
> Como usuario móvil, quiero "instalar" la app en mi home screen para acceso rápido.

**Flujo**:
1. Usuario visita sitio en Chrome/Safari
2. Navegador muestra prompt "Add to Home Screen"
3. Usuario acepta
4. Icono aparece en home screen
5. Al abrir, comportamiento de app nativa (sin browser chrome)

### US-04: Uso Offline
> Como usuario, quiero poder usar el cronómetro aunque no tenga internet.

**Flujo**:
1. Usuario abre app (previamente cargada)
2. Activa modo avión
3. Cronómetro funciona normalmente
4. Historial guarda localmente
5. Al recuperar conexión, sync silencioso (si aplica)

---

## 6. Estrategia de Implementación (SDD)

### Fase 1: MVP Core (Semana 1-2)
**Objetivo**: Cronómetro funcional, PWA básica, offline

**Entregables**:
- [ ] Cronómetro stopwatch (iniciar, pausar, reset)
- [ ] Timer countdown básico
- [ ] PWA installable (manifest + SW básico)
- [ ] Diseño responsive
- [ ] Tests funcionales

**Definition of Done**:
- Funciona offline
- Instalable en móvil
- Precisión ±100ms/hora

### Fase 2: Notificaciones y UX (Semana 3)
**Objetivo**: Alertas, sonidos, presets, refinamiento UI

**Entregables**:
- [ ] Web Push notifications
- [ ] Sonidos de alerta
- [ ] Modo Pomodoro
- [ ] Presets configurables
- [ ] Themes (light/dark)

**Definition of Done**:
- Notificación funciona en background
- UX mobile nativa
- 90+ Lighthouse score

### Fase 3: Historial y Extras (Semana 4)
**Objetivo**: Persistencia de datos, historial, múltiples timers

**Entregables**:
- [ ] Guardar sesiones en IndexedDB
- [ ] Vista de historial
- [ ] Exportar datos
- [ ] Múltiples timers (extra)
- [ ] Sync entre dispositivos (opcional, cloud)

**Definition of Done**:
- Datos persistentes
- Export funcional
- Tests E2E pasando

---

## 7. Testing y Validación

### 7.1 Testing Funcional

| Test | Descripción | Expected Result |
|------|-------------|-----------------|
| TF-01 | Iniciar cronómetro | Tiempo incrementa cada 10ms |
| TF-02 | Pausar y reanudar | Tiempo continúa desde pausa |
| TF-03 | Timer 1 min | Alerta a los 60s exactos |
| TF-04 | Background 5 min | Timer sigue, notificación al final |
| TF-05 | Offline mode | Funciona sin conexión |
| TF-06 | Instalación PWA | Aparece en home screen, splash screen |

### 7.2 Testing de Rendimiento

| Test | Métrica | Umbral |
|------|---------|--------|
| TP-01 | First Paint | < 1s |
| TP-02 | Time to Interactive | < 2s |
| TP-03 | Precisión cronómetro | ±50ms/hora |
| TP-04 | Memoria uso | < 50MB |
| TP-05 | Bundle size | < 100KB gzipped |

### 7.3 Testing de Accesibilidad

- Navegación completa con teclado
- Screen reader compatible
- Contraste WCAG AA
- Touch targets mínimo 44x44px

---

## 8. Documentación del Proceso SDD

### 8.1 Lecciones Aprendidas (Meta-Documentación)

Este proyecto documenta:

1. **Especificación como código**: La spec es el source of truth
2. **Definition of Done por fase**: Criterios claros antes de empezar
3. **Testing como requerimiento**: No después, sino parte de la spec
4. **Decisiones documentadas**: Cada decisión técnica tiene justificación
5. **Iteración controlada**: Fases con entregables medibles

### 8.2 Métricas de Éxito del Proceso SDD

- [ ] Spec completada antes de primera línea de código
- [ ] Zero "scope creep" durante implementación
- [ ] Cada requerimiento tiene test asociado
- [ ] Tiempo de debugging < 20% del total
- [ ] Onboarding de nuevo dev posible con solo la spec

---

## 9. Referencias y Recursos

### Sitios de Referencia Analizados
- https://reloj-alarma.es/cronometro/
- https://www.online-stopwatch.com/
- https://www.cronometroenlinea.com/
- https://www.my-alarm-clock.com/es/cronometro

### Tecnologías Clave
- [MDN: Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 10. Aprobación y Versionado

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-03-19 | OpenBot | Especificación inicial |

**Aprobado por**: ________________  
**Fecha de aprobación**: ________________  

---

**Nota de Implementación**:  
*Esta especificación es un contrato. El código debe cumplirla. Si surge una necesidad no cubierta, se actualiza la spec primero, luego el código.*

**Para la IA (Claude)**:  
- No implementar fuera de esta especificación
- Consultar al usuario antes de añadir features no documentadas
- Mantener trazabilidad: cada función debe mapear a un RF o RNF
- Documentar desviaciones en CHANGELOG.md