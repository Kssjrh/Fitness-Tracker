import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useFitness } from '@/contexts/FitnessContext';
import { useToast } from '@/hooks/use-toast';
import { Calculator, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoadmapDisplay } from '@/components/fitness/RoadmapDisplay';
import { apiFetch } from '@/lib/api';
import type { FitnessRoadmap } from '@/types/fitness';

interface Props {
  onCalculate?: (bmi: number, calorieGoal: number) => void;
}

export const BMICalculator: React.FC<Props> = ({ onCalculate }) => {
  const { user, updateProfile: updateUser } = useAuth();
  const { state, getDailyNutritionSummary } = useFitness();
  const { toast } = useToast();
  
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [fitnessGoal, setFitnessGoal] = useState('maintain');
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState<FitnessRoadmap | null>(null);
  
  const calculateBMI = async () => {
    if (!height || !weight) {
      toast({
        title: "Missing Information",
        description: "Please enter both height and weight.",
        variant: "destructive",
      });
      return;
    }

    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    
    if (isNaN(heightInMeters) || isNaN(weightInKg)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numbers for height and weight.",
        variant: "destructive",
      });
      return;
    }

    const calculatedBMI = weightInKg / (heightInMeters * heightInMeters);
    setBmi(parseFloat(calculatedBMI.toFixed(1)));

    // Calculate Base Metabolic Rate (BMR) using more accurate Mifflin-St Jeor Equation
    const age = user?.age || 25; // Default age if not available
    const gender = user?.gender || 'male'; // Default gender if not available
    const heightInCm = heightInMeters * 100;
    
    let bmr;
    if (gender === 'male') {
      // Mifflin-St Jeor Equation for men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
      bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) + 5;
    } else {
      // Mifflin-St Jeor Equation for women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
      bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) - 161;
    }

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,      // Little or no exercise
      light: 1.375,        // Light exercise 1-3 times/week
      moderate: 1.55,      // Moderate exercise 3-5 times/week
      active: 1.725,       // Active 6-7 times/week
      veryActive: 1.9      // Very active & physical job
    };

    // Calculate Total Daily Energy Expenditure (TDEE)
    const tdee = bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers];
    
    // Adjust calories based on fitness goal
    let calorieGoal;
    switch (fitnessGoal) {
      case 'lose':
        calorieGoal = Math.round(tdee - 500); // 500 calorie deficit for ~0.5kg/week loss
        break;
      case 'gain':
        calorieGoal = Math.round(tdee + 500); // 500 calorie surplus for ~0.5kg/week gain
        break;
      default: // maintain
        calorieGoal = Math.round(tdee);
    }
    
    // Calculate protein goal based on activity level and fitness goal
    let proteinPerKg;
    if (fitnessGoal === 'lose') {
      // Higher protein during weight loss to preserve muscle mass
      proteinPerKg = activityLevel === 'sedentary' ? 1.4 : 1.8;
    } else if (fitnessGoal === 'gain') {
      // Moderate protein for muscle building
      proteinPerKg = activityLevel === 'sedentary' ? 1.2 : 1.6;
    } else {
      // Maintenance protein needs
      proteinPerKg = activityLevel === 'sedentary' ? 1.0 : 1.4;
    }
    
    const proteinGoal = Math.round(weightInKg * proteinPerKg);

    // Calculate macro goals
    const carbsGoal = Math.round((calorieGoal * 0.45) / 4); // 45% of calories from carbs
    const fatsGoal = Math.round((calorieGoal * 0.25) / 9); // 25% of calories from fats
    const weeklyWorkoutGoal = activityLevel === 'sedentary' ? 3 : activityLevel === 'light' ? 4 : 5;

    try {
      // Save BMI data to backend
      const token = localStorage.getItem('fitnessTracker_token');
      if (token) {
        const response = await apiFetch<{
          bmiData: any;
          user: { id: string; weight: number; height: number; bmiData: any };
        }>('/api/bmi', {
          method: 'POST',
          body: JSON.stringify({
            bmi: calculatedBMI,
            calorieGoal,
            proteinGoal,
            carbsGoal,
            fatsGoal,
            weeklyWorkoutGoal,
            weight: weightInKg,
            height: heightInMeters * 100
          })
        }, token);

        // Update user's local state with response from server
        if (user && response.user) {
          updateUser({
            ...user,
            weight: response.user.weight,
            height: response.user.height,
            calorieGoal: response.user.bmiData?.calorieGoal || calorieGoal,
            proteinGoal: response.user.bmiData?.proteinGoal || proteinGoal,
            bmi: calculatedBMI,
            bmiData: response.user.bmiData,
            fitnessGoal,
            activityLevel
          });
        }

        // Refresh FitnessContext BMI data
        if (response.bmiData) {
          // Dispatch event to refresh BMI data in FitnessContext
          window.dispatchEvent(new CustomEvent('bmiUpdated', { detail: response.bmiData }));
        }

        // Refresh user data from server to ensure consistency
        try {
          const userResponse = await apiFetch<{ user: any }>('/api/auth/me', { method: 'GET' }, token);
          if (userResponse.user) {
            updateUser(userResponse.user);
          }
        } catch (err) {
          console.error('Error refreshing user data:', err);
        }
      }

      const goalText = fitnessGoal === 'lose' ? 'Weight Loss' : fitnessGoal === 'gain' ? 'Weight Gain' : 'Weight Maintenance';
      toast({
        title: "BMI & Goals Calculated",
        description: `BMI: ${calculatedBMI.toFixed(1)} | Goal: ${goalText} | Calories: ${calorieGoal} | Protein: ${proteinGoal}g`,
      });

      // Call the onCalculate callback if provided
      if (onCalculate) {
        onCalculate(calculatedBMI, calorieGoal);
      }
    } catch (error) {
      console.error('Error saving BMI data:', error);
      toast({
        title: "Error",
        description: "Failed to save BMI data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateWeeklyGoals = (bmi: number, fitnessGoal: string, activityLevel: string): string[] => {
    const goals: string[] = [];
    
    // BMI-based goals
    if (bmi < 18.5) {
      goals.push("Increase daily calorie intake by 200-300 calories");
      goals.push("Focus on strength training 3 times per week");
      goals.push("Include healthy fats in every meal (nuts, avocado, olive oil)");
    } else if (bmi >= 18.5 && bmi < 25) {
      goals.push("Maintain current healthy weight with balanced nutrition");
      goals.push("Engage in regular physical activity 4-5 times per week");
      goals.push("Focus on muscle maintenance and cardiovascular health");
    } else if (bmi >= 25 && bmi < 30) {
      goals.push("Create a moderate calorie deficit of 300-500 calories daily");
      goals.push("Increase daily water intake to 2.5-3 liters");
      goals.push("Include 30 minutes of cardio 5 times per week");
    } else {
      goals.push("Create a sustainable calorie deficit of 500-750 calories daily");
      goals.push("Start with low-impact exercises (walking, swimming)");
      goals.push("Focus on portion control and mindful eating");
    }
    
    // Fitness goal-based goals
    if (fitnessGoal === 'lose') {
      goals.push("Track all meals and snacks in the nutrition tracker");
      goals.push("Aim for 1-2 pounds of weight loss per week");
      goals.push("Increase protein intake to preserve muscle mass");
    } else if (fitnessGoal === 'gain') {
      goals.push("Eat 5-6 smaller meals throughout the day");
      goals.push("Focus on progressive overload in strength training");
      goals.push("Ensure adequate rest and recovery between workouts");
    } else {
      goals.push("Maintain consistent eating and exercise habits");
      goals.push("Monitor weight weekly to ensure stability");
      goals.push("Focus on overall health and fitness improvements");
    }
    
    // Activity level-based goals
    if (activityLevel === 'sedentary') {
      goals.push("Start with 10-15 minutes of daily movement");
      goals.push("Take walking breaks every hour during work");
      goals.push("Gradually increase activity level over 4-6 weeks");
    } else if (activityLevel === 'light') {
      goals.push("Maintain 3-4 workout sessions per week");
      goals.push("Include both cardio and strength training");
      goals.push("Focus on consistency over intensity");
    } else if (activityLevel === 'moderate') {
      goals.push("Maintain 4-5 workout sessions per week");
      goals.push("Include variety in workout types");
      goals.push("Ensure proper warm-up and cool-down");
    } else if (activityLevel === 'active') {
      goals.push("Maintain 5-6 workout sessions per week");
      goals.push("Include high-intensity interval training");
      goals.push("Focus on recovery and injury prevention");
    } else {
      goals.push("Maintain 6-7 workout sessions per week");
      goals.push("Include both strength and endurance training");
      goals.push("Monitor for signs of overtraining");
    }
    
    // General health goals
    goals.push("Get 7-9 hours of quality sleep each night");
    goals.push("Drink at least 2 liters of water daily");
    goals.push("Include 5-7 servings of fruits and vegetables daily");
    
    return goals.slice(0, 8); // Return top 8 most relevant goals
  };

  const generateExercises = (bmi: number, fitnessGoal: string, activityLevel: string): string[] => {
    const exercises: string[] = [];
    
    // Base exercises for all fitness levels
    exercises.push("Bodyweight squats");
    exercises.push("Push-ups (modified if needed)");
    exercises.push("Plank hold");
    exercises.push("Walking or light jogging");
    
    if (activityLevel !== 'sedentary') {
      exercises.push("Lunges");
      exercises.push("Mountain climbers");
      exercises.push("Burpees (modified if needed)");
    }
    
    if (activityLevel === 'moderate' || activityLevel === 'active' || activityLevel === 'veryActive') {
      exercises.push("Jumping jacks");
      exercises.push("High knees");
      exercises.push("Russian twists");
    }
    
    if (fitnessGoal === 'gain' || activityLevel === 'active' || activityLevel === 'veryActive') {
      exercises.push("Pull-ups or assisted pull-ups");
      exercises.push("Dips or modified dips");
      exercises.push("Deadlifts (with proper form)");
    }
    
    return exercises.slice(0, 10); // Return top 10 exercises
  };

  const generateRoadmap = async () => {
    if (bmi === null) {
      toast({
        title: "Calculate BMI First",
        description: "Please calculate your BMI before generating a roadmap.",
        variant: "destructive",
      });
      return;
    }
    setShowRoadmap(true);
    
    // Generate personalized weekly goals and exercises
    const weeklyGoals = generateWeeklyGoals(bmi, fitnessGoal, activityLevel);
    const exercises = generateExercises(bmi, fitnessGoal, activityLevel);
    
    const newRoadmap: FitnessRoadmap = {
      bmi,
      targetBmi: bmi > 25 ? 25 : bmi < 18.5 ? 18.5 : bmi,
      weeklyGoals,
      exercises,
      nutritionPlan: {
        dailyCalories: user?.calorieGoal || 2000,
        macroSplit: {
          protein: 30,
          carbs: 40,
          fats: 30
        }
      }
    };
    setRoadmap(newRoadmap);
    
    toast({
      title: "Roadmap Generated!",
      description: `Created ${weeklyGoals.length} personalized goals and ${exercises.length} recommended exercises.`,
    });
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            BMI Calculator
          </CardTitle>
          <CardDescription>
            Calculate your Body Mass Index and daily calorie requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                placeholder="Enter your height in cm"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                placeholder="Enter your weight in kg"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select
                value={activityLevel}
                onValueChange={setActivityLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (Little or no exercise)</SelectItem>
                  <SelectItem value="light">Light (Exercise 1-3 times/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (Exercise 3-5 times/week)</SelectItem>
                  <SelectItem value="active">Active (Exercise 6-7 times/week)</SelectItem>
                  <SelectItem value="veryActive">Very Active (Intense exercise & physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal">Fitness Goal</Label>
              <Select
                value={fitnessGoal}
                onValueChange={setFitnessGoal}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your fitness goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose">Weight Loss (-500 cal/day)</SelectItem>
                  <SelectItem value="maintain">Weight Maintenance</SelectItem>
                  <SelectItem value="gain">Weight Gain (+500 cal/day)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={calculateBMI}
              className="w-full"
            >
              Calculate BMI
            </Button>
            {bmi && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 rounded-lg bg-background"
              >
                <p className="text-lg font-semibold">Your BMI: {bmi}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {bmi < 18.5
                    ? "Underweight"
                    : bmi < 25
                    ? "Normal weight"
                    : bmi < 30
                    ? "Overweight"
                    : "Obese"}
                </p>
                {user?.calorieGoal && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      <strong>Daily Calorie Goal:</strong> {user.calorieGoal} calories
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Daily Protein Goal:</strong> {user.proteinGoal}g
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Goal: {fitnessGoal === 'lose' ? 'Weight Loss' : fitnessGoal === 'gain' ? 'Weight Gain' : 'Weight Maintenance'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {bmi && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Fitness Roadmap
            </CardTitle>
            <CardDescription>
              Generate a personalized fitness plan based on your BMI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateRoadmap}
              className="w-full"
              variant="secondary"
            >
              Generate Roadmap
            </Button>
            {showRoadmap && roadmap && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <RoadmapDisplay roadmap={roadmap} />
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};