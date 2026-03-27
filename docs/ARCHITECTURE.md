# Arquitectura Vigente de ChronoFlow

## Resumen

El runtime actual de ChronoFlow está compuesto por una sola ruta activa y un conjunto pequeño de scripts globales en Vanilla JS. Esta es la arquitectura que hoy se carga en producción y que debe considerarse la fuente de verdad del repositorio.

## Componentes Activos

### `index.html`
- Shell único de la aplicación.
- Define la interfaz wall clock fullscreen.
- Carga `storage.js`, `timer.js`, `notifications.js` y `wallclock.js`.

### `js/timer.js`
- Motor de tiempo y máquina de estados.
- Emite eventos `CustomEvent` sobre `document`.
- No manipula DOM.

### `js/wallclock.js`
- Controlador de la UI wall clock.
- Escucha eventos del timer y actualiza el DOM.
- Gestiona controles, label y visualización de zonas horarias.

### `js/storage.js`
- Acceso a `localStorage`.
- Placeholder de IndexedDB para fases futuras.

### `js/notifications.js`
- Audio, vibración y notificaciones del navegador.
- Reacciona a `timer:complete`.

### `sw.js` y `manifest.json`
- Activos PWA mantenidos en el repo.
- Forman parte de la publicación, aunque su integración final todavía requiere cierre de brechas.

## Flujo de Ejecución

1. `index.html` renderiza el layout wall clock.
2. `timer.js` expone el singleton `timer`.
3. `wallclock.js` enlaza eventos de UI con `timer`.
4. `timer.js` emite `timer:tick`, `timer:statechange` y `timer:complete`.
5. `wallclock.js` y `notifications.js` reaccionan a esos eventos.

## Decisión de Limpieza

- La app legacy y la rama experimental plugin/DI fueron retiradas del árbol activo.
- Si en el futuro se quiere retomar una arquitectura pluginizada, debe hacerse mediante ADR y una actualización explícita de la spec antes de reintroducir código.
