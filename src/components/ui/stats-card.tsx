
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
  default: 'accent-primary',
  success: 'success',
  warning: 'warning', 
  error: 'error',
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
        "bg-secondary border-default enhanced-hover animate-fade-in",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p 
              className="text-secondary text-sm font-medium"
              id={`stats-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {title}
            </p>
            <p 
              className="text-primary text-3xl font-bold"
              aria-describedby={`stats-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {value}
            </p>
            {trend && (
              <p className="text-muted text-xs">
                <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                {' '}{trend.label}
              </p>
            )}
          </div>
          <div 
            className={cn(
              'p-3 rounded-full shadow-md',
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
