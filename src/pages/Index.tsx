import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHabits } from "@/hooks/useHabits";
import { useAuth } from "@/hooks/useAuth";
import { Habit } from "@/hooks/useHabits";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import HabitRow from "@/components/HabitRow";
import AddHabitModal from "@/components/AddHabitModal";
import EditHabitModal from "@/components/EditHabitModal";
import HabitSuggestionsModal from "@/components/HabitSuggestionsModal";
import { Button } from "@/components/ui/button";
import { LogOut, User, Sparkles } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const {
    habits,
    loading: habitsLoading,
    currentMonth,
    setCurrentMonth,
    toggleDay,
    addHabit,
    editHabit,
    removeHabit,
    getDaysInMonth,
    getSuccessRate,
    getTotalCompleted,
    getTotalGoals,
  } = useHabits();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading || habitsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-5xl">
        {/* User bar */}
        <div className="flex justify-end items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Header
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onAddHabit={() => setIsModalOpen(true)}
        />

        <StatsCards
          successRate={getSuccessRate()}
          totalCompleted={getTotalCompleted()}
          totalGoals={getTotalGoals()}
          habitCount={habits.length}
        />

        {/* Habits List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Habits</h2>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSuggestOpen(true)}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Suggest with AI</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <p className="text-sm text-muted-foreground">
                {getDaysInMonth()} days in {currentMonth.toLocaleString("default", { month: "long" })}
              </p>
            </div>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-6xl mb-4">🎯</p>
              <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building better habits today!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="gradient-bg text-primary-foreground px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Add Your First Habit
              </button>
            </div>
          ) : (
            habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                daysInMonth={getDaysInMonth()}
                onToggleDay={toggleDay}
                onRemove={removeHabit}
                onEdit={setEditingHabit}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>❤️ Build better habits, one day at a time</p>
        </footer>
      </div>

      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addHabit}
      />

      <EditHabitModal
        habit={editingHabit}
        onClose={() => setEditingHabit(null)}
        onSave={editHabit}
      />

      <HabitSuggestionsModal
        isOpen={isSuggestOpen}
        onClose={() => setIsSuggestOpen(false)}
        onAddHabit={addHabit}
      />
    </div>
  );
};

export default Index;
