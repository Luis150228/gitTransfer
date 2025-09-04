// src/components/images/Icons.tsx
import type { ReactElement } from 'react';

export type IconName =
  | 'grid'
  | 'wallet'
  | 'card'
  | 'plant'
  | 'home'
  | 'hand'
  | 'umbrella'
  | 'help';

const icons: Record<IconName, ReactElement> = {
  grid: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7h18v10H3z" />
      <path d="M16 12h5" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  plant: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22V12" />
      <path d="M12 12s-3-2-6-2-3 4 0 4 6-2 6-2z" />
      <path d="M12 12s3-2 6-2 3 4 0 4-6-2-6-2z" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11l9-7 9 7" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  hand: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12s2-2 5-2 4 2 6 2 4-1 7-1v4c-3 0-6 1-8 1-3 0-4-2-7-2-2 0-3 1-3 1z" />
    </svg>
  ),
  umbrella: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2C6 2 3 7 3 12h18C21 7 18 2 12 2z" />
      <path d="M12 12v7" />
    </svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 9a3 3 0 1 1 6 0c0 2-3 2-3 4" />
      <path d="M12 17h.01" />
    </svg>
  ),
};

export function Icon({ name }: { name: IconName }) {
  return icons[name];
}