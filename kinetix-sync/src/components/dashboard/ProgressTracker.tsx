import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dumbbell, Apple, Award, Target } from 'lucide-react';
import { useFitness } from '@/contexts/FitnessContext';
import { useAuth } from '@/contexts/AuthContext';

export const ProgressTracker: React.FC = () => {
  const { state: { roadmap, dailyProgress, workoutHistory, weeklyGoals } } = useFitness();
  const { user } = useAuth();

  const calculateStreak = () => {
    if (!workoutHistory.length) return 0;
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const sortedHistory = [...workoutHistory].sort((a, b) => b.date.localeCompare(a.date));
    
    for (let i = 0; i < sortedHistory.length; i++) {
      const workoutDate = new Date(sortedHistory[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (workoutDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getWorkoutsThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    return workoutHistory.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= startOfWeek && workoutDate <= today;
    }).length;
  };

  const currentStreak = calculateStreak();
  const workoutsThisWeek = getWorkoutsThisWeek();
  
  // Use user's goals from BMI calculation if available, otherwise fall back to weeklyGoals
  const dailyCalorieGoal = user?.bmiData?.calorieGoal || user?.calorieGoal || weeklyGoals.calories;
  const dailyProteinGoal = user?.bmiData?.proteinGoal || user?.proteinGoal || weeklyGoals.protein;
  
  const calorieProgress = (dailyProgress.calories / dailyCalorieGoal) * 100;
  const proteinProgress = (dailyProgress.protein / dailyProteinGoal) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Calories</CardTitle>
          <Apple className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold">
              {dailyProgress.calories}
              <span className="text-sm text-muted-foreground ml-1">/ {dailyCalorieGoal} kcal</span>
            </p>
            <Progress value={calorieProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Daily Target Progress
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Protein Goal</CardTitle>
          <Target className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold">
              {dailyProgress.protein}
              <span className="text-sm text-muted-foreground ml-1">/ {dailyProteinGoal}g</span>
            </p>
            <Progress value={proteinProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Daily Protein Progress
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Goals</CardTitle>
          <Dumbbell className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold">
              {workoutsThisWeek}
              <span className="text-sm text-muted-foreground ml-1">/ {weeklyGoals.workouts} workouts</span>
            </p>
            <Progress 
              value={(workoutsThisWeek / weeklyGoals.workouts) * 100}
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground">
              Weekly Workout Progress
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Award className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                <span className={currentStreak >= 7 ? 'text-success' : 'text-warning'}>
                  {currentStreak}
                </span>
                <span className="text-sm text-muted-foreground ml-1">days</span>
              </p>
              <p className="text-xs text-muted-foreground">Keep it going!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};