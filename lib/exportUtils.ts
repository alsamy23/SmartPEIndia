
/**
 * Utility for exporting content to PDF and Word
 */

import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export const exportToPdf = async (element: HTMLElement | null, filename: string) => {
  if (!element) {
    console.error("Export element not found");
    return;
  }

  const hiddenElements = Array.from(element.querySelectorAll('.print\\:hidden')) as HTMLElement[];
  const originalDisplays = hiddenElements.map(el => el.style.display);

  try {
    // Hide print:hidden elements temporarily
    hiddenElements.forEach(el => { el.style.display = 'none'; });

    // We use html-to-image instead of html2canvas to natively support modern CSS like oklch from Tailwind v4.
    const imgData = await htmlToImage.toJpeg(element, {
      quality: 0.98,
      backgroundColor: '#ffffff',
      pixelRatio: 2 // High resolution
    });

    // Restore hidden elements
    hiddenElements.forEach((el, i) => { el.style.display = originalDisplays[i]; });
    
    // Calculate PDF dimensions (A4 portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Create an image element to get the intrinsic dimensions
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image data for PDF export'));
      img.src = imgData;
    });

    // Calculate image dimensions to fit PDF page margin
    const margin = 10;
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (img.height * imgWidth) / img.width;
    
    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - (margin * 2));

    // Subsequent pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin; // Shift image up
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - (margin * 2));
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    console.log("PDF export completed successfully");
  } catch (err: any) {
    console.error("PDF export failed:", err);
    alert(`Failed to export PDF: ${err?.message || err}. Try printing the page instead (Ctrl+P / Cmd+P).`);
    window.print();
  } finally {
    // Ensure hidden elements are restored even if an error occurs
    hiddenElements.forEach((el, i) => { el.style.display = originalDisplays[i]; });
  }
};

export const exportToWord = (htmlContent: string, filename: string) => {
  try {
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.doc') || filename.endsWith('.docx') ? filename : `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
    console.log("Word export triggered successfully");
  } catch (err) {
    console.error("Word export failed:", err);
    alert("Failed to export Word document.");
  }
};

/**
 * Escapes text according to iCalendar RFC 5545 specifications
 */
const escapeIcsText = (str: string | undefined | null): string => {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
};

/**
 * Formats a Date object to iCalendar DATE format (YYYYMMDD)
 */
const formatIcsDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

/**
 * Formats a Date object to iCalendar UTC timestamp (YYYYMMDDTHHMMSSZ)
 */
const formatIcsDateTimeUtc = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
};

/**
 * Parses academic year and dates string to determine valid start and end dates
 */
const resolveWeekDates = (
  weekDatesStr: string | undefined,
  monthName: string,
  weekNumber: number,
  academicYearStr?: string,
  baseStartDateStr?: string
): { startDate: Date; endDate: Date } => {
  // Determine base starting year
  let startYear = new Date().getFullYear();
  if (baseStartDateStr) {
    const parsed = new Date(baseStartDateStr);
    if (!isNaN(parsed.getFullYear())) {
      startYear = parsed.getFullYear();
    }
  } else if (academicYearStr) {
    const yearMatch = academicYearStr.match(/\b(20\d\d)\b/);
    if (yearMatch) {
      startYear = parseInt(yearMatch[1], 10);
    }
  }

  // Month map
  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  // Check if month is in the second half of Indian academic year (Jan-Mar)
  const normalizedMonth = (monthName || '').toLowerCase().trim();
  let monthIdx = 3; // Default to April
  for (const [key, idx] of Object.entries(monthMap)) {
    if (normalizedMonth.includes(key)) {
      monthIdx = idx;
      break;
    }
  }

  const effectiveYear = monthIdx < 3 ? startYear + 1 : startYear;

  // Attempt to extract start and end day from weekDatesStr (e.g. "01 Apr - 05 Apr" or "01.04.2026 - 05.04.2026")
  if (weekDatesStr) {
    // Check for DD.MM.YYYY or YYYY-MM-DD
    const isoMatches = weekDatesStr.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g);
    if (isoMatches && isoMatches.length >= 1) {
      const s = new Date(isoMatches[0]);
      let e = isoMatches.length >= 2 ? new Date(isoMatches[1]) : new Date(s.getTime() + 5 * 86400000);
      e = new Date(e.getTime() + 86400000); // DTEND is non-inclusive
      return { startDate: s, endDate: e };
    }

    // Check for "01 Apr - 05 Apr" or "1 - 5 Apr" or "15 Aug"
    const rangeMatch = weekDatesStr.match(/(\d{1,2})\s*([A-Za-z]+)?\s*[-–to]+\s*(\d{1,2})\s*([A-Za-z]+)?/);
    if (rangeMatch) {
      const startDay = parseInt(rangeMatch[1], 10);
      const startMonthStr = (rangeMatch[2] || monthName || '').toLowerCase().trim();
      let startMIdx = monthIdx;
      for (const [k, idx] of Object.entries(monthMap)) {
        if (startMonthStr.includes(k)) {
          startMIdx = idx;
          break;
        }
      }
      const sYear = startMIdx < 3 ? startYear + 1 : startYear;

      const endDay = parseInt(rangeMatch[3], 10);
      const endMonthStr = (rangeMatch[4] || rangeMatch[2] || monthName || '').toLowerCase().trim();
      let endMIdx = startMIdx;
      for (const [k, idx] of Object.entries(monthMap)) {
        if (endMonthStr.includes(k)) {
          endMIdx = idx;
          break;
        }
      }
      const eYear = endMIdx < 3 ? startYear + 1 : startYear;

      const startDate = new Date(sYear, startMIdx, startDay);
      // DTEND is exclusive for VALUE=DATE in RFC 5545, so end day + 1
      const endDate = new Date(eYear, endMIdx, endDay + 1);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        return { startDate, endDate };
      }
    }
  }

  // Fallback: calculate standard week block based on weekNumber from April 1st
  const baseStart = baseStartDateStr ? new Date(baseStartDateStr) : new Date(startYear, 3, 1);
  const weekOffset = Math.max(0, (weekNumber || 1) - 1);
  const calculatedStart = new Date(baseStart.getTime() + weekOffset * 7 * 86400000);
  const calculatedEnd = new Date(calculatedStart.getTime() + 6 * 86400000); // Mon-Fri/Sat exclusive

  return { startDate: calculatedStart, endDate: calculatedEnd };
};

