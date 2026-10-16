import { DayOfWeek } from '../../models/ScheduledTrip';

const DAY_MAP: Record<string, DayOfWeek> = {
  Mon: 'MON',
  Tue: 'TUE',
  Wed: 'WED',
  Thu: 'THU',
  Fri: 'FRI',
  Sat: 'SAT',
  Sun: 'SUN'
};

/**
 * Returns the 3-letter DayOfWeek for a given date in Indian Standard Time (Asia/Kolkata).
 * If no date is provided, uses the current time in IST.
 * 
 * @param dateInput - ISO string ('YYYY-MM-DD' or full ISO) or Date instance
 */
export function getIstDayOfWeek(dateInput?: string | Date): DayOfWeek {
  let targetDate: Date;

  if (!dateInput) {
    targetDate = new Date();
  } else if (typeof dateInput === 'string') {
    // If only YYYY-MM-DD is supplied, anchor to IST noon (06:30 UTC) to guarantee correct IST calendar day
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      targetDate = new Date(`${dateInput}T12:00:00+05:30`);
    } else {
      targetDate = new Date(dateInput);
    }
  } else {
    targetDate = dateInput;
  }

  if (isNaN(targetDate.getTime())) {
    throw new Error(`Invalid date provided for IST calculation: ${dateInput}`);
  }

  const shortDay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short'
  }).format(targetDate);

  const mapped = DAY_MAP[shortDay];
  if (!mapped) {
    throw new Error(`Unmapped weekday in IST: ${shortDay}`);
  }

  return mapped;
}

/**
 * Returns the current local time in Tamil Nadu (IST, Asia/Kolkata) in 24-hour "HH:mm" format.
 */
export function getIstCurrentTime(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date());

  return parts;
}

/**
 * Returns today's calendar date in Tamil Nadu (IST, Asia/Kolkata) as "YYYY-MM-DD".
 */
export function getIstCurrentDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(new Date());
}
