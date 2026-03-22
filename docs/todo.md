gestion de errores
logging
sentry
external logger https://loglayer.dev
info mejor para el usuario feedback

tasks:

- Docstring / comentarios
  Generar o actualizar docstrings y comentarios de un snippet o función.
  Entrada: código + breve descripción del módulo.

- Type Hints / Tipado
  Sugerir tipos (TS, Python, etc.) para funciones y parámetros.
  Muy acotado: “añade tipos pero no cambies la lógica”.

- Error Explain
  Le pasas mensaje de error + snippet y te explica qué pasa y pasos para arreglarlo.
  Es un caso típico donde incluso SLMs pequeños brillan.

- Code Review Lite
  Dado un diff, devuelve 3–5 comentarios de review: claridad, naming, posibles bugs.
  Importante limitar: solo feedback textual, nada de cambios masivos.

- Performance Hint
  Revisar un trozo de código y proponer pequeñas mejoras de rendimiento (bucles, queries, etc.).
  Enfatiza “no cambies el comportamiento, sólo sugiere mejoras”.

- Naming Helper
  Renombrar variables / funciones para que sean más claras, devolviendo un listado de “antes → después”.
  ​
- Dead Code / Cleanup Suggestions
  Dado un archivo o fragmento, señalar imports no usados, código muerto, bloques redundantes.
  ​
