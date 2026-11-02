// Small shared helpers.

// Calendar date in Kigali, as YYYY-MM-DD. Used for "done today" on plan tasks.
export function today(now = new Date()) {
    return now.toLocaleDateString('en-CA', { timeZone: 'Africa/Kigali' });
  }
  
  export function daysAgoDate(n, now = new Date()) {
    return today(new Date(now.getTime() - n * 86400000));
  }
  
  export function isoDaysAgo(n, now = new Date()) {
    return new Date(now.getTime() - n * 86400000).toISOString();
  }
  
  export function cleanText(value, max) {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    if (!s) return null;
    return s.slice(0, max);
  }
  