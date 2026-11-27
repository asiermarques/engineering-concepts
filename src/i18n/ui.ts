export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const isLocale = (value: string | undefined): value is Locale =>
  locales.includes(value as Locale);

export const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'es' : 'en');

export interface AssessmentLabels {
  heading: string;
  needsJavascript: string;
  selectAll: string;
  confirm: string;
  correct: string;
  incorrect: string;
  correctOption: string;
  missingOption: string;
  extraOption: string;
  yourAnswer: string;
  result: string;
  repeat: string;
  answered: string;
  question: string;
  cannotSave: string;
}

export interface ProgressLabels {
  status: { 'not-started': string; 'in-progress': string; mastered: string };
  lastResult: string;
  masteredUnit: string;
  heading: string;
  description: string;
  reset: string;
  resetConfirm: string;
  resetConfirmYes: string;
  resetDone: string;
  export: string;
  import: string;
  importConfirm: string;
  importConfirmYes: string;
  importDone: string;
  importInvalid: string;
  cancel: string;
}

export interface SimulatorLabels {
  controls: string;
  restart: string;
  previous: string;
  next: string;
  play: string;
  pause: string;
  playing: string;
  paused: string;
  step: string;
  of: string;
  state: string;
  note: string;
}

export interface UiStrings {
  siteTitle: string;
  skipToContent: string;
  language: string;
  languageName: string;
  currentLanguage: string;
  topicConcepts: string;
  learningObjective: string;
  conceptNavigation: string;
  previous: string;
  next: string;
  backToTopic: string;
  startReading: string;
  topicLabel: string;
  conceptsUnit: string;
  start: string;
  conceptLabel: string;
  conceptOf: string;
  homeHeading: string;
  homeSummary: string;
  topicsLabel: string;
  topicUnit: string;
  topicsUnit: string;
  enterTopic: string;
  allTopics: string;
  assessment: AssessmentLabels;
  progress: ProgressLabels;
  simulator: SimulatorLabels;
}

