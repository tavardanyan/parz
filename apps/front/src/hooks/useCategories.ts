import { useState } from 'react';
import { useDb } from './useDb';

export function useCategories(initialParentId: string | null = null, autoFetch = true) {
  const [parentId, setParentId] = useState(initialParentId);

  const { data, loading, error, setSelector } = useDb({
    model: 'categories',
    selector: parentId
      ? { select: '*, images(*)', parent_id: `eq.${parentId}` }
      : { select: '*, images(*)', parent_id: 'is.null' },
    autoFetch,
  });

  const fetchCategories = (newParentId: string | null = null) => {
    setParentId(newParentId);
    setSelector(newParentId
      ? { select: '*, images(*)', parent_id: `eq.${newParentId}` }
      : { select: '*, images(*)', parent_id: 'is.null' }
    );
  };

  return {
    data: data || [],
    loading,
    error,
    fetchData: fetchCategories,
  };
}
