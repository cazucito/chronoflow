# Todo - ChronoFlow

## Consolidación del Repo ✅

### Hecho
- [x] Se consolidó el runtime actual basado en `index.html` + `js/wallclock.js`
- [x] Se retiró la app legacy no cargada por la UI activa
- [x] Se retiró la rama experimental plugin/DI que no formaba parte del runtime
- [x] Se actualizó la documentación para reflejar la arquitectura vigente
- [x] Se reemplazaron tests legacy por smoke tests alineados al runtime actual

## Pendientes Inmediatos

- [ ] Cerrar brecha entre spec v1.4 y runtime actual sin alterar la UX wall clock
- [ ] Completar la trazabilidad `RF-*` y `RNF-*` en módulos activos
- [ ] Revisar integración real de `sw.js` con los assets publicados
- [ ] Agregar `assets/icons` y `assets/screenshots` o ajustar la publicación PWA

## Fase 2: RF Requeridos Aún Incompletos

- [ ] RF-02.2: notificación vía Service Worker en background
- [ ] RF-03.3 / RF-03.4 / RF-03.5: Pomodoro y presets persistidos
- [ ] RF-06.2 / RF-06.3: persistencia completa de label y uso uniforme en alertas
- [ ] RF-07.1 / RF-07.2 / RF-07.3 / RF-07.4: información de hora actual y término según spec
- [ ] RF-08.*: selector completo de 5 temas + custom
- [ ] RF-09.8: persistencia/restauración de modo reloj
- [ ] Validación WCAG 2.1 AA y Lighthouse 90+

## Fase 3: Historial y Extras

- [ ] RF-04.*: historial de sesiones en IndexedDB
- [ ] RF-05.*: múltiples timers
- [ ] Export de sesiones a CSV
- [ ] Tests E2E completos
