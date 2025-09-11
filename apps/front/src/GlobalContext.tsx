import { createContext, useContext, useState } from "react";

// 1. Create the context
const GlobalContext = createContext({
  
});

// 2. Make a provider component
export function GlobalContextProvider({ children }) {

  interface Order {
    id: string | number;
    items: Array<{ [key: string]: any; qty: number }>;
  }

  const [orders, setOrders] = useState<Order[]>([{
    id: 0,
    items: []
  }]);

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState<number>(0);
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const selectOption = (product, variant, option) => {
    if (!activeProduct || activeProduct.id !== product.id) {
      setActiveProduct(product);
    }
  
    if (option) {
      setSelectedOptions(prev => {
        // check if this variant already exists
        const exists = prev.find(([v]) => v.id === variant.id);
  
        if (exists) {
          // update option for existing variant
          return prev.map(([v, o]) =>
            v.id === variant.id ? [variant, option] : [v, o]
          );
        } else {
          // add new variant-option pair
          return [...prev, [variant, option]];
        }
      });
    }
  };

  const clearSelectedOptions = () => {
    setSelectedOptions([]);
  }

  const clearSelectedIngredients = () => {
    setSelectedIngredients([]);
  }

  const cleanUpSelections = () => {
    clearSelectedOptions();
    clearSelectedIngredients();
  }

  const selectIngredient = (id) => {
    setSelectedIngredients(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  }
  

  const selectActiveProduct = (product) => {
    setActiveProduct(product)
  }

  const newOrder = (order: Order) => {
    setOrders((prevOrders) => [...prevOrders, order]);
  }

  const changeItemQty = (orderId: string, itemId: string, delta: number) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== orderId) return order;
  
        return {
          ...order,
          items: order.items
            .map((item) =>
              item.id === itemId ? { ...item, qty: item.qty + delta } : item
            )
            // remove if qty goes to 0 or below
            .filter((item) => item.qty > 0),
        };
      })
    );
  };

  const removeItem = (orderId, itemId) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        // Remove item by id
        return {
          ...order,
          items: order.items.filter((item) => item.id !== itemId),
        };
      })
    );
  }

  const addItemToOrder = (orderId, newItem: { [key: string]: any }) => {
    if (orderId) {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id !== orderId) return order;
  
          // Check if item already exists
          const existingItem = order.items.find((i) => i.id === newItem.id && i.name === newItem.name && i.description === newItem.description);
  
          if (existingItem) {
            // Increment qty
            return {
              ...order,
              items: order.items.map((i) =>
                i.id === newItem.id && i.name === newItem.name && i.description === newItem.description ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          } else {
            // Add new item
            return {
              ...order,
              items: [...order.items, { ...newItem, qty: 1 }],
            };
          }
        })
      );
    } else {
      // If no orderId, create a new order with the item
      let newId = 0;
      setOrders((prevOrders) => {
        newId = prevOrders.length; // Use the current length as the new ID
        return [
          ...prevOrders,
          { id: newId, items: [{ ...newItem, qty: 1 }] },
        ];
      });
      setActiveOrderId(newId); // Set the new order as active
    }
  };
  


  return (
    <GlobalContext.Provider value={{ orders, newOrder, addItemToOrder, activeOrderId, setActiveOrderId, removeItem, changeItemQty, selectedOptions, selectOption, activeProduct, selectActiveProduct, selectedIngredients, selectIngredient, cleanUpSelections }}>
      {children}
    </GlobalContext.Provider>
  );
}

// 3. Custom hook (for cleaner usage)
export function useGlobalContext() {
  return useContext(GlobalContext);
}
