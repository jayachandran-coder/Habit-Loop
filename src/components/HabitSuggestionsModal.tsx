import { useState } from "react";
import { X, Sparkles, ChevronRight, Plus, Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SuggestedHabit {
  name: string;
  description: string;
  icon: string;
  goal: number;
  category: string;
}

interface HabitSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (name: string, goal: number, icon: string, description?: string) => void;
}

const questions = [
  {
    id: "mainGoal",
    question: "What's your main goal right now?",
    emoji: "🎯",
    options: [
      { value: "Health & fitness – I want to feel stronger and more energetic", label: "Health & Fitness", emoji: "💪" },
      { value: "Learning & growth – I want to expand my skills and knowledge", label: "Learning & Growth", emoji: "📚" },
      { value: "Productivity – I want to get more done and build better routines", label: "Productivity", emoji: "⚡" },
      { value: "Mindfulness & wellness – I want more calm and balance in life", label: "Mindfulness", emoji: "🧘" },
      { value: "Financial discipline – I want to save more and spend wisely", label: "Financial", emoji: "💰" },
    ],
  },
  {
    id: "schedule",
    question: "How would you describe your daily schedule?",
    emoji: "📅",
    options: [
      { value: "Very structured – I follow a tight schedule every day", label: "Very Structured", emoji: "🗂️" },
      { value: "Somewhat flexible – I have a routine but can adapt", label: "Somewhat Flexible", emoji: "📋" },
      { value: "Quite flexible – My days vary a lot", label: "Quite Flexible", emoji: "🌊" },
      { value: "Chaotic – I struggle to maintain any routine", label: "Chaotic", emoji: "🌪️" },
    ],
  },
  {
    id: "productiveTime",
    question: "When do you feel most productive?",
    emoji: "⏰",
    options: [
      { value: "Early morning (5-8am) – I'm a natural early bird", label: "Early Morning", emoji: "🌅" },
      { value: "Morning (8am-12pm) – I hit my stride in the morning", label: "Morning", emoji: "☀️" },
      { value: "Afternoon (12-5pm) – I get going after lunch", label: "Afternoon", emoji: "🌤️" },
      { value: "Evening (5-9pm) – I work best in the evening", label: "Evening", emoji: "🌆" },
      { value: "Night (9pm+) – I'm a night owl", label: "Night Owl", emoji: "🌙" },
    ],
  },
  {
    id: "biggestChallenge",
    question: "What's your biggest personal challenge?",
    emoji: "🧩",
    options: [
      { value: "Staying consistent – I start things but don't finish them", label: "Staying Consistent", emoji: "🔄" },
      { value: "Finding motivation – I struggle to get started", label: "Finding Motivation", emoji: "🔋" },
      { value: "Managing time – I feel like there's never enough time", label: "Managing Time", emoji: "⏱️" },
      { value: "Health & energy – I feel tired or unhealthy often", label: "Health & Energy", emoji: "🌿" },
      { value: "Focus & distraction – I get easily distracted", label: "Focus & Distraction", emoji: "🎯" },
    ],
  },
  {
    id: "preferredGrowth",
    question: "How do you prefer to grow and improve?",
    emoji: "🌱",
    options: [
      { value: "Solo practice – I like working on myself quietly and independently", label: "Solo Practice", emoji: "🧍" },
      { value: "Social activities – I thrive with accountability partners or groups", label: "Social", emoji: "👥" },
      { value: "Digital learning – I love apps, podcasts, and online content", label: "Digital Learning", emoji: "📱" },
      { value: "Physical activity – I grow through movement and exercise", label: "Physical", emoji: "🏋️" },
      { value: "Creative expression – I learn by creating, writing, or making things", label: "Creative", emoji: "🎨" },
    ],
  },
];

const categoryColors: Record<string, string> = {
  health: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  learning: "bg-blue-500/10 text-blue-600 border-blue-200",
  productivity: "bg-orange-500/10 text-orange-600 border-orange-200",
  mindfulness: "bg-purple-500/10 text-purple-600 border-purple-200",
  social: "bg-pink-500/10 text-pink-600 border-pink-200",
};

const languages = [
  { value: "English", label: "English", emoji: "🇬🇧" },
  { value: "Tamil", label: "தமிழ்", emoji: "🇮🇳" },
  { value: "Hindi", label: "हिन्दी", emoji: "🇮🇳" },
  { value: "Spanish", label: "Español", emoji: "🇪🇸" },
  { value: "French", label: "Français", emoji: "🇫🇷" },
  { value: "Arabic", label: "العربية", emoji: "🇸🇦" },
  { value: "Chinese", label: "中文", emoji: "🇨🇳" },
  { value: "Japanese", label: "日本語", emoji: "🇯🇵" },
  { value: "Korean", label: "한국어", emoji: "🇰🇷" },
  { value: "Portuguese", label: "Português", emoji: "🇧🇷" },
];

