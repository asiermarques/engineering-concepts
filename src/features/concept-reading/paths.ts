import type { Locale } from '../../i18n/ui';

export const homePath = (locale: Locale) => `/${locale}/`;
export const topicPath = (locale: Locale, topicId: string) => `/${locale}/topics/${topicId}/`;
export const conceptPath = (locale: Locale, conceptId: string) => `/${locale}/concepts/${conceptId}/`;
