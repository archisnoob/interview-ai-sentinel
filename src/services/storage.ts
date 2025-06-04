
// Local storage service for persisting detection data
export class StorageService {
  private static readonly SESSIONS_KEY = 'cheating_detection_sessions';
  private static readonly SETTINGS_KEY = 'cheating_detection_settings';

  // Session data persistence
  static saveSessions(sessions: any[]): void {
    try {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  }

  static loadSessions(): any[] {
    try {
      const data = localStorage.getItem(this.SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      return [];
    }
  }

  static clearSessions(): void {
    localStorage.removeItem(this.SESSIONS_KEY);
  }

  // Settings persistence
  static saveSettings(settings: any): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  static loadSettings(): any {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        alertThreshold: 70,
        autoExport: false,
        detectionSensitivity: 'medium'
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  // Analytics and reporting
  static getSessionStats() {
    const sessions = this.loadSessions();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: sessions.length,
      today: sessions.filter((s: any) => new Date(s.timestamp) >= today).length,
      thisWeek: sessions.filter((s: any) => new Date(s.timestamp) >= thisWeek).length,
      highRisk: sessions.filter((s: any) => s.riskLevel === 'high').length,
      aiAssisted: sessions.filter((s: any) => s.verdict === 'ai_assisted').length,
      averageConfidence: sessions.length > 0 ? 
        sessions.reduce((sum: number, s: any) => sum + (s.confidence || 0), 0) / sessions.length : 0
    };
  }
}
