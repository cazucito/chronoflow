# Decisions - ChronoFlow

## 2026-03-19 - Vanilla JS vs Framework
- **Contexto**: Opciones: React, Vue, Svelte, o Vanilla
- **Decisión**: Vanilla JS (ES2020+)
- **Justificación**: 
  - Proyecto pequeño, no necesita virtual DOM
  - Menor bundle size (< 100KB objetivo)
  - Aprendizaje del equipo con SDD
  - Sin dependencias = menos vulnerabilidades
- **Impacto**: Más código manual, pero control total
- **Alternativas**: Svelte (compila a vanilla), descartado por learning curve

## 2026-03-19 - Offline-first vs Cloud
- **Contexto**: Sincronización entre dispositivos vs privacidad/simplicidad
- **Decisión**: Offline-first, localStorage/IndexedDB
- **Justificación**:
  - Sin backend = sin costos de servidor
  - Privacidad total (datos nunca salen del dispositivo)
  - Funciona sin internet
  - Sync puede agregarse en Fase 3 si es necesario
- **Impacto**: No hay multi-device sync automático
- **Alternativas**: Firebase (realtime), descartado por dependencia externa

## 2026-03-19 - PWA vs App Nativa
- **Contexto**: ¿Web PWA o apps nativas iOS/Android?
- **Decisión**: PWA (Progressive Web App)
- **Justificación**:
  - Un codebase para todas las plataformas
  - Distribución vía web (sin app stores)
  - Actualizaciones instantáneas
  - Mismo performance con menos esfuerzo
- **Impacto**: Limitaciones de iOS (Push notifications más restrictivas)
- **Alternativas**: React Native/Flutter, descartado por complejidad innecesaria
