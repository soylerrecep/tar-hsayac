import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Vehicle, FuelLog, MaintenanceLog, OdometerLog } from '../types';

// Helper to sanitize Turkish characters for standard PDF Helvetica font
const sanitizeTurkish = (text: string | number | undefined | null): string => {
  if (text === undefined || text === null) return '';
  const str = String(text);
  const map: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };
  return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m] || m);
};

const formatDate = (isoString?: string) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('tr-TR');
  } catch {
    return isoString;
  }
};

const SERVICE_TYPE_NAMES: Record<string, string> = {
  periyodik: 'Periyodik Bakim',
  yag: 'Yag & Filtre',
  fren: 'Fren & Balata',
  lastik: 'Lastik & Balans',
  aku: 'Aku & Elektrik',
  muayene: 'TUVTURK Muayene',
  ariza: 'Ariza Onarim',
  diger: 'Genel Bakim',
};

const FUEL_TYPE_NAMES: Record<string, string> = {
  benzin: 'Benzin',
  dizel: 'Dizel',
  lpg: 'LPG',
  elektrik: 'Elektrik',
  hibrit: 'Hibrit',
};

export const generateVehiclePdfReport = (
  vehicle: Vehicle,
  fuelLogs: FuelLog[],
  maintLogs: MaintenanceLog[],
  odometerLogs: OdometerLog[],
  stats: {
    totalExpenses: number;
    totalLiters: number;
    avgConsumption: number | null;
    avgCostPerKm: number | null;
  }
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const activeFuel = fuelLogs.filter((f) => f.vehicleId === vehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activeMaint = maintLogs.filter((m) => m.vehicleId === vehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activeOdo = odometerLogs.filter((o) => o.vehicleId === vehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFuelCost = activeFuel.reduce((a, b) => a + b.totalCost, 0);
  const totalMaintCost = activeMaint.reduce((a, b) => a + b.cost, 0);

  // Document Title Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(sanitizeTurkish(`${vehicle.brand} ${vehicle.model} - ARAÇ RAPORU`), 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(sanitizeTurkish(`Plaka: ${vehicle.plateNumber}  |  Yil: ${vehicle.year}  |  Mevcut KM: ${vehicle.currentOdometer.toLocaleString('tr-TR')} KM`), 14, 26);
  doc.text(sanitizeTurkish(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`), 14, 32);

  let currentY = 46;

  // Overview Stats Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 28, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizeTurkish('Ozet Istatistikler'), 18, currentY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const col1 = `Bakim & Onarim Harcamasi: TL ${totalMaintCost.toLocaleString('tr-TR')} (${activeMaint.length} Kayit)`;
  const col2 = `Yakit Harcamasi (Ayri): TL ${totalFuelCost.toLocaleString('tr-TR')} (${activeFuel.length} Alim)`;
  const col3 = `Ort. Tuketim: ${stats.avgConsumption !== null ? `${stats.avgConsumption.toFixed(1)} L/100km` : '-'}`;
  const col4 = `KM Basi Yakit: ${stats.avgCostPerKm !== null ? `TL ${stats.avgCostPerKm.toFixed(2)} / KM` : '-'}`;

  doc.text(sanitizeTurkish(col1), 18, currentY + 15);
  doc.text(sanitizeTurkish(col2), 18, currentY + 21);
  doc.text(sanitizeTurkish(`${col3}   |   ${col4}`), 105, currentY + 15);

  currentY += 34;

  // Profit/Loss & Alternative Travel Box if purchase info exists
  if (vehicle.purchaseOdometer !== undefined || vehicle.currentMarketValue !== undefined) {
    const distanceCovered = Math.max(0, vehicle.currentOdometer - (vehicle.purchaseOdometer || 0));
    const altRate = vehicle.alternativeCostPerKm || 10;
    const altTotal = distanceCovered * altRate;
    const effectiveFuelRate = vehicle.averageFuelCostPerKm || (stats as any).effectiveFuelCostPerKm || 2.75;
    const calculatedFuel = distanceCovered * effectiveFuelRate;
    const directCost = calculatedFuel + totalMaintCost;
    const savings = altTotal - directCost;

    doc.setDrawColor(147, 51, 234);
    doc.setFillColor(250, 245, 255);
    doc.roundedRect(14, currentY, 182, 22, 3, 3, 'FD');

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(88, 28, 135);
    doc.text(sanitizeTurkish('Finansal Kar / Zarar & Arabasiz Alternatif Ulasim Analizi'), 18, currentY + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const p1 = `Alis KM: ${vehicle.purchaseOdometer ? vehicle.purchaseOdometer.toLocaleString('tr-TR') : '-'} KM  |  Katedilen: ${distanceCovered.toLocaleString('tr-TR')} KM  |  Ort. Yakit: TL ${effectiveFuelRate.toFixed(2)}/KM  |  Guncel Deger: ${vehicle.currentMarketValue ? `TL ${vehicle.currentMarketValue.toLocaleString('tr-TR')}` : '-'}`;
    const p2 = `Firsat Maliyeti (Alternatif Ulasim TL ${altRate}/KM): TL ${altTotal.toLocaleString('tr-TR')}  |  Arac Masrafi: TL ${directCost.toLocaleString('tr-TR')}  |  Net Ekonomik Durum: ${savings >= 0 ? `+TL ${savings.toLocaleString('tr-TR')} EKONOMIK KAR` : `-TL ${Math.abs(savings).toLocaleString('tr-TR')} ZARAR`}`;
    doc.text(sanitizeTurkish(p1), 18, currentY + 12);
    doc.text(sanitizeTurkish(p2), 18, currentY + 17.5);

    currentY += 28;
  }

  // 1. Maintenance Logs Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizeTurkish(`1. BAKIM & SERVIS GECMISI (${activeMaint.length})`), 14, currentY);
  currentY += 4;

  const maintTableBody = activeMaint.map((m) => {
    const combinedNotes = [m.partsReplaced, m.notes].filter(Boolean).join('\n') || '-';
    const nextServ = m.nextServiceKm ? `${m.nextServiceKm.toLocaleString('tr-TR')} KM` : formatDate(m.nextServiceDate);
    return [
      formatDate(m.date),
      `${sanitizeTurkish(m.title)}\n[${sanitizeTurkish(SERVICE_TYPE_NAMES[m.serviceType] || m.serviceType)}]`,
      `${m.odometer ? m.odometer.toLocaleString('tr-TR') : '-'} KM`,
      `TL ${m.cost.toLocaleString('tr-TR')}`,
      sanitizeTurkish(combinedNotes),
      sanitizeTurkish(nextServ),
      sanitizeTurkish(m.provider || '-'),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[
      sanitizeTurkish('Tarih'),
      sanitizeTurkish('Islem / Tur'),
      sanitizeTurkish('KM'),
      sanitizeTurkish('Tutar'),
      sanitizeTurkish('Degisen Parcalar, Aciklama & Notlar'),
      sanitizeTurkish('Sonraki Servis'),
      sanitizeTurkish('Servis / Usta'),
    ]],
    body: maintTableBody.length > 0 ? maintTableBody : [[sanitizeTurkish('Kayit bulunamadi'), '-', '-', '-', '-', '-', '-']],
    styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 32 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 60 },
      5: { cellWidth: 22 },
      6: { cellWidth: 18 },
    },
    margin: { left: 12, right: 12 },
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Check page overflow
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // 2. Fuel Logs Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizeTurkish(`2. YAKIT ALIM GECMISI (${activeFuel.length})`), 14, currentY);
  currentY += 4;

  // Calculate distance differences between consecutive fuel fill-ups
  const fuelChronAsc = [...activeFuel].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.odometer - b.odometer);
  const fuelDiffMap = new Map<string, number | null>();
  for (let i = 0; i < fuelChronAsc.length; i++) {
    if (i > 0) {
      const diff = fuelChronAsc[i].odometer - fuelChronAsc[i - 1].odometer;
      fuelDiffMap.set(fuelChronAsc[i].id, diff > 0 ? diff : null);
    }
  }

  const fuelTableBody = activeFuel.map((f) => {
    const pricePerL = f.pricePerLiter || (f.fuelLiters > 0 ? f.totalCost / f.fuelLiters : 0);
    const diff = fuelDiffMap.get(f.id);
    const kmText = diff ? `${f.odometer.toLocaleString('tr-TR')} KM\n(+${diff.toLocaleString('tr-TR')} KM)` : `${f.odometer.toLocaleString('tr-TR')} KM`;
    return [
      formatDate(f.date),
      kmText,
      `${f.fuelLiters} L`,
      `TL ${pricePerL.toFixed(2)}`,
      `TL ${f.totalCost.toLocaleString('tr-TR')}`,
      f.isFullTank ? 'Depo Full' : 'Kısmi',
      sanitizeTurkish(f.station || f.notes || '-'),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[
      sanitizeTurkish('Tarih'),
      sanitizeTurkish('KM'),
      sanitizeTurkish('Litre'),
      sanitizeTurkish('Birim Fiyat'),
      sanitizeTurkish('Toplam TL'),
      sanitizeTurkish('Durum'),
      sanitizeTurkish('Istasyon / Not'),
    ]],
    body: fuelTableBody.length > 0 ? fuelTableBody : [[sanitizeTurkish('Kayit bulunamadi'), '-', '-', '-', '-', '-', '-']],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [254, 243, 199] },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Check page overflow
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // 3. Odometer History Table
  if (activeOdo.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(sanitizeTurkish(`3. KM GUNCELLEME GECMISI (${activeOdo.length})`), 14, currentY);
    currentY += 4;

    const odoTableBody = activeOdo.map((o) => [
      formatDate(o.date),
      `${o.odometer.toLocaleString('tr-TR')} KM`,
      sanitizeTurkish(o.notes || '-'),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [[
        sanitizeTurkish('Tarih'),
        sanitizeTurkish('KM Değeri'),
        sanitizeTurkish('Aciklama / Not'),
      ]],
      body: odoTableBody,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      margin: { left: 14, right: 14 },
    });
  }

  // Save the PDF file
  const fileName = `${vehicle.plateNumber.replace(/\s+/g, '_')}_Arac_Raporu.pdf`;
  doc.save(fileName);
};
