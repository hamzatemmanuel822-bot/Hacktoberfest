import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

export interface DeviceRegistration {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  macAddress: string;
  firmwareVersion: string;
  protocolVersion: string;
  authToken: string;
  status: 'online' | 'offline';
  lastHeartbeat: string;
  registeredAt: string;
}

export interface DeviceEvent {
  id: string;
  deviceId: string;
  eventType: 'STARTUP' | 'IDLE' | 'PERSON_DETECTED' | 'CHECKIN_PENDING' | 'ATTENDANCE_SUCCESS' | 'ATTENDANCE_FAILURE' | 'FAULT';
  payload: Record<string, any>;
  timestamp: string;
  status: 'queued' | 'sent' | 'acknowledged' | 'failed';
  ackTimestamp?: string;
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

export interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  staff: Staff[];
  visitors: Visitor[];
  stickerTokens: StickerToken[];
  attendanceRecords: AttendanceRecord[];
  deviceRegistrations: DeviceRegistration[];
  deviceEvents: DeviceEvent[];
  approvedKnowledge: ApprovedKnowledge[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'smartwelcome.json');

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function generateSecureToken(prefix: 'STF' | 'VIS'): string {
  const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `SWK-${prefix}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}`;
}

const DEFAULT_SETTINGS: SystemSettings = {
  absenceTimeoutSeconds: 5,
  cooldownSeconds: 8,
  duplicateWindowHours: 8,
  gemmaModelVariant: 'gemma-4-e4b-it',
  gemmaInferenceEndpoint: 'http://localhost:11434',
  gemmaApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  unoQHost: '192.168.1.150',
  unoQPort: 3000,
  deviceAuthSecret: 'uno-q-sec-9812-token-auth',
  welcomeVoiceEnabled: true,
  cameraNoticeEnabled: true,
  organizationName: 'SmartWelcome AI Research Lab'
};

function getSeedData(): DatabaseSchema {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const stfToken1 = generateSecureToken('STF');
  const stfToken2 = generateSecureToken('STF');
  const stfToken3 = generateSecureToken('STF');
  const stfToken4 = generateSecureToken('STF');
  const visToken1 = generateSecureToken('VIS');
  const visToken2 = generateSecureToken('VIS');

  const staffList: Staff[] = [
    {
      id: 'stf_01',
      staffNumber: 'EMP-1042',
      fullName: 'Dr. Elena Vance',
      department: 'Robotics & Hardware Lab',
      email: 'elena.vance@smartwelcome.org',
      phone: '+1 (555) 234-8901',
      role: 'Principal Embedded Architect',
      active: true,
      stickerTokenId: 'tok_stf_01',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'stf_02',
      staffNumber: 'EMP-1043',
      fullName: 'Marcus Thorne',
      department: 'Computer Vision & AI Systems',
      email: 'marcus.thorne@smartwelcome.org',
      phone: '+1 (555) 345-6789',
      role: 'Senior Vision Engineer',
      active: true,
      stickerTokenId: 'tok_stf_02',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'stf_03',
      staffNumber: 'EMP-1044',
      fullName: 'Sarah Chen',
      department: 'Cloud & IoT Infrastructure',
      email: 'sarah.chen@smartwelcome.org',
      phone: '+1 (555) 456-7890',
      role: 'DevOps & Security Lead',
      active: true,
      stickerTokenId: 'tok_stf_03',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'stf_04',
      staffNumber: 'EMP-1045',
      fullName: 'David K. O’Connor',
      department: 'Human Resources & Facilities',
      email: 'david.oconnor@smartwelcome.org',
      phone: '+1 (555) 567-8901',
      role: 'Facility Operations Manager',
      active: true,
      stickerTokenId: 'tok_stf_04',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString()
    }
  ];

  const visitorsList: Visitor[] = [
    {
      id: 'vis_01',
      fullName: 'Prof. Arthur Sterling',
      organization: 'Institute of Embedded Intelligence',
      purpose: 'Technical Review: Arduino UNO Q Architecture',
      hostPerson: 'Dr. Elena Vance',
      hostDepartment: 'Robotics & Hardware Lab',
      expectedArrival: `${todayStr}T09:30:00Z`,
      status: 'checked_in',
      stickerTokenId: 'tok_vis_01',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 'vis_02',
      fullName: 'Maya Lin',
      organization: 'Nordic Sensor Dynamics',
      purpose: 'Supplier Audit & Sensor Calibration',
      hostPerson: 'Marcus Thorne',
      hostDepartment: 'Computer Vision & AI Systems',
      expectedArrival: `${todayStr}T14:00:00Z`,
      status: 'expected',
      stickerTokenId: 'tok_vis_02',
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600000).toISOString()
    }
  ];

