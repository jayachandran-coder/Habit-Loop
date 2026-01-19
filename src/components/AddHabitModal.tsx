import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, goal: number, icon: string) => void;
}

const emojiOptions = ["🎯", "💪", "📚", "🏃", "🧘", "💧", "🥗", "😴", "🧹", "💰", "📝", "🎸", "🎨", "🌱", "❤️", "🦷"];

const AddHabitModal = ({ isOpen, onClose, onAdd }: AddHabitModalProps) => {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(7);
  const [icon, setIcon] = useState("🎯");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), goal, icon);
      setName("");
      setGoal(7);
      setIcon("🎯");
      onClose();
    }
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

        <h2 className="text-2xl font-bold mb-6">Add New Habit</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Habit Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Drink 8 glasses of water"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="goal" className="text-sm font-medium">
              Monthly Goal (days)
            </Label>
            <Input
              id="goal"
              type="number"
              min={1}
              max={31}
              value={goal}
              onChange={(e) => setGoal(parseInt(e.target.value) || 1)}
              className="mt-1.5"
            />
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
              Add Habit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHabitModal;
