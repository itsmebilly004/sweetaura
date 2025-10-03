import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, ShoppingCart } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-muted rounded mb-8" />
            <div className="grid md:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded w-3/4" />
                <div className="h-8 bg-muted rounded w-1/4" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate("/products")}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted shadow-[var(--shadow-card)]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="h-32 w-32 text-muted-foreground" />
              </div>
            )}
          </div>

          <div>
            {product.category && (
              <p className="text-primary font-medium mb-2">
                {product.category.name}
              </p>
            )}
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-4xl font-bold text-primary mb-6">
              KES{Number(product.price).toFixed(2)}
            </p>

            {product.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                size="lg"
                className="w-full md:w-auto"
              >
                {product.in_stock ? (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </>
                ) : (
                  "Out of Stock"
                )}
              </Button>

              {!product.in_stock && (
                <p className="text-destructive text-sm">
                  This item is currently unavailable
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;