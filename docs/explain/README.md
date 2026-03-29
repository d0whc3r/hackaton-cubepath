# Documentación técnica — SLM Router

Explicación completa del proyecto en español, organizada por temas.

## Índice

| #   | Documento                                              | Contenido                                                               |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| 01  | [Visión general](./01-vision-general.md)               | Qué es el proyecto, propuesta de valor, tareas soportadas, flujo de uso |
| 02  | [Arquitectura](./02-arquitectura.md)                   | Diseño de tres planos, diagrama de flujo, principios de diseño          |
| 03  | [Stack tecnológico](./03-tecnologias.md)               | Frameworks, librerías, herramientas de desarrollo                       |
| 04  | [Estructura del proyecto](./04-estructura-proyecto.md) | Árbol de directorios, componentes clave, hooks, librerías               |
| 05  | [Sistema de enrutamiento](./05-enrutamiento.md)        | Detección de lenguaje, analista LLM, especialistas, tipos de tarea      |
| 06  | [Streaming y API](./06-streaming-api.md)               | SSE, `runStream()`, auto-continuación, protocolo de eventos             |
| 07  | [Gestión de estado](./07-gestion-estado.md)            | `chat-store`, `model-config`, React Query, storage abstraction          |
| 08  | [Seguridad (RailGuard)](./08-seguridad.md)             | Reglas estáticas, validación semántica LLM, fail-open, event log        |
| 09  | [Cálculo de costes](./09-costes.md)                    | Estimación de tokens, comparativa con cloud, `CostBadge`                |
| 10  | [Tests](./10-tests.md)                                 | Vitest, MSW, happy-dom, patrones de test, organización                  |
| 11  | [Configuración](./11-configuracion.md)                 | Variables de entorno, TypeScript, Astro, Docker, scripts                |
