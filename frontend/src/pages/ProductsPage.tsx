import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownUp,
  Edit2,
  Trash2,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { ProductService } from '../services/product.service';
import { Product } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const productFormSchema = z.object({
  productName: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU must be at least 2 characters').toUpperCase(),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  currentStock: z.coerce.number().int().min(0, 'Current stock cannot be negative'),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock cannot be negative'),
  warehouseLocation: z.string().optional(),
});

type ProductFormInputs = z.infer<typeof productFormSchema>;

export const ProductsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInputs>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productName: '',
      sku: '',
      category: 'Motors & Actuators',
      unitPrice: 1000,
      currentStock: 10,
      minimumStock: 10,
      warehouseLocation: 'Bay A, Rack 01',
    },
  });

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await ProductService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        category: category || undefined,
        lowStockOnly: stockStatusFilter === 'LOW_STOCK' ? 'true' : undefined,
      });

      let items = res?.data || (Array.isArray(res) ? res : []);
      if (stockStatusFilter === 'OUT_OF_STOCK') {
        items = items.filter((p) => p.currentStock <= 0);
      } else if (stockStatusFilter === 'IN_STOCK') {
        items = items.filter((p) => p.currentStock > p.minimumStock);
      }

      setProducts(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search, category, stockStatusFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    reset({
      productName: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Motors & Actuators',
      unitPrice: 1000,
      currentStock: 10,
      minimumStock: 10,
      warehouseLocation: 'Bay A, Rack 01',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    reset({
      productName: p.productName,
      sku: p.sku,
      category: p.category,
      unitPrice: Number(p.unitPrice),
      currentStock: p.currentStock,
      minimumStock: p.minimumStock,
      warehouseLocation: p.warehouseLocation || '',
    });
    setIsModalOpen(true);
  };

  const onFormSubmit = async (data: ProductFormInputs) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await ProductService.update(editingProduct.id, data);
        success(`Product "${data.productName}" updated in catalog`, 'Product Updated');
      } else {
        await ProductService.create(data);
        success(`Product "${data.productName}" created successfully`, 'Product Added');
      }

      setIsModalOpen(false);
      fetchProducts(pagination.currentPage);
    } catch (err: any) {
      error(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    try {
      await ProductService.delete(deletingProduct.id);
      success(`Product "${deletingProduct.productName}" removed from catalog`, 'Deleted');
      setDeletingProduct(null);
      fetchProducts(pagination.currentPage);
    } catch (err: any) {
      error(err.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setStockStatusFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock balance, minimum reorder thresholds, warehouse locations, and product pricing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasRole('ADMIN', 'WAREHOUSE') && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<ArrowDownUp className="w-4 h-4" />}
              onClick={() => navigate('/stock-movements')}
            >
              Stock Adjustments
            </Button>
          )}
          {hasRole('ADMIN', 'WAREHOUSE') && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="Motors & Actuators">Motors & Actuators</option>
              <option value="Electrical Automation">Electrical Automation</option>
              <option value="Pipes & Valves">Pipes & Valves</option>
              <option value="Testing & Instruments">Testing & Instruments</option>
              <option value="Pumps & Fluid Systems">Pumps & Fluid Systems</option>
              <option value="Safety & PPE">Safety & PPE</option>
              <option value="Pneumatics & Hydraulics">Pneumatics & Hydraulics</option>
            </select>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock Alert</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            {(search || category || stockStatusFilter !== 'ALL') && (
              <Button size="sm" variant="ghost" onClick={handleClearFilters} title="Clear Filters">
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading inventory catalog...</div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Products Found"
            description="Try adjusting your search criteria or add new items to the catalog."
            actionLabel={hasRole('ADMIN', 'WAREHOUSE') ? 'Add Product' : undefined}
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product & SKU</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Storage Location</th>
                  <th className="px-6 py-3.5 text-right">Unit Price (₹)</th>
                  <th className="px-6 py-3.5 text-center">Stock Balance</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{p.productName}</p>
                        <span className="font-mono text-xs text-slate-500 font-medium">{p.sku}</span>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant="purple">{p.category}</Badge>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500">
                        {p.warehouseLocation ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {p.warehouseLocation}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        ₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800 text-sm">{p.currentStock}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Min: {p.minimumStock}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasRole('ADMIN', 'WAREHOUSE') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(p)}
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4 text-slate-600" />
                            </Button>
                          )}

                          {hasRole('ADMIN') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingProduct(p)}
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={(page) => fetchProducts(page)} />
      </Card>

      {/* Add / Edit Product Modal using React Hook Form + Zod */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
        subtitle="Specify SKU, pricing, stock levels, and warehouse storage coordinates"
        maxWidth="xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onFormSubmit)}
              isLoading={isSubmitting}
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('productName')}
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                errors.productName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
              }`}
              placeholder="e.g. Heavy Duty Induction Motor 5HP"
            />
            {errors.productName && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.productName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                SKU / Part Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('sku')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.sku ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
                placeholder="MOT-5HP-01"
              />
              {errors.sku && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.sku.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('category')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.category ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
                placeholder="e.g. Electrical Automation"
              />
              {errors.category && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register('unitPrice')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.unitPrice ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
              {errors.unitPrice && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.unitPrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                {...register('currentStock')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.currentStock ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
              {errors.currentStock && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.currentStock.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Minimum Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                {...register('minimumStock')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.minimumStock ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
              {errors.minimumStock && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.minimumStock.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Warehouse Storage Location
            </label>
            <input
              type="text"
              {...register('warehouseLocation')}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Bay A, Rack 02-B"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deletingProduct?.productName}"?`}
        confirmText="Delete Product"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
