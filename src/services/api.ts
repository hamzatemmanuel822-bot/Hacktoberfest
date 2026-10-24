import { Staff, Visitor, AttendanceRecord, StickerToken, DeviceTwin, GemmaInferenceResult, SystemSettings, ApprovedKnowledge, TestResultItem } from '../types';

export const api = {
  async getHealth() {
    const res = await fetch('/api/health');
    return res.json();
  },

  async getStaff(): Promise<Staff[]> {
    const res = await fetch('/api/staff');
    return res.json();
  },

  async createStaff(data: Partial<Staff>) {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateStaff(id: string, data: Partial<Staff>) {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getVisitors(): Promise<Visitor[]> {
    const res = await fetch('/api/visitors');
    return res.json();
  },

  async createVisitor(data: Partial<Visitor>) {
    const res = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async checkoutVisitor(id: string) {
    const res = await fetch(`/api/visitors/${id}/checkout`, { method: 'PUT' });
    return res.json();
  },

  async getStickers(): Promise<StickerToken[]> {
    const res = await fetch('/api/stickers');
    return res.json();
  },

  async revokeSticker(tokenId: string, reason?: string) {
    const res = await fetch('/api/stickers/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId, reason })
    });
    return res.json();
  },

  async getAttendance(): Promise<AttendanceRecord[]> {
    const res = await fetch('/api/attendance');
    return res.json();
  },

  async submitCheckin(tokenString: string, verificationType: 'qr_sticker' | 'manual_code' = 'qr_sticker') {
    const res = await fetch('/api/attendance/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenString, verificationType })
    });
    return res.json();
  },

  async gemmaChat(message: string, language?: string, detectedPresence?: boolean): Promise<GemmaInferenceResult> {
    const res = await fetch('/api/gemma/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, detectedPresence })
    });
    return res.json();
  },

  async gemmaSummary(date?: string): Promise<GemmaInferenceResult> {
    const url = date ? `/api/gemma/summary?date=${encodeURIComponent(date)}` : '/api/gemma/summary';
    const res = await fetch(url);
    return res.json();
  },

  async gemmaExecuteTool(toolName: string, args: Record<string, any>) {
    const res = await fetch('/api/gemma/tool-exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, args })
    });
    return res.json();
  },

  async getGemmaStatus() {
    const res = await fetch('/api/gemma/status');
    return res.json();
  },

  async getDeviceStatus(): Promise<{ twin: DeviceTwin; registration: any; totalEvents: number; recentEvents: any[] }> {
    const res = await fetch('/api/device/status');
    return res.json();
  },

  async sendDeviceTestCommand(eventType: string, payload?: Record<string, any>) {
    const res = await fetch('/api/device/test-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, payload })
    });
    return res.json();
  },

  async notifyPresence(detected: boolean, confidence?: number) {
    const res = await fetch('/api/device/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detected, confidence })
    });
    return res.json();
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async resetData() {
    const res = await fetch('/api/admin/reset-data', { method: 'POST' });
    return res.json();
  },

  async runAcceptanceTests(): Promise<{ summary: any; results: TestResultItem[] }> {
    const res = await fetch('/api/tests/run-acceptance');
    return res.json();
  }
};
