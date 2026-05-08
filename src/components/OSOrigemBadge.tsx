// Badge component for OS sale origin — Venda em Ótica vs Venda Externa (Central/Fábrica).
// The optional canalOperacional prop clarifies organizational ownership for external sales.
// Reutilizável em listagem, detalhe e formulário de revisão.

import { Store, MapPin } from 'lucide-react';
import { OrigemVenda, CanalOperacional } from '@/data/types';

interface OSOrigemBadgeProps {
  origem: OrigemVenda;
  /** Explicit operational channel — used to label 'Central — Externa' correctly */
  canalOperacional?: CanalOperacional;
  /** Show an optional secondary label (e.g. the external location) */
  localAcao?: string;
  size?: 'sm' | 'md';
}

export function OSOrigemBadge({ origem, canalOperacional, localAcao, size = 'sm' }: OSOrigemBadgeProps) {
  const isExterna = origem === 'externa' || canalOperacional === 'externa';
  const textSize = size === 'md' ? 'text-[12px]' : 'text-[10px]';
  const iconSize = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3';
  const px = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';

  // Label: external sales explicitly show the organizational owner (Central/Fábrica)
  const label = isExterna ? 'Central — Externa' : 'Venda Ótica';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold ${textSize} ${px} ${
        isExterna
          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
      }`}
    >
      {isExterna ? (
        <MapPin className={iconSize} />
      ) : (
        <Store className={iconSize} />
      )}
      {label}
      {isExterna && localAcao && (
        <span className="opacity-70 font-normal">· {localAcao}</span>
      )}
    </span>
  );
}
