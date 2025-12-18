import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { FitnessRoadmap } from '@/types/fitness';
import { apiFetch } from '@/lib/api';

interface WorkoutExercise {
  type: 'repetition' | 'duration';
  name: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number;
  intensity?: string;
  notes?: string;
}

interface Workout {
  id?: string;
  userId?: string;
  date: string;
  type: string;
  exercises: WorkoutExercise[];
  duration?: number;
  calories?: number;
  notes?: string;
  completed?: boolean;
}

interface BMIData {
  bmi: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  weeklyWorkoutGoal: number;
  lastUpdated: string;
}

interface FitnessState {
  roadmap: FitnessRoadmap | null;
  bmiData: BMIData | null;
  dailyProgress: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    workoutsCompleted: number;
  };
  weeklyGoals: {
    workouts: number;
    calories: number;
    protein: number;
  };
  workoutHistory: Workout[];
  dailyMeals: NutritionEntry[];
}

interface FitnessContextType {
  state: FitnessState;
  roadmap: FitnessRoadmap | null;
  bmiData: BMIData | null;
  workoutHistory: Workout[];
  nutritionEntries: NutritionEntry[];
  updateRoadmap: (roadmap: FitnessRoadmap) => void;
  logWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (id: string, workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  updateDailyProgress: (progress: Partial<FitnessState['dailyProgress']>) => void;
  logNutrition: (entry: NutritionEntry) => Promise<NutritionSummary>;
  updateMeal: (mealId: string, entry: NutritionEntry) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  getDailyNutritionSummary: (date: string) => Promise<NutritionSummary>;
  getNutritionTrends: (start: string, end: string) => Promise<any>;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

const initialState: FitnessState = {
  roadmap: null,
  bmiData: null,
  dailyProgress: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    workoutsCompleted: 0,
  },
  weeklyGoals: {
    workouts: 3,  // default to 3 workouts per week
    calories: 2000, // default daily calorie goal
    protein: 60, // default daily protein goal in grams
  },
  workoutHistory: [],
  dailyMeals: [],
};

interface NutritionEntry {
  id?: string;
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

interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  roadmapAdherence?: {
    percentage: number;
    mealsOnRoadmap: number;
    totalMeals: number;
  };
}

type FitnessAction =
  | { type: 'SET_ROADMAP'; payload: FitnessRoadmap }
  | { type: 'SET_BMI_DATA'; payload: BMIData }
  | { type: 'LOG_WORKOUT'; payload: Workout }
  | { type: 'UPDATE_WORKOUT'; payload: Workout }
  | { type: 'DELETE_WORKOUT'; payload: string }
  | { type: 'UPDATE_NUTRITION'; payload: NutritionSummary }
  | { type: 'UPDATE_NUTRITION'; payload: NutritionSummary }
  | { type: 'SET_NUTRITION_ENTRIES'; payload: NutritionEntry[] }
  | { type: 'UPDATE_DAILY_PROGRESS'; payload: Partial<FitnessState['dailyProgress']> }
  | { type: 'UPDATE_MEAL'; payload: { mealId: string; entry: NutritionEntry; summary: NutritionSummary } }
  | { type: 'DELETE_MEAL'; payload: { mealId: string; summary: NutritionSummary } };

function fitnessReducer(state: FitnessState, action: FitnessAction): FitnessState {
  switch (action.type) {
    case 'UPDATE_NUTRITION':
      return {
        ...state,
        dailyProgress: {
          ...state.dailyProgress,
          calories: action.payload.totalCalories,
          protein: action.payload.totalProtein,
          carbs: action.payload.totalCarbs,
          fats: action.payload.totalFats
        }
      };

    case 'SET_ROADMAP':
      return { ...state, roadmap: action.payload };

    case 'SET_BMI_DATA':
      return {
        ...state,
        bmiData: action.payload,
        weeklyGoals: {
          workouts: action.payload.weeklyWorkoutGoal,
          calories: action.payload.calorieGoal,
          protein: action.payload.proteinGoal
        }
      };

    case 'LOG_WORKOUT':
      return {
        ...state,
        workoutHistory: [...state.workoutHistory, action.payload],
        dailyProgress: {
          ...state.dailyProgress,
          workoutsCompleted: state.dailyProgress.workoutsCompleted + 1,
        },
      };

    case 'UPDATE_WORKOUT':
      return {
        ...state,
        workoutHistory: state.workoutHistory.map(workout => 
          workout.id === action.payload.id ? action.payload : workout
        )
      };

    case 'DELETE_WORKOUT':
      return {
        ...state,
        workoutHistory: state.workoutHistory.filter(workout => workout.id !== action.payload)
      };

    case 'UPDATE_DAILY_PROGRESS':
      return {
        ...state,
        dailyProgress: { ...state.dailyProgress, ...action.payload },
      };

    case 'UPDATE_MEAL':
      return {
        ...state,
        dailyMeals: state.dailyMeals.map(meal => 
          meal.id === action.payload.mealId ? action.payload.entry : meal
        ),
        dailyProgress: action.payload.summary ? {
          ...state.dailyProgress,
          calories: action.payload.summary.totalCalories,
          protein: action.payload.summary.totalProtein,
          carbs: action.payload.summary.totalCarbs,
          fats: action.payload.summary.totalFats
        } : state.dailyProgress
      };

    case 'DELETE_MEAL':
      return {
        ...state,
        dailyMeals: state.dailyMeals.filter(meal => meal.id !== action.payload.mealId),
        dailyProgress: action.payload.summary ? {
          ...state.dailyProgress,
          calories: action.payload.summary.totalCalories,
          protein: action.payload.summary.totalProtein,
          carbs: action.payload.summary.totalCarbs,
          fats: action.payload.summary.totalFats
        } : state.dailyProgress
      };

    case 'SET_NUTRITION_ENTRIES':
      return {
        ...state,
        dailyMeals: action.payload
      };
      
    default:
      return state;
  }
}

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(fitnessReducer, initialState);
  const { user } = useAuth();
  const todayString = () => new Date().toISOString().split('T')[0];
  let currentDate = todayString();

