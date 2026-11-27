---
id: backend-concurrency
title: Concurrency and consistency in backend
summary: How concurrent requests break business flows, and the simplest mechanism that gives each guarantee.
---

A REST API does not solve concurrency by itself. HTTP is stateless and every request runs on its own thread, so two requests can touch the same order, the same balance or the same stock **at the same time**, on one pod or across many. Concurrency problems are solved in the client, in the application, in the database or with distributed coordination mechanisms, never by REST itself.

This topic follows a payments and checkout system and answers one question over and over: *what is the simplest mechanism that gives the guarantee we need?* It starts with the failure (race conditions), moves through local locks, optimistic and pessimistic locking, idempotency and distributed locks, then isolation levels, concurrent calls, limits and resilience, and ends with sagas.

Examples use **Java**, **Kotlin** and **SQL**. Each concept ends with an **Assessment**: multiple-choice questions that explain every option, right or wrong. If you are preparing for a senior interview, give the first eight concepts the most attention: the goal is to show that you can **choose the simplest mechanism that gives the consistency, availability and performance guarantees the business needs**.

## Which mechanism, when

| Problem | Simplest mechanism that usually gives the guarantee |
| --- | --- |
| Invariant on one row (stock, status transition) | Atomic conditional `UPDATE` and check the affected rows |
| "Only one of these may exist" (one payment per order, unique email) | Unique constraint |
| Edits with user think-time, low contention | Optimistic locking with a version or `ETag` |
| Several rows that must be read and changed together, high contention | `SELECT ... FOR UPDATE` in a short transaction |
| Client retries after timeouts | Idempotency key stored with a unique constraint |
| In-memory state inside one process | Local lock or atomic/concurrent data structure |
| Coordination across pods with no shared database row | Distributed lease plus fencing token |
| A business operation across several services | Saga with idempotent steps, outbox and inbox |
| A dependency that is slow or limited | Timeouts, bounded retries, concurrency limits, circuit breaker, bulkhead |
