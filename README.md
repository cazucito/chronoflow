# ChronoFlow

Cronómetro web progresivo (PWA) diseñado para marcar tiempos de actividades sin fricción.

## Propósito Principal

Este proyecto es un **ejercicio de Specification-Driven Development (SDD)** en la era de la IA. El sistema es el vehículo, la metodología es el objetivo.

## Estado

- [x] Especificación v1.4 - Aprobada
- [x] Runtime activo consolidado en modo wall clock
- [ ] Limpieza de activos PWA pendientes (`assets/icons`, `assets/screenshots`)
- [ ] Fase 2: cierre de RF requeridos aún no completos en runtime actual
- [ ] Fase 3: historial y extras

## Runtime Actual

- UI activa: `index.html` + `js/wallclock.js`
- Motor de tiempo: `js/timer.js`
- Persistencia local: `js/storage.js`
- Alertas: `js/notifications.js`
- PWA publicada: `sw.js` + `manifest.json`

El código legacy y la rama experimental plugin/DI fueron retirados para reducir ruido y evitar rutas muertas en el repositorio.

## Documentación

- [SPECIFICATION.md](./SPECIFICATION.md) - Requerimientos completos
- [docs/METHODOLOGY.md](./docs/METHODOLOGY.md) - Proceso SDD documentado
- [docs/CHANGELOG.md](./docs/CHANGELOG.md) - Cambios versionados
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura vigente del runtime actual

## Uso

```bash
# Desarrollo local
python3 -m http.server 8000

# Abrir en navegador
http://localhost:8000
```

## Tecnologías

- Vanilla JS (ES2020+)
- CSS3 con variables
- PWA (Service Worker + Manifest)
- Web Push API
- Web Audio API

---

*Construido con el enfoque SDD: Specification First, Code Second.*