  const tokensList: StickerToken[] = [
    {
      id: 'tok_stf_01',
      token: stfToken1,
      tokenHash: hashToken(stfToken1),
      assignedToType: 'staff',
      assignedToId: 'stf_01',
      status: 'active',
      expiresAt: null,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'tok_stf_02',
      token: stfToken2,
      tokenHash: hashToken(stfToken2),
      assignedToType: 'staff',
      assignedToId: 'stf_02',
      status: 'active',
      expiresAt: null,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'tok_stf_03',
      token: stfToken3,
      tokenHash: hashToken(stfToken3),
      assignedToType: 'staff',
      assignedToId: 'stf_03',
      status: 'active',
      expiresAt: null,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'tok_stf_04',
      token: stfToken4,
      tokenHash: hashToken(stfToken4),
      assignedToType: 'staff',
      assignedToId: 'stf_04',
      status: 'active',
      expiresAt: null,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: 'tok_vis_01',
      token: visToken1,
      tokenHash: hashToken(visToken1),
      assignedToType: 'visitor',
      assignedToId: 'vis_01',
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'tok_vis_02',
      token: visToken2,
      tokenHash: hashToken(visToken2),
      assignedToType: 'visitor',
      assignedToId: 'vis_02',
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
    }
  ];

  const attendanceList: AttendanceRecord[] = [
    {
      id: 'att_01',
      personType: 'staff',
      personId: 'stf_01',
      personName: 'Dr. Elena Vance',
      department: 'Robotics & Hardware Lab',
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      verificationType: 'qr_sticker',
      tokenUsed: stfToken1,
      deviceNotified: true,
      deviceAck: true,
      duplicateAttempt: false,
      notes: 'Morning entry'
    },
    {
      id: 'att_02',
      personType: 'visitor',
      personId: 'vis_01',
      personName: 'Prof. Arthur Sterling',
      department: 'Robotics & Hardware Lab',
      organization: 'Institute of Embedded Intelligence',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      verificationType: 'qr_sticker',
      tokenUsed: visToken1,
      deviceNotified: true,
      deviceAck: true,
      duplicateAttempt: false,
      notes: 'Visitor check-in with host Dr. Vance'
    }
  ];

  const deviceList: DeviceRegistration[] = [
    {
      id: 'dev_01',
      deviceId: 'UNO-Q-ENTRANCE-01',
      deviceName: 'Main Lobby Arduino UNO Q',
      ipAddress: '192.168.1.150',
      macAddress: 'E4:5F:01:2A:8C:99',
      firmwareVersion: 'v1.4.0-stm32u585',
      protocolVersion: '1.0',
      authToken: 'uno-q-sec-9812-token-auth',
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      registeredAt: new Date(Date.now() - 7 * 86400000).toISOString()
    }
  ];

