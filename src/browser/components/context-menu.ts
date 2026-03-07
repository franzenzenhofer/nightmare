export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly separator?: boolean;
}

export type MenuContext = 'page' | 'link' | 'tab' | 'image';

const item = (id: string, label: string, separator?: boolean): MenuItem => ({
  id,
  label,
  enabled: true,
  ...(separator === true ? { separator: true } : {}),
});

const PAGE_ITEMS: readonly MenuItem[] = [
  item('back', 'Back'),
  item('forward', 'Forward'),
  item('reload', 'Reload', true),
  item('view-source', 'View Source'),
  item('inspect', 'Inspect'),
] as const;

const LINK_ITEMS: readonly MenuItem[] = [
  item('open-new-tab', 'Open in New Tab'),
  item('copy-link', 'Copy Link', true),
  item('inspect', 'Inspect'),
] as const;

const TAB_ITEMS: readonly MenuItem[] = [
  item('new-tab', 'New Tab'),
  item('duplicate', 'Duplicate'),
  item('pin', 'Pin/Unpin', true),
  item('close-tab', 'Close Tab'),
  item('close-others', 'Close Other Tabs'),
] as const;

const IMAGE_ITEMS: readonly MenuItem[] = [
  item('open-image', 'Open Image'),
  item('save-image', 'Save Image'),
  item('copy-image-url', 'Copy Image URL', true),
  item('inspect', 'Inspect'),
] as const;

const MENU_MAP: Record<MenuContext, readonly MenuItem[]> = {
  page: PAGE_ITEMS,
  link: LINK_ITEMS,
  tab: TAB_ITEMS,
  image: IMAGE_ITEMS,
} as const;

export class ContextMenuLogic {
  getMenuItems(context: MenuContext): readonly MenuItem[] {
    return MENU_MAP[context];
  }
}
