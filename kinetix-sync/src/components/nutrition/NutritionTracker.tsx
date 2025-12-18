import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFitness } from '@/contexts/FitnessContext';
import { useToast } from '@/hooks/use-toast';

const mealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snacks']),
  name: z.string().min(1, 'Meal name is required'),
  calories: z.coerce.number().min(1, 'Please enter calories'),
  protein: z.coerce.number().min(0).default(0),
  carbs: z.coerce.number().min(0).default(0),
  fats: z.coerce.number().min(0).default(0),
  servingSize: z.coerce.number().min(1, 'Please enter serving size'),
  servingUnit: z.string().min(1, 'Please enter serving unit'),
  notes: z.string().optional()
});

const formatMacro = (value: number) => `${Math.round(value)}g`;
const formatCalories = (value: number) => `${Math.round(value)} kcal`;
const formatPercentage = (value: number) => `${Math.round(value)}%`;

export const NutritionTracker = () => {
  const { toast } = useToast();
  const { state: { roadmap }, logNutrition, getDailyNutritionSummary } = useFitness();
  type NutritionSummaryBase = {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
    roadmapAdherence?: {
      percentage: number;
      mealsOnRoadmap: number;
      totalMeals: number;
    };
  };

  interface NutritionApiResponse extends NutritionSummaryBase {
    meals: Array<z.infer<typeof mealSchema>>;
  }

  const [dailySummary, setDailySummary] = useState<NutritionSummaryBase | null>(null);
  const [loggedMeals, setLoggedMeals] = useState<Array<z.infer<typeof mealSchema>>>([]);
  const [date] = useState(new Date().toISOString().split('T')[0]);

  const form = useForm<z.infer<typeof mealSchema>>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      mealType: 'breakfast',
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      servingSize: 0,
      servingUnit: 'g'
    }
  });

  const loadDailySummary = async () => {
    try {
      const apiResponse = await getDailyNutritionSummary(date);
      const summary = apiResponse as NutritionApiResponse;
      const { meals, ...summaryData } = summary;
      setDailySummary(summaryData);
      setLoggedMeals(meals);
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    }
  };

  useEffect(() => {
    loadDailySummary();
  }, [date]);

  const onSubmit = async (data: z.infer<typeof mealSchema>) => {
    if (!form.formState.isValid) {
      form.trigger(); // Trigger validation on all fields
      return;
    }

    try {
      // Prepare nutrition entry with proper data transformation
      const nutritionEntry = {
        mealType: data.mealType,
        name: data.name.trim(),
        calories: Math.round(data.calories),
        protein: Math.max(0, Math.round(data.protein)),
        carbs: Math.max(0, Math.round(data.carbs)),
        fats: Math.max(0, Math.round(data.fats)),
        servingSize: Math.round(data.servingSize),
        servingUnit: data.servingUnit.trim(),
        notes: data.notes?.trim(),
        date
      };
      
      await logNutrition(nutritionEntry);
      
      toast({
        title: 'Meal logged successfully',
        description: `Added ${nutritionEntry.name} to your ${nutritionEntry.mealType} log.`
      });
      
      form.reset();
      loadDailySummary();
    } catch (error) {
      console.error('Error logging meal:', error);
      
      toast({
        title: 'Error logging meal',
        description: error instanceof Error ? error.message : 'Failed to log meal',
        variant: 'destructive'
      });
      return; // Keep the form values on error
    }
  };

  const getGoalProgress = (current: number, target: number) => {
    if (!target) return 0;
    const progress = (current / target) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
  const suggestedMeals = {
    breakfast: ["Healthy breakfast options"],
    lunch: ["Balanced lunch suggestions"],
    dinner: ["Nutritious dinner ideas"],
    snacks: ["Healthy snack options"]
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Log Your Meal</CardTitle>
          <CardDescription>Track your nutrition and stay aligned with your goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snacks">Snacks</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Oatmeal with berries" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="kcal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fats (g)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="servingSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serving Size</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servingUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="g">Grams (g)</SelectItem>
                          <SelectItem value="ml">Milliliters (ml)</SelectItem>
                          <SelectItem value="oz">Ounces (oz)</SelectItem>
                          <SelectItem value="cup">Cup</SelectItem>
                          <SelectItem value="serving">Serving</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Any additional notes about the meal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">Log Meal</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {dailySummary && roadmap && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Progress</CardTitle>
            <CardDescription>Your nutrition goals and progress for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Calories</span>
                  <span>{formatCalories(dailySummary.totalCalories)} / {formatCalories(roadmap.nutritionPlan.dailyCalories)}</span>
                </div>
                <Progress value={getGoalProgress(dailySummary.totalCalories, roadmap.nutritionPlan.dailyCalories)} />
                <div className="flex justify-end text-sm mt-1">
                  <span className={dailySummary.totalCalories > roadmap.nutritionPlan.dailyCalories ? "text-red-500" : "text-green-500"}>
                    {dailySummary.totalCalories > roadmap.nutritionPlan.dailyCalories ? 
                      `${formatCalories(dailySummary.totalCalories - roadmap.nutritionPlan.dailyCalories)} over` : 
                      `${formatCalories(roadmap.nutritionPlan.dailyCalories - dailySummary.totalCalories)} remaining`}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Protein</span>
                  <span>{formatMacro(dailySummary.totalProtein)} / {formatMacro((roadmap.nutritionPlan.dailyCalories * (roadmap.nutritionPlan.macroSplit.protein / 100) / 4))}</span>
                </div>
                <Progress value={getGoalProgress(dailySummary.totalProtein, (roadmap.nutritionPlan.dailyCalories * (roadmap.nutritionPlan.macroSplit.protein / 100) / 4))} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Carbs</span>
                  <span>{formatMacro(dailySummary.totalCarbs)} / {formatMacro((roadmap.nutritionPlan.dailyCalories * (roadmap.nutritionPlan.macroSplit.carbs / 100) / 4))}</span>
                </div>
                <Progress value={getGoalProgress(dailySummary.totalCarbs, (roadmap.nutritionPlan.dailyCalories * (roadmap.nutritionPlan.macroSplit.carbs / 100) / 4))} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Fats</span>
                  <span>{formatMacro(dailySummary.totalFats)} / {formatMacro((roadmap.nutritionPlan.dailyCalories * (roadmap.nutritionPlan.macroSplit.fats / 100) / 9))}</span>
                </div>
                <Progress value={getGoalProgress(dailySummary.totalFats, (roadmap.nutritionPlan.dailyCalories * (roadmap.nutritionPlan.macroSplit.fats / 100) / 9))} />
              </div>
            </div>

            {dailySummary.roadmapAdherence && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Roadmap Adherence</p>
                <div className="text-sm text-muted-foreground">
                  <p>On Track: {formatPercentage(dailySummary.roadmapAdherence.percentage)}</p>
                  <p>Meals Following Plan: {dailySummary.roadmapAdherence.mealsOnRoadmap} / {dailySummary.roadmapAdherence.totalMeals}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {suggestedMeals && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Meals</CardTitle>
            <CardDescription>Recommended meals from your roadmap for today</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meal Type</TableHead>
                    <TableHead>Suggestions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(suggestedMeals).map(([type, meals]) => (
                    <TableRow key={type}>
                      <TableCell className="font-medium capitalize">{type}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside">
                          {(meals as string[]).map((meal, index) => (
                            <li key={index}>{meal}</li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};