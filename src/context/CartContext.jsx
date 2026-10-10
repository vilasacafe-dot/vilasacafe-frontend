import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'vilasa_cart_v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // items: [{ id, name, price, image_url, quantity }]
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url || null,
          quantity: 1,
        },
      ];
    });
  }, []);

  const decrement = useCallback((id) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const setQuantity = useCallback((id, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const i of items) {
      c += i.quantity;
      s += i.price * i.quantity;
    }
    return { count: c, subtotal: Math.round(s * 100) / 100 };
  }, [items]);

  const getQuantity = useCallback((id) => items.find((i) => i.id === id)?.quantity || 0, [items]);

  const orderItems = useMemo(
    () => items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
    [items]
  );

  const value = {
    items,
    count,
    subtotal,
    orderItems,
    addItem,
    decrement,
    setQuantity,
    removeItem,
    clearCart,
    getQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