  const knowledgeList: ApprovedKnowledge[] = [
    {
      id: 'knw_01',
      category: 'checkin',
      question: 'What should I do first when arriving at the entrance?',
      answer: 'Welcome to SmartWelcome AI facility! Please collect an attendance sticker badge from the dispenser holder next to the kiosk screen, peel it to display the QR code, and hold it up to the camera scanner to complete your check-in.',
      keywords: ['first', 'arrive', 'entrance', 'sticker', 'procedure', 'how to', 'start'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'knw_02',
      category: 'checkin',
      question: 'What should I do if my QR code sticker fails to scan or is invalid?',
      answer: 'If the camera has trouble reading your sticker, tap the "Enter Code Manually" button on the screen and type the 16-character code printed under the QR code. If the code is rejected, please visit the reception security desk on your left for immediate badge re-issuance.',
      keywords: ['fail', 'error', 'invalid', 'manual', 'code', 'broken', 'sticker', 'trouble'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'knw_03',
      category: 'department',
      question: 'Where is the Robotics & Hardware Lab located?',
      answer: 'The Robotics & Hardware Lab is located on Floor 2, Wing B, Room B-210. Take the main elevator behind the lobby and turn right. Lead contact is Dr. Elena Vance.',
      keywords: ['robotics', 'hardware', 'lab', 'location', 'where', 'elena vance', 'room'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'knw_04',
      category: 'department',
      question: 'Where is the Computer Vision & AI Systems department located?',
      answer: 'The Computer Vision & AI Systems Lab is on Floor 3, Suite 305. Lead contact is Marcus Thorne.',
      keywords: ['computer vision', 'ai', 'systems', 'marcus thorne', 'floor 3', 'suite 305'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'knw_05',
      category: 'facilities',
      question: 'What is the guest Wi-Fi network and how do I connect?',
      answer: 'Visitors may connect to the "SmartWelcome-Guest" wireless network. Once connected, open your browser and accept the guest policy. No password is required for verified registered visitors.',
      keywords: ['wifi', 'wi-fi', 'internet', 'guest', 'network', 'connect'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'knw_06',
      category: 'facilities',
      question: 'Where should visitors wait for their host?',
      answer: 'Please take a seat in the Visitor Lounge located directly behind the kiosk next to the botanical partition. Your host has been notified of your check-in and will meet you there within 5 minutes.',
      keywords: ['wait', 'lounge', 'host', 'seat', 'where to wait'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'knw_07',
      category: 'policy',
      question: 'What information is required for visitors to register?',
      answer: 'Visitors must provide their Full Name, Organization or Company, Purpose of Visit, and the name of their internal host or receiving department. Stickers remain valid for 24 hours.',
      keywords: ['information', 'required', 'register', 'visitor', 'rules', 'policy'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'knw_08',
      category: 'emergency',
      question: 'Where are the emergency fire exits and first aid kits?',
      answer: 'Emergency exit doors are located at the North and South ends of the main atrium, clearly marked with illuminated green exit signs. A first aid kit and AED defibrillator are mounted next to Reception Desk A.',
      keywords: ['emergency', 'fire', 'exit', 'first aid', 'evacuate', 'safety', 'aed'],
      updatedAt: new Date().toISOString()
    }
  ];

  const auditList: AuditLog[] = [
    {
      id: 'aud_01',
      actor: 'system',
      action: 'SYSTEM_BOOTSTRAP',
      target: 'database',
      details: 'SmartWelcome AI core database initialized with default schemas and security rules',
      timestamp: new Date().toISOString()
    }
  ];

  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    staff: staffList,
    visitors: visitorsList,
    stickerTokens: tokensList,
    attendanceRecords: attendanceList,
    deviceRegistrations: deviceList,
    deviceEvents: [],
    approvedKnowledge: knowledgeList,
    auditLogs: auditList,
    settings: DEFAULT_SETTINGS
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version) {
          return parsed;
        }
      } catch (err) {
        console.error('[DB] Error reading existing database, regenerating:', err);
      }
    }
    const seed = getSeedData();
    this.saveDatabase(seed);
    return seed;
  }

  public saveDatabase(dataToSave?: DatabaseSchema) {
    if (dataToSave) {
      this.data = dataToSave;
    }
    this.data.lastUpdated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public resetToSeed() {
    const seed = getSeedData();
    this.saveDatabase(seed);
    return seed;
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Transactional Check-in Validation & Recording
  public recordAttendance(params: {
    tokenString: string;
    verificationType: 'qr_sticker' | 'manual_code' | 'admin_override';
  }): {
    success: boolean;
    error?: string;
    record?: AttendanceRecord;
    person?: { id: string; name: string; type: 'staff' | 'visitor'; department: string; organization?: string };
    duplicateWarning?: boolean;
  } {
    const cleanToken = params.tokenString.trim();
    const tHash = hashToken(cleanToken);

    // 1. Find token
    const tokenObj = this.data.stickerTokens.find(
      (t) => t.token === cleanToken || t.tokenHash === tHash
    );

    if (!tokenObj) {
      this.addAuditLog('kiosk', 'TOKEN_VALIDATION_FAILED', cleanToken, 'Token not found in registry');
      return { success: false, error: 'Invalid sticker token: not recognized in system registry.' };
    }

    if (tokenObj.status === 'revoked') {
      this.addAuditLog('kiosk', 'REVOKED_TOKEN_PRESENTED', cleanToken, `Token revoked: ${tokenObj.revokedReason || 'No reason specified'}`);
      return { success: false, error: `Sticker token has been revoked (${tokenObj.revokedReason || 'Contact security'}).` };
    }

    if (tokenObj.expiresAt && new Date(tokenObj.expiresAt).getTime() < Date.now()) {
      tokenObj.status = 'expired';
      this.saveDatabase();
      this.addAuditLog('kiosk', 'EXPIRED_TOKEN_PRESENTED', cleanToken, 'Token has expired');
      return { success: false, error: 'Sticker token has expired. Please request a new visitor sticker.' };
    }

    // 2. Identify person
    let personName = 'Unknown Person';
    let department = 'General';
    let organization: string | undefined;
    let personType: 'staff' | 'visitor' = 'staff';
    let personId = '';

    if (tokenObj.assignedToType === 'staff' && tokenObj.assignedToId) {
      const staffMember = this.data.staff.find((s) => s.id === tokenObj.assignedToId);
      if (!staffMember) {
        return { success: false, error: 'Staff account associated with sticker no longer exists.' };
      }
      if (!staffMember.active) {
        return { success: false, error: 'Staff account is currently inactive. Contact HR.' };
      }
      personName = staffMember.fullName;
      department = staffMember.department;
      personType = 'staff';
      personId = staffMember.id;
    } else if (tokenObj.assignedToType === 'visitor' && tokenObj.assignedToId) {
      const visitor = this.data.visitors.find((v) => v.id === tokenObj.assignedToId);
      if (!visitor) {
        return { success: false, error: 'Visitor record associated with sticker not found.' };
      }
      personName = visitor.fullName;
      department = visitor.hostDepartment;
      organization = visitor.organization;
      personType = 'visitor';
      personId = visitor.id;

      // Update visitor status
      visitor.status = 'checked_in';
      visitor.updatedAt = new Date().toISOString();
    } else {
      return { success: false, error: 'Sticker token has not been assigned to any staff or visitor record.' };
    }

    // 3. Duplicate Check-in Prevention
    const duplicateWindowMs = (this.data.settings.duplicateWindowHours || 8) * 3600 * 1000;
    const recentCheckin = this.data.attendanceRecords.find((rec) => {
      return (
        rec.personId === personId &&
        new Date().getTime() - new Date(rec.timestamp).getTime() < duplicateWindowMs &&
        !rec.duplicateAttempt
      );
    });

    const isDuplicate = Boolean(recentCheckin);

    // 4. Create Attendance Record
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      personType,
      personId,
      personName,
      department,
      organization,
      timestamp: new Date().toISOString(),
      verificationType: params.verificationType,
      tokenUsed: cleanToken,
      deviceNotified: false,
      deviceAck: false,
      duplicateAttempt: isDuplicate,
      notes: isDuplicate
        ? `Duplicate check-in attempt (first logged at ${new Date(recentCheckin!.timestamp).toLocaleTimeString()})`
        : 'Authorized check-in'
    };

    this.data.attendanceRecords.unshift(newRecord);

    this.addAuditLog(
      'kiosk',
      isDuplicate ? 'DUPLICATE_CHECKIN_LOGGED' : 'ATTENDANCE_RECORDED',
      personName,
      `Verified via ${params.verificationType}. Token: ${cleanToken.slice(0, 7)}...`
    );

    this.saveDatabase();

    return {
      success: true,
      record: newRecord,
      person: {
        id: personId,
        name: personName,
        type: personType,
        department,
        organization
      },
      duplicateWarning: isDuplicate
    };
  }

  public addAuditLog(actor: string, action: string, target: string, details: string) {
    const entry: AuditLog = {
      id: `aud_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      actor,
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
  }
}

export const db = new Database();
