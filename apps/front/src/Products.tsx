import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, ToggleButtonGroup, ToggleButton, Grid, Typography, Breadcrumbs, Chip, CircularProgress,
  Button,
  IconButton,
  TextField,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ViewListSharpIcon from '@mui/icons-material/ViewListSharp';
import WindowSharpIcon from '@mui/icons-material/WindowSharp';
import ViewModuleSharpIcon from '@mui/icons-material/ViewModuleSharp';
import ViewCompactSharpIcon from '@mui/icons-material/ViewCompactSharp';

import ProductItem from './ProductItem';
import { useCategories } from './hooks/useCategories';
import { useProducts } from './hooks/useProducts';
import { useGlobalContext } from './GlobalContext';
import ProductVariants from './ProductVariants';
import { useIngredients } from './hooks/useIngredients';

import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

interface ProductItemType {
  id?: string;
  name?: string;
  price?: number;
  image?: string;
  imageSize?: string;
  sub?: string;
  multi?: {
    name: string;
    child: { name: string; price: number; image: string; imageSize?: number }[];
  }[];
}

interface PageItem { name: string; parent_id: string | null; reset?: boolean; }

export default function Products() {
  const [page, setPage] = useState<PageItem[]>([{ name: 'Home', parent_id: null, reset: true }]);
  const [displayMode, setDisplayMode] = useState<'list' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-6'>('grid-3');
  const [productWithVariants, setProductWithVariants] = useState<ProductItemType>({
    variants: [],
  });

  const parentId = page[page.length - 1]?.parent_id ?? null;

  const { orders, addItemToOrder, newOrder, activeOrderId, activeProduct, selectActiveProduct, activeOptions, selectedOptions, selectedIngredients, cleanUpSelections } = useGlobalContext();

  // Hooks
  const { data: categories, loading: categoriesLoading, error: categoriesError, fetchData: fetchCategories } = useCategories(parentId);
  const { data: products, loading: productsLoading, error: productsError, fetchData: fetchProducts } = useProducts(parentId);
  const { data: ingredients } = useIngredients();

  const mergedData = useMemo(() => [...categories, ...products], [categories, products]);
  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  const handleDisplayChange = (_: React.MouseEvent<HTMLElement>, newValue: typeof displayMode | null) => {
    if (newValue) setDisplayMode(newValue);
  };

  const handlePageChange = (newPage: PageItem, resetVariants = true) => {
    resetVariants && setProductWithVariants({ variants: [] }); // Reset product with variants
    setPage(prev => {
      const index = prev.findIndex(p => p.parent_id === newPage.parent_id);
      if (index >= 0) return prev.slice(0, index + 1);
      return [...prev, { ...newPage, reset: resetVariants }];
    });
  };

  const mountedRef = useRef(false);
  useEffect(() => {
    if(!mountedRef.current) {
      mountedRef.current = true;
      return; // Prevent initial fetch on mount
    }
    // Fetch initial data when component mounts
    fetchCategories(page.at(-1)?.parent_id);
    fetchProducts(page.at(-1)?.parent_id);
    return () => cleanUpSelections();
  }, [page])

  const handleProductClick = (item: ProductItemType) => {
    if (item.isProduct) {
      // If it's a product, handle it directly
      // item.variants = item.variants || [{}];
      console.log('Product clicked:', item);
      if (item.variants.length) {

        // handlePageChange({ name: item.name || 'Item', parent_id: item.id ?? null }, false);
        setProductWithVariants(item);
        selectActiveProduct(item);
        return;
      }
      addItemToOrder(activeOrderId, item);
      return;
    }
    handlePageChange({ name: item.name || 'Item', parent_id: item.id ?? null}, true);
  };

  const getSmCols = () => displayMode === 'list' ? 12 : Math.floor(12 / parseInt(displayMode.split('-')[1]));
  const smCols = getSmCols();
  let price = activeProduct ? activeProduct.price : 0;

  const removedIngredients = () => {
    const names = ingredients.filter(ing =>
      selectedIngredients.includes(ing.id)
    );
  
    return (
      <>
        (
        {names.map((n, idx) => (
          <span key={n.id}>
            <del>{n.name}</del>
            {idx < names.length - 1 ? ', ' : ''}
          </span>
        ))}
        )
      </>
    );
  };

  const productDescription = selectedIngredients.length ? removedIngredients() : '';
  const productDescriptionText = selectedIngredients.length ? `առանց (${ingredients.filter(ing => selectedIngredients.includes(ing.id)).map(i => i.name).join(', ')})` : '';
  const productName = (activeProduct && selectedOptions.length) ? activeProduct.name + ' ' + (selectedOptions.length ? `[${selectedOptions[0][1].name}]` : '') : '';

  const Incrementer = ({ initialCount = 1, desc, price }) => {
    const [count, setCount] = useState(initialCount);
  
    const increment = () => setCount(prev => prev + 1);
    const decrement = () => setCount(prev => Math.max(1, prev - 1));
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      setCount(isNaN(val) || val < 1 ? 1 : val);
    };

    const handler = (count) => {
      addItemToOrder(activeOrderId, { ...activeProduct, name: productName,   qty: count, description: desc ? desc : 'FULL', price });
    }
  
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', width: '100%' }}>
        {/* Row with - input + */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <IconButton
            onClick={decrement}
            size="large"
            sx={{ width: 50, height: 50, fontSize: 32 }}
          >
            <RemoveIcon fontSize="inherit" />
          </IconButton>
  
          <TextField
            value={count}
            onChange={handleChange}
            inputProps={{ style: { textAlign: 'center', fontSize: 32 } }}
            sx={{ width: 100 }}
          />
  
          <IconButton
            onClick={increment}
            size="large"
            sx={{ width: 50, height: 50, fontSize: 32 }}
          >
            <AddIcon fontSize="inherit" />
          </IconButton>
          <Button
            variant="contained"
            color="success"
            size="large"
            sx={{ width: '100%', height: 50, fontSize: 20 }}
            onClick={() => handler(count)}
          >
            Ավելացնել
          </Button>
        </Box>
  
        {/* Add Product button below */}
      </Box>
    );
  };
  return (
    <Box p={4} height="100%" width="100%" position="relative">
      {loading && (
        <Box position="absolute" top={0} left={0} width="100%" height="100%"
          bgcolor="rgba(255,255,255,0.6)" display="flex" justifyContent="center"
          alignItems="center" zIndex={10} sx={{ backdropFilter: 'blur(4px)' }}
        >
          <CircularProgress size={48} />
        </Box>
      )}

      {error && <Typography color="error" mb={1}>{error}</Typography>}
      {/* {parentId} */}
      <Box sx={{ filter: loading ? 'blur(2px)' : 'none' }}>
        <Box display="flex" justifyContent="flex-end" gap={2} mb={1}>
          <ToggleButtonGroup value={displayMode} exclusive onChange={handleDisplayChange} size="small">
            <ToggleButton value="list"><ViewListSharpIcon /></ToggleButton>
            <ToggleButton value="grid-3"><WindowSharpIcon /></ToggleButton>
            <ToggleButton value="grid-4"><ViewModuleSharpIcon /></ToggleButton>
            <ToggleButton value="grid-6"><ViewCompactSharpIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 1 }}>
          {page.map((p, index) => (
            <Chip key={index} label={p.name} variant="outlined" onClick={() => handlePageChange(p)} />
          ))}
        </Breadcrumbs>

        {productWithVariants.variants.length > 0 ? (
          <Box mb={1}
            display="flex"
            flexDirection="column"
            height="100%"        // <-- must resolve to real height
            flex={1}             // <-- ensures it grows inside parent flex
            minHeight="1000px"    // (example) force some space
          >
            {/* <Typography variant="h6">Select a variant for {productWithVariants.name}</Typography> */}
            {/* {productWithVariants.variants.map((variant, index) => (
              <p>variant</p>
            ))} */}
            <ProductVariants item={productWithVariants} />
            <Box mt="auto" sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              height: 120,
              display: 'flex',
            }}>
              <Box sx={{ flex: '0 0 50%', p: 2}}>
                <Typography>{productName} {productDescription}</Typography>
                  {selectedOptions.map(pair => {
                    price = price + pair[1].delta;
                    return (
                    <Typography>{`${pair[0].name}: ${pair[1].name} (${pair[1].delta})`}</Typography>
                  )
                })}
                  <Typography variant='h2'>{price}</Typography>
              </Box>
              <Box sx={{ flex: '0 0 50%', p: 2}}>
                <Incrementer initialCount={1} desc={productDescriptionText} price={price}/>
                {/* <Button variant="contained" color="primary" onClick={() => {}}>Add to Order</Button> */}
              </Box>
            </Box>
          </Box>
        ) :
        (mergedData.length === 0 && !loading ? (
            <Typography>No products found in this page.</Typography>
          ) : (
            <Grid container spacing={2}>
              {mergedData.map((item, index) => {
                console.log('Rendering item:', item);
                item.isProduct = !(item.price === undefined); // Treat as category if no price
                return (
                  <Grid size={smCols} key={index} onClick={() => handleProductClick(item)}>
                    <ProductItem item={item} />
                  </Grid>
                  )
                }
              )}
            </Grid>
          )
        )}
      </Box>
    </Box>
  );
}
