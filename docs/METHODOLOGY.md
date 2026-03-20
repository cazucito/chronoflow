# Specification-Driven Development (SDD) — Guía Completa

**Versión**: 1.1
**Fecha**: 2026-03-20
**Audiencia**: Desarrolladores, Product Owners, equipos que usan IA para desarrollo

---

## ¿Qué es SDD?

SDD es una metodología donde la **especificación es el centro del desarrollo**, no un artefacto previo que se descarta. La spec es simultáneamente:

- **Contrato**: Define exactamente qué se construye y qué no
- **Guía de implementación**: Orienta todas las decisiones técnicas
- **Suite de tests**: Cada requerimiento es un criterio verificable
- **Documento vivo**: Evoluciona con el proyecto, nunca queda obsoleta

La diferencia clave con otros enfoques: **la spec se escribe antes de cualquier línea de código**, y el código es una consecuencia de ella, no al revés.

---

## Por qué SDD es especialmente efectivo con IA

### El problema sin SDD
```
Desarrollador: "Crea un cronómetro"
IA: [genera algo razonable pero incompleto o con decisiones incorrectas]
Desarrollador: "No, quería que fuera PWA y sin frameworks"
IA: [refactoriza, pero ahora falta X]
Desarrollador: "También necesito modo Pomodoro"
IA: [agrega Pomodoro, rompe algo existente]
... 10 iteraciones después ...
```

### El problema con SDD
```
Desarrollador: [entrega SPECIFICATION.md completa]
IA: [implementa RF-01 a RF-05 con trazabilidad directa]
Desarrollador: [revisa contra spec, 0 sorpresas]
```

### Ventajas concretas

| Ventaja | Sin SDD | Con SDD |
|---------|---------|---------|
| Contexto disponible para IA | Fragmentado en mensajes | Completo en un documento |
| Decisiones técnicas | Se toman en el momento | Documentadas y justificadas |
| Scope creep | Frecuente | Bloqueado por contrato |
| Debugging | Reactivo | Preventivo (spec como oracle) |
| Onboarding | Semanas | Leer la spec |
| Tests | Se escriben después | Emergen de criterios de aceptación |
| Alucinaciones de IA | Frecuentes | Reducidas (spec como guardrails) |

---

## Flujo SDD Completo

```
┌────────────────────────────────────────────────────────────┐
│  FASE 0: DESCUBRIMIENTO                                    │
│  └─> Entender el problema, usuarios, restricciones        │
│      Salida: Visión en una oración                        │
├────────────────────────────────────────────────────────────┤
│  FASE 1: ESPECIFICACIÓN                                    │
│  ├─> Requerimientos funcionales (RF-XX) con G/W/T         │
│  ├─> Requerimientos no-funcionales (RNF-XX)               │
│  ├─> Arquitectura y stack con justificaciones             │
│  ├─> Modelo de datos                                      │
│  ├─> Contratos de módulos/interfaces                      │
│  ├─> Máquina de estados (si aplica)                       │
│  └─> Estrategia de testing                                │
├────────────────────────────────────────────────────────────┤
│  FASE 2: VALIDACIÓN DE SPEC                               │
│  ├─> ¿Cada RF es testable?                               │
│  ├─> ¿Hay contradicciones entre RFs?                     │
│  ├─> ¿La arquitectura soporta todos los RNFs?            │
│  └─> ¿Puede implementarse en las fases definidas?        │
├────────────────────────────────────────────────────────────┤
│  FASE 3: APROBACIÓN (CONGELAR v1.0)                       │
│  └─> Stakeholder firma. Desde aquí: spec-first           │
├────────────────────────────────────────────────────────────┤
│  FASE 4: IMPLEMENTACIÓN POR FASES                         │
│  ├─> Fase 1: MVP (subset mínimo de RFs)                  │
│  ├─> Fase 2: Features core                               │
│  └─> Fase 3: Extras y optimizaciones                     │
├────────────────────────────────────────────────────────────┤
│  FASE 5: TESTING CONTRA SPEC                              │
│  └─> Cada RF tiene test que pasa/falla                   │
├────────────────────────────────────────────────────────────┤
│  FASE 6: ITERACIÓN CONTROLADA                             │
│  └─> Spec v1.1 → Code update → Test update              │
└────────────────────────────────────────────────────────────┘
```

---

## Estructura Canónica de una Spec SDD

### Secciones Obligatorias

#### 1. Visión y Propósito
- Una oración que describe el "qué" y el "para quién"
- Filosofía de diseño (3-5 principios, no más)
- Propósito del proyecto vs. propósito del producto (si son distintos)

