import { useState } from 'react';
import { useDb } from './useDb';

export function useProducts(initialParentId: string | null = null, autoFetch = true) {
  const [parentId, setParentId] = useState(initialParentId);

  const { data, loading, error, setSelector } = useDb({
    model: 'categories_products',
    selector: parentId
      ? { select: 'product:products(*, images(*))', categoryId: `eq.${parentId}` }
      : { select: 'product:products(*, images(*))', categoryId: 'is.null' },
    autoFetch,
  });

  const fetchProducts = (newParentId: string | null = null) => {
    setParentId(newParentId);
    setSelector(newParentId
      ? { select: 'product:products(*, images(*))', categoryId: `eq.${newParentId}` }
      : { select: 'product:products(*, images(*))', categoryId: 'is.null' }
    );
    // fetchData();
  };

  return {
    data: data.map(p => p.product) || [],
    loading,
    error,
    fetchData: fetchProducts,
  };
}
