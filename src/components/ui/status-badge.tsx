
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "success-light border-transparent",
        warning: "warning-light border-transparent", 
        error: "error-light border-transparent",
        neutral: "bg-secondary text-secondary-foreground border-border",
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
