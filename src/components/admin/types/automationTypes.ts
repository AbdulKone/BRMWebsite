export interface AutomationStats {
  prospectsAdded: number;
  emailsSent: number;
  openRate: number;
  responseRate: number;
  conversionRate: number;
  activeSequences: number;
  scheduledEmails: number;
  lastUpdate: string;
}

export interface RecentActivity {
  id: string;
  type: 'prospect_added' | 'email_sent' | 'email_opened' | 'email_replied' | 'sequence_started';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export interface AutomationConfig {
  isActive: boolean;
  dailyLimit: number;
  followUpDelay: number;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
}

export interface SystemHealth {
  status: 'active' | 'idle' | 'paused' | 'error' | 'disconnected';
  color: string;
  label: string;
}

export interface EmailTrackingData {
  id: string;
  subject: string;
  sent_at: string;
  opened_at?: string;
  responded_at?: string;
  prospects: {
    company_name: string;
  };
}