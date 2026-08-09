import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-50',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs transition-all duration-200 overflow-hidden',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
            {trend && (
              <span
                className={clsx(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={clsx('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
};
