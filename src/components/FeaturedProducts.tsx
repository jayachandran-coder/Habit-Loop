import ProductCard from "./ProductCard";

const products = [
  {
    id: 1,
    name: "iPhone 15 Pro Max Tempered Glass Screen Protector",
    price: 299,
    originalPrice: 599,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop",
    badge: "Best Seller",
  },
  {
    id: 2,
    name: "Samsung 65W Super Fast Charger with Type-C Cable",
    price: 1499,
    originalPrice: 2499,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
    badge: "New",
  },
  {
    id: 3,
    name: "Original Li-ion Battery for OnePlus 11",
    price: 899,
    originalPrice: 1299,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Premium Silicone Case for iPhone 15",
    price: 499,
    originalPrice: 799,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    name: "Wireless Bluetooth Earbuds TWS Pro",
    price: 1299,
    originalPrice: 2999,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    badge: "Hot Deal",
  },
  {
    id: 6,
    name: "20000mAh Power Bank Fast Charging",
    price: 1199,
    originalPrice: 1999,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop",
  },
  {
    id: 7,
    name: "USB-C to Lightning Cable 2m Braided",
    price: 399,
    originalPrice: 699,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
  },
  {
    id: 8,
    name: "Camera Lens Protector for Samsung S24",
    price: 199,
    originalPrice: 399,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=400&h=400&fit=crop",
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-12 lg:py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">Featured Products</h2>
            <p className="text-muted-foreground">Top picks for your mobile needs</p>
          </div>
          <a href="#" className="text-primary hover:underline text-sm font-medium">
            View All →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
