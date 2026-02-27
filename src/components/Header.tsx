import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar, User, LogOut, Bell, BellOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddHabit: () => void;
  userEmail?: string;
  userId?: string;
  onSignOut: () => void;
  isSubscribed: boolean;
  notifLoading: boolean;
  onToggleReminder: () => void;
  preferredHour: number;
  onUpdateHour: (hour: number) => void;
}

const formatHour = (h: number) => `${String(h).padStart(2, "0")}:00`;

const Header = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onAddHabit,
  userEmail,
  userId,
  onSignOut,
  isSubscribed,
  notifLoading,
  onToggleReminder,
  preferredHour,
  onUpdateHour,
}: HeaderProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  return (
    <header className="mb-8">
      {/* Brand + Add Habit + Reminders + Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Monthly Habit Tracker</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center">
              <span className="text-xl">🔄</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-text">habit</span>-loop
            </h1>
          </div>
        </div>

        {/* Month navigator (inline) */}
        <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 border border-border">
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm whitespace-nowrap">{monthName} {year}</span>
          </div>
          <button
            onClick={onNextMonth}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onAddHabit}
            className="gradient-bg text-primary-foreground hover:opacity-90 transition-opacity gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onToggleReminder}
            disabled={notifLoading}
            className={isSubscribed ? "border-primary text-primary" : ""}
            title={isSubscribed ? "Disable reminders" : "Enable daily reminders"}
          >
            {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>

          {isSubscribed && (
            <Select
              value={String(preferredHour)}
              onValueChange={(val) => onUpdateHour(Number(val))}
            >
              <SelectTrigger className="w-[110px] h-9 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {formatHour(i)} UTC
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Profile icon */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <User className="w-4 h-4 text-primary-foreground" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl border border-border shadow-lg p-4 z-50 animate-fade-in">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                <p className="text-xs text-muted-foreground font-mono truncate mt-1">{userId}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSignOut}
                  className="w-full mt-3 text-muted-foreground hover:text-foreground gap-2 justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};

export default Header;
