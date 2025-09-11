import {
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';

export interface ProductItemProps {
  isVariant?: boolean;
  item: {
    id?: string;
    name?: string;
    price?: number;
    image_id?: string;
    imageSize?: string;
  };
}

export default function ProductItem(props: ProductItemProps) {
  const { isVariant } = props;
  const options = isVariant ? {
    width: 180,
    maxHeight: 180,
    minHeight: 180,
  } : {};

  const imagePath = new URL(`./assets/${props.item.images?.url}`, import.meta.url).href;
  return (
    <>
      {props.item.isProduct && (
        // <Chip sx={{ position: 'absolute', m: 1 }} variant="outlined" color="success" label={props.item.price + " ֏"}/>
        <Paper elevation={6} sx={{ color: 'success.main', borderColor: 'success.main', fontSize: 16, position: 'absolute', m: -1, p: 0.5, fontWeight: 1000, paddingX: 1 }} variant="outlined" color="success" >{props.item.price + " ֏"}</Paper>
      )}
      <Card
        {...props}
        sx={{
          ...options,
          flex: 1,
          '&:hover': {
            cursor: 'pointer',
            transition: 'box-shadow 0.5s ease', // smooth transition
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)', // shadow on hover
          },
        }}
      >
        <CardContent sx={{ height: '100%' }}>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="space-around"
            alignItems="center"
            height="100%"
          >
            <Box
              sx={{
                width: '100%',
                height: 120, // You can adjust this as needed
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src={imagePath}
                alt="No Image"
                sx={{
                  width: props.item.imageSize ? `${props.item.imageSize - 20}%` : '80%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>

            <Typography
              sx={{
                textAlign: 'center',
                mt: 1,
                fontWeight: 'bold',
              }}
            >
              {props.item.name}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}