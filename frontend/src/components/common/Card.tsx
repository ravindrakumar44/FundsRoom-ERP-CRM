import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200',
        hoverable && 'hover:shadow-md hover:border-slate-300',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={clsx('px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-slate-900 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={clsx('p-6', className)}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={clsx('px-6 py-4 bg-slate-50/75 border-t border-slate-100', className)}>{children}</div>;
};
