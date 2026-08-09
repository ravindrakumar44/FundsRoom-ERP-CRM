import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Plus,
  AlertCircle,
  FilePlus2,
  UserPlus,
  ArrowDownUp,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProductService } from '../../services/product.service';
import { Product } from '../../types';
import { Button } from '../common/Button';

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lowStockAlerts, setLowStockAlerts] = useState<Product[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alerts = await ProductService.getLowStock();
        setLowStockAlerts(alerts);
      } catch (err) {
        // Silent catch
      }
    };
    fetchAlerts();
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between gap-4">
      {/* Left: Sidebar Toggle & Page Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900">NEXORA Operations Portal</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
            {user?.role} Mode
          </span>
        </div>
      </div>

      {/* Right: Actions, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Quick Action Buttons based on Role */}
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<FilePlus2 className="w-4 h-4" />}
            onClick={() => navigate('/challans/new')}
            className="hidden md:inline-flex"
          >
            New Challan
          </Button>
        )}

        {/* Low Stock Alerts Notification Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {lowStockAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Inventory Alerts
                </span>
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  {lowStockAlerts.length}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {lowStockAlerts.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">All stock levels healthy 🎉</p>
                ) : (
                  lowStockAlerts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/products');
                      }}
                      className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-medium text-slate-900 truncate">{item.productName}</p>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="text-slate-500 font-mono">{item.sku}</span>
                        <span
                          className={`font-semibold ${
                            item.currentStock <= 0 ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {item.currentStock <= 0
                            ? 'OUT OF STOCK'
                            : `${item.currentStock} left (Min: ${item.minimumStock})`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user?.name ? user.name[0] : 'A'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
              {user?.name || 'Ravindra Kumar'}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight capitalize">{user?.role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
