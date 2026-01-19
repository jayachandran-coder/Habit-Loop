import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  image: string;
  badge?: string;
}

const ProductCard = ({ name, price, originalPrice, rating, image, badge }: ProductCardProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="product-card group">
      {/* Image Container */}
      <div className="relative aspect-square bg-secondary/50 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badge */}
        {badge && (
          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
            {badge}
          </span>
        )}
        
        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full bg-destructive text-destructive-foreground">
            -{discount}%
          </span>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button
            size="sm"
            className="flex-1 gradient-bg text-primary-foreground hover:opacity-90"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Add
          </Button>
          <button className="icon-btn bg-background/90 backdrop-blur-sm">
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3.5 h-3.5 fill-warning text-warning" />
          <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">₹{price}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
