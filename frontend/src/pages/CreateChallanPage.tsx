import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  Building,
  MapPin,
} from 'lucide-react';
import { CustomerService } from '../services/customer.service';
import { ProductService } from '../services/product.service';
import { ChallanService } from '../services/challan.service';
import { Customer, Product, ChallanStatus } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

interface LineItemRow {
  productId: string;
  quantity: number;
}

export const CreateChallanPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItemRow[]>([
    { productId: '', quantity: 1 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          CustomerService.getAll({ limit: 100 }),
          ProductService.getAll({ limit: 100 }),
        ]);
        const custList = custRes?.data || (Array.isArray(custRes) ? custRes : []);
        const prodList = prodRes?.data || (Array.isArray(prodRes) ? prodRes : []);
        setCustomers(custList);
        setProducts(prodList);

        if (custList.length > 0) {
          setCustomerId(custList[0].id);
        }
        if (prodList.length > 0) {
          setItems([{ productId: prodList[0].id, quantity: 1 }]);
        }
      } catch (err: any) {
        error(err.message || 'Failed to load customers or products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems((prev) => [...prev, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Calculate Totals & Stock Verification
  let totalQty = 0;
  let grandTotal = 0;
  let hasStockError = false;

  const resolvedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const unitPrice = product ? Number(product.unitPrice) : 0;
    const lineTotal = unitPrice * item.quantity;
    const isInsufficient = product ? item.quantity > product.currentStock : false;

    if (isInsufficient) {
      hasStockError = true;
    }

    totalQty += item.quantity;
    grandTotal += lineTotal;

    return {
      ...item,
      product,
      unitPrice,
      lineTotal,
      isInsufficient,
    };
  });

  const handleSubmit = async (targetStatus: ChallanStatus) => {
    if (!customerId) {
      error('Please select a customer for this delivery challan');
      return;
    }
    if (items.length === 0 || items.some((it) => !it.productId || it.quantity <= 0)) {
      error('Please ensure all product lines have valid quantities');
      return;
    }
    if (targetStatus === 'CONFIRMED' && hasStockError) {
      error('Cannot confirm challan with items exceeding available warehouse stock!');
      return;
    }

    setIsSubmitting(true);
    try {
      const challan = await ChallanService.create({
        customerId,
        status: targetStatus,
        notes: notes || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      });

      success(
        targetStatus === 'CONFIRMED'
          ? `Delivery Challan ${challan.challanNumber} confirmed & stock deducted!`
          : `Draft Delivery Challan ${challan.challanNumber} saved.`,
        'Challan Created'
      );
      navigate(`/challans/${challan.id}`);
    } catch (err: any) {
      error(err.message || 'Failed to create delivery challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading delivery challan builder...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/challans')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challans</span>
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSubmit('DRAFT')}
            isLoading={isSubmitting}
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit('CONFIRMED')}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm & Dispatch Now
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader
          title="Create New Delivery Challan"
          subtitle="Generate an official dispatch document with automatic inventory synchronization"
        />
        <CardBody className="space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Consignee / Customer <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} {c.businessName ? `(${c.businessName})` : ''} — {c.mobile}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="text-xs text-slate-600 space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">{selectedCustomer.customerName}</p>
                {selectedCustomer.businessName && (
                  <p className="text-slate-700 font-medium">{selectedCustomer.businessName}</p>
                )}
                <p className="text-slate-500">Mobile: {selectedCustomer.mobile}</p>
                <p className="text-slate-500">GSTIN: {selectedCustomer.gstNumber || 'Unregistered'}</p>
                <p className="text-slate-600 truncate mt-1">
                  Deliver To: {selectedCustomer.address || 'Standard Warehouse'}
                </p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Line Items for Dispatch
              </h3>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAddItem}
              >
                Add Product Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/2">Product Item</th>
                    <th className="px-4 py-3 text-center w-28">Available</th>
                    <th className="px-4 py-3 text-center w-28">Quantity</th>
                    <th className="px-4 py-3 text-right w-36">Unit Price (₹)</th>
                    <th className="px-4 py-3 text-right w-36">Line Total (₹)</th>
                    <th className="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {resolvedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      {/* Product Selector */}
                      <td className="px-4 py-3">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.productName} ({p.sku}) — ₹{Number(p.unitPrice).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                        {item.isInsufficient && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Exceeds stock! ({item.product?.currentStock || 0} in warehouse)
                          </p>
                        )}
                      </td>

                      {/* Available Stock */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            (item.product?.currentStock || 0) <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.product?.currentStock || 0}
                        </span>
                      </td>

                      {/* Quantity Input */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-20 px-2.5 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Line Total */}
                      <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                        ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Remove Button */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table Footer Totals */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Total Items: <span className="font-bold text-slate-800">{items.length}</span> lines (
                  <span className="font-bold text-slate-800">{totalQty}</span> units total)
                </div>

                <div className="text-right flex items-baseline gap-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Grand Total Amount:
                  </span>
                  <span className="text-2xl font-extrabold text-indigo-700">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Dispatch Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Dispatch Instructions / Transport Reference Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched via BlueDart Express (Tracking # BD-98212). Vehicle No: MH-04-AB-1234."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/challans')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit('DRAFT')}
              isLoading={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit('CONFIRMED')}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Deduct Stock
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
