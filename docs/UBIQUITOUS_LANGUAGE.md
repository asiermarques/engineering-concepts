# Ubiquitous Language

Los términos canónicos están en español. La columna **English** da el término equivalente para el código y para la interfaz en inglés; los dos nombran el mismo concepto.

## Contenido

| Term | English | Definition | Aliases to avoid |
| --- | --- | --- | --- |
| **Tema** | Topic | Conjunto ordenado de **Conceptos** sobre un mismo ámbito de la ingeniería, p. ej. *Concurrencia y consistencia en backend*. | Ruta, módulo, track, curso |
| **Concepto** | Concept | Unidad de lectura del sitio, sobre un mecanismo de ingeniería, con su explicación, ejemplos y **Evaluación**. | Lección, artículo, página, sección, tarjeta |
| **Objetivo de aprendizaje** | Learning objective | Frase que dice qué debe saber hacer el **Estudiante** tras estudiar un **Concepto**. | Descripción, ítem de checklist, meta |
| **Versión estática** | Static walkthrough | Representación no interactiva (tabla o diagrama de pasos) de lo que mostrará un **Simulador**. | Placeholder, imagen del simulador |
| **Traducción** | Translation | Versión de un **Concepto** o **Reto** en un **Idioma** concreto, con el mismo identificador en todos los idiomas. | Variante, copia |
| **Idioma** | Locale | Idioma en el que se presenta el sitio: español (`es`) o inglés (`en`). | Lengua, language (en español), región |

## Retos y evaluación

| Term | English | Definition | Aliases to avoid |
| --- | --- | --- | --- |
| **Reto** | Challenge | Ejercicio suelto, de un **Tipo de reto** concreto, que comprueba la comprensión de un **Concepto**. | Pregunta (como término genérico), ejercicio, quiz, ítem |
| **Tipo de reto** | Challenge type | Forma del **Reto**: *opción múltiple*, *encontrar el bug*, *ordenar / escenario* o *simulador*. | Modalidad, formato |
| **Pregunta de opción múltiple** | Multiple-choice question | **Reto** en el que se eligen una o varias **Opciones** de una lista. | Test, quiz, pregunta tipo test |
| **Opción** | Option | Cada respuesta posible de una **Pregunta de opción múltiple**; puede ser correcta o incorrecta. | Alternativa, choice (en español) |
| **Explicación** | Explanation | Texto asociado a una **Opción** que justifica por qué es correcta o incorrecta. | Feedback, justificación, pista, solución |
| **Respuesta** | Answer | Selección que hace el **Estudiante** en un **Reto**. | Intento, envío, submission |
| **Evaluación** | Assessment | Conjunto de **Retos** de un **Concepto**, que el **Estudiante** resuelve de una vez. | Reto (como conjunto), quiz, test, examen, prueba |
| **Resultado** | Result | Aciertos sobre total de una **Evaluación** completada, p. ej. 3/4. | Puntuación, score, nota, XP |
| **Simulador** | Simulator | Modelo interactivo de un mecanismo (p. ej. token bucket) que el **Estudiante** manipula, dentro de la lectura o como **Reto**. | Demo, animación, playground |

## Personas

| Term | English | Definition | Aliases to avoid |
| --- | --- | --- | --- |
| **Estudiante** | Learner | Persona anónima que lee **Conceptos** y resuelve **Retos** en el sitio. | Usuario (no hay cuentas), visitante, jugador, alumno |
| **Autor** | Author | Persona que escribe, revisa y publica el contenido en el repositorio. | Admin, editor, mantenedor |

## Progreso y gamificación (planificado)

Estos términos están en PRODUCT.md pero no en el requisito 001. Se refinarán en sus propios requisitos.

