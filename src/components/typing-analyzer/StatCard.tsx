
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  valueColor: string;
  containerClasses: string;
  iconContainerClasses: string;
  titleClasses: string;
  sparklineData?: { time: number; value: number }[];
  sparklineColor?: string;
  isActive: boolean;
  children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  valueColor,
  containerClasses,
  iconContainerClasses,
  titleClasses,
  sparklineData,
  sparklineColor,
  isActive,
  children,
}) => {
  return (
    <div className={`p-4 rounded-xl hover:shadow-md transition-all duration-200 ${containerClasses}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${iconContainerClasses}`}>
            {icon}
          </div>
          <div>
            <p className={`text-xs font-medium ${titleClasses}`}>{title}</p>
            <p className={`text-lg font-bold ${valueColor}`}>
              {value}
              {children}
            </p>
          </div>
        </div>
        {sparklineData && sparklineColor && (
          <div className="w-20 h-10">
            {isActive && sparklineData.length > 1 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="value" stroke={sparklineColor} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
