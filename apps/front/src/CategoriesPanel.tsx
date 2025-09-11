import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import ProductItem from './ProductItem';
import { useDb } from './hooks/useDb';
import type { ProductItemType } from './types';

interface CategoriesPanelProps {
  displayMode: 'list' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-6';
  onCategoryClick: (category: ProductItemType) => void;
  smColsMap: string;
}

export default function CategoriesPanel({ displayMode, onCategoryClick }: CategoriesPanelProps) {
  const { data, loading, error } = useDb<ProductItemType>({
    model: 'categories',
    selector: { select: '*, images(*)', parent_id: 'is.null' },
    autoFetch: true,
  });

  const getSmCols = () => displayMode === 'list' ? 12 : Math.floor(12 / parseInt(displayMode.split('-')[1]));
  const smCols = getSmCols();

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height={200}>
      <CircularProgress />
    </Box>
  );

  if (error) return <Typography color="error">{error}</Typography>;
  if (!data || data.length === 0) return <Typography>No categories found.</Typography>;

  return (
    <Box>
      <Typography variant='h6' sx={{ mb: 1 }}>Categories</Typography>
      <Grid container spacing={2}>
        {data.map((item, index) => (
          <Grid size={smCols} key={index} onClick={() => onCategoryClick(item)}>
            <ProductItem item={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
