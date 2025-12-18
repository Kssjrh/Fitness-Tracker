import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPanel } from './NotificationPanel';
import { Bell, BellOff } from 'lucide-react';

interface NotificationBellProps {
  onNavigate?: (tab: string) => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  onNavigate,
  className = "" 
}) => {
  const { 
    settings, 
    unreadCount,
    hasLoggedMealsToday, 
    hasLoggedWorkoutToday 
  } = useNotifications();

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const hasPendingItems = !hasLoggedMealsToday || !hasLoggedWorkoutToday;
  const notificationsEnabled = settings.mealReminders || settings.workoutReminders;
  const showBadge = unreadCount > 0 || (hasPendingItems && notificationsEnabled);

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPanelOpen(true)}
          className={`relative ${className}`}
        >
          {notificationsEnabled ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          
          {/* Notification badge */}
          {showBadge && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 0 ? unreadCount : '!'}
            </Badge>
          )}
        </Button>
      </div>

      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};