#### 2. Requerimientos Funcionales (RF-XX)
Cada RF sigue esta estructura:

```markdown
### RF-XX: Nombre descriptivo
**Prioridad**: Alta/Media/Baja | **Estado**: Required/Optional/Nice-to-have

| ID     | Descripción | Criterio de Aceptación (Given/When/Then) |
|--------|-------------|------------------------------------------|
| RF-XX.1 | ... | Given [precondición], When [acción], Then [resultado verificable] |
```

**Reglas para RFs bien escritos:**
- El criterio de aceptación usa Given/When/Then (lenguaje Gherkin)
- "Then" describe un resultado **observable y medible**
- Evitar verbos ambiguos: "manejar", "gestionar", "soportar"
- Usar verbos precisos: "incrementa", "cambia a", "persiste en", "emite evento"

#### 3. Requerimientos No-Funcionales (RNF-XX)
- Performance: métricas numéricas con herramienta de medición
- Compatibilidad: versiones exactas de navegadores/OS
- Seguridad: nivel concreto (OWASP Top 10, CSP, etc.)
- Accesibilidad: estándar exacto (WCAG 2.1 AA)

#### 4. Arquitectura Técnica
- Stack con justificación (por qué este, por qué no otros)
- Estructura de archivos con responsabilidad de cada módulo
- Contratos de módulos (API pública, eventos emitidos)
- Modelo de datos (esquema completo)

#### 5. Máquina de Estados (si aplica)
- Diagrama ASCII del grafo de estados
- Tabla de transiciones: (estado, evento) → (nuevo estado, efecto)
- Invariantes que nunca deben violarse

#### 6. Manejo de Errores
- Casos borde conocidos
- Comportamiento esperado para cada uno
- Mensajes de error al usuario (exactos)

#### 7. Reglas de Negocio
- Restricciones que no son obvias de los RFs
- Políticas de datos, límites, excepciones

#### 8. User Stories
- Flujos de extremo a extremo desde perspectiva del usuario
- Complementan los RFs, no los duplican

#### 9. Estrategia de Testing
- Tests funcionales mapeados a RFs
- Tests de rendimiento con umbrales
- Tests de accesibilidad

#### 10. Roadmap de Fases
- Definition of Done por fase (checklist concreto)
- Cada fase debe ser demostrable independientemente

### Secciones Opcionales
- Análisis de competencia
- Wireframes / mockups
- Riesgos y mitigaciones

---

## Template de RF con Given/When/Then

```markdown
| RF-XX.Y | [Descripción breve de la funcionalidad] |
| **Given** [estado del sistema o precondición], **When** [acción del usuario o evento], **Then** [resultado observable] |
```

### Ejemplos de G/W/T bien escritos

✅ **Correcto**:
> **Given** timer en estado RUNNING, **When** usuario presiona "Pausar", **Then** estado cambia a PAUSED y `accumulatedMs` preserva el tiempo transcurrido hasta ese momento

❌ **Incorrecto** (no observable):
> El timer se pausa correctamente

✅ **Correcto**:
> **Given** `localStorage` está lleno, **When** se intenta guardar preferencias, **Then** se muestra toast "Almacenamiento lleno. Exporta o limpia el historial." y no se lanza excepción no capturada

❌ **Incorrecto** (ambiguo):
> Maneja errores de almacenamiento

---

## Anti-patrones en SDD

### ❌ Spec como trámite
Escribir la spec para "cumplir" y luego ignorarla durante la implementación.

**Solución**: La spec es el árbitro. Cuando hay duda sobre cómo implementar algo, la spec decide. Si la spec no cubre el caso, se actualiza **antes** de escribir código.

---

### ❌ Over-specification del MVP
Spec tan detallada para la Fase 1 que nunca se termina de escribir.

**Solución**: La Fase 1 debe ser el mínimo absoluto demostrable. Las fases 2 y 3 pueden tener menor detalle inicial; se refinan antes de empezar cada fase.

---

### ❌ Spec rígida ("ningún cambio permitido")
Tratar la spec como inamovible, incluso cuando el contexto cambia.

**Solución**: Versionado semántico. Cambios menores: v1.0 → v1.1. Cambios que rompen contratos: v1.0 → v2.0. Cada cambio documentado en CHANGELOG.md con justificación.

---

### ❌ RFs sin criterios de aceptación
Requerimientos que no se pueden verificar objetivamente.

**Solución**: Si no puedes escribir un test para él, reescríbelo. Todo RF debe mapearse a al menos un caso de prueba ejecutable.

---

### ❌ Ignorar RNFs
Solo especificar features funcionales, descuidar performance/UX/seguridad.

