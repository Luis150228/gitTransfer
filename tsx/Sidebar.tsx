// src/components/Sidebar.tsx
import { Icon } from './images/Icons';
import type { IconName } from './images/Icons';

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const items: { label: string; icon: IconName }[] = [
  { label: 'Resumen', icon: 'grid' },
  { label: 'Cuentas', icon: 'wallet' },
  { label: 'Tarjetas', icon: 'card' },
  { label: 'Inversiones', icon: 'plant' },
  { label: 'Crédito hipotecario', icon: 'home' },
  { label: 'Crédito personal', icon: 'hand' },
  { label: 'Seguros', icon: 'umbrella' },
  { label: 'Soporte', icon: 'help' },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside
      className={[
        'fixed md:sticky left-0 top-14 md:top-0 z-30',
        'w-72 md:w-64',
        'h-[calc(100dvh-3.5rem)] md:h-[100dvh]',
        'bg-white border-r border-light-50 p-4',
        'overflow-y-auto transition-transform duration-200 md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <nav className="space-y-1">
        {items.map((it) => (
          <a
            key={it.label}
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-light-50 text-sm"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <Icon name={it.icon} />
            {it.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}