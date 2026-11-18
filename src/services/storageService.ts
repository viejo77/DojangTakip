import { createSeedAthletes, createSeedAttendance, DEFAULT_CLUB_METADATA } from '../data/seedData';
import {
  Athlete,
  AttendanceRecord,
  AttendanceStatus,
  BeltLevel,
  BeltPromotionRecord,
  ClubDatabaseBackup,
  ClubMetadata,
} from '../types/club';
import { getTodayISO } from '../utils/dateUtils';

const STORAGE_KEYS = {
  ATHLETES: 'dojang_takip_athletes_v1',
  ATTENDANCE: 'dojang_takip_attendance_v1',
  METADATA: 'dojang_takip_metadata_v1',
  INITIALIZED: 'dojang_takip_initialized_v1',
} as const;

function safeReadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJSON<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Ensures initial seed data is loaded once on first run so the club dashboard is immediately usable.
 */
export function initializeDatabaseIfNeeded(): {
  athletes: Athlete[];
  attendance: AttendanceRecord[];
  metadata: ClubMetadata;
} {
  const isInitialized = window.localStorage.getItem(STORAGE_KEYS.INITIALIZED);

  if (!isInitialized) {
    const seedAthletes = createSeedAthletes();
    const seedAttendance = createSeedAttendance(seedAthletes);
    safeWriteJSON(STORAGE_KEYS.ATHLETES, seedAthletes);
    safeWriteJSON(STORAGE_KEYS.ATTENDANCE, seedAttendance);
    safeWriteJSON(STORAGE_KEYS.METADATA, DEFAULT_CLUB_METADATA);
    window.localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    return {
      athletes: seedAthletes,
      attendance: seedAttendance,
      metadata: DEFAULT_CLUB_METADATA,
    };
  }

  return {
    athletes: safeReadJSON<Athlete[]>(STORAGE_KEYS.ATHLETES, []),
    attendance: safeReadJSON<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []),
    metadata: safeReadJSON<ClubMetadata>(STORAGE_KEYS.METADATA, DEFAULT_CLUB_METADATA),
  };
}

/**
 * CRUD Service for Athletes (designed for drop-in replacement with Supabase/Firebase).
 */
export const athleteService = {
  getAll(): Athlete[] {
    return safeReadJSON<Athlete[]>(STORAGE_KEYS.ATHLETES, []);
  },

  getById(id: string): Athlete | undefined {
    return this.getAll().find((a) => a.id === id);
  },

  create(payload: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>): Athlete[] {
    const now = getTodayISO();
    const newAthlete: Athlete = {
      ...payload,
      id: generateId('ath'),
      createdAt: now,
      updatedAt: now,
    };
    const next = [newAthlete, ...this.getAll()];
    safeWriteJSON(STORAGE_KEYS.ATHLETES, next);
    return next;
  },

  update(id: string, patch: Partial<Omit<Athlete, 'id' | 'createdAt'>>): Athlete[] {
    const now = getTodayISO();
    const next = this.getAll().map((athlete) =>
      athlete.id === id
        ? {
            ...athlete,
            ...patch,
            updatedAt: now,
          }
        : athlete
    );
    safeWriteJSON(STORAGE_KEYS.ATHLETES, next);
    return next;
  },

  promoteBelt(
    id: string,
    toBelt: BeltLevel,
    promotedAt: string,
    note?: string
  ): Athlete[] {
    const now = getTodayISO();
    const next = this.getAll().map((athlete) => {
      if (athlete.id !== id) return athlete;
      const historyEntry: BeltPromotionRecord = {
        id: generateId('prm'),
        fromBelt: athlete.beltLevel,
        toBelt,
        promotedAt,
        note: note?.trim() ? note.trim() : undefined,
      };
      return {
        ...athlete,
        beltLevel: toBelt,
        lastBeltDate: promotedAt,
        beltHistory: [historyEntry, ...(athlete.beltHistory ?? [])],
        updatedAt: now,
      };
    });
    safeWriteJSON(STORAGE_KEYS.ATHLETES, next);
    return next;
  },

  remove(id: string): { athletes: Athlete[]; attendance: AttendanceRecord[] } {
    const nextAthletes = this.getAll().filter((a) => a.id !== id);
    const nextAttendance = attendanceService.getAll().filter((r) => r.athleteId !== id);
    safeWriteJSON(STORAGE_KEYS.ATHLETES, nextAthletes);
    safeWriteJSON(STORAGE_KEYS.ATTENDANCE, nextAttendance);
    return { athletes: nextAthletes, attendance: nextAttendance };
  },
};

/**
 * CRUD Service for Attendance Records (keyed by `${date}_${athleteId}`).
 */
