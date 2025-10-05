import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Product = Tables<'products'>;
type CartItemRow = Tables<'cart_items'> & { products: Product };

interface CartItem {
  id: string; // This is the product_id
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  // This is the core logic fix.
  // This effect now correctly handles the state logic based on authentication status.
  useEffect(() => {
    // 1. Wait until the authentication status is confirmed.
    // This prevents the cart from being cleared prematurely on a page refresh.
    if (authLoading) {
      setCartLoading(true);
      return;
    }

    // 2. Once authentication is resolved, check if a user is logged in.
    if (user) {
      // 2a. User is logged in. Fetch their cart from the database.
      const fetchUserCart = async () => {
        setCartLoading(true);
        const { data, error } = await supabase
          .from("cart_items")
          .select(`*, products(*)`)
          .eq("user_id", user.id);

        if (error) {
          toast.error("Could not fetch your cart from the database.");
          console.error("Cart fetch error:", error);
          setItems([]);
        } else {
          const fetchedItems: CartItem[] = data.map((item: CartItemRow) => ({
            id: item.product_id,
            name: item.products.name,
            price: item.products.price,
            quantity: item.quantity,
            image_url: item.products.image_url || undefined,
          }));
          setItems(fetchedItems);
        }
        setCartLoading(false);
      };
      fetchUserCart();
    } else {
      // 2b. No user is logged in (user is a guest).
      // It is now safe to clear the cart, as we know they are not authenticated.
      setItems([]);
      setCartLoading(false);
    }
  }, [user, authLoading]);

  const addItem = async (item: Omit<CartItem, "quantity">) => {
    if (!user) {
      toast.error("Please log in to add items to your cart.");
      return;
    }

    const existingItem = items.find(i => i.id === item.id);
    const newQuantity = (existingItem?.quantity || 0) + 1;

    const { error } = await supabase.from('cart_items').upsert(
      { user_id: user.id, product_id: item.id, quantity: newQuantity },
      { onConflict: 'user_id, product_id' }
    );
    
    if (error) {
      toast.error("Failed to add item to cart.");
    } else {
      toast.success("Added to cart");
      // Optimistically update the local state for a faster UI response.
      const updatedItems = existingItem
        ? items.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i)
        : [...items, { ...item, quantity: 1 }];
      setItems(updatedItems);
    }
  };

  const removeItem = async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('cart_items').delete().match({ user_id: user.id, product_id: id });
    if (error) {
      toast.error("Failed to remove item.");
    } else {
      toast.success("Removed from cart");
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    if (!user) return;

    const { error } = await supabase.from('cart_items').update({ quantity }).match({ user_id: user.id, product_id: id });
    if (error) {
      toast.error("Failed to update quantity.");
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
    if (error) {
      toast.error("Failed to clear cart.");
    } else {
      setItems([]);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, loading: cartLoading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};