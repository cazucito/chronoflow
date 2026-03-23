# Arquitectura ChronoFlow v2.0

## Visión General

ChronoFlow v2.0 adopta una arquitectura modular basada en **plugins** con **inyección de dependencias** y **comunicación por eventos**. Esta arquitectura permite:

- Extender funcionalidad sin modificar código core
- Testing unitario aislado mediante mocks
- Sustitución de implementaciones (ej: cambiar storage, UI, etc.)
- Desarrollo paralelo por equipos

## Patrones de Diseño Utilizados

### 1. Plugin Architecture
Cada funcionalidad mayor (timer, themes, notifications) es un plugin que se registra en el núcleo.

```
Core (orquestador)
├── Plugin: TimerEngine
├── Plugin: UIRenderer
├── Plugin: ThemeManager
├── Plugin: NotificationManager
├── Plugin: StorageManager
└── Plugin: KeyboardShortcuts
```

### 2. Dependency Injection (DI)
El Core inyecta dependencias a los plugins mediante un contenedor DI.

```javascript
// Ejemplo de inyección
class TimerPlugin {
  constructor({ eventBus, storage, config }) {
    this.events = eventBus;
    this.storage = storage;
    this.config = config;
  }
}
```

### 3. Event Bus (Pub/Sub)
Comunicación desacoplada mediante eventos tipados.

```javascript
// Publicar
eventBus.emit('timer:started', { timestamp: Date.now() });

// Suscribir
eventBus.on('timer:started', (data) => console.log(data));
```

### 4. Strategy Pattern
Para modos de operación (stopwatch, timer, pomodoro).

### 5. Observer Pattern
Para reactividad de la UI ante cambios de estado.

## Estructura de Directorios

```
js/
├── core/                      # Núcleo de la aplicación
│   ├── Core.js               # Orquestador principal
│   ├── EventBus.js           # Bus de eventos centralizado
│   ├── DIContainer.js        # Contenedor de inyección de dependencias
│   ├── PluginInterface.js    # Interface base para plugins
│   └── Logger.js             # Sistema de logging
│
├── plugins/                   # Plugins funcionales
│   ├── TimerPlugin.js        # Motor del cronómetro
│   ├── UIPlugin.js           # Renderizado y DOM
│   ├── ThemePlugin.js        # Gestión de temas visuales
│   ├── NotificationPlugin.js # Alertas y notificaciones
│   ├── StoragePlugin.js      # Persistencia local
│   └── KeyboardPlugin.js     # Atajos de teclado
│
├── strategies/                # Estrategias de operación
│   ├── TimerStrategy.js      # Interface base
│   ├── StopwatchStrategy.js
│   ├── CountdownStrategy.js
│   └── PomodoroStrategy.js
│
├── utils/                     # Utilidades
│   ├── TimeFormatter.js      # Formateo de tiempo
│   ├── ColorUtils.js         # Manipulación de colores
│   ├── Validation.js         # Validaciones
│   └── Constants.js          # Constantes
│
├── interfaces/                # Definiciones de tipos (JSDoc)
│   ├── ITimer.js
│   ├── IPlugin.js
│   ├── IStorage.js
│   └── IEventBus.js
│
└── app.js                     # Entry point
```

## Ciclo de Vida de la Aplicación

```
1. LOAD      → Cargar configuración y estado previo
2. INIT      → Inicializar Core y registrar plugins
3. CONFIGURE → Configurar inyección de dependencias
4. START     → Iniciar plugins en orden de dependencias
5. RUN       → Aplicación en ejecución
6. STOP      → Guardar estado y limpiar
```

## Ciclo de Vida de un Plugin

```javascript
class MyPlugin {
  // 1. Constructor: recibe dependencias
  constructor(deps) {}
  
  // 2. init: configuración inicial
  async init() {}
  
  // 3. start: comenzar operación
  async start() {}
  
  // 4. stop: limpieza
  async stop() {}
  
  // 5. destroy: liberar recursos
  destroy() {}
}
```

## Flujo de Datos

```
Usuario → UI Plugin → Event Bus → Timer Plugin → Event Bus → UI Plugin → DOM
                      ↓
               Storage Plugin (persistencia)
                      ↓
               Notification Plugin (alertas)
```

## Extensibilidad

### Crear un Plugin Personalizado

```javascript
// js/plugins/MyCustomPlugin.js
import { BasePlugin } from '../core/PluginInterface.js';

/**
 * @plugin MyCustomPlugin
 * @description Agrega funcionalidad personalizada
 */
export class MyCustomPlugin extends BasePlugin {
  static name = 'MyCustomPlugin';
  static dependencies = ['EventBus', 'TimerPlugin'];
  
  constructor({ eventBus, timer }) {
    super();
    this.events = eventBus;
    this.timer = timer;
  }
  
  async init() {
    // Suscribirse a eventos
    this.events.on('timer:completed', this.onTimerComplete.bind(this));
  }
  
  onTimerComplete(data) {
    // Mi lógica personalizada
    console.log('¡Timer completado!', data);
  }
}
```

### Registrar el Plugin

```javascript
// app.js
core.registerPlugin(MyCustomPlugin);
```

## Testing

La arquitectura DI permite testing con mocks:

```javascript
// test/TimerPlugin.test.js
const mockEventBus = {
  emit: jest.fn(),
  on: jest.fn()
};

const timer = new TimerPlugin({ 
  eventBus: mockEventBus 
});

timer.start();
expect(mockEventBus.emit).toHaveBeenCalledWith('timer:started', expect.any(Object));
```

## Convenciones de Código

1. **JSDoc obligatorio** para todas las clases y métodos públicos
2. **Prefijo privado** `_methodName()` para métodos privados
3. **Inmutabilidad** preferida para estado
4. **Eventos tipados** con documentación de payload
5. **Validación de entradas** en todos los métodos públicos

## Rendimiento

- Lazy loading de plugins opcional
- RAF para animaciones
- Debouncing/throttling para eventos frecuentes
- Cleanup de listeners al destruir plugins