| Term | English | Definition | Aliases to avoid |
| --- | --- | --- | --- |
| **Progreso** | Progress | Estado del **Estudiante** en el sitio, guardado solo en su navegador. | Perfil, cuenta, historial |
| **Estado del concepto** | Concept status | Situación de un **Concepto** para el **Estudiante**: *no empezado*, *en progreso* o *dominado*. | Completado (sin definir), visto |
| **XP** | XP | Puntos de experiencia que obtiene el **Estudiante** al superar **Retos**. | Puntos, puntuación, score |
| **Nivel** | Level | Escalón que alcanza el **Estudiante** al acumular **XP**. | Rango, tier, grado |
| **Racha** | Streak | Número de días consecutivos con actividad del **Estudiante**. | Serie, combo |
| **Logro** | Achievement | Reconocimiento que desbloquea el **Estudiante** al cumplir una condición concreta. | Medalla, badge, trofeo |
| **Repaso espaciado** | Spaced review | Programación de nuevos intentos de los **Retos** fallados a intervalos crecientes. | Repetición, revisión, flashcards |

## Relationships

- Un **Tema** contiene uno o más **Conceptos**, en un orden fijo.
- Un **Concepto** pertenece a exactamente un **Tema** y tiene exactamente un **Objetivo de aprendizaje**.
- Un **Concepto** tiene exactamente una **Evaluación**, formada por uno o más **Retos** (al menos 3 en el requisito 001).
- Un **Reto** pertenece a exactamente un **Concepto** y tiene exactamente un **Tipo de reto**.
- Una **Pregunta de opción múltiple** tiene dos o más **Opciones**, al menos una correcta, y cada **Opción** tiene exactamente una **Explicación**.
- Una **Evaluación** completada produce exactamente un **Resultado**; el **Resultado** no es **XP**.
- Cada **Concepto** y cada **Reto** tienen una **Traducción** por cada **Idioma**.

## Example dialogue

> **Dev:** "Si el **Estudiante** responde mal una **Pregunta de opción múltiple**, ¿le enseñamos solo la **Explicación** de la **Opción** que eligió?"
> **Autor:** "No, la de todas las **Opciones**. Muchas veces se aprende más viendo por qué la opción que parecía correcta no lo es."
> **Dev:** "Cuando termina la **Evaluación** del **Concepto** y ve 3/4, ¿eso es su **XP**?"
> **Autor:** "No. Eso es el **Resultado** de esa **Evaluación**. El **XP** llegará con la gamificación y se dará por **Reto** superado, no por **Evaluación**."
> **Dev:** "Entonces, cuando añadamos un 'encontrar el bug', ¿es otra **Evaluación**?"
> **Autor:** "Es otro **Reto**, con otro **Tipo de reto**, dentro de la misma **Evaluación** del **Concepto**."

## Flagged ambiguities

- "reto" se usaba tanto para un ejercicio suelto (PRODUCT.md, ARCHITECTURE.md) como para el conjunto de preguntas de un concepto (requisito 001). Decisión: **Reto** es el ejercicio suelto y **Evaluación** es el conjunto. Hay que actualizar el requisito 001 ("reto de opción múltiple con todas sus preguntas", "resumen del reto", "repetir el reto").
- "pregunta" se usaba como sinónimo genérico de ejercicio. Úsese solo en **Pregunta de opción múltiple**; para el término genérico, **Reto**.
- "sección" designaba las partes numeradas (§1–§15) del material original. No es un **Concepto**: varias secciones pueden alimentar un mismo **Concepto** (p. ej. §7 y §8 → *Transaction isolation*).
- "ruta" aparecía en PRODUCT.md como sinónimo de **Tema**. Si en el futuro hace falta un itinerario que cruce varios **Temas**, será un término nuevo, no un alias de **Tema**.
- "puntuación" podía referirse tanto al **Resultado** de una **Evaluación** como al **XP**. Son conceptos distintos y no deben mezclarse en la interfaz.
- "usuario" sugiere una cuenta, y el sitio no tiene cuentas (PRODUCT.md, *Fuera de alcance*). Úsese **Estudiante**.
