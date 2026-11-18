import { jsPDF } from 'jspdf';
import { Athlete, AttendanceRecord, ClubMetadata } from '../types/club';
import {
  calculateAgeAndCategory,
  formatDateTR,
  getMonthDaysISO,
  getTodayISO,
  parseISODate,
  TURKISH_MONTHS,
} from './dateUtils';
import { clubDataService } from '../services/storageService';

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports monthly attendance matrix as UTF-8 BOM CSV (Excel Turkish-locale compatible with `;` delimiter).
 */
export function downloadMonthlyAttendanceCSV(params: {
  year: number;
  month: number;
  athletes: Athlete[];
  attendanceMap: Map<string, AttendanceRecord>;
  onlyRecordedDays: boolean;
  recordedDatesSet: Set<string>;
  clubName: string;
}): void {
  const { year, month, athletes, attendanceMap, onlyRecordedDays, recordedDatesSet, clubName } =
    params;
  const allMonthDays = getMonthDaysISO(year, month);
  const visibleDays = onlyRecordedDays
    ? allMonthDays.filter((d) => recordedDatesSet.has(d))
    : allMonthDays;

  const monthLabel = TURKISH_MONTHS[month - 1];

  const headerRow = [
    'Sporcu Adı Soyadı',
    'Kuşak',
    'Antrenman Grubu',
    ...visibleDays.map((iso) => String(parseISODate(iso).day)),
    'Toplam Gün',
    'Geldi (G)',
    'Gelmedi (X)',
    'İzinli (İ)',
    'Devam Yüzdesi (%)',
  ];

  const rows: string[][] = [
    [`${clubName} - ${monthLabel} ${year} Aylık Devam-Devamsızlık Çizelgesi`],
    [],
    headerRow,
  ];

  athletes.forEach((athlete) => {
    let gCount = 0;
    let xCount = 0;
    let iCount = 0;

    const dayCells = visibleDays.map((iso) => {
      const rec = attendanceMap.get(`${iso}_${athlete.id}`);
      if (!rec) return '-';
      if (rec.status === 'G') {
        gCount += 1;
        return 'G';
      }
      if (rec.status === 'X') {
        xCount += 1;
        return 'X';
      }
      iCount += 1;
      return 'İ';
    });

    const totalSessions = gCount + xCount + iCount;
    const rate = totalSessions > 0 ? Math.round((gCount / totalSessions) * 100) : 0;

    rows.push([
      athlete.fullName,
      athlete.beltLevel,
      athlete.trainingGroup,
      ...dayCells,
      String(totalSessions),
      String(gCount),
      String(xCount),
      String(iCount),
      `%${rate}`,
    ]);
  });

  const csvContent =
    '\uFEFF' + rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(';')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeMonth = String(month).padStart(2, '0');
  link.href = url;
  link.download = `taekwondo-yoklama-${year}-${safeMonth}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Renders crisp Turkish-glyph-safe A4 Landscape PDF for the monthly attendance matrix using Canvas 2D + jsPDF.
 */
export function downloadMonthlyAttendancePDF(params: {
  year: number;
  month: number;
  groupLabel: string;
  athletes: Athlete[];
  attendanceMap: Map<string, AttendanceRecord>;
  onlyRecordedDays: boolean;
  recordedDatesSet: Set<string>;
  metadata: ClubMetadata;
}): void {
  const {
    year,
    month,
    groupLabel,
    athletes,
    attendanceMap,
    onlyRecordedDays,
    recordedDatesSet,
    metadata,
  } = params;

  const allMonthDays = getMonthDaysISO(year, month);
  const visibleDays = onlyRecordedDays
    ? allMonthDays.filter((d) => recordedDatesSet.has(d))
    : allMonthDays;

  const monthLabel = TURKISH_MONTHS[month - 1];

  // High-DPI A4 Landscape Canvas (297mm x 210mm ratio -> 1684 x 1191 px)
  const PAGE_W = 1684;
  const PAGE_H = 1191;
  const MARGIN = 56;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const HEADER_H = 128;
  const TABLE_HEADER_H = 44;
  const ROW_H = 38;
  const FOOTER_H = 48;

  const usableTableH = PAGE_H - MARGIN * 2 - HEADER_H - TABLE_HEADER_H - FOOTER_H;
  const rowsPerPage = Math.max(1, Math.floor(usableTableH / ROW_H));
  const totalPages = Math.max(1, Math.ceil(athletes.length / rowsPerPage));

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Compute column widths dynamically
  const nameColW = 240;
  const beltColW = 120;
  const summaryColW = 50; // Top, G, X, İ
  const pctColW = 74;
  const summaryTotalW = summaryColW * 4 + pctColW;
  const daysAreaW = CONTENT_W - nameColW - beltColW - summaryTotalW;
  const dayColW = visibleDays.length > 0 ? Math.min(44, daysAreaW / visibleDays.length) : 0;
  const actualDaysW = dayColW * visibleDays.length;
  const actualTableW = nameColW + beltColW + actualDaysW + summaryTotalW;

  const drawText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    opts?: {
      font?: string;
      color?: string;
      align?: CanvasTextAlign;
      maxWidth?: number;
    }
  ) => {
    ctx.font = opts?.font ?? '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = opts?.color ?? '#0f172a';
    ctx.textAlign = opts?.align ?? 'left';
    ctx.textBaseline = 'middle';
    if (opts?.maxWidth) {
      ctx.fillText(text, x, y, opts.maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
  };

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // White Page Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Top Taekwondo Red/Blue Accent Stripe
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(MARGIN, MARGIN, CONTENT_W / 2, 5);
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(MARGIN + CONTENT_W / 2, MARGIN, CONTENT_W / 2, 5);

    // Club & Report Title
    drawText(ctx, metadata.clubName, MARGIN, MARGIN + 34, {
      font: '700 26px "Outfit", "Plus Jakarta Sans", sans-serif',
      color: '#0f172a',
    });
    drawText(
      ctx,
      `${monthLabel} ${year} Aylık Devam-Devamsızlık Raporu · Grup: ${groupLabel}`,
      MARGIN,
      MARGIN + 68,
      {
        font: '500 15px "Plus Jakarta Sans", sans-serif',
        color: '#475569',
      }
    );

    // Right Header Info (Coach + Date)
    const rightInfoTop = metadata.coachName;
    const rightInfoSub = [metadata.city, metadata.phone, `Rapor: ${formatDateTR(getTodayISO())}`]
      .filter(Boolean)
      .join(' · ');

    drawText(ctx, rightInfoTop, MARGIN + CONTENT_W, MARGIN + 34, {
      font: '600 16px "Plus Jakarta Sans", sans-serif',
      color: '#0f172a',
      align: 'right',
    });
    drawText(ctx, rightInfoSub, MARGIN + CONTENT_W, MARGIN + 68, {
      font: '400 13px "Plus Jakarta Sans", sans-serif',
      color: '#64748b',
      align: 'right',
    });

    // Divider line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, MARGIN + 96);
    ctx.lineTo(MARGIN + CONTENT_W, MARGIN + 96);
    ctx.stroke();

    // Table Header
    const tableTop = MARGIN + HEADER_H;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(MARGIN, tableTop, actualTableW, TABLE_HEADER_H);

    let cx = MARGIN;
    drawText(ctx, 'Sporcu Adı Soyadı', cx + 12, tableTop + TABLE_HEADER_H / 2, {
      font: '700 13px "Plus Jakarta Sans", sans-serif',
      color: '#ffffff',
    });
    cx += nameColW;

    drawText(ctx, 'Kuşak', cx + 10, tableTop + TABLE_HEADER_H / 2, {
      font: '700 13px "Plus Jakarta Sans", sans-serif',
      color: '#ffffff',
    });
    cx += beltColW;

    visibleDays.forEach((iso) => {
      const dayNum = String(parseISODate(iso).day);
      drawText(ctx, dayNum, cx + dayColW / 2, tableTop + TABLE_HEADER_H / 2, {
        font: '700 12px "JetBrains Mono", monospace',
        color: recordedDatesSet.has(iso) ? '#ffffff' : '#94a3b8',
        align: 'center',
      });
      cx += dayColW;
    });

    const summaryHeaders = [
      { label: 'Top', w: summaryColW, color: '#ffffff' },
      { label: 'G', w: summaryColW, color: '#6ee7b7' },
      { label: 'X', w: summaryColW, color: '#fca5a5' },
      { label: 'İ', w: summaryColW, color: '#fcd34d' },
      { label: 'Devam %', w: pctColW, color: '#ffffff' },
    ];

    summaryHeaders.forEach((col) => {
      drawText(ctx, col.label, cx + col.w / 2, tableTop + TABLE_HEADER_H / 2, {
        font: '700 13px "Plus Jakarta Sans", sans-serif',
        color: col.color,
        align: 'center',
      });
      cx += col.w;
    });

    // Rows for current page
    const slice = athletes.slice(pageIdx * rowsPerPage, (pageIdx + 1) * rowsPerPage);

    slice.forEach((athlete, idx) => {
      const ry = tableTop + TABLE_HEADER_H + idx * ROW_H;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(MARGIN, ry, actualTableW, ROW_H);

      // Row border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, ry + ROW_H);
      ctx.lineTo(MARGIN + actualTableW, ry + ROW_H);
      ctx.stroke();

      let rx = MARGIN;
      drawText(ctx, athlete.fullName, rx + 12, ry + ROW_H / 2, {
        font: '600 13px "Plus Jakarta Sans", sans-serif',
        color: '#0f172a',
        maxWidth: nameColW - 20,
      });
      rx += nameColW;

      drawText(ctx, athlete.beltLevel, rx + 10, ry + ROW_H / 2, {
        font: '500 12px "Plus Jakarta Sans", sans-serif',
        color: '#334155',
        maxWidth: beltColW - 16,
      });
      rx += beltColW;

      // Daily cells
      visibleDays.forEach((iso) => {
        const rec = attendanceMap.get(`${iso}_${athlete.id}`);
        let symbol = '-';
        let cellBg = '';
        let textColor = '#cbd5e1';

        if (rec?.status === 'G') {
          symbol = 'G';
          cellBg = '#ecfdf5';
          textColor = '#047857';
        } else if (rec?.status === 'X') {
          symbol = 'X';
          cellBg = '#fef2f2';
          textColor = '#b91c1c';
        } else if (rec?.status === 'I') {
          symbol = 'İ';
          cellBg = '#fffbeb';
          textColor = '#b45309';
        }

        if (cellBg) {
          ctx.fillStyle = cellBg;
          ctx.fillRect(rx + 1, ry + 2, dayColW - 2, ROW_H - 4);
        }

        drawText(ctx, symbol, rx + dayColW / 2, ry + ROW_H / 2, {
          font: rec ? '700 12px "JetBrains Mono", monospace' : '400 11px "JetBrains Mono", monospace',
          color: textColor,
          align: 'center',
        });
        rx += dayColW;
      });

      // Always calculate monthly totals from all days in the month
      let gCount = 0;
      let xCount = 0;
      let iCount = 0;
      allMonthDays.forEach((iso) => {
        const r = attendanceMap.get(`${iso}_${athlete.id}`);
        if (r?.status === 'G') gCount++;
        else if (r?.status === 'X') xCount++;
        else if (r?.status === 'I') iCount++;
      });

      const totalSessions = gCount + xCount + iCount;
      const rate = totalSessions > 0 ? Math.round((gCount / totalSessions) * 100) : null;

      drawText(ctx, String(totalSessions), rx + summaryColW / 2, ry + ROW_H / 2, {
        font: '600 13px "JetBrains Mono", monospace',
        color: '#0f172a',
        align: 'center',
      });
      rx += summaryColW;

      drawText(ctx, String(gCount), rx + summaryColW / 2, ry + ROW_H / 2, {
        font: '700 13px "JetBrains Mono", monospace',
        color: '#047857',
        align: 'center',
      });
      rx += summaryColW;

      drawText(ctx, String(xCount), rx + summaryColW / 2, ry + ROW_H / 2, {
        font: '700 13px "JetBrains Mono", monospace',
        color: '#b91c1c',
        align: 'center',
      });
      rx += summaryColW;

      drawText(ctx, String(iCount), rx + summaryColW / 2, ry + ROW_H / 2, {
        font: '700 13px "JetBrains Mono", monospace',
        color: '#b45309',
        align: 'center',
      });
      rx += summaryColW;

      const rateText = rate === null ? '—' : `%${rate}`;
      const rateColor =
        rate === null
          ? '#94a3b8'
          : rate >= 85
            ? '#047857'
            : rate >= 60
              ? '#b45309'
              : '#dc2626';

      drawText(ctx, rateText, rx + pctColW / 2, ry + ROW_H / 2, {
        font: '700 13px "JetBrains Mono", monospace',
        color: rateColor,
        align: 'center',
      });
    });

    // Outer table border
    const renderedTableH = TABLE_HEADER_H + slice.length * ROW_H;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(MARGIN, tableTop, actualTableW, renderedTableH);

    // Footer Legend & Pagination
    const footerY = PAGE_H - MARGIN - 10;
    drawText(
      ctx,
      'G: Geldi   ·   X: Gelmedi   ·   İ: İzinli/Raporlu   ·   Kuşak Sınavı Yeterliliği: %85 ve üzeri',
      MARGIN,
      footerY,
      {
        font: '500 12px "Plus Jakarta Sans", sans-serif',
        color: '#64748b',
      }
    );
    drawText(ctx, `Sayfa ${pageIdx + 1} / ${totalPages}`, MARGIN + CONTENT_W, footerY, {
      font: '600 12px "JetBrains Mono", monospace',
      color: '#475569',
      align: 'right',
    });

    const imgData = canvas.toDataURL('image/png');
    if (pageIdx > 0) {
      pdf.addPage('a4', 'landscape');
    }
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
  }

  const safeMonth = String(month).padStart(2, '0');
  pdf.save(`taekwondo-yoklama-raporu-${year}-${safeMonth}.pdf`);
}

/**
 * Generates an A4 Portrait PDF Roster Report for Athletes Library.
 */
export function downloadAthletesListPDF(params: {
  athletes: Athlete[];
  metadata: ClubMetadata;
  filterSummary?: string;
}): void {
  const { athletes, metadata, filterSummary } = params;

  const PAGE_W = 1191;
  const PAGE_H = 1684;
  const MARGIN = 56;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const HEADER_H = 128;
  const TABLE_HEADER_H = 44;
  const ROW_H = 42;
  const FOOTER_H = 48;

  const usableTableH = PAGE_H - MARGIN * 2 - HEADER_H - TABLE_HEADER_H - FOOTER_H;
  const rowsPerPage = Math.max(1, Math.floor(usableTableH / ROW_H));
  const totalPages = Math.max(1, Math.ceil(athletes.length / rowsPerPage));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const drawText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    opts?: {
      font?: string;
      color?: string;
      align?: CanvasTextAlign;
      maxWidth?: number;
    }
  ) => {
    ctx.font = opts?.font ?? '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = opts?.color ?? '#0f172a';
    ctx.textAlign = opts?.align ?? 'left';
    ctx.textBaseline = 'middle';
    if (opts?.maxWidth) {
      ctx.fillText(text, x, y, opts.maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
  };

  const cols = [
    { label: 'Ad Soyad', w: 230 },
    { label: 'Yaş / Kategori', w: 150 },
    { label: 'Kuşak', w: 150 },
    { label: 'Antrenman Grubu', w: 220 },
    { label: 'Lisans', w: 140 },
    { label: 'Veli Telefon', w: 189 },
  ];

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Top stripe
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(MARGIN, MARGIN, CONTENT_W / 2, 5);
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(MARGIN + CONTENT_W / 2, MARGIN, CONTENT_W / 2, 5);

    drawText(ctx, metadata.clubName, MARGIN, MARGIN + 34, {
      font: '700 24px "Outfit", "Plus Jakarta Sans", sans-serif',
      color: '#0f172a',
    });
    drawText(
      ctx,
      `Sporcu Kütüphanesi ve Kuşak Raporu${filterSummary ? ` · ${filterSummary}` : ''}`,
      MARGIN,
      MARGIN + 66,
      {
        font: '500 14px "Plus Jakarta Sans", sans-serif',
        color: '#475569',
      }
    );

    drawText(ctx, metadata.coachName, MARGIN + CONTENT_W, MARGIN + 34, {
      font: '600 15px "Plus Jakarta Sans", sans-serif',
      color: '#0f172a',
      align: 'right',
    });
    drawText(
      ctx,
      `${athletes.length} Sporcu · ${formatDateTR(getTodayISO())}`,
      MARGIN + CONTENT_W,
      MARGIN + 66,
      {
        font: '400 13px "Plus Jakarta Sans", sans-serif',
        color: '#64748b',
        align: 'right',
      }
    );

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, MARGIN + 94);
    ctx.lineTo(MARGIN + CONTENT_W, MARGIN + 94);
    ctx.stroke();

    const tableTop = MARGIN + HEADER_H;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(MARGIN, tableTop, CONTENT_W, TABLE_HEADER_H);

    let cx = MARGIN;
    cols.forEach((col) => {
      drawText(ctx, col.label, cx + 12, tableTop + TABLE_HEADER_H / 2, {
        font: '700 13px "Plus Jakarta Sans", sans-serif',
        color: '#ffffff',
      });
      cx += col.w;
    });

    const slice = athletes.slice(pageIdx * rowsPerPage, (pageIdx + 1) * rowsPerPage);

    slice.forEach((athlete, idx) => {
      const ry = tableTop + TABLE_HEADER_H + idx * ROW_H;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(MARGIN, ry, CONTENT_W, ROW_H);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, ry + ROW_H);
      ctx.lineTo(MARGIN + CONTENT_W, ry + ROW_H);
      ctx.stroke();

      const { age, category } = calculateAgeAndCategory(athlete.birthDate);
      const values = [
        athlete.fullName,
        `${age} yaş (${category})`,
        athlete.beltLevel,
        athlete.trainingGroup,
        athlete.licenseNo ? `${athlete.licenseStatus} · ${athlete.licenseNo}` : athlete.licenseStatus,
        athlete.parentPhone || '-',
      ];

      let rx = MARGIN;
      values.forEach((val, colIdx) => {
        drawText(ctx, val, rx + 12, ry + ROW_H / 2, {
          font:
            colIdx === 0
              ? '600 13px "Plus Jakarta Sans", sans-serif'
              : colIdx === 5
                ? '500 12px "JetBrains Mono", monospace'
                : '400 13px "Plus Jakarta Sans", sans-serif',
          color: colIdx === 0 ? '#0f172a' : '#334155',
          maxWidth: cols[colIdx].w - 20,
        });
        rx += cols[colIdx].w;
      });
    });

    const renderedH = TABLE_HEADER_H + slice.length * ROW_H;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(MARGIN, tableTop, CONTENT_W, renderedH);

    const footerY = PAGE_H - MARGIN - 10;
    drawText(ctx, [metadata.clubName, metadata.city, metadata.phone].filter(Boolean).join(' · '), MARGIN, footerY, {
      font: '500 12px "Plus Jakarta Sans", sans-serif',
      color: '#64748b',
    });
    drawText(ctx, `Sayfa ${pageIdx + 1} / ${totalPages}`, MARGIN + CONTENT_W, footerY, {
      font: '600 12px "JetBrains Mono", monospace',
      color: '#475569',
      align: 'right',
    });

    const imgData = canvas.toDataURL('image/png');
    if (pageIdx > 0) {
      pdf.addPage('a4', 'portrait');
    }
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  }

  pdf.save(`taekwondo-sporcu-listesi-${getTodayISO()}.pdf`);
}

/**
 * Exports full club database as formatted JSON backup file.
 */
export function downloadClubBackupJSON(): void {
  const payload = clubDataService.createBackupPayload();
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const todayStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `dojang-yedek-${todayStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
