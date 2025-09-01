import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: 'users' | 'orders' | 'completed' | 'connected';
}

const iconMap = {
  users: '👥',
  orders: '📋',
  completed: '✅',
  connected: '🟢'
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon
}) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-admin-400" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-admin-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-admin-600">{title}</p>
          <p className="text-3xl font-bold text-admin-900">{value.toLocaleString()}</p>
        </div>
        <div className="text-2xl">{iconMap[icon]}</div>
      </div>
      
      <div className="mt-4 flex items-center">
        {getChangeIcon()}
        <span className={`ml-2 text-sm ${getChangeColor()}`}>
          {change}
        </span>
      </div>
    </div>
  );
};

export default StatsCard;
