# Ubiquitous Language

Canonical terms are in English and are used in code, docs and the English UI. The **Spanish** column gives the equivalent term for the Spanish UI and content; both name the same concept.

## Content

| Term | Spanish | Definition | Aliases to avoid |
| --- | --- | --- | --- |
| **Topic** | Tema | Ordered set of **Concepts** about one area of engineering, e.g. *Concurrency and consistency in backend*. | Route, module, track, course |
| **Concept** | Concepto | The site's reading unit, about one engineering mechanism, with its explanation, examples and **Assessment**. | Lesson, article, page, section, card |
| **Learning objective** | Objetivo de aprendizaje | Sentence stating what the **Learner** should be able to do after studying a **Concept**. | Description, checklist item, goal |
| **Static walkthrough** | Versión estática | Non-interactive representation (table or step diagram) of what a **Simulator** will show. | Placeholder, simulator image |
| **Translation** | Traducción | Version of a **Concept** or **Challenge** in a specific **Locale**, with the same id in every locale. | Variant, copy |
| **Locale** | Idioma | Language the site is presented in: Spanish (`es`) or English (`en`). | Language, region |

## Challenges and assessment

| Term | Spanish | Definition | Aliases to avoid |
| --- | --- | --- | --- |
| **Challenge** | Reto | A single exercise, of a specific **Challenge type**, that checks understanding of a **Concept**. | Question (as a generic term), exercise, quiz, item |
| **Challenge type** | Tipo de reto | Form of a **Challenge**: *multiple choice*, *find the bug*, *ordering / scenario* or *simulator*. | Mode, format |
| **Multiple-choice question** | Pregunta de opción múltiple | **Challenge** where one or several **Options** are chosen from a list. | Test, quiz |
| **Option** | Opción | Each possible answer of a **Multiple-choice question**; it can be correct or incorrect. | Alternative, choice |
| **Explanation** | Explicación | Text attached to an **Option** that justifies why it is correct or incorrect. | Feedback, justification, hint, solution |
| **Answer** | Respuesta | The selection a **Learner** makes in a **Challenge**. | Attempt, submission |
| **Assessment** | Evaluación | The set of **Challenges** of a **Concept**, which the **Learner** solves in one go. | Challenge (as a set), quiz, test, exam |
| **Result** | Resultado | Correct answers over total of a completed **Assessment**, e.g. 3/4. | Score, grade, mark, XP |
| **Simulator** | Simulador | Interactive model of a mechanism (e.g. token bucket) that the **Learner** manipulates, inside the reading or as a **Challenge**. | Demo, animation, playground |

## People

| Term | Spanish | Definition | Aliases to avoid |
| --- | --- | --- | --- |
| **Learner** | Estudiante | Anonymous person who reads **Concepts** and solves **Challenges** on the site. | User (there are no accounts), visitor, player, student |
| **Author** | Autor | Person who writes, reviews and publishes content in the repository. | Admin, editor, maintainer |

## Progress and gamification

**Progress** and **Concept status** are implemented (requirement 002); the rest appear in PRODUCT.md and will be refined in their own requirements.

| Term | Spanish | Definition | Aliases to avoid |
| --- | --- | --- | --- |
| **Progress** | Progreso | The **Learner**'s state on the site, stored only in their browser. | Profile, account, history |
| **Concept status** | Estado del concepto | Situation of a **Concept** for the **Learner**: *not started*, *in progress* or *mastered*. | Completed (undefined), seen |
| **XP** | XP | Experience points the **Learner** earns by passing **Challenges**. | Points, score |
| **Level** | Nivel | Step the **Learner** reaches by accumulating **XP**. | Rank, tier, grade |
| **Streak** | Racha | Number of consecutive days with **Learner** activity. | Series, combo |
| **Achievement** | Logro | Recognition the **Learner** unlocks by meeting a specific condition. | Medal, badge, trophy |
| **Spaced review** | Repaso espaciado | Scheduling new attempts at failed **Challenges** at increasing intervals. | Repetition, revision, flashcards |

## Relationships

- A **Topic** contains one or more **Concepts**, in a fixed order.
- A **Concept** belongs to exactly one **Topic** and has exactly one **Learning objective**.
- A **Concept** has exactly one **Assessment**, made of one or more **Challenges** (at least 3 in requirement 001).
- A **Challenge** belongs to exactly one **Concept** and has exactly one **Challenge type**.
- A **Multiple-choice question** has two or more **Options**, at least one correct, and each **Option** has exactly one **Explanation**.
- A completed **Assessment** produces exactly one **Result**; the **Result** is not **XP**.
- Each **Concept** and each **Challenge** has one **Translation** per **Locale**.

## Example dialogue

> **Dev:** "If the **Learner** gets a **Multiple-choice question** wrong, do we show only the **Explanation** of the **Option** they chose?"
> **Author:** "No, the explanations of all **Options**. You often learn more by seeing why the option that looked right isn't."
> **Dev:** "When they finish a **Concept**'s **Assessment** and see 3/4, is that their **XP**?"
> **Author:** "No. That's the **Result** of that **Assessment**. **XP** will come with gamification and will be awarded per passed **Challenge**, not per **Assessment**."
> **Dev:** "So when we add a 'find the bug', is that another **Assessment**?"
> **Author:** "It's another **Challenge**, with another **Challenge type**, inside the same **Concept**'s **Assessment**."

## Flagged ambiguities

- "challenge" (*reto*) was used both for a single exercise (PRODUCT.md, ARCHITECTURE.md) and for the set of questions of a concept (requirement 001). Decision: **Challenge** is the single exercise and **Assessment** is the set. Requirement 001 must be updated ("multiple-choice challenge with all its questions", "challenge summary", "retry the challenge").
- "question" was used as a generic synonym for exercise. Use it only in **Multiple-choice question**; for the generic term, use **Challenge**.
- "section" referred to the numbered parts (§1–§15) of the original material. It is not a **Concept**: several sections can feed one **Concept** (e.g. §7 and §8 → *Transaction isolation*).
- "route" (*ruta*) appeared in PRODUCT.md as a synonym for **Topic**. If a learning path across several **Topics** is ever needed, it will be a new term, not an alias of **Topic**.
- "score" could refer both to an **Assessment**'s **Result** and to **XP**. They are different concepts and must not be mixed in the UI.
- "user" suggests an account, and the site has no accounts (PRODUCT.md, *Non-goals*). Use **Learner**.
