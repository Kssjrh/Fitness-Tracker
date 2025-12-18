import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MealSuggestions } from './MealSuggestions';
import { useAuth } from '@/contexts/AuthContext';

export const MealPlanningPage: React.FC = () => {
  const { user } = useAuth();

  if (!user?.calorieGoal || !user?.proteinGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meal Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Calculate your BMI first to get personalized meal suggestions.
          </p>
          <p className="text-sm text-muted-foreground">Go to the BMI Calculator to set your goals.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <MealSuggestions
      calorieGoal={user.calorieGoal}
      proteinGoal={user.proteinGoal}
      bmi={user.bmi || 22}
      fitnessGoal={user.fitnessGoal || 'maintain'}
      activityLevel={user.activityLevel || 'moderate'}
    />
  );
};











