/**
 * PERUNDHU (பேருந்து) — Date & Time Utilities
 * Explicit Indian Standard Time (Asia/Kolkata, UTC+05:30) formatting
 */

const TIMEZONE_IST = 'Asia/Kolkata';

/**
 * Formats an ISO date string into Indian Standard Time (hh:mm A).
 */
export function formatIstTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--:--';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE_IST,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return '--:--';
  }
}

/**
 * Formats minutes remaining into localized ETA text.
 * e.g., 3 mins -> 3 நிமிடம் / 3 mins
 */
export function formatEtaMinutes(minutes: number, language: 'ta' | 'en' = 'ta'): string {
  if (minutes <= 0) {
    return language === 'ta' ? 'இப்போது (Now)' : 'Now';
  }
  if (minutes === 1) {
    return language === 'ta' ? '1 நிமிடம்' : '1 min';
  }
  return language === 'ta' ? `${minutes} நிமிடங்கள்` : `${minutes} mins`;
}

/**
 * Returns formatted relative time from ISO timestamp.
 */
export function formatRelativeSecondsAgo(isoString: string, language: 'ta' | 'en' = 'ta'): string {
  try {
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (elapsedSecs < 10) {
      return language === 'ta' ? 'சற்று முன்' : 'Just now';
    }
    if (elapsedSecs < 60) {
      return language === 'ta' ? `${elapsedSecs} வினாடிகளுக்கு முன்` : `${elapsedSecs}s ago`;
    }
    const mins = Math.floor(elapsedSecs / 60);
    return language === 'ta' ? `${mins} நிமிடங்களுக்கு முன்` : `${mins}m ago`;
  } catch {
    return language === 'ta' ? 'சற்று முன்' : 'Just now';
  }
}
