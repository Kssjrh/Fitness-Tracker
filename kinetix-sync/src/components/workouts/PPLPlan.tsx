import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dumbbell } from 'lucide-react';

type DayKey = 'Day 1 - Push' | 'Day 2 - Pull' | 'Day 3 - Legs' | 'Day 4 - Upper/Accessory';

interface PlanExercise {
  name: string;
  sets: number;
  reps: number;
  notes?: string;
}

const PPL_PLAN: Record<DayKey, PlanExercise[]> = {
  'Day 1 - Push': [
    { name: 'Barbell Bench Press', sets: 4, reps: 6 },
    { name: 'Overhead Shoulder Press', sets: 3, reps: 8 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
    { name: 'Lateral Raises', sets: 3, reps: 12 },
    { name: 'Triceps Rope Pushdown', sets: 3, reps: 12 }
  ],
  'Day 2 - Pull': [
    { name: 'Deadlift', sets: 3, reps: 5 },
    { name: 'Pull-ups or Lat Pulldown', sets: 4, reps: 8 },
    { name: 'Barbell Row', sets: 3, reps: 8 },
    { name: 'Face Pulls', sets: 3, reps: 12 },
    { name: 'Dumbbell Bicep Curls', sets: 3, reps: 12 }
  ],
  'Day 3 - Legs': [
    { name: 'Back Squat', sets: 4, reps: 6 },
    { name: 'Romanian Deadlift', sets: 3, reps: 8 },
    { name: 'Leg Press', sets: 3, reps: 10 },
    { name: 'Walking Lunges', sets: 3, reps: 12 },
    { name: 'Calf Raises', sets: 4, reps: 12 }
  ],
  'Day 4 - Upper/Accessory': [
    { name: 'Incline Barbell Press', sets: 4, reps: 8 },
    { name: 'Seated Cable Row', sets: 4, reps: 10 },
    { name: 'Dumbbell Shoulder Press', sets: 3, reps: 10 },
    { name: 'Hammer Curls', sets: 3, reps: 12 },
    { name: 'Overhead Triceps Extension', sets: 3, reps: 12 }
  ]
};

export const PPLPlan: React.FC = () => {
  const loadIntoLogger = (day: DayKey) => {
    const exercises = PPL_PLAN[day].map(e => ({
      type: 'repetition',
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      setType: 'normal'
    }));
    try {
      (window as any).dispatchEvent(new CustomEvent('workout:prefill', { detail: { workoutType: 'strength', exercises } }));
    } catch {}
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>4-Day PPL Split</CardTitle>
            <CardDescription>Push • Pull • Legs • Upper/Accessory</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.keys(PPL_PLAN) as DayKey[]).map((day) => (
          <div key={day} className="rounded-lg border">
            <div className="flex items-center justify-between p-4">
              <h3 className="font-semibold">{day}</h3>
              <Button size="sm" onClick={() => loadIntoLogger(day)}>Load into Logger</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise</TableHead>
                  <TableHead className="w-24">Sets</TableHead>
                  <TableHead className="w-24">Reps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PPL_PLAN[day].map((ex, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{ex.name}</TableCell>
                    <TableCell>{ex.sets}</TableCell>
                    <TableCell>{ex.reps}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};











