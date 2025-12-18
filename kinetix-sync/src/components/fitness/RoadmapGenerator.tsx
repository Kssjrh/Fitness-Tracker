import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Trophy, Dumbbell, Utensils, Target, Flame } from 'lucide-react';
import type { FitnessGoal, FitnessRoadmap, Exercise, RepetitionExercise, DurationExercise } from '@/types/fitness';

interface RoadmapGeneratorProps {
  bmi: number;
  height: number;
  weight: number;
  onRoadmapGenerated: (roadmap: FitnessRoadmap) => void;
}

interface WorkoutDay {
  type: string;
  exercises: Exercise[];
}

interface WorkoutPlan {
  noEquipment: WorkoutDay[];
  withEquipment: WorkoutDay[];
}

export const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({
  bmi,
  height,
  weight,
  onRoadmapGenerated
}) => {
  const [goal, setGoal] = useState<FitnessGoal>({
    type: 'general_fitness',
    intensity: 'beginner',
    equipmentAccess: false
  });

  const calculateBaseMetrics = () => {
    // Harris-Benedict BMR Formula
    const isMale = true; // TODO: Add gender selection
    const age = 30; // TODO: Add age input
    let bmr;
    
    if (isMale) {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Activity multiplier based on intensity
    const activityMultipliers = {
      beginner: 1.2,
      intermediate: 1.375,
      advanced: 1.55
    };

    const tdee = bmr * activityMultipliers[goal.intensity];
    
    // Adjust calories based on goal
    let targetCalories = tdee;
    if (goal.type === 'weight_loss') {
      targetCalories = tdee - 500; // 500 calorie deficit
    } else if (goal.type === 'muscle_gain') {
      targetCalories = tdee + 300; // 300 calorie surplus
    }

    return {
      bmr,
      tdee,
      targetCalories
    };
  };

  const workoutPlans: Record<'beginner' | 'intermediate' | 'advanced', WorkoutPlan> = {
    beginner: {
      noEquipment: [
        {
          type: 'Full Body',
          exercises: [
            { type: 'repetition', name: 'Bodyweight Squats', sets: 3, reps: 12 },
            { type: 'repetition', name: 'Push-ups (or Knee Push-ups)', sets: 3, reps: 10 },
            { type: 'repetition', name: 'Walking Lunges', sets: 3, reps: 10 },
            { type: 'duration', name: 'Plank', sets: 3, duration: 30 },
            { type: 'repetition', name: 'Mountain Climbers', sets: 3, reps: 20 }
          ]
        }
      ],
      withEquipment: [
        {
          type: 'Full Body',
          exercises: [
            { type: 'repetition', name: 'Dumbbell Squats', sets: 3, reps: 12 },
            { type: 'repetition', name: 'Dumbbell Bench Press', sets: 3, reps: 10 },
            { type: 'repetition', name: 'Dumbbell Rows', sets: 3, reps: 12 },
            { type: 'repetition', name: 'Romanian Deadlifts', sets: 3, reps: 12 },
            { type: 'duration', name: 'Plank', sets: 3, duration: 30 }
          ]
        }
      ]
    },
    intermediate: {
      noEquipment: [
        {
          type: 'Upper Body',
          exercises: [
            { type: 'repetition', name: 'Diamond Push-ups', sets: 4, reps: 12 },
            { type: 'repetition', name: 'Wide Push-ups', sets: 4, reps: 12 },
            { type: 'repetition', name: 'Pike Push-ups', sets: 3, reps: 10 },
            { type: 'repetition', name: 'Pull-ups', sets: 3, reps: 8 },
            { type: 'repetition', name: 'Dips', sets: 3, reps: 10 }
          ]
        },
        {
          type: 'Lower Body',
          exercises: [
            { type: 'repetition', name: 'Jump Squats', sets: 4, reps: 15 },
            { type: 'repetition', name: 'Bulgarian Split Squats', sets: 3, reps: 12 },
            { type: 'repetition', name: 'Pistol Squats', sets: 3, reps: 8 },
            { type: 'repetition', name: 'Glute Bridges', sets: 4, reps: 15 },
            { type: 'repetition', name: 'Calf Raises', sets: 4, reps: 20 }
          ]
        }
      ],
      withEquipment: [
        {
          type: 'Push Day',
          exercises: [
            { type: 'repetition', name: 'Dumbbell Bench Press', sets: 4, reps: 12 },
            { type: 'repetition', name: 'Shoulder Press', sets: 4, reps: 10 },
            { type: 'repetition', name: 'Incline Press', sets: 3, reps: 12 },
            { type: 'repetition', name: 'Tricep Extensions', sets: 3, reps: 15 },
            { type: 'repetition', name: 'Lateral Raises', sets: 3, reps: 15 }
          ]
        },
        {
          type: 'Pull Day',
          exercises: [
            { type: 'repetition', name: 'Bent Over Rows', sets: 4, reps: 12 },
            { type: 'repetition', name: 'Pull-ups', sets: 4, reps: 10 },
            { type: 'repetition', name: 'Face Pulls', sets: 3, reps: 15 },
            { type: 'repetition', name: 'Bicep Curls', sets: 3, reps: 12 },
            { type: 'repetition', name: 'Hammer Curls', sets: 3, reps: 12 }
          ]
        }
      ]
    },
    advanced: {
      noEquipment: [
        {
          type: 'Full Body HIIT',
          exercises: [
            { type: 'repetition', name: 'Burpees', sets: 4, reps: 20 },
            { type: 'repetition', name: 'Plyometric Push-ups', sets: 4, reps: 15 },
            { type: 'repetition', name: 'Box Jumps', sets: 4, reps: 20 },
            { type: 'repetition', name: 'Handstand Push-ups', sets: 3, reps: 8 },
            { type: 'repetition', name: 'Muscle Ups', sets: 3, reps: 5 }
          ]
        }
      ],
      withEquipment: [
        {
          type: 'Strength Day',
          exercises: [
            { type: 'repetition', name: 'Heavy Squats', sets: 5, reps: 5 },
            { type: 'repetition', name: 'Weighted Pull-ups', sets: 4, reps: 8 },
            { type: 'repetition', name: 'Dumbbell Press', sets: 4, reps: 8 },
            { type: 'repetition', name: 'Weighted Dips', sets: 4, reps: 8 },
            { type: 'repetition', name: 'Deadlifts', sets: 5, reps: 5 }
          ]
        }
      ]
    }
  };

  const generateWorkoutPlan = (): WorkoutDay[] => {
    return goal.equipmentAccess 
      ? workoutPlans[goal.intensity].withEquipment 
      : workoutPlans[goal.intensity].noEquipment;
  };

  const generateMealPlan = (calories: number) => {
    // Basic meal distribution
    const breakfast = Math.round(calories * 0.3);
    const lunch = Math.round(calories * 0.35);
    const dinner = Math.round(calories * 0.25);
    const snacks = Math.round(calories * 0.1);

    const mealSuggestions = {
      breakfast: [
        'Oatmeal with banana and almonds',
        'Greek yogurt with berries and honey',
        'Whole grain toast with eggs and avocado',
        'Protein smoothie with spinach and fruit',
        'Overnight chia seed pudding'
      ],
      lunch: [
        'Grilled chicken salad with olive oil dressing',
        'Turkey and avocado wrap with vegetables',
        'Quinoa bowl with roasted vegetables',
        'Tuna salad with whole grain crackers',
        'Lentil soup with whole grain bread'
      ],
      dinner: [
        'Baked salmon with sweet potato',
        'Lean beef stir-fry with brown rice',
        'Grilled chicken with quinoa and vegetables',
        'Turkey meatballs with zucchini noodles',
        'Tofu and vegetable curry with brown rice'
      ],
      snacks: [
        'Apple with almond butter',
        'Greek yogurt with berries',
        'Handful of mixed nuts',
        'Protein bar',
        'Carrot sticks with hummus'
      ]
    };

    return {
      calories: { breakfast, lunch, dinner, snacks },
      suggestions: mealSuggestions
    };
  };

  const generateRoadmap = () => {
    const metrics = calculateBaseMetrics();
    const workouts = generateWorkoutPlan();
    const mealPlan = generateMealPlan(metrics.targetCalories);

    const roadmap: FitnessRoadmap = {
      dailyCalories: metrics.targetCalories,
      weeklyPlan: {},
      adaptiveGoals: {
        calories: {
          min: metrics.targetCalories - 100,
          target: metrics.targetCalories,
          max: metrics.targetCalories + 100
        },
        protein: Math.round(weight * 1.6), // 1.6g per kg of body weight
        carbs: Math.round((metrics.targetCalories * 0.45) / 4), // 45% of calories from carbs
        fats: Math.round((metrics.targetCalories * 0.25) / 9), // 25% of calories from fats
        workoutsPerWeek: goal.intensity === 'beginner' ? 3 : goal.intensity === 'intermediate' ? 4 : 5
      }
    };

    // Generate weekly plan
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((day, index) => {
      const isWorkoutDay = index < roadmap.adaptiveGoals.workoutsPerWeek;
      roadmap.weeklyPlan[day] = {
        meals: {
          breakfast: [mealPlan.suggestions.breakfast[index % 5]],
          lunch: [mealPlan.suggestions.lunch[index % 5]],
          dinner: [mealPlan.suggestions.dinner[index % 5]],
          snacks: [mealPlan.suggestions.snacks[index % 5]]
        },
        workout: isWorkoutDay ? workouts[0] : { type: 'Rest', exercises: [] }
      };
    });

    onRoadmapGenerated(roadmap);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-6 w-6" />
          Personalize Your Fitness Journey
        </CardTitle>
        <CardDescription>
          Let's create a customized plan based on your BMI and goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>What's your primary goal?</Label>
            <Select
              value={goal.type}
              onValueChange={(value: FitnessGoal['type']) =>
                setGoal({ ...goal, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_loss">Weight Loss</SelectItem>
                <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                <SelectItem value="maintenance">Maintain Weight</SelectItem>
                <SelectItem value="general_fitness">General Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>How intense would you like your program to be?</Label>
            <Select
              value={goal.intensity}
              onValueChange={(value: FitnessGoal['intensity']) =>
                setGoal({ ...goal, intensity: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select intensity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="equipment"
              checked={goal.equipmentAccess}
              onCheckedChange={(checked) =>
                setGoal({ ...goal, equipmentAccess: checked })
              }
            />
            <Label htmlFor="equipment">I have access to gym equipment</Label>
          </div>

          <Button onClick={generateRoadmap} className="w-full">
            Generate Roadmap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};