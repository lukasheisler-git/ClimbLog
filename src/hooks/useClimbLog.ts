import { useCallback, useEffect, useState } from 'react';
import { deleteRoute, loadRoutes, saveRoute } from '../storage/climblogStorage';
import { ClimbResult, ClimbRoute, ClimbStyle, GRADES } from '../types/climblog';

export type SortOrder = 'date-desc' | 'date-asc' | 'grade-asc' | 'grade-desc';

export interface FilterState {
  query:     string;
  gradeFrom: string;
  gradeTo:   string;
  style:     ClimbStyle | 'Alle';
  result:    ClimbResult | 'Alle';
  sort:      SortOrder;
}

export const DEFAULT_FILTER: FilterState = {
  query:     '',
  gradeFrom: GRADES[0],
  gradeTo:   GRADES[GRADES.length - 1],
  style:     'Alle',
  result:    'Alle',
  sort:      'date-desc',
};

export function gradeIndex(g: string): number {
  const idx = (GRADES as readonly string[]).indexOf(g);
  return idx >= 0 ? idx : 0;
}

export function applyFilter(routes: ClimbRoute[], filter: FilterState): ClimbRoute[] {
  const fromIdx = gradeIndex(filter.gradeFrom);
  const toIdx   = gradeIndex(filter.gradeTo);
  const q       = filter.query.toLowerCase().trim();

  const filtered = routes.filter(r => {
    if (q && !r.name.toLowerCase().includes(q) && !(r.area ?? '').toLowerCase().includes(q)) return false;
    const gi = gradeIndex(r.grade);
    if (gi < fromIdx || gi > toIdx) return false;
    if (filter.style  !== 'Alle' && r.style  !== filter.style)  return false;
    if (filter.result !== 'Alle' && r.result !== filter.result) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filter.sort) {
      case 'date-desc':  return b.createdAt - a.createdAt;
      case 'date-asc':   return a.createdAt - b.createdAt;
      case 'grade-asc':  return gradeIndex(a.grade) - gradeIndex(b.grade);
      case 'grade-desc': return gradeIndex(b.grade) - gradeIndex(a.grade);
    }
  });
}

export function useClimbLog() {
  const [routes, setRoutes] = useState<ClimbRoute[]>([]);

  const reload = useCallback(async () => {
    setRoutes(await loadRoutes());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (route: ClimbRoute) => {
    await saveRoute(route);
    setRoutes(prev => [route, ...prev]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteRoute(id);
    setRoutes(prev => prev.filter(r => r.id !== id));
  }, []);

  return { routes, reload, add, remove };
}
