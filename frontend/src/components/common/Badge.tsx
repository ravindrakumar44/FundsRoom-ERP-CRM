import React from 'react';
import { clsx } from 'clsx';
import { CustomerStatus, CustomerType, ChallanStatus, MovementType, Role } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
    info: 'bg-sky-50 text-sky-700 border-sky-200/60',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/60',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border leading-none tracking-wide transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: CustomerStatus | ChallanStatus | MovementType | Role | string }> = ({
  status,
}) => {
  switch (status) {
    // Customer Status
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>;
    case 'LEAD':
      return <Badge variant="warning">Lead</Badge>;
    case 'INACTIVE':
      return <Badge variant="neutral">Inactive</Badge>;

    // Challan Status
    case 'CONFIRMED':
      return <Badge variant="success">Confirmed (Dispatched)</Badge>;
    case 'DRAFT':
      return <Badge variant="warning">Draft</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>;

    // Stock Movement Type
    case 'IN':
      return <Badge variant="success">▲ Stock IN</Badge>;
    case 'OUT':
      return <Badge variant="danger">▼ Stock OUT</Badge>;

    // Customer Type
    case 'DISTRIBUTOR':
      return <Badge variant="purple">Distributor</Badge>;
    case 'WHOLESALE':
      return <Badge variant="info">Wholesale</Badge>;
    case 'RETAIL':
      return <Badge variant="default">Retail</Badge>;

    // Roles
    case 'ADMIN':
      return <Badge variant="danger">Admin</Badge>;
    case 'SALES':
      return <Badge variant="default">Sales</Badge>;
    case 'WAREHOUSE':
      return <Badge variant="warning">Warehouse</Badge>;
    case 'ACCOUNTS':
      return <Badge variant="info">Accounts</Badge>;

    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
