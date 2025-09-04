// src/components/Sidebar.tsx
import { FC } from 'react';
import { Icon, IconName } from './images/Icons';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

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

export const Sidebar: FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <aside
      className={[
        // siempre en STRING, no objeto
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

      <div className="mt-6 p-3 rounded-lg bg-light-50 border border-light-50">
        <p className="text-sm text-mid-500">Saldo disponible</p>
        <p className="text-xl font-semibold">$25,340.00</p>
        <button className="mt-3 bg-santander-500 text-white px-4 py-2 rounded-md hover:opacity-95 active:scale-95 w-full">
          Depositar
        </button>
      </div>
    </aside>
  );
};