# Changelog

Todos los cambios notables de ChronoFlow se documentan aquí.

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Changed
- Se consolidó el repositorio alrededor del runtime activo `index.html` + `wallclock.js`.
- README, Todo y arquitectura fueron actualizados para reflejar la implementación vigente.

### Removed
- Archivos CSS obsoletos de la UI legacy eliminados para optimizar la carga del modo Reloj de Pared (`css/components.css`, `css/themes.css`, `css/responsive.css`).
- Limpieza de selectores layout inactivos (`#app`, `.app-header`) en `css/main.css`.
- App legacy no cargada por la UI actual (`js/app.js`, `js/ui.js`, `js/pwa.js`).
- Rama experimental plugin/DI (`js/app-v2.js`, `js/core/**`, `js/plugins/TimerPlugin.js`).
- Suite funcional acoplada a la arquitectura anterior.

### Added
- Smoke tests mínimos orientados al runtime actual (`tests/smoke.js`).

## [1.0.0] - 2026-03-XX (Fecha estimada Fase 3)

### Added
- MVP completo
- Notificaciones push
- Historial de sesiones
- Exportar datos

## Cómo usar este changelog

- **Added**: Nuevas features
- **Changed**: Cambios en features existentes
- **Deprecated**: Features que se eliminarán
- **Removed**: Features eliminadas
- **Fixed**: Bug fixes
- **Security**: Cambios de seguridad
