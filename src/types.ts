export interface Staff {
  id: string;
  staffNumber: string;
  fullName: string;
  department: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  stickerTokenId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  id: string;
  fullName: string;
  organization: string;
  purpose: string;
  hostPerson: string;
  hostDepartment: string;
  expectedArrival: string;
  status: 'expected' | 'checked_in' | 'checked_out' | 'cancelled';
  stickerTokenId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StickerToken {
  id: string;
  token: string;
  tokenHash: string;
  assignedToType: 'staff' | 'visitor' | 'unassigned';
  assignedToId: string | null;
  status: 'active' | 'revoked' | 'expired';
  expiresAt: string | null;
  createdAt: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface AttendanceRecord {
  id: string;
  personType: 'staff' | 'visitor';
  personId: string;
  personName: string;
  department: string;
  organization?: string;
  timestamp: string;
  verificationType: 'qr_sticker' | 'manual_code' | 'admin_override';
  tokenUsed: string;
  deviceNotified: boolean;
  deviceAck: boolean;
  duplicateAttempt: boolean;
  notes?: string;
}

export interface DeviceTwin {
  deviceId: string;
  status: 'online' | 'offline';
  ipAddress: string;
  macAddress: string;
  firmwareVersion: string;
  protocolVersion: string;
  currentIndicatorState: string;
  rgbColor: string;
  matrixPattern: number[][];
  lastHeartbeat: string;
  uptimeSeconds: number;
  rssi: number;
  lastCommandId: string;
  lastAckTimestamp: string;
}

export interface GemmaInferenceResult {
  text: string;
  model: string;
  runtime: 'local_ollama' | 'hosted_endpoint' | 'google_genai' | 'deterministic_fallback';
  latencyMs: number;
  toolsUsed?: string[];
  fallbackEngaged: boolean;
  tokensUsed?: { prompt: number; completion: number };
}

export interface SystemSettings {
  absenceTimeoutSeconds: number;
  cooldownSeconds: number;
  duplicateWindowHours: number;
  gemmaModelVariant: string;
  gemmaInferenceEndpoint: string;
  gemmaApiKeyConfigured: boolean;
  unoQHost: string;
  unoQPort: number;
  deviceAuthSecret: string;
  welcomeVoiceEnabled: boolean;
  cameraNoticeEnabled: boolean;
  organizationName: string;
}

export interface ApprovedKnowledge {
  id: string;
  category: 'checkin' | 'department' | 'policy' | 'facilities' | 'emergency';
  question: string;
  answer: string;
  keywords: string[];
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface TestResultItem {
  id: string;
  name: string;
  category: 'Software' | 'Human Detection' | 'Gemma 4' | 'Hardware' | 'Security';
  status: 'PASS' | 'FAIL' | 'DOCUMENTED';
  details: string;
  executionTimeMs: number;
}
