import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useFitness } from '@/contexts/FitnessContext';
import { Dashboard } from '@/pages/Dashboard';
import { Settings as SettingsPage } from '@/pages/Settings';
import { BMICalculator } from '@/components/bmi/BMICalculator';
import { LogWorkout } from '@/components/workouts/LogWorkout';
import { PPLPlan } from '@/components/workouts/PPLPlan';
import { NutritionTrackingPage } from '@/components/nutrition/NutritionTrackingPage';
import { MealPlanningPage } from '@/components/nutrition/MealPlanningPage';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  Activity, 
  Calculator, 
  Apple, 
  User, 
  Settings,
  LogOut,
  Menu,
  X,
  LineChart,
  Calendar,
  Brain
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';

type ActiveTab = 'dashboard' | 'workouts' | 'bmi' | 'nutrition-tracking' | 'meal-planning' | 'profile' | 'analytics' | 'settings';

export const FitnessApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const { user, logout, updateProfile } = useAuth();
  const { bmiData } = useFitness();
  const { theme, toggleTheme } = useTheme();

  // Check if user is new (no BMI data) and redirect to BMI calculator
  useEffect(() => {
    if (user && !bmiData) {
      setIsNewUser(true);
      setActiveTab('bmi');
    } else if (user && bmiData) {
      setIsNewUser(false);
    }
  }, [user, bmiData]);

  // Listen for BMI updates to refresh user data
  useEffect(() => {
    const handleBmiUpdate = async () => {
      try {
        const token = localStorage.getItem('fitnessTracker_token');
        if (!token) return;
        
        // Refresh user data from server
        const { apiFetch } = await import('@/lib/api');
        const userResponse = await apiFetch<{ user: any }>('/api/auth/me', { method: 'GET' }, token);
        if (userResponse.user) {
          updateProfile(userResponse.user);
        }
      } catch (error) {
        console.error('Error refreshing user data after BMI update:', error);
      }
    };
    
    window.addEventListener('bmiUpdated' as any, handleBmiUpdate);
    return () => {
      window.removeEventListener('bmiUpdated' as any, handleBmiUpdate);
    };
  }, [updateProfile]);

  // Set up global navigation function for notifications
  React.useEffect(() => {
    (window as any).navigateToTab = (tab: string) => {
      setActiveTab(tab as ActiveTab);
      setIsMobileMenuOpen(false);
    };
    
    return () => {
      delete (window as any).navigateToTab;
    };
  }, []);

  const navigationItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: Home },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: LineChart },
    { id: 'workouts' as ActiveTab, label: 'Workouts', icon: Activity },
    { id: 'nutrition-tracking' as ActiveTab, label: 'Nutrition Tracking', icon: Apple },
    { id: 'meal-planning' as ActiveTab, label: 'Meal Planning', icon: Brain },
    { id: 'bmi' as ActiveTab, label: 'BMI Calculator', icon: Calculator },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'workouts':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">Workout Tracker</h1>
                <p className="text-muted-foreground">Log and track your fitness activities</p>
              </div>
              <LogWorkout />
              <PPLPlan />
            </motion.div>
          </div>
        );
      case 'bmi':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">
                  {isNewUser ? 'Welcome! Let\'s Get Started' : 'BMI Calculator'}
                </h1>
                <p className="text-muted-foreground">
                  {isNewUser 
                    ? 'First, let\'s calculate your BMI and set up your fitness goals' 
                    : 'Calculate and track your Body Mass Index'
                  }
                </p>
              </div>
              <BMICalculator 
                onCalculate={(bmi, calorieGoal) => {
                  if (isNewUser) {
                    // After BMI calculation, redirect to dashboard
                    setTimeout(() => {
                      setActiveTab('dashboard');
                      setIsNewUser(false);
                    }, 2000); // Give user time to see the results
                  }
                }}
              />
              {isNewUser && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-primary">Complete Setup Required</p>
                        <p className="text-sm text-muted-foreground">
                          Please calculate your BMI to access all features of the app.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        );
      case 'nutrition-tracking':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">Nutrition Tracking</h1>
                <p className="text-muted-foreground">Log your meals and track daily macros</p>
              </div>
              <NutritionTrackingPage />
            </motion.div>
          </div>
        );
      case 'meal-planning':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">Meal Planning</h1>
                <p className="text-muted-foreground">Generate meals to hit your goals</p>
              </div>
              <MealPlanningPage />
            </motion.div>
          </div>
        );
      case 'profile':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">Profile</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
              </div>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-primary rounded-full">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{user?.name}</h3>
                        <p className="text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Age</label>
                        <p className="text-lg">{user?.age || 'Not set'}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gender</label>
                        <p className="text-lg">{user?.gender || 'Not set'}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Height</label>
                        <p className="text-lg">{user?.height ? `${user.height} cm` : 'Not set'}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Weight</label>
                        <p className="text-lg">{user?.weight ? `${user.weight} kg` : 'Not set'}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">BMI</label>
                        <p className="text-lg">
                          {bmiData?.bmi ? bmiData.bmi.toFixed(1) : user?.bmiData?.bmi ? user.bmiData.bmi.toFixed(1) : user?.bmi ? user.bmi.toFixed(1) : 'Not calculated'}
                          {bmiData?.bmi && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({bmiData.bmi < 18.5 ? 'Underweight' : bmiData.bmi < 25 ? 'Normal' : bmiData.bmi < 30 ? 'Overweight' : 'Obese'})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Calorie Goal</label>
                        <p className="text-lg">
                          {bmiData?.calorieGoal || user?.bmiData?.calorieGoal || user?.calorieGoal ? 
                            `${bmiData?.calorieGoal || user?.bmiData?.calorieGoal || user?.calorieGoal} kcal` : 
                            'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Theme</p>
                          <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Light</span>
                          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                          <span className="text-sm text-muted-foreground">Dark</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        variant="destructive" 
                        onClick={logout}
                        className="w-full"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        );
      case 'settings':
        return <SettingsPage onNavigate={(tab) => setActiveTab(tab)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-primary text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">FitTracker</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-white/20"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)] lg:h-screen">
        {/* Sidebar */}
        <aside className={`
          fixed lg:relative z-40 w-64 bg-card border-r transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold gradient-text">FitTracker</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isNewUser ? 'Welcome! Let\'s get started' : `Welcome back, ${user?.name}!`}
                </p>
                {isNewUser && (
                  <div className="mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full inline-block">
                    Setup Required
                  </div>
                )}
              </div>
              <NotificationBell onClick={() => setActiveTab('settings')} />
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const isDisabled = isNewUser && item.id !== 'bmi';
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                  {isDisabled && (
                    <span className="ml-auto text-xs text-muted-foreground">Complete BMI first</span>
                  )}
                </Button>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};