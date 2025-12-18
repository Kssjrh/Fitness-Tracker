import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export const NotificationSettings: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    hasLoggedMealsToday, 
    hasLoggedWorkoutToday,
    lastMealLogTime,
    lastWorkoutLogTime
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);

  const handleTimeChange = async (type: 'meal' | 'workout', time: string) => {
    setIsLoading(true);
    try {
      if (type === 'meal') {
        await updateSettings({ mealReminderTime: time });
      } else {
        await updateSettings({ workoutReminderTime: time });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrequencyChange = async (frequency: 'daily' | 'weekly' | 'custom') => {
    setIsLoading(true);
    try {
      await updateSettings({ reminderFrequency: frequency });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomDayToggle = async (day: number, checked: boolean) => {
    setIsLoading(true);
    try {
      const currentDays = settings.customDays || [];
      const newDays = checked 
        ? [...currentDays, day]
        : currentDays.filter(d => d !== day);
      await updateSettings({ customDays: newDays });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure reminders for meal logging and workout tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meal Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="meal-reminders" className="text-base font-medium">
                  Meal Logging Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to log your meals
                </p>
              </div>
              <Switch
                id="meal-reminders"
                checked={settings.mealReminders}
                onCheckedChange={(checked) => updateSettings({ mealReminders: checked })}
              />
            </div>

            {settings.mealReminders && (
              <div className="ml-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="meal-time">Reminder Time</Label>
                  <Input
                    id="meal-time"
                    type="time"
                    value={settings.mealReminderTime}
                    onChange={(e) => handleTimeChange('meal', e.target.value)}
                    className="w-32"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  {hasLoggedMealsToday ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Meals logged today</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">No meals logged today</span>
                    </>
                  )}
                  {lastMealLogTime && (
                    <span className="text-muted-foreground">
                      (Last: {formatTime(lastMealLogTime)})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Workout Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workout-reminders" className="text-base font-medium">
                  Workout Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to log your workouts
                </p>
              </div>
              <Switch
                id="workout-reminders"
                checked={settings.workoutReminders}
                onCheckedChange={(checked) => updateSettings({ workoutReminders: checked })}
              />
            </div>

            {settings.workoutReminders && (
              <div className="ml-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="workout-time">Reminder Time</Label>
                  <Input
                    id="workout-time"
                    type="time"
                    value={settings.workoutReminderTime}
                    onChange={(e) => handleTimeChange('workout', e.target.value)}
                    className="w-32"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  {hasLoggedWorkoutToday ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Workout logged today</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">No workout logged today</span>
                    </>
                  )}
                  {lastWorkoutLogTime && (
                    <span className="text-muted-foreground">
                      (Last: {formatTime(lastWorkoutLogTime)})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reminder Frequency */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="frequency" className="text-base font-medium">
                Reminder Frequency
              </Label>
            </div>
            
            <Select value={settings.reminderFrequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly (Mondays)</SelectItem>
                <SelectItem value="custom">Custom Days</SelectItem>
              </SelectContent>
            </Select>

            {settings.reminderFrequency === 'custom' && (
              <div className="ml-6 space-y-2">
                <Label className="text-sm font-medium">Select Days</Label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={settings.customDays?.includes(day.value) || false}
                        onCheckedChange={(checked) => 
                          handleCustomDayToggle(day.value, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`day-${day.value}`}
                        className="text-sm font-normal"
                      >
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Notification Types */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="achievement-notifications" className="text-base font-medium">
                  Achievement Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you reach milestones
                </p>
              </div>
              <Switch
                id="achievement-notifications"
                checked={settings.achievementNotifications}
                onCheckedChange={(checked) => updateSettings({ achievementNotifications: checked })}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streak-notifications" className="text-base font-medium">
                  Streak Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate your consistency streaks
                </p>
              </div>
              <Switch
                id="streak-notifications"
                checked={settings.streakNotifications}
                onCheckedChange={(checked) => updateSettings({ streakNotifications: checked })}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="progress-notifications" className="text-base font-medium">
                  Progress Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Updates on your fitness progress
                </p>
              </div>
              <Switch
                id="progress-notifications"
                checked={settings.progressNotifications}
                onCheckedChange={(checked) => updateSettings({ progressNotifications: checked })}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Test Reminders */}
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={async () => {
                setIsLoading(true);
                try {
                  // Force check reminders for testing
                  const now = new Date();
                  const testTime = now.toTimeString().slice(0, 5);
                  await updateSettings({ 
                    mealReminderTime: testTime,
                    workoutReminderTime: testTime 
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full"
              disabled={isLoading}
            >
              Test Reminders Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
