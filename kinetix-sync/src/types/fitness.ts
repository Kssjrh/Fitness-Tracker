import { z } from 'zod';

export interface BaseExercise {
  name: string;
  sets: number;
  weight?: number;
  notes?: string;
}

export interface RepetitionExercise extends BaseExercise {
  type: 'repetition';
  reps: number;
  intensity?: 'low' | 'moderate' | 'high';
  setType?: 'normal' | 'drop' | 'super';
  dropSets?: Array<{ weight: number; reps: number }>;
  superSetWith?: string; // Name of the exercise to superset with
}

export interface DurationExercise extends BaseExercise {
  type: 'duration';
  duration: number;  // duration in seconds
  intensity?: 'low' | 'moderate' | 'high';
}

export type Exercise = RepetitionExercise | DurationExercise;

export interface Workout {
  id?: string;
  userId?: string;
  date: string;
  type: string;
  exercises: Exercise[];
  duration?: number;
  calories?: number;
  notes?: string;
  completed?: boolean;
}

export interface NutritionEntry {
  id?: string;
  userId?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
  servingUnit: string;
  notes?: string;
  date: string;
}

export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  entries?: NutritionEntry[];
}

export const mealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snacks']),
  name: z.string().min(1, 'Meal name is required'),
  calories: z.coerce.number().min(1, 'Please enter calories'),
  protein: z.coerce.number().min(0).default(0),
  carbs: z.coerce.number().min(0).default(0),
  fats: z.coerce.number().min(0).default(0),
  servingSize: z.coerce.number().min(1, 'Please enter serving size'),
  servingUnit: z.string().min(1, 'Please enter serving unit')
});

export interface FitnessRoadmap {
  bmi: number;
  targetBmi: number;
  weeklyGoals: string[];
  exercises: string[];
  nutritionPlan: {
    dailyCalories: number;
    macroSplit: {
      protein: number;
      carbs: number;
      fats: number;
    };
  };
}

export interface DailyProgress {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  workoutsCompleted: number;
}

export interface FitnessState {
  roadmap: FitnessRoadmap | null;
  dailyProgress: DailyProgress;
  workoutHistory: Workout[];
}