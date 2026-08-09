import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  PlusCircle,
  Layers,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { user, logout, switchRoleUser } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Customers & CRM',
      href: '/customers',
      icon: Users,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
    },
    {
      name: 'Inventory Catalog',
      href: '/products',
      icon: Package,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Delivery Challans',
      href: '/challans',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Stock Movements',
      href: '/stock-movements',
      icon: ArrowLeftRight,
      roles: ['ADMIN', 'WAREHOUSE'],
    },
  ];

  const filteredNav = navigation.filter((item) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return item.roles.includes(user.role);
  });

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-white flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-950 flex-shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                NEXORA
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
                Operations Portal
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Operations
          </p>
        )}

        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105" />
            {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
            {!collapsed && item.name === 'Delivery Challans' && (
              <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                ERP
              </span>
            )}
          </NavLink>
        ))}

        {/* Quick Action: New Challan Shortcut for Sales / Admin */}
        {!collapsed && (user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <div className="pt-4 px-1">
            <NavLink
              to="/challans/new"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 rounded-xl text-xs font-semibold text-indigo-200 transition-all shadow-inner"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Create Challan</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Role Switcher Demo Tool */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Demo Role Persona:
            </span>
          </div>
          <select
            value={user?.email || 'admin@nexora.demo'}
            onChange={(e) => switchRoleUser(e.target.value)}
            className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="admin@nexora.demo">Admin (Ravindra Kumar)</option>
            <option value="sales@nexora.demo">Sales Head (Rohan Mehta)</option>
            <option value="warehouse@nexora.demo">Warehouse Ops (Vikram)</option>
            <option value="accounts@nexora.demo">Accounts Lead (Pooja)</option>
          </select>
        </div>
      )}

      {/* User Info & Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-sm flex-shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Demo User'}</p>
                <div className="mt-0.5">
                  <StatusBadge status={user?.role || 'ADMIN'} />
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
