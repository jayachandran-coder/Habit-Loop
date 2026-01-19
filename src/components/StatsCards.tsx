import { Target, CheckCircle2, TrendingUp, Award } from "lucide-react";

interface StatsCardsProps {
  successRate: number;
  totalCompleted: number;
  totalGoals: number;
  habitCount: number;
}

const StatsCards = ({ successRate, totalCompleted, totalGoals, habitCount }: StatsCardsProps) => {
  const stats = [
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Completed",
      value: `${totalCompleted}/${totalGoals}`,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Active Habits",
      value: habitCount.toString(),
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Status",
      value: successRate >= 80 ? "Great!" : successRate >= 50 ? "Good" : "Keep Going",
      icon: Award,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="stat-card animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <p className="text-2xl font-bold mb-1">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
