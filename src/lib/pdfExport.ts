import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type ObligationRow = Database['public']['Tables']['obligations']['Row'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];

const categoryLabels: Record<string, string> = {
  'tax_financial': 'Fiscale & Finanziario',
  'licenses_permits': 'Licenze & Permessi',
  'regulatory_legal': 'Normativo & Legale',
};

const statusLabels: Record<string, string> = {
  'pending': 'In Attesa',
  'in_progress': 'In Corso',
  'completed': 'Completato',
  'overdue': 'Scaduto',
};

const riskLabels: Record<string, string> = {
  'low': 'Basso',
  'medium': 'Medio',
  'high': 'Alto',
};

export function generateComplianceReport(
  obligations: ObligationRow[],
  company?: CompanyRow | null,
  reportTitle: string = 'Report Compliance'
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 64, 175);
  doc.text(reportTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Company info
  if (company) {
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(company.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    if (company.registration_number) {
      doc.setFontSize(10);
      doc.text(`P.IVA: ${company.registration_number}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }
  }

  // Date
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generato il ${format(new Date(), 'dd MMMM yyyy', { locale: it })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Summary stats
  const total = obligations.length;
  const completed = obligations.filter(o => o.status === 'completed').length;
  const overdue = obligations.filter(o => o.status === 'overdue').length;
  const pending = obligations.filter(o => o.status === 'pending').length;
  const highRisk = obligations.filter(o => o.risk_level === 'high').length;

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Riepilogo', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const summaryData = [
    ['Totale Obblighi', total.toString()],
    ['Completati', completed.toString()],
    ['In Attesa', pending.toString()],
    ['Scaduti', overdue.toString()],
    ['Alto Rischio', highRisk.toString()],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 30 },
    },
    margin: { left: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Obligations by status
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Dettaglio Obblighi', 14, yPos);
  yPos += 8;

  const tableData = obligations.map(obl => [
    obl.title,
    categoryLabels[obl.category] || obl.category,
    format(parseISO(obl.deadline), 'dd/MM/yyyy'),
    statusLabels[obl.status] || obl.status,
    riskLabels[obl.risk_level || 'medium'] || obl.risk_level,
    obl.assigned_to || '-',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Titolo', 'Categoria', 'Scadenza', 'Stato', 'Rischio', 'Assegnato']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
    },
  });

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Pagina ${i} di ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadComplianceReport(
  obligations: ObligationRow[],
  company?: CompanyRow | null,
  filename?: string
) {
  const doc = generateComplianceReport(obligations, company);
  const defaultFilename = `report_compliance_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename || defaultFilename);
}

export function generateRiskReport(
  obligations: ObligationRow[],
  company?: CompanyRow | null
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(185, 28, 28);
  doc.text('Report Indicatori di Rischio', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  if (company) {
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(company.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generato il ${format(new Date(), 'dd MMMM yyyy', { locale: it })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Risk breakdown
  const riskCounts = {
    high: obligations.filter(o => o.risk_level === 'high').length,
    medium: obligations.filter(o => o.risk_level === 'medium').length,
    low: obligations.filter(o => o.risk_level === 'low').length,
  };

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Distribuzione Rischio', 14, yPos);
  yPos += 8;

  const totalObls = obligations.length || 1;
  autoTable(doc, {
    startY: yPos,
    head: [['Livello Rischio', 'Numero Obblighi', 'Percentuale']],
    body: [
      ['Alto', riskCounts.high.toString(), `${((riskCounts.high / totalObls) * 100).toFixed(1)}%`],
      ['Medio', riskCounts.medium.toString(), `${((riskCounts.medium / totalObls) * 100).toFixed(1)}%`],
      ['Basso', riskCounts.low.toString(), `${((riskCounts.low / totalObls) * 100).toFixed(1)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [185, 28, 28], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // High risk obligations detail
  const highRiskObligations = obligations.filter(
    o => o.risk_level === 'high'
  );

  if (highRiskObligations.length > 0) {
    doc.setFontSize(12);
    doc.text('Obblighi ad Alto Rischio', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Titolo', 'Scadenza', 'Stato', 'Rischio']],
      body: highRiskObligations.map(o => [
        o.title,
        format(parseISO(o.deadline), 'dd/MM/yyyy'),
        statusLabels[o.status] || o.status,
        riskLabels[o.risk_level || 'medium'],
      ]),
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4 },
    });
  }

  return doc;
}

export function downloadRiskReport(
  obligations: ObligationRow[],
  company?: CompanyRow | null,
  filename?: string
) {
  const doc = generateRiskReport(obligations, company);
  const defaultFilename = `report_rischio_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename || defaultFilename);
}
