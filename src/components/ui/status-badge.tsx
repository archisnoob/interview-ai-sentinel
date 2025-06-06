
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-success-light text-success border-success/20",
        warning: "bg-warning-light text-warning border-warning/20", 
        error: "bg-error-light text-error border-error/20",
        neutral: "bg-secondary text-secondary border-border",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  neutral: Clock,
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  showIcon?: boolean;
}

function StatusBadge({ 
  className, 
  variant = "neutral", 
  children, 
  showIcon = true,
  ...props 
}: StatusBadgeProps) {
  const Icon = iconMap[variant || 'neutral'];

  return (
    <div 
      className={cn(statusBadgeVariants({ variant }), className)} 
      role="status"
      aria-label={`Status: ${children}`}
      {...props}
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      <span>{children}</span>
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };
