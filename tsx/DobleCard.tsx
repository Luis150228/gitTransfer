// Vite + React + Tailwind v4 — Santander style starter con TypeScript typings // src/components/DoubleCard.tsx import { ReactNode } from "react";

interface DoubleCardProps { minHeight?: string; // por ejemplo "180px" bgColor?: string; // clases tailwind ej. "bg-santander-500" textColor?: string; // clases tailwind ej. "text-white" children: ReactNode; // el contenido completo que quieras pasar (h3, p, div...) }

function DoubleCard({ minHeight = "180px", bgColor = "bg-santander-500", textColor = "text-white", children, }: DoubleCardProps) { return ( <div className={card lg:col-span-4 ${bgColor} ${textColor}} style={{ minHeight }} > {children} </div> ); }

export default DoubleCard;

// Ejemplo de uso /* <DoubleCard>

  <h3 className="font-semibold mb-2 text-white">Resumen</h3>
  <p className="text-sm text-mid-500">Equipos en Almacen</p>
  <div className="mt-4 h-28 rounded-lg bg-light-50" />
</DoubleCard>
*/