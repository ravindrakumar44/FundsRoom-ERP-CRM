import React, { useState, useEffect } from 'react';
import {
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Package,
  Search,
  Calendar,
  Layers,
  User,
} from 'lucide-react';
import { StockService } from '../services/stock.service';
import { ProductService } from '../services/product.service';
import { StockMovement, Product, MovementType } from '../types';
import { Card } from '../components/common/Card';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const StockMovementsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const [movementType, setMovementType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Record Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    movementType: 'IN' as MovementType,
    reason: '',
  });

  const fetchMovements = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await StockService.getAll({
        page,
        limit: 10,
        movementType: (movementType as MovementType) || undefined,
      });
      const items = res?.data || (Array.isArray(res) ? res : []);
      setMovements(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch stock movements');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductList = async () => {
    try {
      const res = await ProductService.getAll({ limit: 100 });
      const prodItems = res?.data || (Array.isArray(res) ? res : []);
      setProducts(prodItems);
      if (prodItems.length > 0 && !formData.productId) {
        setFormData((prev) => ({ ...prev, productId: prodItems[0].id }));
      }
    } catch (err) {
      // Silent catch
    }
  };

  useEffect(() => {
    fetchMovements(1);
  }, [movementType]);

  useEffect(() => {
    fetchProductList();
  }, []);

  const handleOpenModal = () => {
    if (products.length > 0) {
      setFormData({
        productId: products[0].id,
        quantity: 5,
        movementType: 'IN',
        reason: 'Purchase Receipt / Warehouse Inflow',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || formData.quantity <= 0) return;
    setIsSubmitting(true);
    try {
      await StockService.recordMovement(formData);
      success('Inventory balance updated and audit log recorded', 'Stock Adjusted');
      setIsModalOpen(false);
      fetchMovements(1);
    } catch (err: any) {
      error(err.message || 'Failed to record stock movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === formData.productId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Stock Movements</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable audit trail of all inventory receipts, dispatches, write-offs, and manual adjustments.
          </p>
        </div>
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenModal}
          >
            Record Stock Adjustment
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMovementType('')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                movementType === ''
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Movements
            </button>
            <button
              onClick={() => setMovementType('IN')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                movementType === 'IN'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Stock Inflow (+IN)</span>
            </button>
            <button
              onClick={() => setMovementType('OUT')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                movementType === 'OUT'
                  ? 'bg-rose-600 text-white shadow-xs shadow-rose-200'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Stock Outflow (-OUT)</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading audit history...</div>
        ) : movements.length === 0 ? (
          <EmptyState
            icon={ArrowDownUp}
            title="No Stock Movements Logged"
            description="All stock transactions through delivery challans or manual warehouse receipts appear here."
            actionLabel={hasRole('ADMIN', 'WAREHOUSE') ? 'Record Movement' : undefined}
            onAction={handleOpenModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Product & SKU</th>
                  <th className="px-6 py-3.5">Movement Type</th>
                  <th className="px-6 py-3.5 text-center">Quantity</th>
                  <th className="px-6 py-3.5">Reason / Ref</th>
                  <th className="px-6 py-3.5">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {new Date(m.createdAt).toLocaleString('en-IN')}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{m.product?.productName}</p>
                      <span className="font-mono text-xs text-slate-400">{m.product?.sku}</span>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={m.movementType} />
                    </td>

                    <td className="px-6 py-4 text-center font-bold">
                      <span
                        className={
                          m.movementType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                        }
                      >
                        {m.movementType === 'IN' ? `+${m.quantity}` : `-${m.quantity}`} Units
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-700 font-medium">{m.reason}</td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{m.user?.name || 'Warehouse Staff'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={(page) => fetchMovements(page)} />
      </Card>

      {/* Record Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Warehouse Stock Adjustment"
        subtitle="Perform physical inventory reconciliation, receipt, or damaged item write-off"
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
              Apply Stock Movement
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} ({p.sku}) — Available: {p.currentStock} units
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Movement Direction <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.movementType}
                onChange={(e) => setFormData({ ...formData, movementType: e.target.value as MovementType })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="IN">▲ Stock IN (Add Inventory)</option>
                <option value="OUT">▼ Stock OUT (Deduct Inventory)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantity (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {selectedProduct && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Current Stock: </span>
                <span className="font-bold text-slate-800">{selectedProduct.currentStock} Units</span>
              </div>
              <div>
                <span className="text-slate-500">Projected Balance: </span>
                <span className="font-bold text-indigo-600">
                  {formData.movementType === 'IN'
                    ? selectedProduct.currentStock + formData.quantity
                    : Math.max(0, selectedProduct.currentStock - formData.quantity)}{' '}
                  Units
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason / Reference Note <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Received shipment from Pune Supplier (PO-2026-901)"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
