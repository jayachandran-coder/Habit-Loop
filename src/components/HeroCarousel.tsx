import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    id: 1,
    title: "Premium Screen Protectors",
    subtitle: "Crystal clear protection for your device",
    cta: "Shop Now",
    gradient: "from-primary/20 to-transparent",
  },
  {
    id: 2,
    title: "Original Batteries",
    subtitle: "Power that lasts all day long",
    cta: "Explore",
    gradient: "from-success/20 to-transparent",
  },
  {
    id: 3,
    title: "Fast Chargers",
    subtitle: "Charge smarter, not longer",
    cta: "View Collection",
    gradient: "from-warning/20 to-transparent",
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="relative">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`transition-all duration-700 ${
                index === currentSlide
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 absolute inset-0 translate-x-8"
              }`}
            >
              <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-r ${slide.gradient} border border-border p-8 lg:p-16`}>
                <div className="relative z-10 max-w-2xl">
                  <h1 className="text-4xl lg:text-6xl font-bold mb-4 animate-fade-in">
                    {slide.title}
                  </h1>
                  <p className="text-lg lg:text-xl text-muted-foreground mb-8 animate-fade-in">
                    {slide.subtitle}
                  </p>
                  <Button className="gradient-bg text-primary-foreground hover:opacity-90 transition-opacity px-8 py-6 text-lg rounded-full">
                    {slide.cta}
                  </Button>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/2 right-8 lg:right-16 -translate-y-1/2 w-48 h-48 lg:w-80 lg:h-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-32 h-32 lg:w-48 lg:h-48 rounded-full bg-gradient-to-br from-primary/30 to-transparent animate-float" />
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 icon-btn bg-background/80 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 icon-btn bg-background/80 backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
