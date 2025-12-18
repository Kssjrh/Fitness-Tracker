import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Utensils, 
  Dumbbell,
  Bell,
  BellOff
} from 'lucide-react';

interface NotificationStatusProps {
  onNavigate?: (tab: string) => void;
}

export const NotificationStatus: React.FC<NotificationStatusProps> = ({ onNavigate }) => {
  const { 
    settings,
    hasLoggedMealsToday, 
    hasLoggedWorkoutToday,
    lastMealLogTime,
    lastWorkoutLogTime
  } = useNotifications();

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (hasLogged: boolean) => {
    return hasLogged ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (hasLogged: boolean) => {
    return hasLogged ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (hasLogged: boolean) => {
    return hasLogged ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Completed
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
        Pending
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Today's Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meal Logging Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Utensils className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Meal Logging</span>
                {getStatusIcon(hasLoggedMealsToday)}
              </div>
              <div className="text-sm text-muted-foreground">
                Last logged: {formatTime(lastMealLogTime)}
              </div>
              {settings.mealReminders && (
                <div className="text-xs text-muted-foreground">
                  Reminder at {settings.mealReminderTime}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(hasLoggedMealsToday)}
            {!hasLoggedMealsToday && (
              <Button 
                size="sm" 
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('nutrition');
                  } else if (typeof window !== 'undefined' && (window as any).navigateToTab) {
                    (window as any).navigateToTab('nutrition');
                  } else {
                    window.location.href = '/nutrition';
                  }
                }}
              >
                Log Meals
              </Button>
            )}
          </div>
        </div>

        {/* Workout Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Workout</span>
                {getStatusIcon(hasLoggedWorkoutToday)}
              </div>
              <div className="text-sm text-muted-foreground">
                Last logged: {formatTime(lastWorkoutLogTime)}
              </div>
              {settings.workoutReminders && (
                <div className="text-xs text-muted-foreground">
                  Reminder at {settings.workoutReminderTime}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(hasLoggedWorkoutToday)}
            {!hasLoggedWorkoutToday && (
              <Button 
                size="sm" 
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('workouts');
                  } else if (typeof window !== 'undefined' && (window as any).navigateToTab) {
                    (window as any).navigateToTab('workouts');
                  } else {
                    window.location.href = '/workouts';
                  }
                }}
              >
                Log Workout
              </Button>
            )}
          </div>
        </div>

        {/* Notification Settings Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {settings.mealReminders || settings.workoutReminders ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <div className="font-medium">Notifications</div>
              <div className="text-sm text-muted-foreground">
                {settings.mealReminders || settings.workoutReminders 
                  ? 'Reminders enabled' 
                  : 'Reminders disabled'
                }
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (onNavigate) {
                onNavigate('settings');
              } else if (typeof window !== 'undefined' && (window as any).navigateToTab) {
                (window as any).navigateToTab('settings');
              } else {
                window.location.href = '/settings/notifications';
              }
            }}
          >
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
