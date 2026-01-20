import { useState, useEffect } from "react";

export interface Habit {
  id: string;
  name: string;
  goal: number;
  icon: string;
  color: string;
  completedDays: number[];
}

const defaultHabits: Habit[] = [
  { id: "1", name: "Stretch or do yoga", goal: 5, icon: "🧘", color: "primary", completedDays: [3, 11, 19, 24] },
  { id: "2", name: "Walk 10,000 steps", goal: 7, icon: "🚶", color: "success", completedDays: [1, 4, 6, 7, 8, 22] },
  { id: "3", name: "Read a book chapter", goal: 15, icon: "📚", color: "accent", completedDays: [1, 2, 4, 6, 7, 10, 12, 16, 20, 21] },
  { id: "4", name: "Declutter a space", goal: 4, icon: "🧹", color: "warning", completedDays: [3, 10, 17, 24] },
  { id: "5", name: "Floss", goal: 20, icon: "🦷", color: "primary", completedDays: [1, 3, 5, 7, 9, 11, 13, 15, 16, 18, 21] },
  { id: "6", name: "Play guitar", goal: 10, icon: "🎸", color: "accent", completedDays: [2, 11, 12, 16, 19] },
  { id: "7", name: "Call grandpa", goal: 10, icon: "📞", color: "success", completedDays: [1, 4, 6, 8, 12, 22] },
  { id: "8", name: "Volunteer", goal: 3, icon: "❤️", color: "accent", completedDays: [15, 23] },
  { id: "9", name: "Put $10 to savings", goal: 10, icon: "💰", color: "warning", completedDays: [3, 14, 18, 21] },
];

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("habits");
    return saved ? JSON.parse(saved) : defaultHabits;
  });

  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  const toggleDay = (habitId: string, day: number) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const isCompleted = habit.completedDays.includes(day);
        return {
          ...habit,
          completedDays: isCompleted
            ? habit.completedDays.filter((d) => d !== day)
            : [...habit.completedDays, day].sort((a, b) => a - b),
        };
      })
    );
  };

  const addHabit = (name: string, goal: number, icon: string) => {
    // Validate inputs - defense in depth
    const sanitizedName = String(name).trim().slice(0, 100);
    const sanitizedGoal = Math.min(31, Math.max(1, Math.floor(Number(goal) || 1)));
    
    if (!sanitizedName) {
      console.error("Invalid habit name");
      return;
    }
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: sanitizedName,
      goal: sanitizedGoal,
      icon: String(icon),
      color: ["primary", "success", "accent", "warning"][Math.floor(Math.random() * 4)],
      completedDays: [],
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const removeHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const getDaysInMonth = () => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  };

  const getSuccessRate = () => {
    const totalGoals = habits.reduce((sum, h) => sum + h.goal, 0);
    const totalCompleted = habits.reduce((sum, h) => sum + Math.min(h.completedDays.length, h.goal), 0);
    return totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;
  };

  const getTotalCompleted = () => {
    return habits.reduce((sum, h) => sum + h.completedDays.length, 0);
  };

  const getTotalGoals = () => {
    return habits.reduce((sum, h) => sum + h.goal, 0);
  };

  return {
    habits,
    currentMonth,
    setCurrentMonth,
    toggleDay,
    addHabit,
    removeHabit,
    getDaysInMonth,
    getSuccessRate,
    getTotalCompleted,
    getTotalGoals,
  };
};
