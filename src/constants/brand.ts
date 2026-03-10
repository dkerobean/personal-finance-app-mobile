import { COLORS } from '@/constants/design';

export function getKippoMarkSvg(fill: string = COLORS.white): string {
  return `<svg width="64" height="64" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M16 84L33 16H49L32 84H16Z" fill="${fill}"/>
  <path d="M43 45L61 16H83L60 45H43Z" fill="${fill}"/>
  <path d="M43 55H60L83 84H61L43 55Z" fill="${fill}"/>
</svg>`;
}

export const KIPPO_MARK_WHITE_SVG = getKippoMarkSvg(COLORS.white);
export const KIPPO_MARK_PRIMARY_SVG = getKippoMarkSvg(COLORS.primary);
