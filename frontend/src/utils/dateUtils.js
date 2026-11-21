/**
 * Date and Duration utilities for Student OD & Leave Applications
 * Standard date format: DD/MM/YYYY
 */

export function formatDate(dateInput) {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string') {
    const datePart = dateInput.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const [yyyy, mm, dd] = parts;
      return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day}/${month}/${year}, ${time}`;
}

export function formatDateRange(fromDate, toDate) {
  if (!fromDate) return '-';
  const startStr = formatDate(fromDate);
  if (!toDate) return startStr;
  const endStr = formatDate(toDate);
  if (startStr === endStr) return startStr;
  return `${startStr} – ${endStr}`;
}

export function calculateDurationDays(fromDate, toDate) {
  if (!fromDate) return '1 Day';
  if (!toDate) return '1 Day';
  
  const start = new Date(fromDate);
  const end = new Date(toDate);
  
  // Set both to midnight UTC to avoid time-of-day or DST rounding issues
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffDays = Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
  const count = Math.max(1, isNaN(diffDays) ? 1 : diffDays);
  return count === 1 ? '1 Day' : `${count} Days`;
}

export function calculateDurationDaysNum(fromDate, toDate) {
  if (!fromDate) return 1;
  if (!toDate) return 1;
  
  const start = new Date(fromDate);
  const end = new Date(toDate);
  
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffDays = Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
}
