import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useFitness } from './FitnessContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface NotificationSettings {
  mealReminders: boolean;
  workoutReminders: boolean;
  mealReminderTime: string; // HH:MM format
  workoutReminderTime: string; // HH:MM format
  reminderFrequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[]; // 0-6 (Sunday-Saturday)
  achievementNotifications: boolean;
  streakNotifications: boolean;
  progressNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

interface Notification {
  _id: string;
  type: 'reminder' | 'achievement' | 'goal' | 'streak' | 'motivation' | 'system';
  category: 'meal' | 'workout' | 'progress' | 'achievement' | 'reminder' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  createdAt: string;
  readAt?: string;
  timeAgo?: string;
}

interface NotificationContextType {
  settings: NotificationSettings;
  notifications: Notification[];
  unreadCount: number;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  checkAndShowReminders: () => void;
  hasLoggedMealsToday: boolean;
  hasLoggedWorkoutToday: boolean;
  lastMealLogTime: Date | null;
  lastWorkoutLogTime: Date | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshNotificationData: () => void;
  debugNotificationState: () => void;
}

const defaultSettings: NotificationSettings = {
  mealReminders: true,
  workoutReminders: true,
  mealReminderTime: '12:00',
  workoutReminderTime: '18:00',
  reminderFrequency: 'daily',
  customDays: [1, 2, 3, 4, 5], // Monday to Friday
  achievementNotifications: true,
  streakNotifications: true,
  progressNotifications: true,
  pushNotifications: true,
  emailNotifications: false
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, authToken } = useAuth();
  const { nutritionEntries, workoutHistory } = useFitness();
  const { toast } = useToast();
  
  // Debug logging
  console.log('NotificationProvider render:', {
    user: user?.id,
    nutritionEntriesCount: nutritionEntries?.length || 0,
    workoutHistoryCount: workoutHistory?.length || 0,
    nutritionEntries: nutritionEntries?.map(e => ({ date: e.date, name: e.name })) || [],
    workoutHistory: workoutHistory?.map(w => ({ date: w.date, type: w.type })) || []
  });
  
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLoggedMealsToday, setHasLoggedMealsToday] = useState(false);
  const [hasLoggedWorkoutToday, setHasLoggedWorkoutToday] = useState(false);
  const [lastMealLogTime, setLastMealLogTime] = useState<Date | null>(null);
  const [lastWorkoutLogTime, setLastWorkoutLogTime] = useState<Date | null>(null);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!authToken) return;
    
    try {
      const response = await apiFetch<{ notifications: Notification[]; pagination: any }>('/api/notifications', { method: 'GET' }, authToken);
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!authToken) return;
    
    try {
      const response = await apiFetch<{ count: number }>('/api/notifications/unread-count', { method: 'GET' }, authToken);
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!authToken) return;
    
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }, authToken);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!authToken) return;
    
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'PATCH' }, authToken);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!authToken) return;
    
    try {
      await apiFetch(`/api/notifications/${notificationId}`, { method: 'DELETE' }, authToken);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(notif => notif._id === notificationId);
        return deletedNotif && !deletedNotif.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Update settings on backend
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (!authToken) return;
    
    try {
      await apiFetch('/api/notifications/settings', {
        method: 'PATCH',
        body: JSON.stringify(updatedSettings)
      }, authToken);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  };

  // Load notifications when user logs in
  useEffect(() => {
    if (user && authToken) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      // Reset notification state when user logs out
      setHasLoggedMealsToday(false);
      setHasLoggedWorkoutToday(false);
      setLastMealLogTime(null);
      setLastWorkoutLogTime(null);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, authToken]);

  // Refresh notification data when fitness data changes
  useEffect(() => {
    // Only run if we have a user and the data arrays are defined (even if empty)
    if (user && Array.isArray(nutritionEntries) && Array.isArray(workoutHistory)) {
      // Check if user has logged meals today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Also create a date string for the user's local timezone
      const localTodayString = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
      
      console.log('Fitness data changed, refreshing notification data:', {
        nutritionEntriesCount: nutritionEntries.length,
        workoutHistoryCount: workoutHistory.length,
        todayString,
        localTodayString,
        sampleNutritionEntry: nutritionEntries[0] ? { date: nutritionEntries[0].date, name: nutritionEntries[0].name } : null,
        sampleWorkoutEntry: workoutHistory[0] ? { date: workoutHistory[0].date, type: workoutHistory[0].type } : null
      });
      
      const todayMeals = nutritionEntries.filter(entry => {
        // Check if entry has valid data
        if (!entry || !entry.date) {
          return false;
        }
        
        // Handle different date formats and timezones robustly
        let entryDateString;
        try {
          // Always try to parse as Date first
          const dateObj = new Date(entry.date);
          if (!isNaN(dateObj.getTime())) {
            entryDateString = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
          } else {
            // Fallback: try to extract YYYY-MM-DD from string
            if (entry.date.includes('T')) {
              entryDateString = entry.date.split('T')[0];
            } else {
              // Try to find YYYY-MM-DD pattern in the string
              const match = entry.date.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (match) {
                entryDateString = match[0];
              } else {
                entryDateString = entry.date; // Last resort
              }
            }
          }
        } catch (e) {
          console.error('Error parsing entry date:', entry.date, e);
          entryDateString = entry.date;
        }
        
        // Check against both UTC and local timezone dates
        const isTodayUTC = entryDateString === todayString;
        const isTodayLocal = entryDateString === localTodayString;
        const isToday = isTodayUTC || isTodayLocal;
        
        console.log('Checking nutrition entry date:', {
          originalDate: entry.date,
          entryDateString,
          todayString,
          localTodayString,
          isTodayUTC,
          isTodayLocal,
          isToday,
          entryName: entry.name,
          comparison: {
            'entryDateString === todayString': entryDateString === todayString,
            'entryDateString === localTodayString': entryDateString === localTodayString,
            'entryDateString type': typeof entryDateString,
            'todayString type': typeof todayString,
            'localTodayString type': typeof localTodayString,
            'isTodayUTC || isTodayLocal': isTodayUTC || isTodayLocal
          }
        });
        
        return isToday;
      });

      console.log('Today meals found in main effect:', todayMeals.length, todayMeals.map(m => ({ date: m.date, name: m.name })));

      setHasLoggedMealsToday(todayMeals.length > 0);
      
      if (todayMeals.length > 0) {
        const latestMeal = todayMeals.reduce((latest, current) => 
          new Date(current.date) > new Date(latest.date) ? current : latest
        );
        setLastMealLogTime(new Date(latestMeal.date));
      } else {
        setLastMealLogTime(null);
      }

      // Check if user has logged workout today
      const todayWorkouts = workoutHistory.filter(workout => {
        if (!workout || !workout.date) {
          return false;
        }
        
        // Handle different date formats and timezones robustly
        let workoutDateString;
        try {
          // Always try to parse as Date first
          const dateObj = new Date(workout.date);
          if (!isNaN(dateObj.getTime())) {
            workoutDateString = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
          } else {
            // Fallback: try to extract YYYY-MM-DD from string
            if (workout.date.includes('T')) {
              workoutDateString = workout.date.split('T')[0];
            } else {
              // Try to find YYYY-MM-DD pattern in the string
              const match = workout.date.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (match) {
                workoutDateString = match[0];
              } else {
                workoutDateString = workout.date; // Last resort
              }
            }
          }
        } catch (e) {
          console.error('Error parsing workout date:', workout.date, e);
          workoutDateString = workout.date;
        }
        
        // Check against both UTC and local timezone dates
        const isTodayUTC = workoutDateString === todayString;
        const isTodayLocal = workoutDateString === localTodayString;
        const isToday = isTodayUTC || isTodayLocal;
        
        // Additional debugging to catch any issues
        console.log('=== WORKOUT DATE DEBUG ===');
        console.log('workoutDateString:', workoutDateString, typeof workoutDateString);
        console.log('todayString:', todayString, typeof todayString);
        console.log('localTodayString:', localTodayString, typeof localTodayString);
        console.log('isTodayUTC:', isTodayUTC);
        console.log('isTodayLocal:', isTodayLocal);
        console.log('isToday calculation:', isTodayUTC || isTodayLocal);
        console.log('isToday variable:', isToday);
        console.log('Direct comparison:', workoutDateString === localTodayString);
        console.log('========================');
        
        console.log('Checking workout entry date:', {
          originalDate: workout.date,
          workoutDateString,
          todayString,
          localTodayString,
          isTodayUTC,
          isTodayLocal,
          isToday,
          workoutType: workout.type,
          comparison: {
            'workoutDateString === todayString': workoutDateString === todayString,
            'workoutDateString === localTodayString': workoutDateString === localTodayString,
            'workoutDateString type': typeof workoutDateString,
            'todayString type': typeof todayString,
            'localTodayString type': typeof localTodayString,
            'isTodayUTC || isTodayLocal': isTodayUTC || isTodayLocal
          }
        });
        
        return isToday;
      });

      console.log('Today workouts found in main effect:', todayWorkouts.length, todayWorkouts.map(w => ({ date: w.date, type: w.type })));

      // Check for force flag (temporary workaround)
      const forceWorkoutLogged = (window as any).forceWorkoutLogged;
      
      setHasLoggedWorkoutToday(todayWorkouts.length > 0 || forceWorkoutLogged);
      
      if (todayWorkouts.length > 0) {
        const latestWorkout = todayWorkouts.reduce((latest, current) => 
          new Date(current.date) > new Date(latest.date) ? current : latest
        );
        setLastWorkoutLogTime(new Date(latestWorkout.date));
      } else if (forceWorkoutLogged) {
        // Set a fake time for testing
        setLastWorkoutLogTime(new Date());
      } else {
        setLastWorkoutLogTime(null);
      }
    }
  }, [user, nutritionEntries, workoutHistory]);

  // Force refresh notification data when user logs meals or workouts
  const refreshNotificationData = useCallback(() => {
    if (user && Array.isArray(nutritionEntries) && Array.isArray(workoutHistory)) {
      // Check if user has logged meals today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Also create a date string for the user's local timezone
      const localTodayString = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
      
      console.log('Refreshing notification data:', {
        todayString,
        localTodayString,
        nutritionEntriesCount: nutritionEntries.length,
        workoutHistoryCount: workoutHistory.length,
        nutritionEntries: nutritionEntries.map(e => ({ date: e.date, name: e.name })),
        workoutHistory: workoutHistory.map(w => ({ date: w.date, type: w.type }))
      });
      
      const todayMeals = nutritionEntries.filter(entry => {
        if (!entry || !entry.date) {
          return false;
        }
        
        // Handle different date formats and timezones robustly
        let entryDateString;
        try {
          // Always try to parse as Date first
          const dateObj = new Date(entry.date);
          if (!isNaN(dateObj.getTime())) {
            entryDateString = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
          } else {
            // Fallback: try to extract YYYY-MM-DD from string
            if (entry.date.includes('T')) {
              entryDateString = entry.date.split('T')[0];
            } else {
              // Try to find YYYY-MM-DD pattern in the string
              const match = entry.date.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (match) {
                entryDateString = match[0];
              } else {
                entryDateString = entry.date; // Last resort
              }
            }
          }
        } catch (e) {
          console.error('Error parsing entry date:', entry.date, e);
          entryDateString = entry.date;
        }
        
        // Check against both UTC and local timezone dates
        const isTodayUTC = entryDateString === todayString;
        const isTodayLocal = entryDateString === localTodayString;
        return isTodayUTC || isTodayLocal;
      });

      console.log('Today meals found:', todayMeals.length, todayMeals.map(m => ({ date: m.date, name: m.name })));

      setHasLoggedMealsToday(todayMeals.length > 0);
      
      if (todayMeals.length > 0) {
        const latestMeal = todayMeals.reduce((latest, current) => {
          const currentDate = new Date(current.date);
          const latestDate = new Date(latest.date);
          return currentDate > latestDate ? current : latest;
        });
        setLastMealLogTime(new Date(latestMeal.date));
      } else {
        setLastMealLogTime(null);
      }

      // Check if user has logged workout today
      const todayWorkouts = workoutHistory.filter(workout => {
        if (!workout || !workout.date) {
          return false;
        }
        
        // Handle different date formats and timezones robustly
        let workoutDateString;
        try {
          // Always try to parse as Date first
          const dateObj = new Date(workout.date);
          if (!isNaN(dateObj.getTime())) {
            workoutDateString = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
          } else {
            // Fallback: try to extract YYYY-MM-DD from string
            if (workout.date.includes('T')) {
              workoutDateString = workout.date.split('T')[0];
            } else {
              // Try to find YYYY-MM-DD pattern in the string
              const match = workout.date.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (match) {
                workoutDateString = match[0];
              } else {
                workoutDateString = workout.date; // Last resort
              }
            }
          }
        } catch (e) {
          console.error('Error parsing workout date:', workout.date, e);
          workoutDateString = workout.date;
        }
        
        // Check against both UTC and local timezone dates
        const isTodayUTC = workoutDateString === todayString;
        const isTodayLocal = workoutDateString === localTodayString;
        return isTodayUTC || isTodayLocal;
      });

      console.log('Today workouts found:', todayWorkouts.length, todayWorkouts.map(w => ({ date: w.date, type: w.type })));

      // Check for force flag (temporary workaround)
      const forceWorkoutLogged = (window as any).forceWorkoutLogged;
      
      setHasLoggedWorkoutToday(todayWorkouts.length > 0 || forceWorkoutLogged);
      
      if (todayWorkouts.length > 0) {
        const latestWorkout = todayWorkouts.reduce((latest, current) => {
          const currentDate = new Date(current.date);
          const latestDate = new Date(latest.date);
          return currentDate > latestDate ? current : latest;
        });
        setLastWorkoutLogTime(new Date(latestWorkout.date));
      } else if (forceWorkoutLogged) {
        // Set a fake time for testing
        setLastWorkoutLogTime(new Date());
      } else {
        setLastWorkoutLogTime(null);
      }
    }
  }, [user, nutritionEntries, workoutHistory]);


  // Check if it's time to show reminders
  const checkAndShowReminders = () => {
    if (!user) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentDay = now.getDay();

    // Check if we should show reminders today
    let shouldShowToday = false;
    switch (settings.reminderFrequency) {
      case 'daily':
        shouldShowToday = true;
        break;
      case 'weekly':
        shouldShowToday = currentDay === 1; // Monday
        break;
      case 'custom':
        shouldShowToday = settings.customDays?.includes(currentDay) || false;
        break;
    }

    if (!shouldShowToday) return;

    // Check meal reminder
    if (settings.mealReminders && currentTime === settings.mealReminderTime && !hasLoggedMealsToday) {
      toast({
        title: "🍽️ Meal Logging Reminder",
        description: "Don't forget to log your meals today! Track your nutrition to stay on top of your goals.",
        duration: 10000,
        action: (
          <button 
            onClick={() => {
              // Try to find the navigation function from the global scope or use URL navigation
              if (typeof window !== 'undefined' && (window as any).navigateToTab) {
                (window as any).navigateToTab('nutrition-tracking');
              } else {
                window.location.href = '/nutrition';
              }
            }}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90"
          >
            Log Meals
          </button>
        )
      });
    }

    // Check workout reminder
    if (settings.workoutReminders && currentTime === settings.workoutReminderTime && !hasLoggedWorkoutToday) {
      toast({
        title: "💪 Workout Reminder",
        description: "Time to get moving! Log your workout to track your fitness progress.",
        duration: 10000,
        action: (
          <button 
            onClick={() => {
              // Try to find the navigation function from the global scope or use URL navigation
              if (typeof window !== 'undefined' && (window as any).navigateToTab) {
                (window as any).navigateToTab('workouts');
              } else {
                window.location.href = '/workouts';
              }
            }}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90"
          >
            Log Workout
          </button>
        )
      });
    }
  };

  // Set up interval to check for reminders
  useEffect(() => {
    const interval = setInterval(checkAndShowReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings, hasLoggedMealsToday, hasLoggedWorkoutToday, user]);

  // Check immediately when component mounts
  useEffect(() => {
    checkAndShowReminders();
  }, [settings, hasLoggedMealsToday, hasLoggedWorkoutToday, user]);

  // Listen for custom events from fitness context
  useEffect(() => {
    const handleNutritionLogged = (event) => {
      console.log('Nutrition logged event received:', event.detail);
      refreshNotificationData();
    };

    const handleWorkoutLogged = (event) => {
      console.log('Workout logged event received:', event.detail);
      refreshNotificationData();
    };

    window.addEventListener('nutritionLogged', handleNutritionLogged);
    window.addEventListener('workoutLogged', handleWorkoutLogged);

    return () => {
      window.removeEventListener('nutritionLogged', handleNutritionLogged);
      window.removeEventListener('workoutLogged', handleWorkoutLogged);
    };
  }, [refreshNotificationData]);

  // Debug function to check current state
  const debugNotificationState = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    const localTodayString = today.toLocaleDateString('en-CA');
    
    console.log('=== NOTIFICATION DEBUG STATE ===');
    console.log('Current time:', new Date().toString());
    console.log('Today string (UTC):', todayString);
    console.log('Today string (Local):', localTodayString);
    console.log('Nutrition entries count:', nutritionEntries?.length || 0);
    console.log('Workout history count:', workoutHistory?.length || 0);
    console.log('Has logged meals today:', hasLoggedMealsToday);
    console.log('Has logged workout today:', hasLoggedWorkoutToday);
    console.log('Last meal log time:', lastMealLogTime);
    console.log('Last workout log time:', lastWorkoutLogTime);
    console.log('Sample nutrition entries:', nutritionEntries?.slice(0, 2).map(e => ({ date: e.date, name: e.name })));
    console.log('Sample workout entries:', workoutHistory?.slice(0, 2).map(w => ({ date: w.date, type: w.type })));
    console.log('================================');
  };

  // Make debug function globally available
  React.useEffect(() => {
    (window as any).debugNotifications = debugNotificationState;
    return () => {
      delete (window as any).debugNotifications;
    };
  }, [debugNotificationState]);

  const value: NotificationContextType = {
    settings,
    notifications,
    unreadCount,
    updateSettings,
    checkAndShowReminders,
    hasLoggedMealsToday,
    hasLoggedWorkoutToday,
    lastMealLogTime,
    lastWorkoutLogTime,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    refreshNotificationData,
    debugNotificationState
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
