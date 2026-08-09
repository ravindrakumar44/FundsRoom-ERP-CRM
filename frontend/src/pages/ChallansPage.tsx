import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import { ChallanService } from '../services/challan.service';
import { Challan, ChallanStatus } from '../types';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchChallans = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await ChallanService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: statusTab !== 'ALL' ? (statusTab as ChallanStatus) : undefined,
      });
      const items = res?.data || (Array.isArray(res) ? res : []);
      setChallans(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch delivery challans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans(1);
  }, [search, statusTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery Challans & Dispatch</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate, confirm, and print official Delivery Challans with automatic inventory synchronization.
          </p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/challans/new')}
          >
            Create New Challan
          </Button>
        )}
      </div>

      {/* Status Tabs and Search */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Challans
            </button>
            <button
              onClick={() => setStatusTab('CONFIRMED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === 'CONFIRMED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusTab('DRAFT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === 'DRAFT'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setStatusTab('CANCELLED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === 'CANCELLED' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search challan # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Challans Table */}
      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading delivery challans...</div>
        ) : challans.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No Challans Found"
            description="Create your first Delivery Challan to begin warehouse dispatch fulfillment."
            actionLabel={hasRole('ADMIN', 'SALES') ? 'Create Challan' : undefined}
            onAction={() => navigate('/challans/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Challan #</th>
                  <th className="px-6 py-3.5">Customer & Entity</th>
                  <th className="px-6 py-3.5">Issue Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Items Qty</th>
                  <th className="px-6 py-3.5 text-right">Total Amount (₹)</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      <span
                        onClick={() => navigate(`/challans/${ch.id}`)}
                        className="cursor-pointer hover:underline"
                      >
                        {ch.challanNumber}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{ch.customer?.customerName}</p>
                      {ch.customer?.businessName && (
                        <p className="text-xs text-slate-400">{ch.customer.businessName}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {new Date(ch.createdAt).toLocaleDateString('en-IN')}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={ch.status} />
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                      {ch.totalQuantity} units
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-slate-900 text-base">
                      ₹{Number(ch.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/challans/${ch.id}`)}
                      >
                        View & Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={(page) => fetchChallans(page)} />
      </Card>
    </div>
  );
};
