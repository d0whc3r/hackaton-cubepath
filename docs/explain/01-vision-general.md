# Visión General — SLM Router

## ¿Qué es este proyecto?

**SLM Router** es una plataforma de enrutamiento inteligente de modelos de lenguaje pequeños (_Small Language Models_) diseñada para flujos de trabajo de desarrollo de software.

En lugar de usar un único modelo grande para todas las tareas, el sistema detecta el tipo de tarea que el usuario quiere realizar y la delega a un modelo especializado y más pequeño (SLM), optimizado para esa tarea concreta.

---

## Propuesta de valor

- **Enrutamiento por tarea**: cada tipo de tarea (explicar código, generar tests, refactorizar, etc.) tiene su propio modelo especializado con un prompt de sistema optimizado.
- **Streaming en tiempo real**: las respuestas se muestran en tiempo real a medida que el modelo las genera.
- **Traducción de respuestas**: cualquier respuesta puede traducirse al idioma del usuario con un solo clic. La traducción conserva intactos los bloques de código, nombres de funciones, identificadores y cualquier elemento relacionado con la programación; solo se traduce el texto en prosa.
- **Comparativa de costes**: muestra cuánto costaría la misma petición en proveedores cloud (OpenAI, Anthropic, etc.) frente al SLM local.
- **Local-first con Ollama**: toda la inferencia se ejecuta localmente con [Ollama](https://ollama.com), sin necesidad de enviar código a APIs externas.
- **Capa de seguridad**: validación semántica + reglas estáticas antes de procesar cada petición (_RailGuard_).

---

## Tareas soportadas (10 especialistas)

| Tarea              | Descripción                                             |
| ------------------ | ------------------------------------------------------- |
| `explain`          | Explica qué hace un fragmento de código                 |
| `test`             | Genera tests unitarios adaptados al framework detectado |
| `refactor`         | Propone mejoras de calidad y legibilidad                |
| `commit`           | Genera mensajes de commit concisos y descriptivos       |
| `docstring`        | Añade comentarios de documentación a funciones/métodos  |
| `type-hints`       | Añade anotaciones de tipos (TypeScript / Python)        |
| `error-explain`    | Analiza errores y propone pasos para resolverlos        |
| `performance-hint` | Sugiere optimizaciones de rendimiento                   |
| `naming-helper`    | Propone mejores nombres para variables y funciones      |
| `dead-code`        | Detecta código inalcanzable o nunca usado               |

---

## Flujo de uso básico

```
Usuario escribe código  →  Selecciona tarea  →  RailGuard valida input
  →  Analyst detecta lenguaje/framework  →  Se elige especialista
    →  Modelo SLM genera respuesta (streaming)  →  UI muestra resultado + coste
```

---

## Modo de despliegue

El proyecto es un sitio estático generado con Astro (SSG). Toda la lógica — RailGuard, enrutamiento, llamadas al modelo — se ejecuta en el navegador del usuario. No existe ningún servidor de aplicación intermedio.

Requisitos:

1. **Ollama** corriendo en `http://localhost:11434` (configurable en `/settings`)
2. Los modelos SLM descargados (se pueden gestionar en la misma página de ajustes)
3. `npm run dev` para desarrollo o `npm run build && npm run start` para producción (o Docker)

---

## Documentos relacionados

- [02 — Arquitectura](./02-arquitectura.md)
- [03 — Stack tecnológico](./03-tecnologias.md)
- [04 — Estructura del proyecto](./04-estructura-proyecto.md)
- [05 — Sistema de enrutamiento](./05-enrutamiento.md)
- [06 — Streaming y API](./06-streaming-api.md)
- [07 — Gestión de estado](./07-gestion-estado.md)
- [08 — Seguridad (RailGuard)](./08-seguridad.md)
- [09 — Cálculo de costes](./09-costes.md)
- [10 — Tests](./10-tests.md)
- [11 — Configuración](./11-configuracion.md)
