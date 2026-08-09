import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { CustomerService } from '../services/customer.service';
import { ChallanService } from '../services/challan.service';
import { Customer, FollowUp, Challan } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Follow-up Modal State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomerDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [custData, followUpData, challanData] = await Promise.all([
        CustomerService.getById(id),
        CustomerService.getFollowUps(id).catch(() => []),
        ChallanService.getAll({ customerId: id, limit: 10 }).catch(() => ({ data: [] })),
      ]);
      setCustomer(custData);
      setFollowUps(Array.isArray(followUpData) ? followUpData : ((followUpData as any)?.data || []));
      setChallans(challanData?.data || (Array.isArray(challanData) ? challanData : []));
    } catch (err: any) {
      error(err.message || 'Failed to fetch customer profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !note) return;
    setIsSubmitting(true);
    try {
      await CustomerService.createFollowUp(id, note, new Date(followUpDate).toISOString());
      // Also update customer's followUpDate
      await CustomerService.update(id, {
        followUpDate: new Date(followUpDate).toISOString(),
        notes: note,
      });

      success('Follow-up activity recorded and schedule updated', 'Follow-up Logged');
      setIsFollowUpModalOpen(false);
      setNote('');
      fetchCustomerDetails();
    } catch (err: any) {
      error(err.message || 'Failed to record follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800">Customer Not Found</h3>
        <Button className="mt-4" onClick={() => navigate('/customers')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>

        {hasRole('ADMIN', 'SALES') && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Calendar className="w-4 h-4" />}
              onClick={() => setIsFollowUpModalOpen(true)}
            >
              Log CRM Follow-up
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => navigate('/challans/new')}
            >
              New Delivery Challan
            </Button>
          </div>
        )}
      </div>

      {/* Customer Header Card */}
      <Card className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-0 shadow-xl">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{customer.customerName}</h1>
                <StatusBadge status={customer.customerType} />
                <StatusBadge status={customer.status} />
              </div>

              {customer.businessName && (
                <p className="text-indigo-200 text-sm font-medium flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  {customer.businessName}
                </p>
              )}

              {customer.gstNumber && (
                <p className="text-xs text-slate-300 font-mono">GSTIN: {customer.gstNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-300">Total Challans</p>
                <p className="text-xl font-bold mt-0.5">{challans.length}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-300">Next Follow-Up</p>
                <p className="text-sm font-semibold mt-1 text-indigo-300">
                  {customer.followUpDate
                    ? new Date(customer.followUpDate).toLocaleDateString('en-IN')
                    : 'Not Scheduled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Coordinates & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account Details" />
            <CardBody className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Mobile Contact
                </p>
                <a
                  href={`tel:${customer.mobile}`}
                  className="font-medium text-slate-800 flex items-center gap-2 hover:text-indigo-600 transition-colors"
                >
                  <Phone className="w-4 h-4 text-indigo-600" />
                  {customer.mobile}
                </a>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </p>
                {customer.email ? (
                  <a
                    href={`mailto:${customer.email}`}
                    className="font-medium text-slate-800 flex items-center gap-2 hover:text-indigo-600 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-indigo-600" />
                    {customer.email}
                  </a>
                ) : (
                  <p className="text-slate-400">—</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Dispatch Address
                </p>
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{customer.address || 'Standard Location'}</p>
                </div>
              </div>

              {customer.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                  <p className="text-xs font-bold text-amber-900 mb-0.5">Account Notes:</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{customer.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: CRM Follow-Up Activity & Delivery History */}
        <div className="lg:col-span-2 space-y-6">
          {/* CRM Follow-up Timeline */}
          <Card>
            <CardHeader
              title="CRM Follow-Up & Interaction History"
              subtitle="Track conversations, order inquiries, and sales touchpoints"
              action={
                hasRole('ADMIN', 'SALES') && (
                  <Button size="sm" variant="outline" onClick={() => setIsFollowUpModalOpen(true)}>
                    + Log Activity
                  </Button>
                )
              }
            />
            <CardBody>
              {followUps.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No previous follow-up notes logged for this customer.
                </p>
              ) : (
                <div className="space-y-4">
                  {followUps.map((fu) => (
                    <div
                      key={fu.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 leading-relaxed font-medium">{fu.note}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>Logged: {new Date(fu.createdAt).toLocaleDateString('en-IN')}</span>
                          <span>•</span>
                          <span className="font-medium text-indigo-600">
                            Target Date: {new Date(fu.followUpDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Delivery Challans History */}
          <Card>
            <CardHeader
              title="Customer Delivery Challans"
              subtitle="All dispatch records and fulfillment orders associated with this account"
            />
            {challans.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No delivery challans issued to this customer yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Challan #</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {challans.map((ch) => (
                      <tr key={ch.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-indigo-600">
                          {ch.challanNumber}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(ch.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={ch.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          ₹{Number(ch.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/challans/${ch.id}`)}
                          >
                            View →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Follow-up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Log CRM Interaction & Schedule Follow-Up"
        subtitle={`Recording touchpoint for ${customer.customerName}`}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsFollowUpModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddFollowUp} isLoading={isSubmitting}>
              Save Follow-up Note
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Follow-up Note / Discussion Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Discussed upcoming quarterly motor requirement; customer agreed to review quote by next Friday."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Next Scheduled Action Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
