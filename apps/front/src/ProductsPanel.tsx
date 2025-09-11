import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import ProductItem from './ProductItem';
import { useDb } from './hooks/useDb';
import type { ProductItemType } from './types';
import { useEffect } from 'react';

interface ProductsPanelProps {
  category: ProductItemType;
  displayMode: 'list' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-6';
  smColsMap: string;
}

export default function ProductsPanel({ category, displayMode }: ProductsPanelProps) {
  const { data, loading, error, fetchData } = useDb<ProductItemType>({
    model: 'categories_products',
    selector: {
      select: 'product:products(*)',
      categoryId: `eq.${category.id}`
    },
    autoFetch: true
  });

  useEffect(() => {
    fetchData();
  }, [category.id]);

  const getSmCols = () => displayMode === 'list' ? 12 : Math.floor(12 / parseInt(displayMode.split('-')[1]));
  const smCols = getSmCols();

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height={200}>
      <CircularProgress />
    </Box>
  );

  if (error) return <Typography color="error">{error}</Typography>;
  if (!data || data.length === 0) return <Typography>No products in this category.</Typography>;

  return (
    <Box mt={4}>
      <Typography variant='h6' sx={{ mb: 1 }}>Products in {category.name}</Typography>
      <Grid container spacing={2}>
        {data.map((item, index) => (
          <Grid size={smCols} key={index}>
            <ProductItem item={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
