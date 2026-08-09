import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Challan } from '../../types';

export const exportChallanToPdf = (challan: Challan) => {
  const doc = new jsPDF();

  // Company Header
  doc.setFontSize(20);
  doc.setTextColor(30, 27, 75); // Dark Indigo
  doc.text('NEXORA ENTERPRISES', 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Industrial Automation, Motors & Supplies Hub', 14, 26);
  doc.text('GSTIN: 27AAAAA0000A1Z5 | PAN: AAAAA0000A', 14, 31);
  doc.text('Plot 100, Central Industrial Corridor, Mumbai 400001', 14, 36);

  // Document Title Pill
  doc.setDrawColor(99, 102, 241);
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(140, 14, 56, 12, 2, 2, 'FD');
  doc.setFontSize(11);
  doc.setTextColor(67, 56, 202);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY CHALLAN', 144, 22);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 42, 196, 42);

  // Challan & Customer Meta
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('CHALLAN DETAILS:', 14, 50);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Challan Number: ${challan.challanNumber}`, 14, 56);
  doc.text(`Date of Issue: ${new Date(challan.createdAt).toLocaleDateString('en-IN')}`, 14, 61);
  doc.text(`Status: ${challan.status}`, 14, 66);

  // Consignee Details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('CONSIGNEE (DELIVER TO):', 110, 50);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const custName = challan.customer?.customerName || 'N/A';
  const bizName = challan.customer?.businessName ? `(${challan.customer.businessName})` : '';
  doc.text(`${custName} ${bizName}`, 110, 56);
  doc.text(`Mobile: ${challan.customer?.mobile || 'N/A'}`, 110, 61);
  doc.text(`GSTIN: ${challan.customer?.gstNumber || 'Unregistered'}`, 110, 66);
  const address = challan.customer?.address || 'Standard Delivery Address';
  const splitAddress = doc.splitTextToSize(`Address: ${address}`, 86);
  doc.text(splitAddress, 110, 71);

  // Items Table
  const tableData = (challan.items || []).map((item, index) => [
    index + 1,
    item.productNameSnapshot || 'Product Item',
    item.skuSnapshot || '-',
    item.quantity,
    `₹${Number(item.unitPriceSnapshot).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    `₹${(Number(item.unitPriceSnapshot) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: 88,
    head: [['#', 'Description of Goods', 'SKU / Part Code', 'Qty', 'Unit Rate (₹)', 'Total Amount (₹)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 36, halign: 'right' },
    },
  });

  // Grand Totals Summary
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFillColor(248, 250, 252);
  doc.rect(120, finalY, 76, 24, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(120, finalY, 76, 24, 'D');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Quantity:`, 124, finalY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${challan.totalQuantity} Units`, 175, finalY + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text(`Total Value:`, 124, finalY + 16);
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  doc.text(`₹${Number(challan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 16, {
    align: 'right',
  });

  // Notes & Signatures
  const notesY = Math.max(finalY + 36, 230);

  if (challan.notes) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Dispatch Remarks / Instructions:', 14, notesY - 14);
    doc.setFont('helvetica', 'normal');
    doc.text(challan.notes, 14, notesY - 8);
  }

  // Signatures
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Receiver sign
  doc.line(14, notesY + 25, 75, notesY + 25);
  doc.text("Receiver's Signature & Stamp", 14, notesY + 30);

  // Authorized Signatory
  doc.line(135, notesY + 25, 196, notesY + 25);
  doc.text('For NEXORA ENTERPRISES', 135, notesY + 20);
  doc.text('Authorized Signatory', 135, notesY + 30);

  // Save the PDF
  doc.save(`${challan.challanNumber}_NEXORA.pdf`);
};
