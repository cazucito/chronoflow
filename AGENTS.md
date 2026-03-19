# AGENTS.md - ChronoFlow

## Memory Contract

Proyecto SDD: Cronómetro PWA construido con Specification-Driven Development.

### Orden de Contexto (cargar en este orden)
1. `SPECIFICATION.md` - **SIEMPRE** leer primero
2. `docs/METHODOLOGY.md` - Entender el proceso SDD
3. `README.md` - Estado actual del proyecto
4. `Todo.md` - Qué está en curso
5. `Decisions.md` - Decisiones arquitectónicas relevantes

### Reglas de Implementación SDD
- **Nunca** implementar fuera de la SPECIFICATION.md
- **Siempre** actualizar spec antes de cambiar requerimientos
- Cada función debe mapear a un RF-XX o RNF-XX
- Tests obligatorios para cada RF
- Commits descriptivos: `RF-01.3: Implement timer reset functionality`

### Estructura de Commits
```
[Fase X]: Descripción breve

- Implementa RF-XX.Y: Descripción
- Agrega tests para RF-XX.Y
- Actualiza CHANGELOG.md
```

### Testing
- Antes de commit: `npm test` (o tests manuales)
- Cada RF debe tener test que pase
- Lighthouse score > 90

### Stack Recordado
- Vanilla JS (no frameworks)
- CSS3 con variables
- Service Worker para PWA
- Web Push API
- Web Audio API
- Sin backend (offline-first)

### Decisiones Clave (no cuestionar sin consultar)
- Vanilla JS sobre frameworks
- Offline-first sobre cloud
- PWA sobre nativas
- Fases de implementación (MVP primero)
