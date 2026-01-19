import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddHabit: () => void;
}

const Header = ({ currentMonth, onPrevMonth, onNextMonth, onAddHabit }: HeaderProps) => {
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-1">
            <span className="gradient-text">Monthly</span> Habit Tracker
          </h1>
          <p className="text-muted-foreground">Build better habits, one day at a time</p>
        </div>

        <Button 
          onClick={onAddHabit}
          className="gradient-bg text-primary-foreground hover:opacity-90 transition-opacity gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Habit
        </Button>
      </div>

      <div className="flex items-center justify-between mt-6 bg-card rounded-2xl p-4 border border-border">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">{monthName}</h2>
            <p className="text-sm text-muted-foreground">{year}</p>
          </div>
        </div>

        <button
          onClick={onNextMonth}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
