import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Dumbbell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFitness } from '@/contexts/FitnessContext';
import { useAuth } from '@/contexts/AuthContext';
import type { RepetitionExercise, DurationExercise, Exercise, Workout } from '@/types/fitness';

const exerciseSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('repetition'),
    name: z.string().min(1, "Exercise name is required"),
    sets: z.coerce.number().min(1, "Sets must be at least 1"),
    reps: z.coerce.number().min(1, "Reps must be at least 1"),
    weight: z.coerce.number().min(0).optional(),
    intensity: z.enum(['low', 'moderate', 'high']).optional(),
    notes: z.string().optional(),
  }),
  z.object({
    type: z.literal('duration'),
    name: z.string().min(1, "Exercise name is required"),
    sets: z.coerce.number().min(1, "Sets must be at least 1"),
    duration: z.coerce.number().min(1, "Duration must be at least 1 second"),
    weight: z.coerce.number().min(0).optional(),
    intensity: z.enum(['low', 'moderate', 'high']).optional(),
    notes: z.string().optional(),
  }),
]);

const formSchema = z.object({
  workoutType: z.string().min(1, "Please select a workout type"),
  exercises: z.array(exerciseSchema),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

export const LogWorkout: React.FC = () => {
  const { logWorkout } = useFitness();
  const { toast } = useToast();
  const [currentExercise, setCurrentExercise] = useState<Partial<RepetitionExercise | DurationExercise>>({
    type: 'repetition',
    name: '',
    sets: 0,
    reps: 0,
    setType: 'normal'
  });
  const [dropSets, setDropSets] = useState<Array<{ weight: number; reps: number }>>([]);
  const [superSetWith, setSuperSetWith] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workoutType: '',
      exercises: [],
      notes: null,
    },
    mode: 'onChange'
  });

  const exercises = form.watch('exercises') || [];
  const workoutType = form.watch('workoutType');

  // Determine exercise type and specific fields based on workout type
  const getWorkoutTypeConfig = (workoutType: string) => {
    switch (workoutType) {
      case 'strength':
        return {
          exerciseType: 'repetition' as const,
          fields: ['sets', 'reps', 'weight', 'setType'],
          placeholder: "e.g., Bench Press, Squats, Deadlifts",
          description: "Add strength training exercises with sets and reps"
        };
      case 'cardio':
        return {
          exerciseType: 'duration' as const,
          fields: ['duration', 'intensity', 'distance'],
          placeholder: "e.g., Running, Cycling, Swimming",
          description: "Add cardio exercises with duration and intensity"
        };
      case 'hiit':
        return {
          exerciseType: 'duration' as const,
          fields: ['duration', 'intensity', 'rounds'],
          placeholder: "e.g., Burpees, Mountain Climbers, Jump Squats",
          description: "Add HIIT exercises with work/rest intervals"
        };
      case 'flexibility':
        return {
          exerciseType: 'duration' as const,
          fields: ['duration', 'intensity', 'holdTime'],
          placeholder: "e.g., Downward Dog, Warrior Pose, Child's Pose",
          description: "Add flexibility exercises with hold times"
        };
      default:
        return {
          exerciseType: 'repetition' as const,
          fields: ['sets', 'reps', 'weight'],
          placeholder: "e.g., Bench Press",
          description: "Add exercises with sets and reps"
        };
    }
  };

  const workoutConfig = getWorkoutTypeConfig(workoutType);
  const currentExerciseType = workoutConfig.exerciseType;

  // Reset current exercise when workout type changes
  useEffect(() => {
    if (workoutType) {
      const config = getWorkoutTypeConfig(workoutType);
      setCurrentExercise({
        type: config.exerciseType,
        name: '',
        sets: 0,
        setType: 'normal',
        ...(config.exerciseType === 'repetition' ? { reps: 0 } : { duration: 0 })
      });
      setDropSets([]);
      setSuperSetWith('');
    }
  }, [workoutType]);

  // Prefill from PPL plan loader
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail;
      if (!detail) return;
      form.setValue('workoutType', detail.workoutType || 'strength');
      form.setValue('exercises', detail.exercises || []);
    };
    window.addEventListener('workout:prefill' as any, handler as any);
    return () => window.removeEventListener('workout:prefill' as any, handler as any);
  }, []);

  const addExercise = () => {
    if (!currentExercise.name) return;

    if (currentExerciseType === 'repetition') {
      if (!currentExercise.sets || currentExercise.sets <= 0 || !('reps' in currentExercise) || currentExercise.reps <= 0) return;
      
      const exerciseData: RepetitionExercise = {
        ...currentExercise,
        type: 'repetition',
        setType: currentExercise.setType || 'normal',
        ...(currentExercise.setType === 'drop' && dropSets.length > 0 && { dropSets }),
        ...(currentExercise.setType === 'super' && superSetWith && { superSetWith })
      } as RepetitionExercise;
      
      form.setValue('exercises', [...exercises, exerciseData]);
      setCurrentExercise({
        type: 'repetition',
        name: '',
        sets: 0,
        reps: 0,
        setType: 'normal'
      });
      setDropSets([]);
      setSuperSetWith('');
    } else {
      if (!('duration' in currentExercise) || currentExercise.duration <= 0) return;
      form.setValue('exercises', [...exercises, { ...currentExercise, type: 'duration' } as DurationExercise]);
      setCurrentExercise({
        type: 'duration',
        name: '',
        sets: 0,
        duration: 0
      });
    }
  };

  const removeExercise = (index: number) => {
    form.setValue('exercises', exercises.filter((_, i) => i !== index));
  };

  const addDropSet = () => {
    setDropSets([...dropSets, { weight: 0, reps: 0 }]);
  };

  const removeDropSet = (index: number) => {
    setDropSets(dropSets.filter((_, i) => i !== index));
  };

  const updateDropSet = (index: number, field: 'weight' | 'reps', value: number) => {
    const updated = [...dropSets];
    updated[index] = { ...updated[index], [field]: value };
    setDropSets(updated);
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Calculate total duration and calories
      let totalDuration = 0;
      let totalCalories = 0;
      
      data.exercises.forEach(exercise => {
        const intensityMultiplier = {
          low: 5,
          moderate: 8,
          high: 12
        }[exercise.intensity || 'moderate'] as number;

        if (exercise.type === 'duration' && 'duration' in exercise) {
          totalDuration += exercise.duration;
          // Estimate calories based on duration and intensity
          totalCalories += exercise.duration * intensityMultiplier;
        } else if ('reps' in exercise) {
          // For repetition exercises, estimate based on sets and reps
          totalDuration += (exercise.sets || 0) * (exercise.reps || 0) * 3; // Assume 3 seconds per rep
          totalCalories += (exercise.sets || 0) * (exercise.reps || 0) * ((exercise.weight || 1) * 0.1);
        }
      });

      const workout: Workout = {
        date: new Date().toISOString().split('T')[0],
        type: data.workoutType,
        exercises: data.exercises as Exercise[],
        duration: totalDuration,
        calories: Math.round(totalCalories),
        notes: data.notes
      };

      await logWorkout(workout);

      toast({
        title: "Workout logged!",
        description: "Your workout has been recorded successfully. Great job! 💪",
      });

      // Reset form
      form.reset();
      setCurrentExercise({
        type: currentExerciseType,
        name: '',
        sets: 0,
        setType: 'normal',
        ...(currentExerciseType === 'repetition' ? { reps: 0 } : { duration: 0 })
      });
      setDropSets([]);
      setSuperSetWith('');
    } catch (error) {
      console.error('Failed to log workout:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Log Workout</CardTitle>
            <CardDescription>Record your workout details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="workoutType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="hiit">HIIT</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              {workoutType && (
                <div className="text-sm text-muted-foreground">
                  {workoutConfig.description}
                </div>
              )}

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="exerciseName">Exercise Name</Label>
                  <Input
                    id="exerciseName"
                    value={currentExercise.name || ''}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                    placeholder={workoutConfig.placeholder}
                  />
                </div>
                {workoutConfig.fields.map((field) => {
                  switch (field) {
                    case 'sets':
                      return (
                        <div key="sets" className="w-20">
                          <Label htmlFor="sets">Sets</Label>
                          <Input
                            id="sets"
                            type="number"
                            min="0"
                            value={currentExercise.sets || ''}
                            onChange={(e) => setCurrentExercise({ ...currentExercise, sets: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      );
                    case 'reps':
                      return (
                        <div key="reps" className="w-20">
                          <Label htmlFor="reps">Reps</Label>
                          <Input
                            id="reps"
                            type="number"
                            min="0"
                            value={(currentExercise as Partial<RepetitionExercise>).reps || ''}
                            onChange={(e) => setCurrentExercise({ 
                              ...currentExercise, 
                              type: 'repetition',
                              reps: parseInt(e.target.value) || 0 
                            })}
                          />
                        </div>
                      );
                    case 'weight':
                      return (
                        <div key="weight" className="w-24">
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            min="0"
                            value={currentExercise.weight ?? ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined;
                              setCurrentExercise({ ...currentExercise, weight: value });
                            }}
                          />
                        </div>
                      );
                    case 'setType':
                      return (
                        <div key="setType" className="w-28">
                          <Label htmlFor="setType">Set Type</Label>
                          <Select
                            value={currentExercise.setType || 'normal'}
                            onValueChange={(value) => setCurrentExercise({ 
                              ...currentExercise, 
                              setType: value as 'normal' | 'drop' | 'super' 
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal Sets</SelectItem>
                              <SelectItem value="drop">Drop Sets</SelectItem>
                              <SelectItem value="super">Supersets</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    case 'duration':
                      return (
                        <div key="duration" className="w-24">
                          <Label htmlFor="duration">Duration (min)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="0"
                            step="0.1"
                            value={(currentExercise as Partial<DurationExercise>).duration ? 
                              ((currentExercise as Partial<DurationExercise>).duration! / 60).toFixed(1) : ''}
                            onChange={(e) => setCurrentExercise({ 
                              ...currentExercise, 
                              type: 'duration',
                              duration: Math.round((parseFloat(e.target.value) || 0) * 60) // Convert minutes to seconds
                            })}
                          />
                        </div>
                      );
                    case 'intensity':
                      return (
                        <div key="intensity" className="w-24">
                          <Label htmlFor="intensity">Intensity</Label>
                          <Select
                            value={currentExercise.intensity || 'moderate'}
                            onValueChange={(value) => setCurrentExercise({ 
                              ...currentExercise, 
                              intensity: value as 'low' | 'moderate' | 'high' 
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    case 'distance':
                      return (
                        <div key="distance" className="w-24">
                          <Label htmlFor="distance">Distance (km)</Label>
                          <Input
                            id="distance"
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Optional"
                            onChange={(e) => {
                              const distance = e.target.value;
                              setCurrentExercise({ 
                                ...currentExercise, 
                                notes: distance ? `Distance: ${distance}km` : undefined 
                              });
                            }}
                          />
                        </div>
                      );
                    case 'rounds':
                      return (
                        <div key="rounds" className="w-24">
                          <Label htmlFor="rounds">Rounds</Label>
                          <Input
                            id="rounds"
                            type="number"
                            min="0"
                            placeholder="Optional"
                            onChange={(e) => {
                              const rounds = e.target.value;
                              setCurrentExercise({ 
                                ...currentExercise, 
                                notes: rounds ? `Rounds: ${rounds}` : undefined 
                              });
                            }}
                          />
                        </div>
                      );
                    case 'holdTime':
                      return (
                        <div key="holdTime" className="w-24">
                          <Label htmlFor="holdTime">Hold Time (s)</Label>
                          <Input
                            id="holdTime"
                            type="number"
                            min="0"
                            placeholder="Optional"
                            onChange={(e) => {
                              const holdTime = e.target.value;
                              setCurrentExercise({ 
                                ...currentExercise, 
                                notes: holdTime ? `Hold: ${holdTime}s` : undefined 
                              });
                            }}
                          />
                        </div>
                      );
                    default:
                      return null;
                  }
                })}

                {/* Drop Sets Configuration */}
                {currentExerciseType === 'repetition' && currentExercise.setType === 'drop' && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Drop Sets</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDropSet}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Drop Set
                      </Button>
                    </div>
                    {dropSets.map((dropSet, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <div className="w-20">
                          <Input
                            type="number"
                            placeholder="Weight"
                            value={dropSet.weight || ''}
                            onChange={(e) => updateDropSet(index, 'weight', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            placeholder="Reps"
                            value={dropSet.reps || ''}
                            onChange={(e) => updateDropSet(index, 'reps', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDropSet(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {dropSets.length === 0 && (
                      <p className="text-sm text-muted-foreground">Add drop sets to reduce weight after each set</p>
                    )}
                  </div>
                )}

                {/* Superset Configuration */}
                {currentExerciseType === 'repetition' && currentExercise.setType === 'super' && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                    <Label className="text-sm font-medium mb-2 block">Superset With</Label>
                    <Input
                      placeholder="e.g., Barbell Rows, Pull-ups"
                      value={superSetWith}
                      onChange={(e) => setSuperSetWith(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">Enter the exercise you're supersetting with</p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={addExercise}
                  disabled={
                    !currentExercise.name || 
                    (currentExerciseType === 'repetition' && (!currentExercise.sets || currentExercise.sets <= 0 || !('reps' in currentExercise) || currentExercise.reps <= 0)) ||
                    (currentExerciseType === 'duration' && (!('duration' in currentExercise) || currentExercise.duration <= 0))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[200px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    {workoutConfig.fields.map((field) => {
                      const getHeaderLabel = (field: string) => {
                        switch (field) {
                          case 'sets': return 'Sets';
                          case 'reps': return 'Reps';
                          case 'weight': return 'Weight (kg)';
                          case 'setType': return 'Set Type';
                          case 'duration': return 'Duration (min)';
                          case 'intensity': return 'Intensity';
                          case 'distance': return 'Distance (km)';
                          case 'rounds': return 'Rounds';
                          case 'holdTime': return 'Hold Time (s)';
                          default: return field;
                        }
                      };
                      return (
                        <TableHead key={field} className="w-24">
                          {getHeaderLabel(field)}
                        </TableHead>
                      );
                    })}
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercises.map((exercise, index) => (
                    <TableRow key={index}>
                      <TableCell>{exercise.name || ''}</TableCell>
                      {workoutConfig.fields.map((field) => {
                        const getCellValue = (field: string) => {
                          switch (field) {
                            case 'sets':
                              return exercise.sets || 0;
                            case 'reps':
                              return 'reps' in exercise ? exercise.reps : 0;
                            case 'weight':
                              return exercise.weight || '-';
                            case 'setType':
                              if (exercise.type === 'repetition') {
                                const setType = (exercise as RepetitionExercise).setType || 'normal';
                                if (setType === 'drop' && (exercise as RepetitionExercise).dropSets?.length) {
                                  return `Drop (${(exercise as RepetitionExercise).dropSets!.length})`;
                                } else if (setType === 'super' && (exercise as RepetitionExercise).superSetWith) {
                                  return `Super w/ ${(exercise as RepetitionExercise).superSetWith}`;
                                }
                                return setType.charAt(0).toUpperCase() + setType.slice(1);
                              }
                              return '-';
                            case 'duration':
                              return 'duration' in exercise ? (exercise.duration / 60).toFixed(1) : 0;
                            case 'intensity':
                              return exercise.intensity || 'moderate';
                            case 'distance':
                              return exercise.notes?.includes('Distance:') ? exercise.notes.split('Distance: ')[1] : '-';
                            case 'rounds':
                              return exercise.notes?.includes('Rounds:') ? exercise.notes.split('Rounds: ')[1] : '-';
                            case 'holdTime':
                              return exercise.notes?.includes('Hold:') ? exercise.notes.split('Hold: ')[1] : '-';
                            default:
                              return '-';
                          }
                        };
                        return (
                          <TableCell key={field}>
                            {getCellValue(field)}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExercise(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <Button
              type="submit"
              className="w-full"
              disabled={!form.getValues('workoutType') || exercises.length === 0}
            >
              Log Workout
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};