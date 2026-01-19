import { Smartphone, Battery, Cable, Headphones, Shield, Zap } from "lucide-react";

const categories = [
  {
    id: 1,
    name: "Screen Protectors",
    icon: Shield,
    count: "120+ Products",
    color: "from-primary/20 to-primary/5",
  },
  {
    id: 2,
    name: "Phone Cases",
    icon: Smartphone,
    count: "85+ Products",
    color: "from-success/20 to-success/5",
  },
  {
    id: 3,
    name: "Chargers & Cables",
    icon: Cable,
    count: "95+ Products",
    color: "from-warning/20 to-warning/5",
  },
  {
    id: 4,
    name: "Batteries",
    icon: Battery,
    count: "60+ Products",
    color: "from-destructive/20 to-destructive/5",
  },
  {
    id: 5,
    name: "Headphones",
    icon: Headphones,
    count: "45+ Products",
    color: "from-primary/20 to-primary/5",
  },
  {
    id: 6,
    name: "Power Banks",
    icon: Zap,
    count: "35+ Products",
    color: "from-success/20 to-success/5",
  },
];

const CategorySection = () => {
  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">Shop by Category</h2>
            <p className="text-muted-foreground">Find exactly what you need</p>
          </div>
          <a href="#" className="text-primary hover:underline text-sm font-medium">
            View All →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="category-card group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <category.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
