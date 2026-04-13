# Documentación de ChronoFlow

Esta carpeta contiene toda la documentación técnica del proyecto.

## Estructura

| Archivo | Propósito |
|---------|-----------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Arquitectura vigente del runtime actual |
| [`CHANGELOG.md`](./CHANGELOG.md) | Historial de cambios versionados |
| [`METHODOLOGY.md`](./METHODOLOGY.md) | Guía de Specification-Driven Development (SDD) |
| [`Decisions.md`](./Decisions.md) | Architecture Decision Records (ADRs) |
| [`AGENTS.md`](./AGENTS.md) | Contrato de comportamiento para agentes IA |

## Documentos en Raíz

| Archivo | Propósito |
|---------|-----------|
| [`../README.md`](../README.md) | Entrada principal del proyecto |
| [`../SPECIFICATION.md`](../SPECIFICATION.md) | Especificación completa (contrato) |
| [`../Todo.md`](../Todo.md) | Seguimiento de tareas y backlog |

## Flujo de Trabajo SDD

1. Leer [`SPECIFICATION.md`](../SPECIFICATION.md) — entender qué se construye
2. Revisar [`METHODOLOGY.md`](./METHODOLOGY.md) — entender cómo se construye
3. Consultar [`ARCHITECTURE.md`](./ARCHITECTURE.md) — entender la implementación actual
4. Seguir [`AGENTS.md`](./AGENTS.md) — si usas IA para desarrollar
5. Documentar decisiones en [`Decisions.md`](./Decisions.md)
6. Actualizar [`CHANGELOG.md`](./CHANGELOG.md) con cada cambio

---

*Para contribuir: sigue el formato ADR para nuevas decisiones y mantén la trazabilidad con RF/RNF de la spec.*