const HabitSuggestionsModal = ({ isOpen, onClose, onAddHabit }: HabitSuggestionsModalProps) => {
  const [step, setStep] = useState(-1); // -1: language, 0-4: questions, 5: loading/results
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<SuggestedHabit[]>([]);
  const [addedHabits, setAddedHabits] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const isLanguageStep = step === -1;
  const currentQuestion = step >= 0 ? questions[step] : null;
  const isQuizDone = step === questions.length;

  const handleAnswer = async (value: string) => {
    const newAnswers = { ...answers, [currentQuestion!.id]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Last question answered — fetch suggestions
      setStep(questions.length);
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("suggest-habits", {
          body: { answers: newAnswers, language: selectedLanguage },
        });

        if (error) throw error;
        if (data.error) {
          toast({ title: "Error", description: data.error, variant: "destructive" });
          setStep(questions.length - 1);
          return;
        }

        setSuggestions(data.habits);
        setAddedHabits(new Set());
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        toast({ title: "Error", description: "Failed to get AI suggestions. Please try again.", variant: "destructive" });
        setStep(questions.length - 1);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddHabit = (habit: SuggestedHabit, index: number) => {
    onAddHabit(habit.name, habit.goal, habit.icon, habit.description);
    setAddedHabits((prev) => new Set([...prev, index]));
  };

  const handleRetake = () => {
    setStep(-1);
    setSelectedLanguage("English");
    setAnswers({});
    setSuggestions([]);
    setAddedHabits(new Set());
    setIsLoading(false);
  };

  const handleClose = () => {
    handleRetake();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-card rounded-2xl w-full max-w-lg border border-border shadow-xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="gradient-bg px-6 py-5 text-primary-foreground">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors text-primary-foreground"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">AI Habit Coach</span>
          </div>
          <h2 className="text-xl font-bold">
            {isQuizDone
              ? isLoading
                ? "Analyzing your personality..."
                : "Your Personalized Habits"
              : "Personality Quiz"}
          </h2>
          {!isQuizDone && !isLanguageStep && (
            <p className="text-sm opacity-75 mt-1">
              Question {step + 1} of {questions.length}
            </p>
          )}
          {isLanguageStep && (
            <p className="text-sm opacity-75 mt-1">Choose your language</p>
          )}
        </div>

        {/* Progress bar */}
        {!isQuizDone && !isLanguageStep && (
          <div className="h-1 bg-primary/20">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((step) / questions.length) * 100}%` }}
            />
          </div>
        )}

        <div className="p-6">
          {/* Language selection */}
          {isLanguageStep && (
            <div>
              <div className="text-center mb-5">
                <span className="text-4xl">🌍</span>
                <h3 className="text-lg font-semibold mt-3">Pick your language</h3>
                <p className="text-sm text-muted-foreground mt-1">Habits will be suggested in this language</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      setSelectedLanguage(lang.value);
                      setStep(0);
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-secondary/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
                  >
                    <span className="text-xl">{lang.emoji}</span>
                    <div>
                      <span className="font-medium text-sm block">{lang.value}</span>
                      <span className="text-xs text-muted-foreground">{lang.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quiz questions */}
          {!isQuizDone && !isLanguageStep && currentQuestion && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl">{currentQuestion.emoji}</span>
                <h3 className="text-lg font-semibold mt-3">{currentQuestion.question}</h3>
              </div>
              <div className="space-y-2.5">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="font-medium text-sm flex-1">{option.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isQuizDone && isLoading && (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              </div>
              <p className="font-semibold text-lg mb-2">🧠 Thinking about your habits...</p>
              <p className="text-sm text-muted-foreground">
                AI is analyzing your personality to craft the perfect habit plan
              </p>
            </div>
          )}

          {/* Results */}
          {isQuizDone && !isLoading && suggestions.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Based on your personality, here are your perfect habits 🎯
              </p>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {suggestions.map((habit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-2xl mt-0.5">{habit.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-sm">{habit.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors[habit.category] ?? "bg-muted"}`}>
                          {habit.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{habit.description}</p>
                      <p className="text-xs text-muted-foreground">Goal: {habit.goal} days/month</p>
                    </div>
                    <button
                      onClick={() => handleAddHabit(habit, index)}
                      disabled={addedHabits.has(index)}
                      className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        addedHabits.has(index)
                          ? "bg-success/20 text-success cursor-default"
                          : "gradient-bg text-primary-foreground hover:opacity-80"
                      }`}
                    >
                      {addedHabits.has(index) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={handleRetake}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake Quiz
                </Button>
                <Button className="flex-1 gradient-bg text-primary-foreground hover:opacity-90" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HabitSuggestionsModal;
