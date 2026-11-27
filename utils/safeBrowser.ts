import { toast } from '../services/toast';
import { trackEvent } from '../services/analytics';

/**
 * Safely copies text to the clipboard with textarea fallback for restricted iframe contexts.
 */
export async function safeCopyToClipboard(
  text: string,
  successMessage?: string
): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error('Clipboard API unavailable');
    }
    if (successMessage) toast.success(successMessage);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) {
        if (successMessage) toast.success(successMessage);
        return true;
      }
    } catch {
      // ignore fallback errors
    }
    toast.error('Unable to copy automatically. Please copy manually.');
    return false;
  }
}

/**
 * Safely opens an external URL using an anchor click without relying on window.open(),
 * avoiding popup blockers in embedded iframe previews.
 */
export function safeOpenExternal(url: string, label?: string): void {
  if (!url) return;
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (label) toast.success(label);
  } catch {
    safeCopyToClipboard(url, 'Link copied to clipboard — paste in a new browser tab.');
  }
}

/**
 * Escapes a single CSV field according to RFC 4180.
 */
export function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Triggers a browser download for a Blob and cleans up the Object URL afterwards.
 */
export function downloadBlobFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 150);
}

/**
 * Downloads a properly quoted UTF-8 BOM CSV file.
 */
export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown>>
): void {
  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ];
  const blob = new Blob(['\uFEFF' + csvLines.join('\n')], {
    type: 'text/csv;charset=utf-8;'
  });
  downloadBlobFile(blob, filename);
  trackEvent('resource_downloaded', {
    resource_name: 'CSV Spreadsheet Export',
    resource_type: 'spreadsheet',
    format: 'csv'
  });
}

/**
 * Parses a single CSV/TSV line while respecting quoted fields containing delimiters or escaped quotes.
 */
export function parseCsvLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
