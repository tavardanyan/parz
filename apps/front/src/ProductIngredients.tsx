import { Box, Card, CardContent, Typography } from "@mui/material";

import { useGlobalContext } from "./GlobalContext";
import { useIngredients } from "./hooks/useIngredients";

export default function ProductIngredients({ item }) {
  const { selectedIngredients, selectIngredient } = useGlobalContext();
  const { data } = useIngredients();

  const filteredData = data.filter(ing => item.variants[0].ingredients.includes(ing.id));
  const flavors = filteredData.filter(ing => ing.type === 'flavor');
  const sauce = filteredData.filter(ing => ing.type === 'sauce');
  
  const getImagePath = (image) => {
    console.log(image)
    return new URL(`./assets/${image?.url}`, import.meta.url).href;
  }
  const handleClick = (id) => {
    selectIngredient(id);
  };

  const box = (ingredient) => {
    // selectIngredient(ingredient);
    let isSelected = selectedIngredients.includes(ingredient.id)
    return (
      <>
        <Card
          sx={(theme) => ({
            backgroundColor: isSelected
              ? 'hsl(0, 90%, 65%)'
              : theme.palette.background.paper,
            flex: 1,
            '&:hover': {
              cursor: 'pointer',
              transition: 'box-shadow 0.5s ease',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            },
          })}
          onClick={() => handleClick(ingredient.id)}
        >

          <CardContent sx={{ height: '100%' }}>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="space-around"
              alignItems="center"
              height="100%"
              >
              <Box sx={{
                  width: '100%',
                  height: 100, // You can adjust this as needed
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 2
                }}
                >
              <Box
                component="img"
                src={getImagePath(ingredient.images)}
                alt="No Image"
                sx={{
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}/>
              </Box>
              <Typography sx={{
                  textAlign: 'center',
                  mt: 1,
                  fontWeight: 'bold',
                }}
              >
                { isSelected ? (<del>{ingredient.name}</del>) : ingredient.name}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <>
    {/* {JSON.stringify(data)} */}
    {/* {data ? data.map((ingredient, i) => ( */}
      <Box display="flex" width="100%" sx={{ border: 2, borderColor: 'divider', borderRadius: 1, mb: 2}}>
        {/* Left Column (30%) */}

        {/* {JSON.stringify(item.variants)} */}
        {/* Right Column (70%) with scrollable row of boxes */}
        <Box
          flex="0 0 100%"
          p={2}
          display="flex"
          overflow="hidden"
        >
          <Box
            gap={2}
            sx={{
              overflowX: "auto",
              display: "flex",
              p: 3
            }}
            flex="1"
          >
            
              <Box
                sx={{
                  // minWidth: 200,
                  // height: 120,
                  flexShrink: 0, // prevents shrinking so horizontal scroll works
                  display: "flex",
                  alignItems: "start",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                {flavors.map(box)}
              </Box>
          </Box>
        </Box>
      </Box>
      <Box display="flex" width="100%" sx={{ border: 2, borderColor: 'divider', borderRadius: 1}}>
        {/* Left Column (30%) */}

        {/* {JSON.stringify(item.variants)} */}
        {/* Right Column (70%) with scrollable row of boxes */}
        <Box
          flex="0 0 100%"
          p={2}
          display="flex"
          overflow="hidden"
        >
          <Box
            gap={2}
            sx={{
              overflowX: "auto",
              display: "flex",
              p: 3
            }}
            flex="1"
          >
            
              <Box
                sx={{
                  // minWidth: 200,
                  // height: 120,
                  flexShrink: 0, // prevents shrinking so horizontal scroll works
                  display: "flex",
                  alignItems: "start",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                {sauce.map(box)}
              </Box>
          </Box>
        </Box>
      </Box>
    {/* )) : (<Typography>{loading ? 'Loading...' : 'ready!'}</Typography>)} */}
    </>
  );
}