export const attendanceService = {
  getAll(): AttendanceRecord[] {
    return safeReadJSON<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  },

  getByDate(dateISO: string): AttendanceRecord[] {
    return this.getAll().filter((r) => r.date === dateISO);
  },

  getByMonth(year: number, month: number): AttendanceRecord[] {
    const prefix = `${year}-${String(month).padStart(2, '0')}-`;
    return this.getAll().filter((r) => r.date.startsWith(prefix));
  },

  upsertBatch(
    dateISO: string,
    entries: Array<{ athleteId: string; status: AttendanceStatus | null; note?: string }>
  ): AttendanceRecord[] {
    const existing = this.getAll();
    const map = new Map<string, AttendanceRecord>();
    existing.forEach((rec) => map.set(rec.id, rec));

    const nowISO = new Date().toISOString();
    entries.forEach(({ athleteId, status, note }) => {
      const id = `${dateISO}_${athleteId}`;
      if (status === null) {
        map.delete(id);
      } else {
        map.set(id, {
          id,
          date: dateISO,
          athleteId,
          status,
          note: note?.trim() ? note.trim() : undefined,
          updatedAt: nowISO,
        });
      }
    });

    const next = Array.from(map.values());
    safeWriteJSON(STORAGE_KEYS.ATTENDANCE, next);
    return next;
  },

  upsertSingle(
    dateISO: string,
    athleteId: string,
    status: AttendanceStatus | null,
    note?: string
  ): AttendanceRecord[] {
    return this.upsertBatch(dateISO, [{ athleteId, status, note }]);
  },
};

/**
 * Club metadata, backup JSON export/import, and seed reset/clear actions.
 */
export const clubDataService = {
  getMetadata(): ClubMetadata {
    return safeReadJSON<ClubMetadata>(STORAGE_KEYS.METADATA, DEFAULT_CLUB_METADATA);
  },

  updateMetadata(patch: Partial<ClubMetadata>): ClubMetadata {
    const next = { ...this.getMetadata(), ...patch };
    safeWriteJSON(STORAGE_KEYS.METADATA, next);
    return next;
  },

  createBackupPayload(): ClubDatabaseBackup {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      metadata: this.getMetadata(),
      athletes: athleteService.getAll(),
      attendance: attendanceService.getAll(),
    };
  },

  restoreFromBackup(rawData: unknown): {
    athletes: Athlete[];
    attendance: AttendanceRecord[];
    metadata: ClubMetadata;
  } {
    if (!rawData || typeof rawData !== 'object') {
      throw new Error('Geçersiz yedek dosya formatı.');
    }
    const parsed = rawData as Partial<ClubDatabaseBackup>;
    if (!Array.isArray(parsed.athletes) || !Array.isArray(parsed.attendance)) {
      throw new Error('Yedek dosyasında sporcu veya yoklama dizisi bulunamadı.');
    }

    const nextMetadata: ClubMetadata = {
      clubName: parsed.metadata?.clubName || DEFAULT_CLUB_METADATA.clubName,
      coachName: parsed.metadata?.coachName || DEFAULT_CLUB_METADATA.coachName,
      city: parsed.metadata?.city || '',
      phone: parsed.metadata?.phone || '',
      seedLoaded: Boolean(parsed.metadata?.seedLoaded),
    };

    safeWriteJSON(STORAGE_KEYS.ATHLETES, parsed.athletes);
    safeWriteJSON(STORAGE_KEYS.ATTENDANCE, parsed.attendance);
    safeWriteJSON(STORAGE_KEYS.METADATA, nextMetadata);
    window.localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    return {
      athletes: parsed.athletes,
      attendance: parsed.attendance,
      metadata: nextMetadata,
    };
  },

  clearAllData(): {
    athletes: Athlete[];
    attendance: AttendanceRecord[];
    metadata: ClubMetadata;
  } {
    const nextMetadata: ClubMetadata = {
      ...this.getMetadata(),
      seedLoaded: false,
    };
    safeWriteJSON(STORAGE_KEYS.ATHLETES, []);
    safeWriteJSON(STORAGE_KEYS.ATTENDANCE, []);
    safeWriteJSON(STORAGE_KEYS.METADATA, nextMetadata);
    window.localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    return {
      athletes: [],
      attendance: [],
      metadata: nextMetadata,
    };
  },

  resetToSeedData(): {
    athletes: Athlete[];
    attendance: AttendanceRecord[];
    metadata: ClubMetadata;
  } {
    const seedAthletes = createSeedAthletes();
    const seedAttendance = createSeedAttendance(seedAthletes);
    const nextMetadata: ClubMetadata = {
      ...DEFAULT_CLUB_METADATA,
      seedLoaded: true,
    };
    safeWriteJSON(STORAGE_KEYS.ATHLETES, seedAthletes);
    safeWriteJSON(STORAGE_KEYS.ATTENDANCE, seedAttendance);
    safeWriteJSON(STORAGE_KEYS.METADATA, nextMetadata);
    window.localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    return {
      athletes: seedAthletes,
      attendance: seedAttendance,
      metadata: nextMetadata,
    };
  },
};
