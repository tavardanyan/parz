import React, { act, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  IconButton,
  Button,
  Paper,
  Collapse,
  Input,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useGlobalContext } from './GlobalContext';
import cash from './assets/cash.png'
import idram from './assets/idram.png'
import card from './assets/card.png'
import { hdmPrint, receiptPrint, req } from './api';

interface InvoiceItem {
  name: string;
  description: string;
  qty: number;
  price: number;
}

export default function Invoice({ items: order }) {
  const [items, setItems] = useState<InvoiceItem[]>([
    { name: '', description: '-', qty: 1, price: 0 },
  ]);
  const [billExpanded, setBillExpanded] = useState(false);

  const { removeItem, changeItemQty, setActiveOrderId, activeOrderId, orders } = useGlobalContext();

  const handleChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index][field] = field === 'name' || field === 'description' ? value : Number(value);
    setItems(updated);
  };

  const handleQuantity = (index: number, delta: number) => {
    changeItemQty(order.id, order.items[index].id, delta);
  };

  const handleAddItem = () => {
    alert('Tax Terminal Error')
    setItems([...items, { name: '', description: '', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    removeItem(order.id, order.items[index].id);
  };

  // const handleCheckOut = async (method) => {
  //   if (!items.length) return;
  //   console.log('ORDER', order)
  //   let amount = 0;
  //   let res = null;
  //   const data = {
  //     items: order.items.map((i, index) => {
  //       amount += i.price * i.qty;
  //       return {
  //         productCode: index,
  //         productName: i.name + `(${i.description})`,
  //         price: i.price,
  //         qty: i.qty,
  //         dep: 1,
  //         adgCode: '1905',
  //         unit: 'Հատ'
  //       }
  //     }),
  //     mode: 2,
  //     paidAmount: 0,
  //     paidAmountCard: 0,
  //   };

  //   if (method === 'card') {
  //     data.paidAmountCard = amount;
  //   } else {
  //     data.paidAmount = amount;
  //   }

  //   if(amount) {
  //     res = await hdmPrint(data)
  //   }
  //   console.log('HDM result: ', res)
  // }

  const handleCheckOut = async (method, id = activeOrderId) => {
    if (!items.length) return;
    console.log('ORDER', order)
    let amount = 0;
    let res = null;
    const activeOrder = orders.find(o => o.id === id);
    const data = {
      items: activeOrder.items.map((i, index) => {
        amount += i.price * i.qty;
        return {
          productCode: index,
          name: i.name,
          description: i.description,
          price: i.price,
          qty: i.qty,
          dep: 1,
          adgCode: '1905',
          unit: 'Հատ'
        }
      }),
      mode: 2,
      paidAmount: 0,
      paidAmountCard: 0,
      status: 'paid',
      id,
    };

    if (method === 'card') {
      data.status = 'pending'
      data.paidAmountCard = amount;
    } else {
      data.paidAmount = amount;
    }

    if(amount) {
      res = await receiptPrint(data)
    }
    console.log('HDM result: ', res)
  }

  const subtotal = order.items.reduce((acc, item) => acc + item.qty * item.price, 0);
  const tax = subtotal * 0;
  const total = subtotal + tax;

  const checkBarcode = async (code) => {
    const data = await req(code)
    const result = +data?.result || 0;
    setActiveOrderId(result);
    console.log(+result)
    setTimeout(() => {
      handleCheckOut('cash', result)
    }, 1000)
  }

  return (
    <Box sx={{ backgroundColor: (theme) => theme.palette.background, p: 4, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h4" gutterBottom>Կտրոն # {order.id}</Typography>
      <TextField
        onChange={(e) => {
            checkBarcode(e.target.value)
            e.target.value = ''
          }
        }
        variant="standard"
        InputProps={{ disableUnderline: true, style: { fontSize: 16 } }}
        fullWidth
        placeholder="Name"
      />
      {/* Bill To section */}
      <Box mb={3}>
        {/* {JSON.stringify(props, null, 2)} */}
        <Box display="flex" alignItems="center" onClick={() => setBillExpanded(!billExpanded)} sx={{ cursor: 'pointer' }}>
          <Typography variant="h6">Bill To</Typography>
          {billExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        <Collapse in={billExpanded}>
          <Box mt={1}>
            <TextField fullWidth placeholder="Customer Name" sx={{ mb: 1 }} />
            <TextField fullWidth placeholder="Address" sx={{ mb: 1 }} />
            <TextField fullWidth placeholder="Email" />
          </Box>
        </Collapse>
      </Box>

      {/* Invoice Items */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Total</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {order.items.map((item, index) => (
          <TableRow key={index}>
            {/* Name + Description */}
            <TableCell sx={{ width: 400 }}>
              <Box display="flex" flexDirection="column">
                <TextField
                  value={item.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  variant="standard"
                  InputProps={{ disableUnderline: true, style: { fontSize: 16 } }}
                  fullWidth
                  placeholder="Name"
                />
                <TextField
                  value={item.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  variant="standard"
                  InputProps={{ disableUnderline: true, style: { fontSize: 14, color: 'gray' } }}
                  fullWidth
                  placeholder="Description"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </TableCell>

            {/* Quantity */}
            <TableCell sx={{ width: 30 }}>
              <Box display="flex" alignItems="center">
                <IconButton size="small" onClick={() => handleQuantity(index, -1)}>
                  <RemoveIcon />
                </IconButton>
                <Typography sx={{ mx: 1 }}>{item.qty}</Typography>
                <IconButton size="small" onClick={() => handleQuantity(index, 1)}>
                  <AddIcon />
                </IconButton>
              </Box>
            </TableCell>

            {/* Price */}
            <TableCell sx={{ width: 100 }}>
              <TextField
                type="number"
                value={item.price}
                onChange={(e) => handleChange(index, 'price', e.target.value)}
                variant="standard"
                InputProps={{ disableUnderline: true, style: { fontSize: 16 } }}
              />
            </TableCell>

            {/* Total */}
            <TableCell sx={{ width: 50 }}>{(item.qty * item.price).toFixed(2)}</TableCell>

            {/* Delete */}
            <TableCell sx={{ width: 50 }}>
              <IconButton onClick={() => handleRemoveItem(index)}>
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      </Table>

      {/* <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddItem}
        sx={{ mt: 2 }}
      >
        Add Item
      </Button> */}

      {/* Totals */}
      <Box mt={4} textAlign="right">
        <Typography>Ընդհանուր: {subtotal.toFixed(2)}</Typography>
        <Typography>Զեղչ (0%): {tax.toFixed(2)}</Typography>
        <Typography variant="h4"><Typography>Վճարման ենթակա: </Typography>{total.toFixed(2)}</Typography>
      </Box>

      <Box mt={4} textAlign="right">
        <Box
          component="img"
          src={idram}
          alt="No Image" 
          sx={{ 
            width: 180, 
            height: 140,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            objectFit: 'contain',
            cursor: 'pointer',
            m: 1
          }}
          onClick={() => alert('Idram not configured!')}
        ></Box>
        <Box
          component="img"
          src={card}
          alt="No Image" 
          sx={{ 
            width: 180, 
            height: 140,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            objectFit: 'contain',
            cursor: 'pointer',
            m: 1
          }}
          onClick={() => handleCheckOut('card')}
        ></Box>
        <Box
          component="img"
          src={cash}
          alt="No Image" 
          sx={{ 
            width: 180, 
            height: 140,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            objectFit: 'contain',
            cursor: 'pointer',
            m: 1
          }}
          onClick={() => handleCheckOut('cash')}
        ></Box>
      </Box>
    </Box>
  );
}
