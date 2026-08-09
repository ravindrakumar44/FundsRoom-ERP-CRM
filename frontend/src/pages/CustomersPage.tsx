import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Building,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { CustomerService } from '../services/customer.service';
import { Customer, CustomerType, CustomerStatus } from '../types';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const customerFormSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  businessName: z.string().optional(),
  mobile: z
    .string()
    .min(8, 'Mobile number must be at least 8 digits')
    .regex(/^[0-9+ -]{8,16}$/, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN (e.g. 27AABCA1234F1Z5)')
    .optional()
    .or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  status: z.enum(['ACTIVE', 'LEAD', 'INACTIVE']),
  address: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormInputs = z.infer<typeof customerFormSchema>;

export const CustomersPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormInputs>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerName: '',
      businessName: '',
      mobile: '',
      email: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      status: 'ACTIVE',
      address: '',
      followUpDate: '',
      notes: '',
    },
  });

  const fetchCustomers = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await CustomerService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        customerType: customerType || undefined,
        status: status || undefined,
      });
      const items = res?.data || (Array.isArray(res) ? res : []);
      setCustomers(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search, customerType, status]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    reset({
      customerName: '',
      businessName: '',
      mobile: '',
      email: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      status: 'ACTIVE',
      address: '',
      followUpDate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    reset({
      customerName: c.customerName,
      businessName: c.businessName || '',
      mobile: c.mobile,
      email: c.email || '',
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      status: c.status,
      address: c.address || '',
      followUpDate: c.followUpDate ? new Date(c.followUpDate).toISOString().split('T')[0] : '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const onFormSubmit = async (data: CustomerFormInputs) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : null,
      };

      if (editingCustomer) {
        await CustomerService.update(editingCustomer.id, payload);
        success(`Customer "${data.customerName}" updated successfully`, 'Customer Updated');
      } else {
        await CustomerService.create(payload);
        success(`Customer "${data.customerName}" registered successfully`, 'Customer Added');
      }

      setIsModalOpen(false);
      fetchCustomers(pagination.currentPage);
    } catch (err: any) {
      error(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    setIsSubmitting(true);
    try {
      await CustomerService.delete(deletingCustomer.id);
      success(`Customer "${deletingCustomer.customerName}" removed`, 'Deleted');
      setDeletingCustomer(null);
      fetchCustomers(pagination.currentPage);
    } catch (err: any) {
      error(err.message || 'Failed to delete customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCustomerType('');
    setStatus('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer CRM Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain customer directories, B2B wholesale accounts, GSTIN coordinates, and sales follow-ups.
          </p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Add New Customer
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, business, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Account Types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="LEAD">Lead</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {(search || customerType || status) && (
              <Button size="sm" variant="ghost" onClick={handleClearFilters} title="Clear Filters">
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Customers Table (Responsive Desktop Table / Mobile Cards) */}
      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Customers Found"
            description={
              search || customerType || status
                ? 'Try adjusting your search query or filters to find what you need.'
                : 'Get started by creating your first wholesale or retail customer account.'
            }
            actionLabel={hasRole('ADMIN', 'SALES') ? 'Add Customer' : undefined}
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Customer & Entity</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Type / Segment</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Next Follow-Up</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="cursor-pointer group"
                      >
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {c.customerName}
                        </p>
                        {c.businessName && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            {c.businessName}
                          </p>
                        )}
                        {c.gstNumber && (
                          <span className="inline-block font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1">
                            GSTIN: {c.gstNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.mobile}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[160px]">{c.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={c.customerType} />
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="px-6 py-4 text-xs">
                      {c.followUpDate ? (
                        <div className="flex items-center gap-1.5 font-semibold text-indigo-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(c.followUpDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/customers/${c.id}`)}
                          title="View Profile & CRM Activity"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </Button>

                        {hasRole('ADMIN', 'SALES') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4 text-slate-600" />
                          </Button>
                        )}

                        {hasRole('ADMIN') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingCustomer(c)}
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={(page) => fetchCustomers(page)} />
      </Card>

      {/* Add / Edit Customer Modal using React Hook Form + Zod */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Information' : 'Add New Customer Profile'}
        subtitle="Manage contact coordinates, GST registration, and customer classification"
        maxWidth="2xl"
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
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('customerName')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.customerName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
                placeholder="e.g. Rajesh Kulkarni"
              />
              {errors.customerName && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.customerName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Business / Company Name
              </label>
              <input
                type="text"
                {...register('businessName')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Apex Industrial Supplies Pvt Ltd"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                {...register('mobile')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.mobile ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
                placeholder="+91 98200 12345"
              />
              {errors.mobile && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.mobile.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
                placeholder="buyer@company.com"
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Type
              </label>
              <select
                {...register('customerType')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="RETAIL">Retail</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="LEAD">Lead</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                GST Number
              </label>
              <input
                type="text"
                {...register('gstNumber')}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.gstNumber ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                }`}
                placeholder="27AABCA1234F1Z5"
              />
              {errors.gstNumber && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.gstNumber.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Billing & Delivery Address
            </label>
            <textarea
              rows={2}
              {...register('address')}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Plot No, Industrial Area, City, State, PIN"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Next Scheduled Follow-Up
              </label>
              <input
                type="date"
                {...register('followUpDate')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Internal Account Notes
              </label>
              <input
                type="text"
                {...register('notes')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Bulk buyer for western region"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDelete}
        title="Delete Customer Profile"
        message={`Are you sure you want to permanently delete customer "${deletingCustomer?.customerName}"? This action cannot be undone.`}
        confirmText="Delete Customer"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
