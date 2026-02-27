import { useState } from "react";
import { Check, Trash2, Pencil } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HabitRowProps {
  habit: Habit;
  daysInMonth: number;
  onToggleDay: (habitId: string, day: number) => void;
  onRemove: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
}

const HabitRow = ({ habit, daysInMonth, onToggleDay, onRemove, onEdit }: HabitRowProps) => {
  const [confirmUntick, setConfirmUntick] = useState<number | null>(null);
  const progress = Math.min((habit.completedDays.length / habit.goal) * 100, 100);
  const progressColor = 
    habit.color === "success" ? "bg-success" :
    habit.color === "accent" ? "bg-accent" :
    habit.color === "warning" ? "bg-warning" : "bg-primary";

  return (
    <div className="habit-row animate-fade-in">
      {/* Habit Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{habit.icon}</span>
          <div>
            <h3 className="font-semibold">{habit.name}</h3>
            {habit.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{habit.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Goal: {habit.goal} days • {habit.completedDays.length} done
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-lg font-bold">{Math.round(progress)}%</p>
          </div>
          <button
            onClick={() => onEdit(habit)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{habit.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this habit and all its completion data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove(habit.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${progressColor} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Day Cells */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const isCompleted = habit.completedDays.includes(day);
          return (
            <button
              key={day}
              onClick={() => {
                if (isCompleted) {
                  setConfirmUntick(day);
                } else {
                  onToggleDay(habit.id, day);
                }
              }}
              className={`habit-cell ${
                isCompleted ? "habit-cell-checked" : "habit-cell-unchecked"
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 animate-scale-in" />
              ) : (
                <span className="text-xs text-muted-foreground">{day}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Untick confirmation dialog */}
      <AlertDialog open={confirmUntick !== null} onOpenChange={(open) => !open && setConfirmUntick(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmark day {confirmUntick}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unmark this day as completed for "{habit.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmUntick !== null) {
                  onToggleDay(habit.id, confirmUntick);
                  setConfirmUntick(null);
                }
              }}
            >
              Unmark
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HabitRow;
