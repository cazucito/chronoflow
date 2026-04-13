# Documentación de ChronoFlow

Esta carpeta contiene toda la documentación técnica del proyecto.

## Estructura de `docs/`

| Archivo | Propósito |
|---------|-----------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Arquitectura vigente del runtime actual |
| [`CHANGELOG.md`](./CHANGELOG.md) | Historial de cambios versionados |
| [`DECISIONS.md`](./DECISIONS.md) | Architecture Decision Records (ADRs) |
| [`METHODOLOGY.md`](./METHODOLOGY.md) | Guía de Specification-Driven Development (SDD) |
| [`README.md`](./README.md) | Este índice |
| [`TODO.md`](./TODO.md) | Seguimiento de tareas y backlog |

## Documentos en Raíz

| Archivo | Propósito |
|---------|-----------|
| [`../AGENTS.md`](../AGENTS.md) | Contrato de comportamiento para agentes IA |
| [`../README.md`](../README.md) | Entrada principal del proyecto |
| [`../SPECIFICATION.md`](../SPECIFICATION.md) | Especificación completa (contrato) |

## Flujo de Trabajo SDD

1. Leer [`SPECIFICATION.md`](../SPECIFICATION.md) — entender qué se construye
2. Revisar [`AGENTS.md`](../AGENTS.md) — si usas IA para desarrollar
3. Revisar [`METHODOLOGY.md`](./METHODOLOGY.md) — entender cómo se construye
4. Consultar [`ARCHITECTURE.md`](./ARCHITECTURE.md) — entender la implementación actual
5. Documentar decisiones en [`DECISIONS.md`](./DECISIONS.md)
6. Actualizar [`CHANGELOG.md`](./CHANGELOG.md) con cada cambio

---

*Para contribuir: sigue el formato ADR para nuevas decisiones y mantén la trazabilidad con RF/RNF de la spec.*
