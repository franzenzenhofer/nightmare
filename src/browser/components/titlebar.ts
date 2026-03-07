import type { Tab } from '../services/tab';

const APP_NAME = 'Nightmare';

export function getWindowTitle(tab: Tab | undefined): string {
  if (!tab) return APP_NAME;

  const trimmed = tab.title.trim();
  const display = trimmed || tab.url;
  if (!display) return APP_NAME;

  return `${display} - ${APP_NAME}`;
}
