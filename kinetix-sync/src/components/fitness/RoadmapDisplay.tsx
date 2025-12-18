import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dumbbell, Utensils, Target, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { FitnessRoadmap } from '@/types/fitness';

interface RoadmapDisplayProps {
  roadmap: FitnessRoadmap;
}

export const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({ roadmap }) => {
  const { user } = useAuth();
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-6 w-6" />
          Your Personalized Fitness Plan
        </CardTitle>
        <CardDescription>
          Follow this plan to reach your fitness goals effectively
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Current BMI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roadmap.bmi}</div>
                <p className="text-xs text-muted-foreground">
                  Target: {roadmap.targetBmi}
                </p>
                <Progress
                  value={Math.min(100, (roadmap.bmi / roadmap.targetBmi) * 100)}
                  className="mt-2"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Daily Calories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roadmap.nutritionPlan.dailyCalories}</div>
                <p className="text-xs text-muted-foreground">
                  Recommended intake
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Protein Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user?.proteinGoal || Math.round(roadmap.nutritionPlan.dailyCalories * (roadmap.nutritionPlan.macroSplit.protein / 100) / 4)}g
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.proteinGoal ? 'Daily target (weight-based)' : `Daily target (${roadmap.nutritionPlan.macroSplit.protein}% of calories)`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Weekly Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roadmap.weeklyGoals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Goals to achieve
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Weekly Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {roadmap.weeklyGoals.map((goal, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <p className="text-sm">{goal}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Nutrition Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Daily Targets</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Calories:</span>
                        <span>{roadmap.nutritionPlan.dailyCalories} kcal</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Protein:</span>
                        <span>
                          {user?.proteinGoal 
                            ? `${Math.round((user.proteinGoal * 4 / roadmap.nutritionPlan.dailyCalories) * 100)}%`
                            : `${roadmap.nutritionPlan.macroSplit.protein}%`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Carbs:</span>
                        <span>{roadmap.nutritionPlan.macroSplit.carbs}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fats:</span>
                        <span>{roadmap.nutritionPlan.macroSplit.fats}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {roadmap.exercises.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Recommended Exercises
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roadmap.exercises.map((exercise, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h4 className="font-semibold text-sm">{exercise}</h4>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};