import { useDb } from './useDb';

export function useIngredients(autoFetch = true) {

  const { data, loading, error, setSelector } = useDb({
    model: 'ingredients',
    selector: { select: '*, images(*)' },
    autoFetch,
  });

  const fetchIngredients = () => {
    setSelector({ select: '*, images(*)' });
  };

  return {
    data: data || [],
    loading,
    error,
    fetchData: fetchIngredients,
  };
}
