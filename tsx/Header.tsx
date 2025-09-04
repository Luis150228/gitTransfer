// src/components/Header.tsx
import { FC } from 'react';

type HeaderProps = {
  onToggleSidebar: () => void;
};

export const Header: FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-40 h-14 bg-white border-b border-mid-500/20">
      <div className="h-full max-w-7xl mx-auto flex items-center px-4 gap-3">
        <button
          onClick={onToggleSidebar}
          className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-md border border-mid-500/20 hover:bg-light-50"
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {/* tu logo aquí */}
          <span className="font-semibold tracking-tight text-dark-900">Mi Banco</span>
        </div>
      </div>
    </header>
  );
};