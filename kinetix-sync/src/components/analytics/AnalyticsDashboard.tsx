import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressChart } from './ProgressChart';
import { Activity, Scale, Trophy, Utensils, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Measurement {
  date: string;
  weight: number;
  bodyFat?: number;
  [key: string]: any;
}

interface AnalyticsSummary {
  weightTrend: { date: string; value: number }[];
  totalWorkouts: number;
  averageCalories: number;
  workoutsByType: { [key: string]: number };
}

export const AnalyticsDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [newMeasurement, setNewMeasurement] = useState({
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
  });

  useEffect(() => {
    fetchAnalytics();
    fetchMeasurements();
  }, [timeframe]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/analytics/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
      console.error('Error fetching analytics:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeasurements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/analytics/measurements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMeasurements(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch measurements';
      console.error('Error fetching measurements:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMeasurement = async () => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/analytics/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newMeasurement,
          date: new Date().toISOString(),
        })
      });
      
      if (response.ok) {
        fetchMeasurements();
        setNewMeasurement({
          weight: '',
          bodyFat: '',
          chest: '',
          waist: '',
          hips: '',
          arms: '',
          thighs: '',
        });
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <Scale className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <h3 className="text-2xl font-bold">
                  {measurements[0]?.weight || '--'} kg
                </h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Activity className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
                <h3 className="text-2xl font-bold">{summary?.totalWorkouts || '--'}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Utensils className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Daily Calories</p>
                <h3 className="text-2xl font-bold">
                  {summary?.averageCalories.toFixed(0) || '--'}
                </h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Trophy className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Goal Progress</p>
                <h3 className="text-2xl font-bold">78%</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList>
            <TabsTrigger value="progress">Progress Charts</TabsTrigger>
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {summary?.weightTrend && (
                <ProgressChart
                  data={summary.weightTrend}
                  title="Weight Progress"
                  color="hsl(var(--primary))"
                  valueFormatter={(value) => `${value} kg`}
                />
              )}
              {/* Add more charts here */}
            </div>
          </TabsContent>

          <TabsContent value="measurements">
            <Card>
              <CardHeader>
                <CardTitle>Record New Measurement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={newMeasurement.weight}
                      onChange={(e) => setNewMeasurement({
                        ...newMeasurement,
                        weight: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyFat">Body Fat %</Label>
                    <Input
                      id="bodyFat"
                      type="number"
                      value={newMeasurement.bodyFat}
                      onChange={(e) => setNewMeasurement({
                        ...newMeasurement,
                        bodyFat: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chest">Chest (cm)</Label>
                    <Input
                      id="chest"
                      type="number"
                      value={newMeasurement.chest}
                      onChange={(e) => setNewMeasurement({
                        ...newMeasurement,
                        chest: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waist">Waist (cm)</Label>
                    <Input
                      id="waist"
                      type="number"
                      value={newMeasurement.waist}
                      onChange={(e) => setNewMeasurement({
                        ...newMeasurement,
                        waist: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hips">Hips (cm)</Label>
                    <Input
                      id="hips"
                      type="number"
                      value={newMeasurement.hips}
                      onChange={(e) => setNewMeasurement({
                        ...newMeasurement,
                        hips: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arms">Arms (cm)</Label>
                    <Input
                      id="arms"
                      type="number"
                      value={newMeasurement.arms}
                      onChange={(e) => setNewMeasurement({
                        ...newMeasurement,
                        arms: e.target.value
                      })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddMeasurement} className="mt-6">
                  Save Measurement
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Measurement History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Weight</th>
                        <th className="text-left p-2">Body Fat</th>
                        <th className="text-left p-2">Chest</th>
                        <th className="text-left p-2">Waist</th>
                        <th className="text-left p-2">Hips</th>
                        <th className="text-left p-2">Arms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((measurement, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            {format(new Date(measurement.date), 'MMM d, yyyy')}
                          </td>
                          <td className="p-2">{measurement.weight} kg</td>
                          <td className="p-2">{measurement.bodyFat}%</td>
                          <td className="p-2">{measurement.chest} cm</td>
                          <td className="p-2">{measurement.waist} cm</td>
                          <td className="p-2">{measurement.hips} cm</td>
                          <td className="p-2">{measurement.arms} cm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};