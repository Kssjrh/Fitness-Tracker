import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NutritionTracker } from './NutritionTracker';

export const NutritionTrackingPage: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Your Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <NutritionTracker />
      </CardContent>
    </Card>
  );
};











