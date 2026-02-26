import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Habit } from "@/hooks/useHabits";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface HabitChartsProps {
  habits: Habit[];
  currentMonth: Date;
  daysInMonth: number;
}

const HabitCharts = ({ habits, currentMonth, daysInMonth }: HabitChartsProps) => {
  const weeklyData = useMemo(() => {
    const weeks: { name: string; completed: number; total: number }[] = [];
    let weekStart = 1;

    while (weekStart <= daysInMonth) {
      const weekEnd = Math.min(weekStart + 6, daysInMonth);
      const label = `${weekStart}–${weekEnd}`;
      let completed = 0;
      const total = habits.length * (weekEnd - weekStart + 1);

      habits.forEach((habit) => {
        habit.completedDays.forEach((d) => {
          if (d >= weekStart && d <= weekEnd) completed++;
        });
      });

      weeks.push({ name: label, completed, total });
      weekStart = weekEnd + 1;
    }
    return weeks;
  }, [habits, daysInMonth]);

  const dailyData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const completed = habits.filter((h) => h.completedDays.includes(day)).length;
      return {
        name: String(day),
        completed,
        total: habits.length,
      };
    });
  }, [habits, daysInMonth]);

  if (habits.length === 0) return null;

  const monthLabel = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Completion Trends</h2>
      <Tabs defaultValue="weekly">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="daily">Daily ({monthLabel})</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Possible" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="daily">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="completed" name="Habits Done" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HabitCharts;
