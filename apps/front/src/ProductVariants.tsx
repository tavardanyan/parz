import { Box, Card, CardContent, Paper, Typography } from "@mui/material";
import { useState } from "react";

import imagePath from './assets/coffee_3497933.png'; // Adjust the path as necessary
import { useGlobalContext } from "./GlobalContext";
import ProductIngredients from "./ProductIngredients";

export default function ProductVariants({ item }) {
  const [variants, setVariants] = useState(item.variants);
  const { selectedOptions, selectOption } = useGlobalContext();

  const getImagePath = (slug) => {
    return new URL(`./assets/${slug}.png`, import.meta.url).href;
  }
  const handleClick = (opt, variant) => {
    if (variant) {
      selectOption(item, variant, opt);
    } else {
      selectOption(item, opt, undefined);
    }
  
    // if this option is selected, add its children variants
    if (opt.variants && opt.variants.length > 0) {
      setVariants(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const newOnes = opt.variants.filter(v => !existingIds.has(v.id));
        if (newOnes.length === 0) return prev; // no change → no re-render
        return [...prev, ...newOnes];
      });
    }
  };

  const box = (opt, variant) => {
    let isSelected = false;
    // console.log('VARIANT', variant)
    if (variant) {
      // if (variant.default === opt.id) {
      //   selectOption(item, variant, opt);
      //   isSelected = true;
      // }
      selectedOptions.map(pair => {
        console.log(pair)
        if (pair[0].id === variant.id && pair[1].id === opt.id) {
          isSelected = true;
        }
      });
    }

    const getColor = (delta) => {
      if (delta > 0) return 'success.main';
      if (delta < 0) return 'error.main';
      return 'warning.main';
    };
    return (
      <>
        <Card
          sx={{
            backgroundColor: isSelected ? 'primary.light' : 'background.paper',
            flex: 1,
            '&:hover': {
              cursor: 'pointer',
              transition: 'box-shadow 0.5s ease', // smooth transition
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)', // shadow on hover
            },
          }}
          onClick={() => handleClick(opt, variant)}
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
                flex: 1,
                border: 1,
                borderRadius: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: getColor(opt.delta),
                borderColor: getColor(opt.delta),
                fontSize: 16,
                m: -1,
                p: 0.5,
                fontWeight: 1000,
                paddingX: 1
              }}>
                {opt.delta !== undefined ? opt.delta + " ֏" : "0 ֏"}
              </Box>
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
                src={getImagePath(opt.slug)}
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
                {opt.name}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    variants.map((v, i) => (
      <Box>
        <Box display="flex" width="100%" sx={{ border: 2, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          {/* Left Column (30%) */}
          <Box
            flex="0 0 30%"
            p={5}
            display="flex"
            alignItems="start"
            justifyContent="center"
          >
            { box(v, null) }
          </Box>
          {/* {JSON.stringify(item.variants)} */}
          {/* Right Column (70%) with scrollable row of boxes */}
          <Box
            flex="0 0 70%"
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
                  key={i}
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
                  {console.log('VVV', v) || v.options.map(o => box(o, v))}
                </Box>
            </Box>
          </Box>
        </Box>
        <ProductIngredients item={item} />
      </Box>
    ))
  );
}
