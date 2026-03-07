import type { Tab } from '../services/tab';

export function getDisplayOrder(tabs: ReadonlyArray<Tab>): Tab[] {
  return [...tabs].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.createdAt - b.createdAt;
  });
}

export function reorder(
  tabs: ReadonlyArray<Tab>,
  tabId: string,
  newIndex: number,
): Tab[] {
  const sourceIndex = tabs.findIndex((t) => t.id === tabId);
  if (sourceIndex === -1) return [...tabs];

  const result = [...tabs];
  const moved = result.splice(sourceIndex, 1)[0] as Tab;
  const clamped = Math.max(0, Math.min(newIndex, result.length));
  result.splice(clamped, 0, moved);
  return result;
}

export function getCloseTarget(
  tabs: ReadonlyArray<Tab>,
  closingId: string,
  activeId: string,
): string | null {
  const index = tabs.findIndex((t) => t.id === closingId);
  if (index === -1) return null;
  if (closingId !== activeId) return activeId;
  if (tabs.length <= 1) return null;

  const nextTab = tabs[index + 1] ?? tabs[index - 1];
  return nextTab?.id ?? null;
}
