import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Habit {
  id: string;
  name: string;
  goal: number;
  icon: string;
  color: string;
  completedDays: number[];
}

interface DbHabit {
  id: string;
  user_id: string;
  name: string;
  goal: number;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface DbCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
}

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch habits and completions from Supabase
  const fetchHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (habitsError) throw habitsError;

      // Fetch completions for the current month (use local date strings to avoid UTC timezone shift)
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const daysInCurrentMonth = new Date(year, month, 0).getDate();
      const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
      const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(daysInCurrentMonth).padStart(2, "0")}`;
      
      const { data: completionsData, error: completionsError } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_date", startOfMonth)
        .lte("completed_date", endOfMonth);

      if (completionsError) throw completionsError;

      // Map completions to habits
      const habitsWithCompletions: Habit[] = (habitsData as DbHabit[] || []).map((habit) => {
        const habitCompletions = (completionsData as DbCompletion[] || [])
          .filter((c) => c.habit_id === habit.id)
          .map((c) => parseInt(c.completed_date.split("-")[2], 10));
        
        return {
          id: habit.id,
          name: habit.name,
          goal: habit.goal,
          icon: habit.icon,
          color: habit.color,
          completedDays: habitCompletions.sort((a, b) => a - b),
        };
      });

      setHabits(habitsWithCompletions);
    } catch (error) {
      console.error("Error fetching habits:", error);
      toast({
        title: "Error",
        description: "Failed to load habits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth, toast]);

  // Fetch habits when user or month changes
  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const toggleDay = async (habitId: string, day: number) => {
    if (!user) return;

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const isCompleted = habit.completedDays.includes(day);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const completedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        return {
          ...h,
          completedDays: isCompleted
            ? h.completedDays.filter((d) => d !== day)
            : [...h.completedDays, day].sort((a, b) => a - b),
        };
      })
    );

    try {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", habitId)
          .eq("completed_date", completedDate);

        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from("habit_completions")
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: completedDate,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling day:", error);
      // Revert optimistic update
      fetchHabits();
      toast({
        title: "Error",
        description: "Failed to update completion. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addHabit = async (name: string, goal: number, icon: string) => {
    if (!user) return;

    // Validate inputs - defense in depth
    const sanitizedName = String(name).trim().slice(0, 100);
    const sanitizedGoal = Math.min(31, Math.max(1, Math.floor(Number(goal) || 1)));

    if (!sanitizedName) {
      console.error("Invalid habit name");
      return;
    }

    const color = ["primary", "success", "accent", "warning"][Math.floor(Math.random() * 4)];

    try {
      const { data, error } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          name: sanitizedName,
          goal: sanitizedGoal,
          icon: String(icon),
          color,
        })
        .select()
        .single();

      if (error) throw error;

      const newHabit: Habit = {
        id: data.id,
        name: data.name,
        goal: data.goal,
        icon: data.icon,
        color: data.color,
        completedDays: [],
      };

      setHabits((prev) => [...prev, newHabit]);
      
      toast({
        title: "Habit added",
        description: `"${sanitizedName}" has been added to your habits.`,
      });
    } catch (error) {
      console.error("Error adding habit:", error);
      toast({
        title: "Error",
        description: "Failed to add habit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const editHabit = async (habitId: string, name: string, goal: number, icon: string) => {
    if (!user) return;

    const sanitizedName = String(name).trim().slice(0, 100);
    const sanitizedGoal = Math.min(31, Math.max(1, Math.floor(Number(goal) || 1)));

    if (!sanitizedName) return;

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId ? { ...h, name: sanitizedName, goal: sanitizedGoal, icon: String(icon) } : h
      )
    );

    try {
      const { error } = await supabase
        .from("habits")
        .update({ name: sanitizedName, goal: sanitizedGoal, icon: String(icon) })
        .eq("id", habitId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Habit updated",
        description: `"${sanitizedName}" has been updated.`,
      });
    } catch (error) {
      console.error("Error editing habit:", error);
      fetchHabits();
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeHabit = async (habitId: string) => {
    if (!user) return;

    const habitToRemove = habits.find((h) => h.id === habitId);
    
    // Optimistic update
    setHabits((prev) => prev.filter((h) => h.id !== habitId));

    try {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId)
        .eq("user_id", user.id);

      if (error) throw error;

      if (habitToRemove) {
        toast({
          title: "Habit removed",
          description: `"${habitToRemove.name}" has been removed.`,
        });
      }
    } catch (error) {
      console.error("Error removing habit:", error);
      // Revert optimistic update
      fetchHabits();
      toast({
        title: "Error",
        description: "Failed to remove habit. Please try again.",
        variant: "destructive",
      });
    }
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
    loading,
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
  };
};
