export type Gender = 'Erkek' | 'Kadın';

export type AgeCategory = 'Minikler' | 'Yıldızlar' | 'Gençler' | 'Büyükler';

export type LicenseStatus = 'Aktif' | 'Pasif' | 'Beklemede';

export type AthleteStatus = 'Aktif' | 'Dondurulmuş' | 'Ayrıldı';

export type BeltLevel =
  | 'Beyaz'
  | 'Sarı'
  | 'Sarı-Yeşil'
  | 'Yeşil'
  | 'Yeşil-Mavi'
  | 'Mavi'
  | 'Mavi-Kırmızı'
  | 'Kırmızı'
  | 'Kırmızı-Siyah'
  | 'Siyah 1. Poom'
  | 'Siyah 1. Dan'
  | 'Siyah 2. Dan'
  | 'Siyah 3. Dan';

export type TrainingGroup =
  | 'Minik Başlangıç'
  | 'Yıldız Müsabık'
  | 'Genç-Büyük Akşam Grubu'
  | 'Poomsae Özel Grubu';

export type AttendanceStatus = 'G' | 'X' | 'I'; // G: Geldi, X: Gelmedi, I: İzinli/Raporlu

export interface BeltPromotionRecord {
  id: string;
  fromBelt: BeltLevel;
  toBelt: BeltLevel;
  promotedAt: string; // YYYY-MM-DD
  note?: string;
}

export interface Athlete {
  id: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  tcIdentityNo?: string;
  licenseNo?: string;
  licenseStatus: LicenseStatus;
  beltLevel: BeltLevel;
  lastBeltDate: string; // YYYY-MM-DD
  beltHistory?: BeltPromotionRecord[];
  trainingGroup: TrainingGroup;
  parentName: string;
  parentPhone: string;
  healthNotes?: string;
  status: AthleteStatus;
  createdAt: string; // ISO string or YYYY-MM-DD
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string; // `${date}_${athleteId}`
  date: string; // YYYY-MM-DD
  athleteId: string;
  status: AttendanceStatus;
  note?: string;
  updatedAt: string;
}

export interface ClubMetadata {
  clubName: string;
  coachName: string;
  city?: string;
  phone?: string;
  seedLoaded: boolean;
}

export interface ClubDatabaseBackup {
  version: number;
  exportedAt: string;
  metadata: ClubMetadata;
  athletes: Athlete[];
  attendance: AttendanceRecord[];
}

export type ActiveTab = 'dashboard' | 'athletes' | 'attendance' | 'matrix';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}
