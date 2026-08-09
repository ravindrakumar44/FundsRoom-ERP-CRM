import React from 'react';
import { Challan } from '../../types';
import { Layers } from 'lucide-react';

interface ChallanPrintViewProps {
  challan: Challan;
}

export const ChallanPrintView: React.FC<ChallanPrintViewProps> = ({ challan }) => {
  return (
    <div id="printable-challan" className="p-8 bg-white border border-slate-200 text-slate-800 font-sans text-xs">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-wider text-slate-900">NEXORA ENTERPRISES</h1>
          </div>
          <p className="text-slate-500 text-[11px]">Industrial Automation, Motors & Supplies Distribution</p>
          <p className="text-slate-500 text-[11px]">Plot 100, Central Industrial Corridor, Mumbai 400001</p>
          <p className="text-slate-600 font-semibold text-[11px] mt-1">GSTIN: 27AAAAA0000A1Z5 | PAN: AAAAA0000A</p>
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-sm rounded tracking-wider mb-2">
            DELIVERY CHALLAN
          </span>
          <p className="font-bold text-slate-900 text-sm">Challan #: {challan.challanNumber}</p>
          <p className="text-slate-600">Date: {new Date(challan.createdAt).toLocaleDateString('en-IN')}</p>
          <p className="text-slate-600 uppercase font-semibold">Status: {challan.status}</p>
        </div>
      </div>

      {/* Customer / Consignee Details */}
      <div className="grid grid-cols-2 gap-8 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
            Consignee / Deliver To:
          </h3>
          <p className="font-bold text-sm text-slate-900">{challan.customer?.customerName}</p>
          {challan.customer?.businessName && (
            <p className="font-medium text-slate-700">{challan.customer.businessName}</p>
          )}
          <p className="text-slate-600 mt-1">Mobile: {challan.customer?.mobile}</p>
          {challan.customer?.email && <p className="text-slate-600">Email: {challan.customer.email}</p>}
          <p className="text-slate-600">GSTIN: {challan.customer?.gstNumber || 'Unregistered'}</p>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Delivery Address:</h3>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {challan.customer?.address || 'Standard Delivery Location as per PO'}
          </p>
        </div>
      </div>

      {/* Item Table */}
      <table className="w-full border-collapse border border-slate-300 mb-6 text-left">
        <thead>
          <tr className="bg-slate-100 text-slate-900">
            <th className="border border-slate-300 p-2 text-center w-10 font-bold">#</th>
            <th className="border border-slate-300 p-2 font-bold">Product Description</th>
            <th className="border border-slate-300 p-2 font-bold w-36">SKU / Code</th>
            <th className="border border-slate-300 p-2 text-center w-16 font-bold">Qty</th>
            <th className="border border-slate-300 p-2 text-right w-28 font-bold">Unit Price (₹)</th>
            <th className="border border-slate-300 p-2 text-right w-32 font-bold">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {(challan.items || []).map((item, idx) => (
            <tr key={item.id} className="border-b border-slate-200">
              <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
              <td className="border border-slate-300 p-2 font-medium">{item.productNameSnapshot}</td>
              <td className="border border-slate-300 p-2 font-mono text-[11px] text-slate-600">
                {item.skuSnapshot}
              </td>
              <td className="border border-slate-300 p-2 text-center font-bold">{item.quantity}</td>
              <td className="border border-slate-300 p-2 text-right">
                ₹{Number(item.unitPriceSnapshot).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="border border-slate-300 p-2 text-right font-semibold">
                ₹{(Number(item.unitPriceSnapshot) * item.quantity).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 font-bold">
            <td colSpan={3} className="border border-slate-300 p-2 text-right">
              Total:
            </td>
            <td className="border border-slate-300 p-2 text-center">{challan.totalQuantity}</td>
            <td className="border border-slate-300 p-2 text-right">Grand Total:</td>
            <td className="border border-slate-300 p-2 text-right text-indigo-700 text-sm">
              ₹{Number(challan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Notes / Remarks */}
      {challan.notes && (
        <div className="mb-8 p-3 bg-amber-50/60 border border-amber-200 rounded">
          <p className="font-bold text-amber-900 text-[11px] mb-0.5">Dispatch Instructions / Remarks:</p>
          <p className="text-amber-800 text-[11px]">{challan.notes}</p>
        </div>
      )}

      {/* Terms & Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-12 border-t border-slate-300 mt-12 text-slate-600">
        <div>
          <p className="font-bold text-slate-800 mb-1">Terms & Conditions:</p>
          <ol className="list-decimal list-inside text-[10px] space-y-0.5">
            <li>Goods once dispatched are subject to standard delivery terms.</li>
            <li>Any discrepancy must be reported within 24 hours of delivery.</li>
            <li>This delivery challan is not a tax invoice.</li>
          </ol>
          <div className="mt-12 border-t border-slate-400 w-48 pt-1">
            <p className="text-slate-800 font-semibold text-[11px]">Receiver's Signature & Stamp</p>
          </div>
        </div>

        <div className="text-right flex flex-col justify-end items-end">
          <p className="font-bold text-slate-900 mb-12">For NEXORA ENTERPRISES</p>
          <div className="border-t border-slate-400 w-48 pt-1 text-center">
            <p className="text-slate-800 font-semibold text-[11px]">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};
