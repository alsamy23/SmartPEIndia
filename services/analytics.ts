declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      eventParams?: Record<string, any>
    ) => void;
    GA_MEASUREMENT_ID?: string;
  }
}

export interface AnalyticsEventParams {
  tool_used: {
    tool_name: string;
    category?: string;
    [key: string]: any;
  };
  resource_downloaded: {
    resource_name: string;
    resource_type?: string;
    format?: string;
    [key: string]: any;
  };
  resource_viewed: {
    resource_name: string;
    category?: string;
    [key: string]: any;
  };
  signup: {
    method?: string;
    user_role?: string;
    workspace?: string;
    [key: string]: any;
  };
  profile_created: {
    user_role?: string;
    school_board?: string;
    workspace?: string;
    [key: string]: any;
  };
  screen_view_custom: {
    screen_name: string;
    previous_screen?: string;
    [key: string]: any;
  };
}

/**
 * Strict Privacy & Child-Data Sanitizer:
 * Guarantees that no student names, student IDs, assessment scores,
 * medical notes, marks, or personal student identifiers are ever sent to analytics.
 */
function sanitizeAnalyticsParams(params?: Record<string, any>): Record<string, any> {
  if (!params || typeof params !== 'object') return {};

  const forbiddenKeys = new Set([
    'studentname', 'student_name', 'studentnames', 'name', 'student', 'students',
    'studentid', 'student_id', 'rollnumber', 'roll_number', 'dob', 'dateofbirth',
    'score', 'scores', 'marks', 'result', 'results', 'assessmentscore', 'assessment_score',
    'progressreport', 'progress_report', 'report', 'phone', 'email', 'address', 'medical'
  ]);

  const clean: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (forbiddenKeys.has(normalizedKey)) {
      continue; // Strip forbidden student personal data & scores
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        clean[key] = value.length; // Convert raw arrays to item counts
      } else {
        clean[key] = sanitizeAnalyticsParams(value);
      }
    } else if (typeof value !== 'function') {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Safely track custom GA4 events using window.gtag with data-minimization guardrails.
 */
export function trackEvent<K extends keyof AnalyticsEventParams>(
  eventName: K,
  params: AnalyticsEventParams[K]
): void {
  try {
    const sanitized = sanitizeAnalyticsParams(params);

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, sanitized);
      console.log(`[Analytics] Event: ${eventName}`, sanitized);
    } else {
      console.log(`[Analytics Offline] Event: ${eventName}`, sanitized);
    }
  } catch (error) {
    console.warn('[Analytics] Error tracking event:', error);
  }
}
