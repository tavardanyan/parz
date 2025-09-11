import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../api';

type Selector = Record<string, any> | null;

interface UseDbOptions {
  model: string;
  selector?: Selector;
  autoFetch?: boolean; // fetch automatically on mount and when selector changes
}

export function useDb<T = any>({ model, selector: initialSelector = null, autoFetch = true }: UseDbOptions) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [selector, setSelector] = useState<Selector>(initialSelector);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await db.get(model, selector ? { ...selector } : { select: '*' });
      console.log(`Fetched data for model "${model}":`, res);
      setData(res.result as T[]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [model, selector]);

  // Auto-fetch when selector changes
  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch, selector]);

  const insert = useCallback(
    async (items: T[], refresh = true) => {
      try {
        setLoading(true);
        const result = await db.insert(model, items);
        if (refresh) await fetchData();
        return result;
      } catch (err: any) {
        setError(err.message || 'Insert failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [model, fetchData]
  );

  const update = useCallback(
    async (sel: Selector, items: Partial<T>[], refresh = true) => {
      try {
        setLoading(true);
        const result = await db.update(model, sel, items);
        if (refresh) await fetchData();
        return result;
      } catch (err: any) {
        setError(err.message || 'Update failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [model, fetchData]
  );

  const remove = useCallback(
    async (sel: Selector, refresh = true) => {
      try {
        setLoading(true);
        const result = await db.delete(model, sel);
        if (refresh) await fetchData();
        return result;
      } catch (err: any) {
        setError(err.message || 'Delete failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [model, fetchData]
  );

  return { data: data || [], loading, error, selector, setSelector, fetchData, insert, update, remove };
}
