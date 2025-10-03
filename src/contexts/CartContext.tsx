import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Product = Tables<'products'>;
type CartItemRow = Tables<'cart_items'> & { products: Product };

interface CartItem {
  id: string; // This will be the product_id
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
  const { user, session } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch cart from DB for logged-in user
  const fetchCart = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select(`*, products(*)`)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Could not fetch your cart.");
      console.error(error);
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
    setLoading(false);
  }, [user]);
  
  // Merge local cart with DB cart on login
  const mergeAndClearLocalCart = useCallback(async (localCart: CartItem[]) => {
    if (!user || localCart.length === 0) return;

    const upserts = localCart.map(item => ({
      user_id: user.id,
      product_id: item.id,
      quantity: item.quantity
    }));
    
    const { error } = await supabase.from('cart_items').upsert(upserts, { onConflict: 'user_id, product_id' });
    
    if (error) {
      toast.error("Could not merge your cart items.");
    } else {
      // Clear local state before fetching merged cart
      setItems([]);
      await fetchCart();
    }
  }, [user, fetchCart]);

  useEffect(() => {
    if (user && session) {
      const localCart = items; // items from guest session
      if (localCart.length > 0) {
        mergeAndClearLocalCart(localCart);
      } else {
        fetchCart();
      }
    } else {
      // User is logged out, clear cart
      setItems([]);
      setLoading(false);
    }
  }, [user, session, fetchCart, mergeAndClearLocalCart]);


  const addItem = async (item: Omit<CartItem, "quantity">) => {
    if (user) {
      const { data, error } = await supabase.from('cart_items').upsert(
        { user_id: user.id, product_id: item.id, quantity: (items.find(i => i.id === item.id)?.quantity || 0) + 1 },
        { onConflict: 'user_id, product_id' }
      ).select().single();
      
      if (error) toast.error("Failed to add item to cart.");
      else {
        toast.success("Added to cart");
        await fetchCart();
      }
    } else {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          toast.success("Updated cart quantity");
          return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        toast.success("Added to cart");
        return [...prev, { ...item, quantity: 1 }];
      });
    }
  };

  const removeItem = async (id: string) => {
    if (user) {
      const { error } = await supabase.from('cart_items').delete().match({ user_id: user.id, product_id: id });
      if (error) toast.error("Failed to remove item.");
      else {
        toast.success("Removed from cart");
        await fetchCart();
      }
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Removed from cart");
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    if (user) {
      const { error } = await supabase.from('cart_items').update({ quantity }).match({ user_id: user.id, product_id: id });
      if (error) toast.error("Failed to update quantity.");
      else await fetchCart();
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    }
  };

  const clearCart = async () => {
    if (user) {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
      if (error) toast.error("Failed to clear cart.");
      else {
        setItems([]);
      }
    } else {
      setItems([]);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};