# Producto: Engineering Concepts

## Visión

Un sitio web público para **leer, practicar y demostrar que se han entendido conceptos de ingeniería de software**, empezando por la preparación de entrevistas de **System Design y arquitectura backend**. Cada concepto explica cómo funciona el mecanismo por dentro, cómo se implementa y cuándo conviene usarlo, y termina con retos que obligan a aplicarlo.

El sitio funciona como un **juego de aprendizaje**: el progreso, la experiencia (XP), los niveles, las rachas y los logros motivan a volver y a repasar lo que se ha fallado.

## Usuario objetivo

- Ingenieros/as backend que preparan entrevistas técnicas de System Design o quieren profundizar en mecanismos de concurrencia, consistencia y resiliencia.
- Perfil de referencia del primer contenido: experiencia en pagos, checkout y sistemas distribuidos, con ejemplos en Java, Kotlin y SQL.
- Uso **anónimo**: no hay cuentas ni login. Cualquiera puede entrar y usarlo.

## Propuesta de valor

- Explicaciones con profundidad de entrevista senior, no definiciones de glosario: casos que fallan, por qué fallan y la solución más sencilla que da las garantías necesarias.
- Retos variados que comprueban la comprensión de verdad, no la memoria.
- Simuladores interactivos que hacen visible lo que pasa en el tiempo (intercalación de peticiones, tokens, permisos, latencias).
- Un catálogo que crece: se añaden conceptos, retos y preguntas sin rediseñar el sitio.

## Estado actual

Implementado (requisito 001): el tema *Concurrencia y consistencia en backend* con sus 13 conceptos en español e inglés, cada uno con su **Evaluación** de preguntas de opción múltiple (una o varias respuestas correctas, explicación por opción, **Resultado** y repetición) y **Versión estática** de las secuencias de simulador. Sin progreso, XP ni persistencia: recargar o cambiar de idioma reinicia la Evaluación. El contenido está redactado por Claude a partir del material original (secciones 1–15) y **pendiente de revisión técnica por el Autor**.

## Alcance del producto

### Contenido

- **Concepto**: unidad de lectura (p. ej. *Optimistic locking*). Pertenece a un **tema** o ruta (p. ej. *Concurrencia y consistencia en backend*).
- Cada concepto tiene explicación, ejemplos de código y uno o varios **retos**.
- Primer tema: concurrencia en backend y System Design (race conditions, atomicidad, locks locales, optimistic/pessimistic locking, idempotencia, distributed locking, aislamiento de transacciones y MVCC, deadlocks, fan-out/fan-in y structured concurrency, modelos de hilos, semáforos y connection pools, rate limiting y backpressure, timeouts/retries/circuit breakers/bulkheads, Saga/Outbox/Inbox).
- Idiomas: **español e inglés** desde la primera versión. Los términos técnicos de uso habitual se mantienen en inglés en ambos idiomas.

### Tipos de reto

1. **Opción múltiple**: una o varias respuestas correctas, con explicación por opción.
2. **Encontrar el bug**: fragmento Java/Kotlin/SQL donde hay que señalar la línea o el problema.
3. **Ordenar / escenario**: ordenar los pasos de una intercalación o elegir el mecanismo adecuado para un caso de negocio.
4. **Simulador interactivo**: manipular un modelo (optimistic locking paso a paso, token bucket, semáforo, latencia secuencial frente a concurrente…) y responder sobre lo observado.

### Mecánica de juego (visión completa)

- XP por retos superados y niveles.
- Estado por concepto (no empezado / en progreso / dominado).
- Rachas diarias.
- Logros.
- Repaso espaciado de las preguntas falladas.
- Simuladores interactivos integrados en la lectura y en los retos.

La visión es el juego completo; cada funcionalidad se define y prioriza en su propio documento de requisitos (`.workflow/requisites/`).

### Progreso

- Se guarda **solo en el navegador** de cada persona. No hay sincronización entre dispositivos.
- El sitio debe seguir funcionando aunque el almacenamiento del navegador no esté disponible (modo privado, datos borrados): se puede leer y responder, pero no se conserva el progreso.

## Fuera de alcance (non-goals)

- Cuentas de usuario, login o perfiles.
- Backend propio o base de datos en servidor.
- Rankings o comparación entre personas (no hay identidad compartida).
- Panel de administración: el contenido se edita como ficheros en el repositorio.
- Generar preguntas con IA en tiempo de ejecución.
- Ejecutar código real del usuario (los retos de código se evalúan con respuestas predefinidas).

## Principios de producto

- **Precisión técnica por encima de simplificación**: matizar cuando una garantía depende del motor, del aislamiento o del despliegue.
- **El mecanismo más sencillo que da las garantías necesarias**: el contenido debe enseñar a elegir, no solo a enumerar.
- **Contenido como código**: añadir un concepto o un reto no debería requerir tocar la lógica del sitio.
- **Privacidad por defecto**: sin tracking de terceros ni datos personales.

## Preguntas de producto abiertas

- ¿Los conceptos se **desbloquean** en orden al superar retos, o todo el contenido es accesible desde el principio y la progresión solo es informativa? (Al ser un sitio público, bloquear la lectura puede frustrar a quien llega buscando un concepto concreto.)
- Fórmula de XP y niveles, y qué cuenta como concepto *dominado*.
- Algoritmo de repaso espaciado (p. ej. cajas de Leitner o SM-2).
- ¿Exportar e importar el progreso (fichero JSON) para mitigar la falta de sincronización?
