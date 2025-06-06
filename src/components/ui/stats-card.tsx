
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const variantStyles = {
  default: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning', 
  error: 'bg-error',
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  variant = 'default',
  className,
  trend,
}) => {
  return (
    <Card 
      className={cn(
        "card-professional animate-fade-in-up",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p 
              className="text-muted text-sm font-medium"
              id={`stats-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {title}
            </p>
            <p 
              className="text-primary text-3xl font-bold tracking-tight"
              aria-describedby={`stats-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {value}
            </p>
            {trend && (
              <p className="text-muted text-xs">
                <span 
                  className={cn(
                    "font-medium",
                    trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                {' '}{trend.label}
              </p>
            )}
          </div>
          <div 
            className={cn(
              'p-3 rounded-xl shadow-sm',
              variantStyles[variant]
            )}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