  useEffect(() => {
    if (user?.id) {
      // Fetch user's fitness data when component mounts
      const fetchFitnessData = async () => {
        try {
          const token = localStorage.getItem('fitnessTracker_token');
          
          const [roadmapRes, bmiRes, progressRes, historyRes, nutritionRes, nutritionEntriesRes] = await Promise.all([
            apiFetch<{ roadmap: FitnessRoadmap }>('/api/workouts/roadmap', { method: 'GET' }, token),
            apiFetch<BMIData>('/api/bmi', { method: 'GET' }, token),
            apiFetch<{ progress: FitnessState['dailyProgress'] }>('/api/workouts/daily-progress', { method: 'GET' }, token),
            apiFetch<FitnessState['workoutHistory']>('/api/workouts/history', { method: 'GET' }, token),
            apiFetch<NutritionSummary>(`/api/nutrition/daily-summary?date=${new Date().toISOString().split('T')[0]}`, { method: 'GET' }, token),
            apiFetch<NutritionEntry[]>(`/api/nutrition/entries?date=${new Date().toISOString().split('T')[0]}`, { method: 'GET' }, token)
          ]);

          if (bmiRes && bmiRes.bmi) {
            dispatch({ 
              type: 'SET_BMI_DATA',
              payload: bmiRes
            });
          }

          if (roadmapRes.roadmap) {
            dispatch({ type: 'SET_ROADMAP', payload: roadmapRes.roadmap });
          }

          if (progressRes.progress) {
            dispatch({ type: 'UPDATE_DAILY_PROGRESS', payload: progressRes.progress });
          }

          if (historyRes && Array.isArray(historyRes)) {
            historyRes.forEach((workout) => {
              dispatch({ type: 'LOG_WORKOUT', payload: workout });
            });
          }

          if (nutritionRes) {
            dispatch({ type: 'UPDATE_NUTRITION', payload: nutritionRes });
          }

          // Always set nutrition entries, even if empty array
          if (Array.isArray(nutritionEntriesRes)) {
            dispatch({ type: 'SET_NUTRITION_ENTRIES', payload: nutritionEntriesRes });
          } else {
            // If API call failed, set empty array
            dispatch({ type: 'SET_NUTRITION_ENTRIES', payload: [] });
          }
        } catch (error) {
          console.error('Error fetching fitness data:', error);
        }
      };

      fetchFitnessData();

      // Listen for nutrition entries added from other components (e.g., MealSuggestions)
      const onEntryAdded = async (e: any) => {
        try {
          const date = e?.detail?.date || new Date().toISOString().split('T')[0];
          const token = localStorage.getItem('fitnessTracker_token');
          const [summary, entries] = await Promise.all([
            apiFetch<NutritionSummary>(`/api/nutrition/daily-summary?date=${date}`, { method: 'GET' }, token),
            apiFetch<NutritionEntry[]>(`/api/nutrition/entries?date=${date}`, { method: 'GET' }, token)
          ]);
          dispatch({ type: 'UPDATE_NUTRITION', payload: summary });
          dispatch({ type: 'SET_NUTRITION_ENTRIES', payload: entries });
        } catch (err) {
          console.error('Failed refreshing nutrition after add:', err);
        }
      };
      window.addEventListener('nutrition:entryAdded' as any, onEntryAdded as any);
      
      // Listen for BMI updates
      const onBmiUpdated = async (e: any) => {
        try {
          const bmiData = e?.detail;
          if (bmiData) {
            dispatch({ 
              type: 'SET_BMI_DATA',
              payload: bmiData
            });
          }
          // Also refresh BMI data from server to ensure consistency
          const token = localStorage.getItem('fitnessTracker_token');
          if (token) {
            const bmiRes = await apiFetch<BMIData>('/api/bmi', { method: 'GET' }, token);
            if (bmiRes && bmiRes.bmi) {
              dispatch({ 
                type: 'SET_BMI_DATA',
                payload: bmiRes
              });
            }
          }
        } catch (err) {
          console.error('Failed refreshing BMI data:', err);
        }
      };
      window.addEventListener('bmiUpdated' as any, onBmiUpdated as any);
      
      // Set up a daily reset at date change
      const interval = setInterval(async () => {
        const now = todayString();
        if (now !== currentDate) {
          currentDate = now;
          try {
            const token = localStorage.getItem('fitnessTracker_token');
            const [summary, entries] = await Promise.all([
              apiFetch<NutritionSummary>(`/api/nutrition/daily-summary?date=${now}`, { method: 'GET' }, token),
              apiFetch<NutritionEntry[]>(`/api/nutrition/entries?date=${now}`, { method: 'GET' }, token)
            ]);
            dispatch({ type: 'UPDATE_NUTRITION', payload: summary });
            dispatch({ type: 'SET_NUTRITION_ENTRIES', payload: entries });
          } catch (err) {
            // If API not available, at least zero out local daily totals
            dispatch({ type: 'UPDATE_DAILY_PROGRESS', payload: { calories: 0, protein: 0, carbs: 0, fats: 0 } });
          }
        }
      }, 60 * 1000); // check each minute

      return () => {
        window.removeEventListener('nutrition:entryAdded' as any, onEntryAdded as any);
        window.removeEventListener('bmiUpdated' as any, onBmiUpdated as any);
        clearInterval(interval);
      };
    }
  }, [user?.id]);

