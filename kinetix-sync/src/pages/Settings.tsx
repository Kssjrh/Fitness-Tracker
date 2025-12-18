import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useFitness } from '@/contexts/FitnessContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { 
  ArrowLeft,
  Bell,
  User,
  Shield,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Moon,
  Sun,
  Monitor,
  FileText,
  Calendar,
  Activity,
  Apple,
  Archive,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'workouts' | 'bmi' | 'nutrition' | 'profile';

export const Settings: React.FC<{ onNavigate?: (tab: ActiveTab) => void }> = ({ onNavigate }) => {
  const { user, logout, updateProfile } = useAuth();
  const { state: fitnessState, bmiData } = useFitness();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    dataSharing: false,
    analyticsTracking: true,
    showProgressToOthers: false,
    allowFriendRequests: true
  });

  // Data management state
  const [exportFormat, setExportFormat] = useState('json');
  const [dateRange, setDateRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [dataStats, setDataStats] = useState({
    workouts: 0,
    meals: 0,
    daysActive: 0,
    records: 0
  });
  const [backupHistory, setBackupHistory] = useState([]);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Load data statistics
  useEffect(() => {
    const loadDataStats = async () => {
      try {
        const token = localStorage.getItem('fitnessTracker_token');
        if (!token) return;

        const today = new Date().toISOString().split('T')[0];
        const [workoutsRes, nutritionRes] = await Promise.all([
          apiFetch('/api/workouts/history', { method: 'GET' }, token),
          apiFetch(`/api/nutrition/daily-summary?date=${today}`, { method: 'GET' }, token)
        ]);

        const workouts = Array.isArray(workoutsRes) ? workoutsRes : [];
        const meals = nutritionRes?.entries || [];
        
        // Calculate unique active days
        const activeDays = new Set([
          ...workouts.map((w: any) => w.date),
          ...meals.map((m: any) => m.date)
        ]).size;

        setDataStats({
          workouts: workouts.length,
          meals: meals.length,
          daysActive: activeDays,
          records: workouts.length + meals.length
        });
      } catch (error) {
        console.error('Error loading data stats:', error);
      }
    };

    loadDataStats();
  }, []);

  // Listen for BMI updates to refresh user data
  useEffect(() => {
    const handleBmiUpdate = async () => {
      try {
        const token = localStorage.getItem('fitnessTracker_token');
        if (!token) return;
        
        // Refresh user data from server
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

  // Data Export Functions
  const handleDataExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) throw new Error('No authentication token');

      // Fetch all user data
      const today = new Date().toISOString().split('T')[0];
      const [workoutsRes, nutritionRes, bmiRes] = await Promise.all([
        apiFetch('/api/workouts/history', { method: 'GET' }, token),
        apiFetch(`/api/nutrition/daily-summary?date=${today}`, { method: 'GET' }, token),
        apiFetch('/api/bmi', { method: 'GET' }, token)
      ]);

      const exportData = {
        user: {
          name: user?.name,
          email: user?.email,
          height: user?.height,
          weight: user?.weight,
          age: user?.age,
          gender: user?.gender,
          calorieGoal: user?.calorieGoal,
          proteinGoal: user?.proteinGoal
        },
        bmiData: bmiRes,
        workouts: Array.isArray(workoutsRes) ? workoutsRes : [],
        nutrition: nutritionRes,
        settings: {
          theme,
          privacy: privacySettings
        },
        exportDate: new Date().toISOString(),
        format: exportFormat,
        version: '1.0'
      };

      // Create and download file
      let blob: Blob;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `fittracker-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else if (exportFormat === 'csv') {
        const csvData = convertToCSV(exportData);
        blob = new Blob([csvData], { type: 'text/csv' });
        filename = `fittracker-data-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        // PDF export would require a PDF library
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `fittracker-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Your data has been exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Data Import Functions
  const handleDataImport = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    try {
      const text = await importFile.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.user || !importData.exportDate) {
        throw new Error('Invalid data format');
      }

      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) throw new Error('No authentication token');

      // Import workouts
      if (importData.workouts && Array.isArray(importData.workouts)) {
        for (const workout of importData.workouts) {
          await apiFetch('/api/workouts/log', {
            method: 'POST',
            body: JSON.stringify(workout)
          }, token);
        }
      }

      // Import nutrition data
      if (importData.nutrition && importData.nutrition.entries) {
        for (const meal of importData.nutrition.entries) {
          await apiFetch('/api/nutrition', {
            method: 'POST',
            body: JSON.stringify(meal)
          }, token);
        }
      }

      // Import BMI data
      if (importData.bmiData) {
        await apiFetch('/api/bmi', {
          method: 'POST',
          body: JSON.stringify(importData.bmiData)
        }, token);
      }

      toast({
        title: "Import Successful",
        description: "Your data has been imported successfully",
      });

      // Refresh data stats
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportFile(null);
    }
  };

  // Data Backup Functions
  const handleDataBackup = async () => {
    setIsBackingUp(true);
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) throw new Error('No authentication token');

      const backupData = {
        user: user,
        bmiData: bmiData,
        fitnessState: fitnessState,
        settings: { theme, privacy: privacySettings },
        backupDate: new Date().toISOString(),
        version: '1.0'
      };

      // Save backup to localStorage
      const backupKey = `backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Update backup history
      const newBackup = {
        id: backupKey,
        date: new Date().toISOString(),
        size: JSON.stringify(backupData).length,
        type: 'local'
      };
      setBackupHistory(prev => [newBackup, ...prev.slice(0, 4)]);

      toast({
        title: "Backup Created",
        description: "Your data has been backed up locally",
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Data Restore Functions
  const handleDataRestore = async (backupId: string) => {
    setIsRestoring(true);
    try {
      const backupData = localStorage.getItem(backupId);
      if (!backupData) throw new Error('Backup not found');

      const parsedBackup = JSON.parse(backupData);
      
      // Restore user data
      if (parsedBackup.user) {
        // Update user profile
        const token = localStorage.getItem('fitnessTracker_token');
        if (token) {
          await apiFetch('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(parsedBackup.user)
          }, token);
        }
      }

      // Restore BMI data
      if (parsedBackup.bmiData) {
        const token = localStorage.getItem('fitnessTracker_token');
        if (token) {
          await apiFetch('/api/bmi', {
            method: 'POST',
            body: JSON.stringify(parsedBackup.bmiData)
          }, token);
        }
      }

      toast({
        title: "Restore Successful",
        description: "Your data has been restored from backup",
      });

      // Refresh the page to load restored data
      window.location.reload();
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: "Failed to restore data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Data Clear Functions
  const handleClearWorkouts = async () => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) throw new Error('No authentication token');

      await apiFetch('/api/data/workouts/clear', { method: 'DELETE' }, token);
      
      toast({
        title: "Workouts Cleared",
        description: "All workout data has been removed",
      });
      
      // Refresh data stats
      window.location.reload();
    } catch (error) {
      console.error('Clear workouts error:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear workout data",
        variant: "destructive",
      });
    }
  };

  const handleClearNutrition = async () => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) throw new Error('No authentication token');

      await apiFetch('/api/data/nutrition/clear', { method: 'DELETE' }, token);
      
      toast({
        title: "Nutrition Data Cleared",
        description: "All nutrition data has been removed",
      });
      
      // Refresh data stats
      window.location.reload();
    } catch (error) {
      console.error('Clear nutrition error:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear nutrition data",
        variant: "destructive",
      });
    }
  };

  const handleResetAllData = async () => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) throw new Error('No authentication token');

      // Clear all data
      await apiFetch('/api/data/clear-all', { method: 'DELETE' }, token);
      
      toast({
        title: "All Data Reset",
        description: "All your data has been cleared",
      });
      
      // Refresh data stats
      window.location.reload();
    } catch (error) {
      console.error('Reset all data error:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset all data",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('fitnessTracker_token');
      if (!token) throw new Error('No authentication token');

      await apiFetch('/api/data/account/delete', { method: 'DELETE' }, token);
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
      
      logout();
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data: any) => {
    const headers = ['Date', 'Type', 'Name', 'Calories', 'Protein', 'Carbs', 'Fats'];
    const rows = [headers.join(',')];

    // Add workout data
    if (data.workouts) {
      data.workouts.forEach((workout: any) => {
        rows.push([
          workout.date,
          'Workout',
          workout.type,
          workout.calories || 0,
          0,
          0,
          0
        ].join(','));
      });
    }

    // Add nutrition data
    if (data.nutrition && data.nutrition.entries) {
      data.nutrition.entries.forEach((meal: any) => {
        rows.push([
          meal.date,
          'Meal',
          meal.name,
          meal.calories || 0,
          meal.protein || 0,
          meal.carbs || 0,
          meal.fats || 0
        ].join(','));
      });
    }

    return rows.join('\n');
  };

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
            <div className="flex items-center gap-4">
              <Button 
                variant="glass" 
                size="icon" 
                onClick={() => onNavigate?.('dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold"
                >
                  Settings
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 mt-1"
                >
                  Customize your fitness tracking experience
                </motion.p>
              </div>
            </div>
            <Button variant="glass" onClick={logout}>
              Logout
            </Button>
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
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="notifications" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notifications" className="space-y-6">
                <NotificationSettings />
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Manage your personal information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground">{user?.name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground">{user?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Height</label>
                        <p className="text-sm text-muted-foreground">{user?.height ? `${user.height} cm` : 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Weight</label>
                        <p className="text-sm text-muted-foreground">{user?.weight ? `${user.weight} kg` : 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">BMI</label>
                        <p className="text-sm text-muted-foreground">
                          {bmiData?.bmi ? bmiData.bmi.toFixed(1) : user?.bmiData?.bmi ? user.bmiData.bmi.toFixed(1) : user?.bmi ? user.bmi.toFixed(1) : 'Not calculated'}
                          {bmiData?.bmi && (
                            <span className="ml-2 text-xs">
                              ({bmiData.bmi < 18.5 ? 'Underweight' : bmiData.bmi < 25 ? 'Normal' : bmiData.bmi < 30 ? 'Overweight' : 'Obese'})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Daily Calorie Goal</label>
                        <p className="text-sm text-muted-foreground">
                          {bmiData?.calorieGoal || user?.bmiData?.calorieGoal || user?.calorieGoal ? 
                            `${bmiData?.calorieGoal || user?.bmiData?.calorieGoal || user?.calorieGoal} calories` : 
                            'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Daily Protein Goal</label>
                        <p className="text-sm text-muted-foreground">
                          {bmiData?.proteinGoal || user?.bmiData?.proteinGoal || user?.proteinGoal ? 
                            `${bmiData?.proteinGoal || user?.bmiData?.proteinGoal || user?.proteinGoal} g` : 
                            'Not set'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy & Security
                    </CardTitle>
                    <CardDescription>
                      Control your data privacy and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Visibility */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Profile Visibility</Label>
                          <p className="text-sm text-muted-foreground">
                            Control who can see your profile and progress
                          </p>
                        </div>
                        <Select 
                          value={privacySettings.profileVisibility} 
                          onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Private
                              </div>
                            </SelectItem>
                            <SelectItem value="friends">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Friends Only
                              </div>
                            </SelectItem>
                            <SelectItem value="public">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Public
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Data Sharing */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Data Sharing</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow anonymous data sharing for app improvement
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.dataSharing}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, dataSharing: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Analytics Tracking</Label>
                          <p className="text-sm text-muted-foreground">
                            Help us improve the app with usage analytics
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.analyticsTracking}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, analyticsTracking: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Show Progress to Others</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow friends to see your workout progress
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.showProgressToOthers}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showProgressToOthers: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Allow Friend Requests</Label>
                          <p className="text-sm text-muted-foreground">
                            Let other users send you friend requests
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.allowFriendRequests}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowFriendRequests: checked }))}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Security Actions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Security Actions</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-auto p-4">
                          <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5" />
                            <div className="text-left">
                              <div className="font-medium">Change Password</div>
                              <div className="text-sm text-muted-foreground">Update your account password</div>
                            </div>
                          </div>
                        </Button>

                        <Button variant="outline" className="h-auto p-4">
                          <div className="flex items-center gap-3">
                            <Eye className="h-5 w-5" />
                            <div className="text-left">
                              <div className="font-medium">View Login History</div>
                              <div className="text-sm text-muted-foreground">See recent account activity</div>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Appearance
                    </CardTitle>
                    <CardDescription>
                      Customize the look and feel of your app
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Theme Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Theme</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred color scheme
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Light</span>
                          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                          <span className="text-sm text-muted-foreground">Dark</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {theme === 'dark' ? (
                            <Moon className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Sun className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium capitalize">{theme} Mode</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Display Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Display Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Compact Mode</Label>
                            <p className="text-sm text-muted-foreground">
                              Use smaller spacing and compact layouts
                            </p>
                          </div>
                          <Switch defaultChecked={false} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Show Icons in Navigation</Label>
                            <p className="text-sm text-muted-foreground">
                              Display icons alongside text in the sidebar
                            </p>
                          </div>
                          <Switch defaultChecked={true} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Animate Transitions</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable smooth animations and transitions
                            </p>
                          </div>
                          <Switch defaultChecked={true} />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Color Customization */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Color Customization</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Primary Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary border-2 border-border"></div>
                            <Button variant="outline" size="sm">Customize</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Accent Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent border-2 border-border"></div>
                            <Button variant="outline" size="sm">Customize</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Success Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-border"></div>
                            <Button variant="outline" size="sm">Customize</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Warning Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-border"></div>
                            <Button variant="outline" size="sm">Customize</Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Font Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Typography</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Font Family</Label>
                          <Select defaultValue="system">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="system">System Default</SelectItem>
                              <SelectItem value="inter">Inter</SelectItem>
                              <SelectItem value="roboto">Roboto</SelectItem>
                              <SelectItem value="opensans">Open Sans</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Font Size</Label>
                          <Select defaultValue="medium">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                              <SelectItem value="xlarge">Extra Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="space-y-6">
                {/* Data Export Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export Your Data
                    </CardTitle>
                    <CardDescription>
                      Download a copy of your fitness data for backup or migration purposes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Export Format</Label>
                        <Select value={exportFormat} onValueChange={setExportFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="pdf">PDF Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date Range</Label>
                        <Select value={dateRange} onValueChange={setDateRange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                            <SelectItem value="month">Last Month</SelectItem>
                            <SelectItem value="week">Last Week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={handleDataExport} 
                      disabled={isExporting}
                      className="w-full"
                    >
                      {isExporting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Data Import Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Import Data
                    </CardTitle>
                    <CardDescription>
                      Import previously exported data to restore your fitness records
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Select File</Label>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Only JSON files exported from FitTracker are supported
                      </p>
                    </div>

                    <Button 
                      onClick={handleDataImport} 
                      disabled={!importFile || isImporting}
                      className="w-full"
                    >
                      {isImporting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Data
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Data Backup Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      Data Backup
                    </CardTitle>
                    <CardDescription>
                      Create local backups of your data for quick restoration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={handleDataBackup} 
                      disabled={isBackingUp}
                      className="w-full"
                    >
                      {isBackingUp ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Creating Backup...
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 mr-2" />
                          Create Backup
                        </>
                      )}
                    </Button>

                    {backupHistory.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Recent Backups</Label>
                        <div className="space-y-2">
                          {backupHistory.map((backup: any) => (
                            <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {new Date(backup.date).toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(backup.size / 1024)} KB • {backup.type}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDataRestore(backup.id)}
                                disabled={isRestoring}
                              >
                                {isRestoring ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Data Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Your Data Overview
                    </CardTitle>
                    <CardDescription>
                      Statistics about your fitness data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{dataStats.workouts}</div>
                        <div className="text-sm text-muted-foreground">Workouts</div>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <Apple className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold">{dataStats.meals}</div>
                        <div className="text-sm text-muted-foreground">Meals Logged</div>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold">{dataStats.daysActive}</div>
                        <div className="text-sm text-muted-foreground">Days Active</div>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold">{dataStats.records}</div>
                        <div className="text-sm text-muted-foreground">Total Records</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Management Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Data Management
                    </CardTitle>
                    <CardDescription>
                      Clear specific data types or reset all data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Clear Workout History
                            </div>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear Workout History</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all your workout records. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearWorkouts} className="bg-destructive">
                              Clear Workouts
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <div className="flex items-center gap-2">
                              <Apple className="h-4 w-4" />
                              Clear Nutrition Data
                            </div>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear Nutrition Data</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all your meal and nutrition records. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearNutrition} className="bg-destructive">
                              Clear Nutrition
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full justify-between">
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              Reset All Data
                            </div>
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reset All Data</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete ALL your data including workouts, nutrition, BMI data, and settings. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetAllData} className="bg-destructive">
                              Reset All Data
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Deletion */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>
                      Permanently delete your account and all associated data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
                      <div className="space-y-2">
                        <div className="font-medium text-destructive">Delete Account</div>
                        <div className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="mt-3">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete your account and ALL associated data. This action cannot be undone and you will lose access to your account forever.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive">
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};
