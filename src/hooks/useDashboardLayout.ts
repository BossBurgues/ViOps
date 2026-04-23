import { useEffect, useState, useCallback } from 'react';

// Persist dashboard layout per (userId, role, unidadeId) tuple.
// This keeps each user's customization isolated by context, including
// per-unit overrides (e.g. a gestor may prefer a different layout when
// inspecting a specific unit vs. the consolidated view).

export function useDashboardLayout<T>(
  scope: { userId: string; role: string; unidadeId: string },
  defaultValue: T,
) {
  const key = `viops:dashboard_layout:${scope.userId}:${scope.role}:${scope.unidadeId}`;

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  // Re-hydrate when scope key changes (e.g. user switches profile or unidade)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setValue(raw ? (JSON.parse(raw) as T) : defaultValue);
    } catch {
      setValue(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue(prev => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore quota / unavailable
        }
        return resolved;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, persist, reset] as const;
}
