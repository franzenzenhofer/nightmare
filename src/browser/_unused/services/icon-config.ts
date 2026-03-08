export type IconFormat = 'png' | 'ico' | 'icns';

export interface IconConfig {
  readonly size: number;
  readonly format: IconFormat;
  readonly outputPath: string;
}

export const ICON_SIZES: readonly number[] = Object.freeze([
  16, 32, 48, 64, 128, 256, 512,
]);

export function createIconConfigs(
  basePath: string,
  format: IconFormat = 'png',
): readonly IconConfig[] {
  const configs = ICON_SIZES.map((size): IconConfig =>
    Object.freeze({
      size,
      format,
      outputPath: `${basePath}/icon-${String(size)}.${format}`,
    }),
  );
  return Object.freeze(configs);
}

export function getIconPath(
  size: number,
  basePath: string,
  format: IconFormat = 'png',
): string {
  if (!ICON_SIZES.includes(size)) {
    throw new Error(`Invalid icon size: ${String(size)}`);
  }
  return `${basePath}/icon-${String(size)}.${format}`;
}

const SVG_PARTS: readonly string[] = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
  '<rect width="512" height="512" rx="48" fill="#1a1a2e"/>',
  '<g fill="none" stroke="#ff4444" stroke-width="28" stroke-linecap="round">',
  '<line x1="128" y1="384" x2="128" y2="128"/>',
  '<line x1="128" y1="128" x2="384" y2="384"/>',
  '<line x1="384" y1="128" x2="384" y2="384"/>',
  '</g>',
  '<rect x="0" y="220" width="512" height="24" fill="#1a1a2e" opacity="0.9"/>',
  '<rect x="8" y="220" width="512" height="24" fill="#ff4444" opacity="0.15"/>',
  '<rect x="0" y="300" width="512" height="16" fill="#1a1a2e" opacity="0.85"/>',
  '<rect x="-6" y="300" width="512" height="16" fill="#ff4444" opacity="0.12"/>',
  '<g fill="none" stroke="#ff4444" stroke-width="28" stroke-linecap="round"',
  '   opacity="0.5" transform="translate(6,0)">',
  '<line x1="128" y1="220" x2="128" y2="244"/>',
  '<line x1="200" y1="220" x2="230" y2="244"/>',
  '<line x1="384" y1="220" x2="384" y2="244"/>',
  '</g>',
  '<rect x="0" y="160" width="512" height="2" fill="#ff4444" opacity="0.08"/>',
  '<rect x="0" y="260" width="512" height="1" fill="#ff4444" opacity="0.06"/>',
  '<rect x="0" y="350" width="512" height="2" fill="#ff4444" opacity="0.08"/>',
  '</svg>',
];

export const NIGHTMARE_ICON_SVG: string = SVG_PARTS.join('\n');
