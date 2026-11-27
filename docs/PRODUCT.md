# Product: Engineering Concepts

## Vision

A public website for **reading, practising and proving understanding of software engineering concepts**, starting with interview preparation for **System Design and backend architecture**. Each concept explains how the mechanism works inside, how it is implemented and when to use it, and ends with challenges that require applying it.

The site works as a **learning game**: progress, experience points (XP), levels, streaks and achievements motivate learners to come back and review what they got wrong.

## Target user

- Backend engineers preparing for System Design interviews, or who want to go deeper into concurrency, consistency and resilience mechanisms.
- Reference profile for the first content: experience in payments, checkout and distributed systems, with examples in Java, Kotlin and SQL.
- **Anonymous** use: no accounts or login. Anyone can visit and use it.

## Value proposition

- Explanations at senior-interview depth, not glossary definitions: cases that fail, why they fail, and the simplest solution that gives the required guarantees.
- Varied challenges that test real understanding, not memory.
- Interactive simulators that make visible what happens over time (request interleaving, tokens, permits, latencies).
- A growing catalogue: concepts, challenges and questions are added without redesigning the site.

## Current state

Implemented (requirement 001): the topic *Concurrency and consistency in backend* with its 13 concepts in Spanish and English, each with its **Assessment** of multiple-choice questions (one or several correct answers, explanation per option, **Result** and retry). Interactive simulators inside the reading (requirement 003): the 9 Concepts that depend on timing (race conditions, locking, deadlocks, permits, latency, sagas) embed a step-through **Simulator** with actor lanes, the state after each step, optional step notes, and Previous / Next / Restart / Play-Pause controls; it stores nothing and does not affect **Progress**, and without JavaScript its **Static walkthrough** (every step, state and note) is shown. Local progress saving (requirement 002): the **Learner**'s **Answers**, best and last **Result** and **Concept status** are kept in the browser, so a half-done **Assessment** survives a reload or locale switch; the topic map shows each **Concept status** and last **Result**, the home topic cards show the mastered count, and the home page has a "Your progress" panel to reset, export and import **Progress**. No XP, levels, streaks, achievements or spaced review yet. The content (including the Simulators' states and notes) was written by Claude from the original material (sections 1–15) and is **pending technical review by the Author**.

## Product scope

### Content

- **Concept**: the reading unit (e.g. *Optimistic locking*). It belongs to a **topic** (e.g. *Concurrency and consistency in backend*).
- Each concept has an explanation, code examples and one or more **challenges**.
- First topic: backend concurrency and System Design (race conditions, atomicity, local locks, optimistic/pessimistic locking, idempotency, distributed locking, transaction isolation and MVCC, deadlocks, fan-out/fan-in and structured concurrency, threading models, semaphores and connection pools, rate limiting and backpressure, timeouts/retries/circuit breakers/bulkheads, Saga/Outbox/Inbox).
- Locales: **Spanish and English** from the first version. Commonly used technical terms stay in English in both locales.

### Challenge types

1. **Multiple choice**: one or several correct answers, with an explanation per option.
2. **Find the bug**: a Java/Kotlin/SQL snippet where the learner points out the line or the problem.
3. **Ordering / scenario**: order the steps of an interleaving, or choose the right mechanism for a business case.
4. **Interactive simulator**: manipulate a model (step-by-step optimistic locking, token bucket, semaphore, sequential vs. concurrent latency…) and answer questions about what was observed.

### Game mechanics (full vision)

- XP for passed challenges, and levels.
- Status per concept (not started / in progress / mastered).
- Daily streaks.
- Achievements.
- Spaced review of failed questions.
- Interactive simulators embedded in the reading and in challenges.

The vision is the full game; each feature is defined and prioritised in its own requirements document (`.workflow/requisites/`).

### Progress

- Stored **only in each learner's browser**. No sync between devices.
- The site must keep working when browser storage is unavailable (private mode, cleared data): learners can read and answer, but progress is not kept, and a discreet notice near the **Assessment** says so.
- **Concept status**: *not started* (no **Answer**), *in progress* (some **Answer**, never a fully correct completed **Assessment**), *mastered* (at least one completed **Assessment** with every question correct). *Mastered* is sticky: a worse later attempt does not undo it; the last **Result** is shown. This is deliberate.
- Retrying starts a new attempt with all questions unanswered; the best and last **Result** are kept.
- The **Learner** can reset **Progress** (in-page confirmation), export it to a JSON file and import such a file; importing **replaces** current **Progress** after an in-page confirmation. The file contains only **Progress** and its schema version.

## Non-goals

- User accounts, login or profiles.
- Own backend or server-side database.
- Leaderboards or comparison between people (there is no shared identity).
- Admin panel: content is edited as files in the repository.
- Generating questions with AI at runtime.
- Running the learner's real code (code challenges are graded against predefined answers).

## Product principles

- **Technical accuracy over simplification**: qualify claims when a guarantee depends on the engine, the isolation level or the deployment.
- **The simplest mechanism that gives the required guarantees**: content should teach how to choose, not just enumerate.
- **Content as code**: adding a concept or a challenge should not require touching the site's logic.
- **Privacy by default**: no third-party tracking or personal data.

## Open product questions

- Are concepts **unlocked** in order by passing challenges, or is all content accessible from the start with progression being informational only? (As a public site, locking the reading may frustrate someone who arrives looking for a specific concept.)
- XP and level formula.
- Spaced review algorithm (e.g. Leitner boxes or SM-2).