/**
 * Export 40-week mapped curriculum yearly plan to standard iCalendar (.ics) format
 */
export const exportYearlyPlanToIcs = (
  plan: any,
  options?: {
    term1Focus?: string;
    term2Focus?: string;
    startDate?: string;
    filename?: string;
  }
) => {
  if (!plan || !plan.terms || !Array.isArray(plan.terms) || plan.terms.length === 0) {
    alert("No yearly plan curriculum available to export.");
    return;
  }

  const now = new Date();
  const dtStamp = formatIcsDateTimeUtc(now);
  const grade = plan.grade || 'All';
  const board = plan.board || 'CBSE';
  const academicYear = plan.academicYear || `${now.getFullYear()}-${now.getFullYear() + 1}`;
  const calName = `PE Yearly Plan - Grade ${grade} (${board})`;
  const calDesc = `Mapped 40-week physical education curriculum syllabus for Grade ${grade} (${board}) - Academic Session ${academicYear}`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SmartPE//PE Yearly Curriculum Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    `X-WR-CALDESC:${escapeIcsText(calDesc)}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  let eventCount = 0;

  plan.terms.forEach((term: any, tIdx: number) => {
    const termName = term.termName || `Term ${tIdx + 1}`;
    const termFocus = tIdx === 0 ? (options?.term1Focus || 'Term 1 Core Skills') : (options?.term2Focus || 'Term 2 Team Games');

    term.months?.forEach((month: any) => {
      const monthName = month.monthName || '';

      month.weeks?.forEach((week: any) => {
        eventCount++;
        const weekNum = week.weekNumber || eventCount;
        const status = week.status || 'Instructional';
        const topic = week.topic || (status === 'Instructional' ? 'Physical Education Session' : status);
        const details = week.details || '';

        const { startDate, endDate } = resolveWeekDates(
          week.dates,
          monthName,
          weekNum,
          academicYear,
          options?.startDate || plan.startDate
        );

        const dtStartStr = formatIcsDate(startDate);
        const dtEndStr = formatIcsDate(endDate);
        const uid = `smartpe-pe-grade${grade}-t${tIdx + 1}-w${weekNum}-${dtStartStr}@smartpe.education`;

        // Rich description with educational metadata
        const descriptionLines = [
          `GRADE: Class ${grade} (${board})`,
          `TERM: ${termName}`,
          `MONTH: ${monthName}`,
          `WEEK: Week ${weekNum}`,
          `STATUS: ${status}`,
          `TOPIC: ${topic}`,
          `DISCIPLINE/FOCUS: ${termFocus}`,
          details ? `PEDAGOGICAL DETAILS: ${details}` : '',
          'ORGANIZATION: SmartPE Physical Education Academic Curriculum'
        ].filter(Boolean);

        const summary = status === 'Instructional'
          ? `PE [Gr ${grade}] Wk ${weekNum}: ${topic}`
          : `[${status.toUpperCase()}] PE Gr ${grade} Wk ${weekNum}: ${topic}`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${dtStamp}`);
        lines.push(`DTSTART;VALUE=DATE:${dtStartStr}`);
        lines.push(`DTEND;VALUE=DATE:${dtEndStr}`);
        lines.push(`SUMMARY:${escapeIcsText(summary)}`);
        lines.push(`DESCRIPTION:${escapeIcsText(descriptionLines.join('\n'))}`);
        lines.push(`STATUS:CONFIRMED`);
        lines.push(`TRANSP:${status === 'Holiday' ? 'TRANSPARENT' : 'OPAQUE'}`);
        lines.push(`CATEGORIES:${escapeIcsText(`Physical Education,Curriculum,Grade ${grade},${status}`)}`);
        lines.push(`LOCATION:${escapeIcsText('School Sports Ground / Gymnasium')}`);
        lines.push('END:VEVENT');
      });
    });
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const safeFilename = options?.filename || `PE_Yearly_Plan_Grade${grade}_${board}_40Weeks.ics`;

  try {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    console.log(`Calendar .ics export completed with ${eventCount} curriculum events.`);
  } catch (err) {
    console.error("Calendar .ics export failed:", err);
    alert("Failed to export calendar (.ics) file.");
  }
};

export const printElement = (element: HTMLElement | null) => {
   if (!element) return;
   window.print();
};