**Solución**: Los RNFs son tan contractuales como los RFs. Una app que pasa todos los RFs pero carga en 8 segundos no cumple la spec.

---

### ❌ Cambiar código sin actualizar spec
Implementar algo diferente a la spec y no registrarlo.

**Solución**: Si la implementación diverge de la spec (por razón técnica válida), la spec se actualiza **en el mismo commit** que el cambio de código.

---

## SDD vs Otras Metodologías

| Aspecto | SDD | TDD | BDD | Agile/Scrum |
|---------|-----|-----|-----|-------------|
| **Focus principal** | Especificación completa | Tests primero | Comportamiento de usuario | Iteraciones cortas |
| **Artefacto central** | SPECIFICATION.md | Test suite | Feature files | Product backlog |
| **Momento de decisiones** | Antes de codificar | Al escribir tests | Al escribir scenarios | Durante el sprint |
| **AI-friendly** | ★★★★★ | ★★★ | ★★★★ | ★★ |
| **Documentación** | Inherente | Parcial | Parcial | Variable |

**SDD es compatible y complementario** con TDD y BDD:
1. Primero se especifica (SDD) — los criterios G/W/T son la fuente de verdad
2. Luego se escriben tests (TDD) — derivados de los G/W/T
3. Opcionalmente, se formalizan en feature files (BDD)

---

## Herramientas del Stack SDD

| Herramienta | Propósito en SDD |
|-------------|-----------------|
| **Markdown + Git** | Spec versionada junto al código |
| **Gherkin (G/W/T)** | Lenguaje de criterios de aceptación |
| **ADR (Architecture Decision Records)** | Justificar decisiones técnicas (ver `Decisions.md`) |
| **Lighthouse CI** | Validar RNFs de performance automáticamente |
| **axe-core** | Validar RNFs de accesibilidad |
| **Playwright / Cypress** | Tests E2E mapeados a User Stories |

---

## Proceso con IA (Claude / LLMs)

### Cómo entregar contexto a la IA
```
"Lee SPECIFICATION.md antes de empezar.
Implementa [RF-XX].
Cada función debe referenciar el RF que implementa en un comentario.
Si necesitas algo no cubierto en la spec, dímelo antes de implementarlo."
```

### Reglas para la IA en SDD
1. **Lee la spec completa** antes de escribir código
2. **Trazabilidad obligatoria**: cada función tiene comentario `// RF-XX.Y`
3. **No inventar features**: si un caso no está en la spec, preguntar
4. **Actualizar spec en el mismo PR** si la implementación diverge
5. **Commits descriptivos**: `RF-01.3: Implement timer reset with state machine`

### Señales de alerta (red flags)
- La IA propone algo no documentado en la spec → preguntar si debe agregarse a la spec primero
- La IA "mejora" la spec unilateralmente → rechazar, discutir con el equipo
- El código crece sin que crezca la spec → señal de scope creep

---

## Métricas de Éxito del Proceso SDD

Al finalizar el proyecto, evaluar:

- [ ] Spec completada **antes** de la primera línea de código
- [ ] Cero features implementadas que no estén en la spec
- [ ] Cada RF tiene al menos un test automatizado
- [ ] Tiempo de debugging < 20% del tiempo total
- [ ] Un desarrollador nuevo puede onboardear leyendo solo la spec
- [ ] Todos los cambios de spec están en el CHANGELOG con justificación
- [ ] Lighthouse ≥ 90 en todas las categorías (valida los RNFs)

---

## Lecciones del Proyecto ChronoFlow

*Esta sección se completa durante el desarrollo*

### Lección 1: Máquina de estados antes de código
Definir el grafo de estados completo en la spec evita bugs de transición. Descubierto al agregar el estado COMPLETED al cronómetro — sin el diagrama, habría quedado como caso borde sin manejar.

### Lección 2: Contratos de módulos como API docs
Escribir las firmas de funciones públicas en la spec (§5) antes de implementar fuerza a pensar en las responsabilidades únicas de cada módulo. Evita que `timer.js` acabe manipulando el DOM.

### Lección 3: Given/When/Then como test stubs
Los criterios de aceptación en formato G/W/T se convierten directamente en estructura de tests (`describe`/`it`). Reduce el tiempo de escritura de tests en ~40%.

---

**Conclusión**:
SDD en la era de la IA significa usar la IA para acelerar la creación de specs rigurosas, luego usar esa spec como guía inquebrantable para la implementación. La IA es más efectiva con contexto completo (la spec) que con instrucciones fragmentadas en el chat. La spec es el único artefacto que no se negocia.
