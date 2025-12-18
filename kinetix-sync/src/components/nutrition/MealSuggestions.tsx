import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Utensils, Target, Zap } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
}

interface MealSuggestions {
  breakfast: MealSuggestion[];
  lunch: MealSuggestion[];
  dinner: MealSuggestion[];
  snack: MealSuggestion[];
}

interface MealGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Props {
  calorieGoal: number;
  proteinGoal: number;
  bmi: number;
  fitnessGoal: string;
  activityLevel: string;
}

export const MealSuggestions: React.FC<Props> = ({
  calorieGoal,
  proteinGoal,
  bmi,
  fitnessGoal,
  activityLevel
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<MealSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [mealGoals, setMealGoals] = useState<Record<string, MealGoals>>({});

  // Persist suggestions locally so switching tabs doesn't clear data
  const storageKey = `meal_suggestions_${user?.id || 'guest'}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if for the same goal context (rough check)
        if (
          parsed?.meta &&
          parsed.meta.calorieGoal === calorieGoal &&
          parsed.meta.proteinGoal === proteinGoal
        ) {
          setSuggestions(parsed.suggestions || null);
          setMealGoals(parsed.mealGoals || {});
        }
      }
    } catch {
      // ignore restore errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = (data: { suggestions: MealSuggestions; mealGoals: Record<string, MealGoals> }) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ...data, meta: { calorieGoal, proteinGoal, bmi, fitnessGoal, activityLevel } })
      );
    } catch {
      // ignore persist errors
    }
  };

  const generateSuggestions = async () => {
    if (!calorieGoal || !proteinGoal) {
      toast({
        title: "Missing Information",
        description: "Please calculate your BMI first to get meal suggestions.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      const response = await apiFetch('/api/meal-planning/meal-suggestions', {
        method: 'POST',
        body: JSON.stringify({
          calorieGoal,
          proteinGoal,
          bmi,
          fitnessGoal,
          activityLevel
        })
      }, token);

      setSuggestions(response);
      
      // Calculate meal goals for display
      const goals = calculateMealGoals(calorieGoal, proteinGoal, bmi, fitnessGoal);
      setMealGoals(goals);

      // Persist to storage so it survives tab switches
      persist({ suggestions: response, mealGoals: goals });

      toast({
        title: "Meal Suggestions Generated!",
        description: "Personalized meal suggestions based on your BMI and goals.",
      });
    } catch (error) {
      console.error('Error generating meal suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate meal suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMealGoals = (calorieGoal: number, proteinGoal: number, bmi: number, fitnessGoal: string) => {
    // Calculate meal distribution based on BMI and goals
    let breakfastCalories, lunchCalories, dinnerCalories, snackCalories;
    let breakfastProtein, lunchProtein, dinnerProtein, snackProtein;

    // Adjust distribution based on BMI
    if (bmi < 18.5) {
      breakfastCalories = calorieGoal * 0.30;
      lunchCalories = calorieGoal * 0.35;
      dinnerCalories = calorieGoal * 0.25;
      snackCalories = calorieGoal * 0.10;
    } else if (bmi >= 18.5 && bmi < 25) {
      breakfastCalories = calorieGoal * 0.25;
      lunchCalories = calorieGoal * 0.35;
      dinnerCalories = calorieGoal * 0.30;
      snackCalories = calorieGoal * 0.10;
    } else if (bmi >= 25 && bmi < 30) {
      breakfastCalories = calorieGoal * 0.30;
      lunchCalories = calorieGoal * 0.35;
      dinnerCalories = calorieGoal * 0.25;
      snackCalories = calorieGoal * 0.10;
    } else {
      breakfastCalories = calorieGoal * 0.25;
      lunchCalories = calorieGoal * 0.30;
      dinnerCalories = calorieGoal * 0.30;
      snackCalories = calorieGoal * 0.15;
    }

    // Adjust for fitness goals
    if (fitnessGoal === 'lose') {
      dinnerCalories *= 0.9;
      snackCalories += (calorieGoal * 0.1 - snackCalories);
    } else if (fitnessGoal === 'gain') {
      breakfastCalories *= 1.1;
      lunchCalories *= 1.1;
      dinnerCalories *= 1.1;
    }

    // Protein distribution
    breakfastProtein = proteinGoal * 0.25;
    lunchProtein = proteinGoal * 0.35;
    dinnerProtein = proteinGoal * 0.30;
    snackProtein = proteinGoal * 0.10;

    return {
      breakfast: {
        calories: Math.round(breakfastCalories),
        protein: Math.round(breakfastProtein),
        carbs: Math.round((breakfastCalories * 0.45) / 4),
        fats: Math.round((breakfastCalories * 0.25) / 9)
      },
      lunch: {
        calories: Math.round(lunchCalories),
        protein: Math.round(lunchProtein),
        carbs: Math.round((lunchCalories * 0.45) / 4),
        fats: Math.round((lunchCalories * 0.25) / 9)
      },
      dinner: {
        calories: Math.round(dinnerCalories),
        protein: Math.round(dinnerProtein),
        carbs: Math.round((dinnerCalories * 0.45) / 4),
        fats: Math.round((dinnerCalories * 0.25) / 9)
      },
      snack: {
        calories: Math.round(snackCalories),
        protein: Math.round(snackProtein),
        carbs: Math.round((snackCalories * 0.45) / 4),
        fats: Math.round((snackCalories * 0.25) / 9)
      }
    };
  };

  const addMealToPlan = async (meal: MealSuggestion, mealType: string) => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      const today = new Date().toISOString().split('T')[0];
      const apiMealType = mealType === 'snack' ? 'snacks' : mealType; // backend expects 'snacks'
      
      // Add to nutrition entries
      await apiFetch('/api/nutrition', {
        method: 'POST',
        body: JSON.stringify({
          date: today,
          mealType: apiMealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks',
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          servingSize: 1,
          servingUnit: 'serving',
          notes: meal.description
        })
      }, token);

      toast({
        title: "Meal Added!",
        description: `${meal.name} has been added to your ${apiMealType} log for today.`,
      });

      // Emit a simple event for other parts of the app to optionally refresh
      try { (window as any).dispatchEvent(new CustomEvent('nutrition:entryAdded', { detail: { date: today } })); } catch {}
    } catch (error) {
      console.error('Error adding meal:', error);
      toast({
        title: "Error",
        description: "Failed to add meal to plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const MealCard: React.FC<{ meal: MealSuggestion; mealType: string; goals: MealGoals }> = ({ 
    meal, 
    mealType, 
    goals 
  }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{meal.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {meal.prepTime} min
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{meal.calories}</div>
            <div className="text-xs text-muted-foreground">Calories</div>
            <div className="text-xs text-green-600">Goal: {goals.calories}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{meal.protein}g</div>
            <div className="text-xs text-muted-foreground">Protein</div>
            <div className="text-xs text-green-600">Goal: {goals.protein}g</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{meal.carbs}g</div>
            <div className="text-xs text-muted-foreground">Carbs</div>
            <div className="text-xs text-green-600">Goal: {goals.carbs}g</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">{meal.fats}g</div>
            <div className="text-xs text-muted-foreground">Fats</div>
            <div className="text-xs text-green-600">Goal: {goals.fats}g</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Ingredients
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {meal.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Instructions
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              {meal.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-semibold text-xs mt-0.5">{index + 1}.</span>
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <Button 
          onClick={() => addMealToPlan(meal, mealType)}
          className="w-full mt-4"
          size="sm"
        >
          Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Plan
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Personalized Meal Suggestions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Get meal suggestions tailored to your BMI ({bmi.toFixed(1)}), calorie goal ({calorieGoal}), 
            and protein goal ({proteinGoal}g)
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateSuggestions}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Generating Suggestions..." : "Generate Meal Suggestions"}
          </Button>
        </CardContent>
      </Card>

      {suggestions && (
        <Tabs defaultValue="breakfast" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
            <TabsTrigger value="lunch">Lunch</TabsTrigger>
            <TabsTrigger value="dinner">Dinner</TabsTrigger>
            <TabsTrigger value="snack">Snacks</TabsTrigger>
          </TabsList>

          {Object.entries(suggestions).map(([mealType, meals]) => (
            <TabsContent key={mealType} value={mealType} className="space-y-4">
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Goals
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Calories:</span>
                    <span className="ml-2 font-semibold">{mealGoals[mealType]?.calories}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Protein:</span>
                    <span className="ml-2 font-semibold">{mealGoals[mealType]?.protein}g</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carbs:</span>
                    <span className="ml-2 font-semibold">{mealGoals[mealType]?.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fats:</span>
                    <span className="ml-2 font-semibold">{mealGoals[mealType]?.fats}g</span>
                  </div>
                </div>
              </div>

              {meals.length > 0 ? (
                meals.map((meal, index) => (
                  <MealCard 
                    key={index} 
                    meal={meal} 
                    mealType={mealType}
                    goals={mealGoals[mealType] || { calories: 0, protein: 0, carbs: 0, fats: 0 }}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No suggestions available for this meal type.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};
