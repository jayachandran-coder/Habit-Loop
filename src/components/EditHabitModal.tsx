import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { Habit } from "@/hooks/useHabits";

interface EditHabitModalProps {
  habit: Habit | null;
  onClose: () => void;
  onSave: (habitId: string, name: string, goal: number, icon: string) => void;
}

const habitSchema = z.object({
  name: z.string()
    .min(1, "Habit name is required")
    .max(100, "Habit name must be 100 characters or less")
    .transform(val => val.trim()),
  goal: z.number()
    .int("Goal must be a whole number")
    .min(1, "Goal must be at least 1")
    .max(31, "Goal cannot exceed 31 days"),
});

const emojiOptions = ["🎯", "💪", "📚", "🏃", "🧘", "💧", "🥗", "😴", "🧹", "💰", "📝", "🎸", "🎨", "🌱", "❤️", "🦷"];

const EditHabitModal = ({ habit, onClose, onSave }: EditHabitModalProps) => {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(7);
  const [icon, setIcon] = useState("🎯");
  const [errors, setErrors] = useState<{ name?: string; goal?: string }>({});

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setGoal(habit.goal);
      setIcon(habit.icon);
      setErrors({});
    }
  }, [habit]);

  if (!habit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = habitSchema.safeParse({ name, goal });

    if (!result.success) {
      const fieldErrors: { name?: string; goal?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "name") fieldErrors.name = err.message;
        if (err.path[0] === "goal") fieldErrors.goal = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSave(habit.id, result.data.name, result.data.goal, icon);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl p-6 w-full max-w-md border border-border shadow-xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Edit Habit</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="edit-name" className="text-sm font-medium">
              Habit Name
            </Label>
            <Input
              id="edit-name"
              type="text"
              placeholder="e.g., Drink 8 glasses of water"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              maxLength={100}
              className={`mt-1.5 ${errors.name ? "border-destructive" : ""}`}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit-goal" className="text-sm font-medium">
              Monthly Goal (days)
            </Label>
            <Input
              id="edit-goal"
              type="number"
              min={1}
              max={31}
              value={goal}
              onChange={(e) => {
                const parsed = parseInt(e.target.value);
                setGoal(isNaN(parsed) ? 1 : Math.min(31, Math.max(1, parsed)));
                if (errors.goal) setErrors((prev) => ({ ...prev, goal: undefined }));
              }}
              className={`mt-1.5 ${errors.goal ? "border-destructive" : ""}`}
            />
            {errors.goal && (
              <p className="text-sm text-destructive mt-1">{errors.goal}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">Choose an Icon</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    icon === emoji
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-secondary hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-bg text-primary-foreground hover:opacity-90"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHabitModal;
