import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ChallanService } from '../services/challan.service';
import { Challan } from '../types';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ChallanPrintView } from '../components/challan/ChallanPrintView';
import { exportChallanToPdf } from '../components/challan/ChallanPdfExport';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const fetchChallan = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await ChallanService.getById(id);
      setChallan(data);
    } catch (err: any) {
      error(err.message || 'Failed to fetch challan details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!challan) return;
    try {
      exportChallanToPdf(challan);
      success('Delivery challan PDF downloaded successfully', 'PDF Generated');
    } catch (err: any) {
      error(err.message || 'Failed to generate PDF');
    }
  };

  const handleConfirmChallan = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const updated = await ChallanService.confirm(id);
      setChallan(updated);
      success(
        `Delivery Challan ${updated.challanNumber} confirmed! Warehouse inventory deducted.`,
        'Challan Confirmed'
      );
      setIsConfirmDialogOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to confirm challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelChallan = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const updated = await ChallanService.cancel(id);
      setChallan(updated);
      success(
        `Delivery Challan ${updated.challanNumber} cancelled. Any reserved stock restored.`,
        'Challan Cancelled'
      );
      setIsCancelDialogOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to cancel challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading delivery challan...</div>;
  }

  if (!challan) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800">Challan Not Found</h3>
        <Button className="mt-4" onClick={() => navigate('/challans')}>
          Back to Challans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar with Actions (Hidden in Print Mode) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/challans')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challans List</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Print Button */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print Challan
          </Button>

          {/* Download PDF Button */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownloadPdf}
          >
            Download PDF
          </Button>

          {/* Confirm Action (for Drafts) */}
          {challan.status === 'DRAFT' && hasRole('ADMIN', 'SALES') && (
            <Button
              variant="success"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              Confirm Dispatch
            </Button>
          )}

          {/* Cancel Action */}
          {challan.status !== 'CANCELLED' && hasRole('ADMIN', 'SALES') && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle className="w-4 h-4" />}
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Cancel Challan
            </Button>
          )}
        </div>
      </div>

      {/* Main Delivery Challan Viewport */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
        <ChallanPrintView challan={challan} />
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmChallan}
        title="Confirm Delivery Challan"
        message={`Confirming challan ${challan.challanNumber} will immediately deduct all line item quantities from warehouse stock and record immutable OUT stock movements. Proceed?`}
        confirmText="Confirm & Deduct Stock"
        variant="primary"
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelChallan}
        title="Cancel Delivery Challan"
        message={`Are you sure you want to cancel challan ${challan.challanNumber}? ${
          challan.status === 'CONFIRMED'
            ? 'All deducted item quantities will be restored back to inventory.'
            : ''
        }`}
        confirmText="Cancel Challan"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
