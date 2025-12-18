import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = false,
  trend
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className={`glass-card h-full transition-smooth hover-lift ${gradient ? 'bg-gradient-primary text-white' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${gradient ? 'text-white/80' : 'text-muted-foreground'}`}>
                {title}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold">
                  {value}
                </p>
                {trend && (
                  <span className={`text-xs font-medium ${
                    trend.isPositive 
                      ? gradient ? 'text-white/80' : 'text-success' 
                      : gradient ? 'text-white/80' : 'text-destructive'
                  }`}>
                    {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                  </span>
                )}
              </div>
              {subtitle && (
                <p className={`text-xs mt-1 ${gradient ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {subtitle}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full ${
              gradient 
                ? 'bg-white/20 text-white' 
                : 'bg-primary/10 text-primary'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};