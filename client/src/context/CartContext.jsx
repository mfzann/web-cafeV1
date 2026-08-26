import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cafeorder_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orderType, setOrderType] = useState(() => {
    return localStorage.getItem('cafeorder_order_type') || 'dine_in';
  });

  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('cafeorder_table_number') || '';
  });

  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('cafeorder_customer_name') || '';
  });

  const [cafeSettings, setCafeSettings] = useState({
    tax_rate: 10,
    service_fee: 5,
    cafe_name: 'CafeOrder Bistro',
    operational_status: { isOpen: true, message: '' }
  });

  // Load cafe settings
  useEffect(() => {
    fetch('/api/public/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCafeSettings(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch cafe settings:', err));
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cafeorder_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('cafeorder_order_type', orderType);
  }, [orderType]);

  useEffect(() => {
    localStorage.setItem('cafeorder_table_number', tableNumber);
  }, [tableNumber]);

  useEffect(() => {
    localStorage.setItem('cafeorder_customer_name', customerName);
  }, [customerName]);

  const addToCart = (menuItem, quantity = 1, note = '') => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.menuItem.id === menuItem.id && item.note === note
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { menuItem, quantity, note }];
      }
    });
  };

  const updateQuantity = (index, newQty) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCartItems(prev => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const updateNote = (index, newNote) => {
    setCartItems(prev => {
      const updated = [...prev];
      updated[index].note = newNote;
      return updated;
    });
  };

  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const taxAmount = (subtotal * (cafeSettings.tax_rate || 0)) / 100;
  const serviceAmount = (subtotal * (cafeSettings.service_fee || 0)) / 100;
  const grandTotal = subtotal + taxAmount + serviceAmount;
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        updateNote,
        removeFromCart,
        clearCart,
        orderType,
        setOrderType,
        tableNumber,
        setTableNumber,
        customerName,
        setCustomerName,
        cafeSettings,
        subtotal,
        taxAmount,
        serviceAmount,
        grandTotal,
        totalItemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
