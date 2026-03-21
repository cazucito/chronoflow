# Todo - ChronoFlow

## Fase 1: MVP Core (Semana 1-2) ✅ COMPLETADA

### Hecho ✅
- [x] Especificación SDD completa (v1.1 aprobada)
- [x] Estructura de proyecto
- [x] Metodología documentada
- [x] **Estructura HTML básica** — semántica, accesible, PWA-ready
- [x] **Cronómetro stopwatch** — iniciar, pausar, reanudar, reset (timer.js)
- [x] **Timer countdown** — cuenta regresiva con alerta al 0
- [x] **Diseño responsive** — mobile-first, breakpoints, touch targets ≥44px
- [x] **Service Worker** — cache assets, funcionamiento offline (sw.js)
- [x] **Manifest.json** — PWA instalable, iconos, standalone mode
- [x] **Tests funcionales TF-01 a TF-06** — validación de requerimientos

### Módulos creados:
- `js/timer.js` — Máquina de estados con requestAnimationFrame
- `js/ui.js` — Manipulación DOM, accesibilidad ARIA
- `js/storage.js` — localStorage + IndexedDB
- `js/notifications.js` — Web Audio, vibración, push
- `js/pwa.js` — Service Worker registration
- `js/app.js` — Wiring e inicialización

### CSS creado:
- `css/main.css` — Variables, reset, layout base
- `css/components.css` — Display, botones, controles
- `css/themes.css` — Dark mode
- `css/responsive.css` — Breakpoints 320px–1920px

---

## Fase 2: Notificaciones y UX (Semana 3)

### Backlog
- [ ] Web Push notifications con Service Worker
- [ ] Web Audio API refinado (tonos personalizables)
- [ ] Modo Pomodoro con alternancia automática trabajo/descanso
- [ ] Presets configurables persistidos
- [ ] Themes light/dark selector UI
- [ ] 90+ Lighthouse score
- [ ] Tests de accesibilidad WCAG 2.1 AA

---

## Fase 3: Historial y Extras (Semana 4)

### Backlog
- [ ] IndexedDB para persistencia de sesiones
- [ ] Vista de historial con estadísticas
- [ ] Exportar datos (CSV/JSON)
- [ ] Múltiples timers (hasta 4 simultáneos)
- [ ] Tests E2E completos