export const ui: Record<Locale, UiStrings> = {
  en: {
    siteTitle: 'Engineering Concepts',
    skipToContent: 'Skip to content',
    language: 'Language',
    languageName: 'English',
    currentLanguage: 'current language',
    topicConcepts: 'Concepts',
    learningObjective: 'Learning objective',
    conceptNavigation: 'Concept navigation',
    previous: 'Previous',
    next: 'Next',
    backToTopic: 'All concepts',
    startReading: 'Read concept',
    topicLabel: 'Topic',
    conceptsUnit: 'concepts',
    start: 'Start',
    conceptLabel: 'Concept',
    conceptOf: 'of',
    homeHeading: 'Choose a topic',
    homeSummary: 'Each topic is an ordered path of concepts: how each mechanism works inside, how to implement it and when it is worth using. Every concept ends with an assessment.',
    topicsLabel: 'Topics',
    topicUnit: 'topic',
    topicsUnit: 'topics',
    enterTopic: 'Enter',
    allTopics: 'All topics',
    assessment: {
      heading: 'Assessment',
      needsJavascript: 'The assessment needs JavaScript. Enable it to answer the questions.',
      selectAll: 'Choose all the correct options, then confirm.',
      confirm: 'Confirm selection',
      correct: 'Correct',
      incorrect: 'Incorrect',
      correctOption: 'Correct answer',
      missingOption: 'Correct option not selected',
      extraOption: 'Incorrect option selected',
      yourAnswer: 'Your answer',
      result: 'Result',
      repeat: 'Repeat assessment',
      answered: 'Answered',
      question: 'Question',
      cannotSave: "Progress can't be saved in this browser: it will be lost when you leave this page.",
    },
  progress: {
      status: { 'not-started': 'Not started', 'in-progress': 'In progress', mastered: 'Mastered' },
      lastResult: 'Last result',
      masteredUnit: 'mastered',
      heading: 'Your progress',
      description: 'Saved only in this browser. Export it to keep a copy or to continue in another browser.',
      reset: 'Reset progress',
      resetConfirm: 'This erases all your progress in this browser. Do you want to reset it?',
      resetConfirmYes: 'Yes, reset',
      resetDone: 'Progress reset.',
      export: 'Export progress',
      import: 'Import progress',
      importConfirm: 'Importing replaces all your current progress with the file. Do you want to continue?',
      importConfirmYes: 'Yes, import',
      importDone: 'Progress imported.',
      importInvalid: "This file can't be imported: it is not a valid progress file. Your progress has not changed.",
      cancel: 'Cancel',
    },
    simulator: {
      controls: 'Simulator controls',
      restart: 'Restart',
      previous: 'Previous',
      next: 'Next',
      play: 'Play',
      pause: 'Pause',
      playing: 'Playing',
      paused: 'Paused',
      step: 'Step',
      of: 'of',
      state: 'State',
      note: 'Note',
    },
  },
  es: {
    siteTitle: 'Engineering Concepts',
    skipToContent: 'Saltar al contenido',
    language: 'Idioma',
    languageName: 'Español',
    currentLanguage: 'idioma actual',
    topicConcepts: 'Conceptos',
    learningObjective: 'Objetivo de aprendizaje',
    conceptNavigation: 'Navegación entre conceptos',
    previous: 'Anterior',
    next: 'Siguiente',
    backToTopic: 'Todos los conceptos',
    startReading: 'Leer concepto',
    topicLabel: 'Tema',
    conceptsUnit: 'conceptos',
    start: 'Empezar',
    conceptLabel: 'Concepto',
    conceptOf: 'de',
    homeHeading: 'Elige un tema',
    homeSummary: 'Cada tema es un recorrido ordenado de conceptos: cómo funciona cada mecanismo por dentro, cómo se implementa y cuándo conviene usarlo. Cada concepto termina con una evaluación.',
    topicsLabel: 'Temas',
    topicUnit: 'tema',
    topicsUnit: 'temas',
    enterTopic: 'Entrar',
    allTopics: 'Todos los temas',
    assessment: {
      heading: 'Evaluación',
      needsJavascript: 'La evaluación necesita JavaScript. Actívalo para responder las preguntas.',
      selectAll: 'Elige todas las opciones correctas y confirma.',
      confirm: 'Confirmar selección',
      correct: 'Correcta',
      incorrect: 'Incorrecta',
      correctOption: 'Respuesta correcta',
      missingOption: 'Opción correcta no seleccionada',
      extraOption: 'Opción incorrecta seleccionada',
      yourAnswer: 'Tu respuesta',
      result: 'Resultado',
      repeat: 'Repetir evaluación',
      answered: 'Respondidas',
      question: 'Pregunta',
      cannotSave: 'El progreso no se puede guardar en este navegador: se perderá al salir de esta página.',
    },
  progress: {
      status: { 'not-started': 'Sin empezar', 'in-progress': 'En curso', mastered: 'Dominado' },
      lastResult: 'Último resultado',
      masteredUnit: 'dominados',
      heading: 'Tu progreso',
      description: 'Se guarda solo en este navegador. Expórtalo para conservar una copia o continuar en otro navegador.',
      reset: 'Reiniciar progreso',
      resetConfirm: 'Esto borra todo tu progreso en este navegador. ¿Quieres reiniciarlo?',
      resetConfirmYes: 'Sí, reiniciar',
      resetDone: 'Progreso reiniciado.',
      export: 'Exportar progreso',
      import: 'Importar progreso',
      importConfirm: 'Importar reemplaza todo tu progreso actual con el del archivo. ¿Quieres continuar?',
      importConfirmYes: 'Sí, importar',
      importDone: 'Progreso importado.',
      importInvalid: 'No se puede importar este archivo: no es un archivo de progreso válido. Tu progreso no ha cambiado.',
      cancel: 'Cancelar',
    },
    simulator: {
      controls: 'Controles del simulador',
      restart: 'Reiniciar',
      previous: 'Anterior',
      next: 'Siguiente',
      play: 'Reproducir',
      pause: 'Pausa',
      playing: 'Reproduciendo',
      paused: 'En pausa',
      step: 'Paso',
      of: 'de',
      state: 'Estado',
      note: 'Nota',
    },
  },
};
