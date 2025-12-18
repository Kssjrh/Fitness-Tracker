import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useFitness } from '@/contexts/FitnessContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProgressTracker } from '@/components/dashboard/ProgressTracker';
import { NotificationStatus } from '@/components/notifications/NotificationStatus';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Target, 
  Flame, 
  TrendingUp, 
  Calendar,
  Plus,
  User,
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';

type ActiveTab = 'dashboard' | 'workouts' | 'bmi' | 'nutrition' | 'profile';

export const Dashboard: React.FC<{ onNavigate?: (tab: ActiveTab) => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { state: { roadmap, dailyProgress, workoutHistory, weeklyGoals } } = useFitness();

  const calculateBMI = () => {
    // First try to use BMI from bmiData if available
    if (user?.bmiData?.bmi) {
      return user.bmiData.bmi.toFixed(1);
    }
    // Fallback to calculating from height and weight
    if (user?.height && user?.weight) {
      return (user.weight / Math.pow(user.height / 100, 2)).toFixed(1);
    }
    return '0';
  };

  const calculateWorkoutsThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return workoutHistory.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= startOfWeek && workoutDate <= today;
    }).length;
  };

  const stats = {
    bmi: calculateBMI(),
    todayCalories: dailyProgress.calories,
    targetCalories: user?.bmiData?.calorieGoal || user?.calorieGoal || 2000, // Use BMI data first, then user calorie goal, then default
    workoutsThisWeek: calculateWorkoutsThisWeek(),
    targetWorkouts: user?.bmiData?.weeklyWorkoutGoal || (weeklyGoals?.workouts ?? 3),
  };

  const caloriesProgress = (stats.todayCalories / stats.targetCalories) * 100;
  const workoutProgress = (stats.workoutsThisWeek / stats.targetWorkouts) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold"
              >
                Welcome back, {user?.name}! 👋
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/80 mt-1"
              >
                Ready to crush your fitness goals today?
              </motion.p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell onClick={() => onNavigate?.('settings')} />
              <Button variant="glass" size="icon" onClick={() => onNavigate?.('profile')}>
                <User className="h-4 w-4" />
              </Button>
              <Button variant="glass" size="icon" onClick={() => onNavigate?.('settings')}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="glass" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Quick Stats */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4">Today's Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="BMI"
                value={stats.bmi}
                subtitle="Body Mass Index"
                icon={TrendingUp}
                gradient
              />
              <StatsCard
                title="Calories Today"
                value={`${stats.todayCalories}/${stats.targetCalories}`}
                subtitle={`${caloriesProgress.toFixed(0)}% of goal`}
                icon={Flame}
              />
              <StatsCard
                title="Workouts This Week"
                value={`${stats.workoutsThisWeek}/${stats.targetWorkouts}`}
                subtitle={`${workoutProgress.toFixed(0)}% complete`}
                icon={Activity}
              />
              <StatsCard
                title="Current Streak"
                value={calculateWorkoutsThisWeek() > 0 ? `${calculateWorkoutsThisWeek()} days` : '0 days'}
                subtitle="Keep it up!"
                icon={Target}
              />
            </div>
          </motion.div>

          {/* Progress Tracker */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4">Progress & Streaks</h2>
            <ProgressTracker />
          </motion.div>

          {/* Notification Status */}
          <motion.div variants={itemVariants}>
            <NotificationStatus onNavigate={onNavigate} />
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card hover-lift cursor-pointer" onClick={() => onNavigate?.('workouts')}>
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-primary/10 text-primary rounded-full w-fit mx-auto mb-4">
                    <Plus className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg mb-2">Log Workout</CardTitle>
                  <CardDescription>Record your latest exercise session</CardDescription>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift cursor-pointer" onClick={() => onNavigate?.('nutrition')}>
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-success/10 text-success rounded-full w-fit mx-auto mb-4">
                    <Flame className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg mb-2">Log Meal</CardTitle>
                  <CardDescription>Track your nutrition intake</CardDescription>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift cursor-pointer" onClick={() => onNavigate?.('workouts')}>
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-info/10 text-info rounded-full w-fit mx-auto mb-4">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg mb-2">View Schedule</CardTitle>
                  <CardDescription>Check your workout plan</CardDescription>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Progress Charts Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Your workout consistency this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-8">{day}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: index < stats.workoutsThisWeek ? '100%' : '0%' }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="h-full bg-gradient-primary"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {index < stats.workoutsThisWeek ? '✓' : '○'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Calorie Balance</CardTitle>
                  <CardDescription>Daily intake vs target</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {stats.targetCalories - stats.todayCalories}
                      </div>
                      <p className="text-sm text-muted-foreground">Calories remaining</p>
                    </div>
                    <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(caloriesProgress, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${
                          caloriesProgress > 100 
                            ? 'bg-warning' 
                            : 'bg-gradient-primary'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>{stats.targetCalories} cal</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};