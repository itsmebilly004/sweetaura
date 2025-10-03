import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  in_stock: boolean;
}

const ProductCard = ({ id, name, price, image_url, in_stock }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name, price, image_url });
  };

  return (
    <Link to={`/product/${id}`}>
      <Card className="group overflow-hidden hover:shadow-[var(--shadow-card)] transition-all duration-300">
        <div className="aspect-square overflow-hidden bg-muted">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{name}</h3>
          <p className="text-2xl font-bold text-primary">KES{price.toFixed(2)}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={!in_stock}
            className="w-full"
          >
            {in_stock ? (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </>
            ) : (
              "Out of Stock"
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;