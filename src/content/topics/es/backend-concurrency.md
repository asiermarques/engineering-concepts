---
id: backend-concurrency
title: Concurrencia y consistencia en backend
summary: Cómo las peticiones concurrentes rompen los flujos de pago y checkout, y cuál es el mecanismo más sencillo que da cada garantía.
---

Este tema es una preparación de **System Design y arquitectura backend**. Profundiza en cómo funciona cada mecanismo internamente, cómo se implementa y cuándo conviene utilizarlo.

Una API REST no resuelve por sí misma la concurrencia. HTTP no tiene estado y cada petición se ejecuta en su propio hilo, así que dos peticiones pueden tocar el mismo pedido, el mismo saldo o el mismo stock **a la vez**, en un pod o en varios. Los problemas de concurrencia se resuelven en el cliente, en la aplicación, en la base de datos o mediante mecanismos de coordinación distribuida, nunca por REST en sí.

Este tema sigue un sistema de pagos y checkout y responde una y otra vez a la misma pregunta: *¿cuál es el mecanismo más sencillo que da la garantía que necesitamos?* Empieza por el fallo (race conditions), pasa por locks locales, optimistic y pessimistic locking, idempotencia y locks distribuidos, después niveles de aislamiento, llamadas concurrentes, límites y resiliencia, y termina con sagas.

Los ejemplos usan **Java**, **Kotlin** y **SQL**. Cada concepto acaba con una **Evaluación**: preguntas de opción múltiple que explican todas las opciones, correctas o no. Si preparas una entrevista senior, dedica especial atención a los ocho primeros conceptos: el objetivo es demostrar que sabes **elegir el mecanismo más sencillo que da las garantías de consistencia, disponibilidad y rendimiento que necesita el negocio**.

## Qué mecanismo usar y cuándo

| Problema | Mecanismo más sencillo que suele dar la garantía |
| --- | --- |
| Invariante sobre una fila (stock, transición de estado) | `UPDATE` condicional atómico y comprobar las filas afectadas |
| «Solo puede existir uno» (un pago por pedido, email único) | Restricción de unicidad |
| Ediciones con tiempo de reflexión del usuario, poca contención | Optimistic locking con versión o `ETag` |
| Varias filas que hay que leer y cambiar juntas, mucha contención | `SELECT ... FOR UPDATE` en una transacción corta |
| Reintentos del cliente tras timeouts | Clave de idempotencia guardada con restricción de unicidad |
| Estado en memoria dentro de un proceso | Lock local o estructura atómica/concurrente |
| Coordinación entre pods sin una fila compartida en base de datos | Lease distribuido más fencing token |
| Una operación de negocio entre varios servicios | Saga con pasos idempotentes, outbox e inbox |
| Una dependencia lenta o limitada | Timeouts, reintentos acotados, límites de concurrencia, circuit breaker, bulkhead |
