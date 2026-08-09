import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  FileSpreadsheet,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStats } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await DashboardService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Error loading dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 rounded-2xl" />
          <div className="h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis;

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry on customer leads, inventory velocity, and delivery challans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Package className="w-4 h-4" />}
            onClick={() => navigate('/products')}
          >
            Manage Catalog
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => navigate('/challans/new')}
          >
            Create Challan
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Customers & Leads"
          value={kpis?.totalCustomers || 0}
          subtitle={`${kpis?.activeCustomers || 0} Active • ${kpis?.leadCustomers || 0} Leads`}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          trend={{ value: '+14% MoM', isPositive: true }}
          onClick={() => navigate('/customers')}
        />

        <StatCard
          title="Catalog Inventory"
          value={kpis?.totalProducts || 0}
          subtitle={`${kpis?.lowStockProducts || 0} items near minimum stock`}
          icon={Package}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          onClick={() => navigate('/products')}
        />

        <StatCard
          title="Stock Alerts"
          value={kpis?.lowStockProducts || 0}
          subtitle={`${kpis?.outOfStockProducts || 0} completely out of stock`}
          icon={AlertTriangle}
          iconColor={kpis?.lowStockProducts ? 'text-amber-600' : 'text-emerald-600'}
          iconBg={kpis?.lowStockProducts ? 'bg-amber-50' : 'bg-emerald-50'}
          onClick={() => navigate('/products')}
        />

        <StatCard
          title="Delivery Challans"
          value={kpis?.totalChallans || 0}
          subtitle={`${kpis?.confirmedChallans || 0} Dispatched & Confirmed`}
          icon={FileSpreadsheet}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={{ value: '100% Stock Sync', isPositive: true }}
          onClick={() => navigate('/challans')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue / Volume Trends */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Dispatch Revenue & Volume Velocity"
            subtitle="Monthly confirmed dispatch turnover in ₹ vs draft orders"
          />
          <CardBody className="pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.charts.challansOverTime || []}>
                  <defs>
                    <linearGradient id="confirmedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="draftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="confirmedRevenue"
                    name="Confirmed Revenue"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#confirmedGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="draftRevenue"
                    name="Draft Pipelines"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#draftGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Customer Distribution Donut */}
        <Card>
          <CardHeader title="Customer Breakdown" subtitle="Distribution by business type" />
          <CardBody className="pt-2">
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.charts.customerDistribution || []}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(stats?.charts.customerDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      borderRadius: '8px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-center">
              {(stats?.charts.customerDistribution || []).map((item) => (
                <div key={item.name} className="p-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Actionable Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader
            title="Critical Inventory Alerts"
            subtitle="Products that have reached or fallen below minimum reorder levels"
            action={
              <Button size="sm" variant="outline" onClick={() => navigate('/products')}>
                View All
              </Button>
            }
          />
          <div className="divide-y divide-slate-100 overflow-hidden">
            {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
              stats.lowStockAlerts.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{prod.productName}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-mono">{prod.sku}</span>
                      <span>•</span>
                      <span>Loc: {prod.warehouseLocation || 'Main Hub'}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        prod.currentStock <= 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {prod.currentStock <= 0 ? '0 In Stock' : `${prod.currentStock} Units Left`}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Min: {prod.minimumStock}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All products maintain healthy stock buffers!
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Customer Follow-ups */}
        <Card>
          <CardHeader
            title="Upcoming CRM Follow-ups"
            subtitle="Scheduled interactions for potential orders and account nurturing"
            action={
              <Button size="sm" variant="outline" onClick={() => navigate('/customers')}>
                CRM View
              </Button>
            }
          />
          <div className="divide-y divide-slate-100 overflow-hidden">
            {stats?.upcomingFollowUps && stats.upcomingFollowUps.length > 0 ? (
              stats.upcomingFollowUps.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/customers/${item.id}`)}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.customerName}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.businessName && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3" />
                        {item.businessName}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-slate-600 italic truncate mt-1">"{item.notes}"</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.followUpDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{item.mobile}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                No pending customer follow-ups scheduled for today.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Delivery Challans Table */}
      <Card>
        <CardHeader
          title="Recent Delivery Challans"
          subtitle="Real-time dispatch orders and warehouse fulfillment records"
          action={
            <Button size="sm" variant="outline" onClick={() => navigate('/challans')}>
              View All Challans
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Challan #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Items / Amount</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.recentChallans || []).map((ch) => (
                <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-indigo-600">{ch.challanNumber}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{ch.customer?.customerName}</p>
                    {ch.customer?.businessName && (
                      <p className="text-xs text-slate-400">{ch.customer.businessName}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(ch.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ch.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-slate-900">
                      ₹{Number(ch.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400">{ch.totalQuantity} units</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/challans/${ch.id}`)}>
                      Details →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