  const updateRoadmap = async (roadmap: FitnessRoadmap) => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      await apiFetch('/api/workouts/roadmap', {
        method: 'POST',
        body: JSON.stringify({ roadmap })
      }, token);
      dispatch({ type: 'SET_ROADMAP', payload: roadmap });
    } catch (error) {
      console.error('Error updating roadmap:', error);
    }
  };

  const logWorkout = async (workout: Workout): Promise<void> => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiFetch<Workout>('/api/workouts/log', {
        method: 'POST',
        body: JSON.stringify(workout)
      }, token);

      // Update state with the response from server
      dispatch({ type: 'LOG_WORKOUT', payload: response });

      // Dispatch custom event to notify other contexts after a short delay to ensure state is updated
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('workoutLogged', { detail: { workout: response } }));
      }, 100);
    } catch (error) {
      console.error('Error logging workout:', error);
      throw error;
    }
  };

  const updateWorkout = async (id: string, workout: Workout): Promise<void> => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiFetch<Workout>(`/api/workouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(workout),
      }, token);
      
      dispatch({
        type: 'UPDATE_WORKOUT',
        payload: response,
      });
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  };

  const deleteWorkout = async (id: string): Promise<void> => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await apiFetch(`/api/workouts/${id}`, {
        method: 'DELETE'
      }, token);
      
      dispatch({
        type: 'DELETE_WORKOUT',
        payload: id,
      });
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  };

  const updateDailyProgress = async (progress: Partial<FitnessState['dailyProgress']>) => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      await apiFetch('/api/workouts/daily-progress', {
        method: 'POST',
        body: JSON.stringify(progress)
      }, token);
      dispatch({ type: 'UPDATE_DAILY_PROGRESS', payload: progress });
    } catch (error) {
      console.error('Error updating daily progress:', error);
    }
  };

  const logNutrition = async (entry: NutritionEntry) => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      await apiFetch('/api/nutrition', {
        method: 'POST',
        body: JSON.stringify(entry)
      }, token);
      
      // Get updated nutrition summary and entries
      const [summary, entries] = await Promise.all([
        getDailyNutritionSummary(entry.date),
        apiFetch<NutritionEntry[]>(`/api/nutrition/entries?date=${entry.date}`, { method: 'GET' }, token)
      ]);
      
      dispatch({ type: 'UPDATE_NUTRITION', payload: summary });
      dispatch({ type: 'SET_NUTRITION_ENTRIES', payload: entries });
      
      // Update daily progress
      const dailyProgress = {
        ...state.dailyProgress,
        calories: summary.totalCalories,
        protein: summary.totalProtein,
        carbs: summary.totalCarbs,
        fats: summary.totalFats
      };
      dispatch({ type: 'UPDATE_DAILY_PROGRESS', payload: dailyProgress });
      
      // Dispatch custom event to notify other contexts after a short delay to ensure state is updated
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nutritionLogged', { detail: { entry, summary } }));
      }, 100);
      
      return summary;
    } catch (error) {
      console.error('Error logging nutrition:', error);
      throw error;
    }
  };

  const getDailyNutritionSummary = async (date: string): Promise<NutritionSummary> => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      const summary = await apiFetch<NutritionSummary>(`/api/nutrition/daily-summary?date=${date}`, { method: 'GET' }, token);
      dispatch({ type: 'UPDATE_NUTRITION', payload: summary });
      return summary;
    } catch (error) {
      console.error('Error getting nutrition summary:', error);
      throw error;
    }
  };

  const getNutritionTrends = async (start: string, end: string) => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      return await apiFetch(`/api/nutrition/trends?start=${start}&end=${end}`, { method: 'GET' }, token);
    } catch (error) {
      console.error('Error getting nutrition trends:', error);
      throw error;
    }
  };

  const updateMeal = async (mealId: string, entry: NutritionEntry): Promise<void> => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      const response = await apiFetch<{meal: NutritionEntry; summary: NutritionSummary}>(`/api/nutrition/${mealId}`, {
        method: 'PUT',
        body: JSON.stringify(entry),
      }, token);

      dispatch({ 
        type: 'UPDATE_MEAL', 
        payload: { 
          mealId, 
          entry: response.meal,
          summary: response.summary 
        }
      });
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  };

  const deleteMeal = async (mealId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      const response = await apiFetch<{summary: NutritionSummary}>(`/api/nutrition/${mealId}`, {
        method: 'DELETE',
      }, token);

      dispatch({ 
        type: 'DELETE_MEAL', 
        payload: { 
          mealId,
          summary: response.summary 
        }
      });
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  };

  return (
    <FitnessContext.Provider value={{
      state,
      roadmap: state.roadmap,
      bmiData: state.bmiData,
      workoutHistory: state.workoutHistory,
      nutritionEntries: state.dailyMeals,
      updateRoadmap,
      logWorkout,
      updateWorkout,
      deleteWorkout,
      updateDailyProgress,
      logNutrition,
      updateMeal,
      deleteMeal,
      getDailyNutritionSummary,
      getNutritionTrends
    }}>
      {children}
    </FitnessContext.Provider>
  );
}

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (context === undefined) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};