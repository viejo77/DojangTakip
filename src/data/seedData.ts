import { Athlete, AttendanceRecord, AttendanceStatus, ClubMetadata } from '../types/club';
import { getTodayISO, getWeekdayIndex, parseISODate, shiftISODate, toISODate } from '../utils/dateUtils';

export const DEFAULT_CLUB_METADATA: ClubMetadata = {
  clubName: 'Anadolu Dojang Taekwondo S.K.',
  coachName: 'Antrenör Serkan Yılmaz',
  seedLoaded: true,
};

function monthsAgoISO(monthsAgo: number, day = 15): string {
  const today = parseISODate(getTodayISO());
  const d = new Date(today.year, today.month - 1 - monthsAgo, day);
  return toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function yearsAgoISO(yearsAgo: number, month = 4, day = 12): string {
  const today = parseISODate(getTodayISO());
  return toISODate(today.year - yearsAgo, month, day);
}

export function createSeedAthletes(): Athlete[] {
  const today = getTodayISO();

  return [
    {
      id: 'ath-001',
      fullName: 'Efe Demirtaş',
      birthDate: yearsAgoISO(10, 3, 18),
      gender: 'Erkek',
      tcIdentityNo: '14829301124',
      licenseNo: '34-TKD-2025-1042',
      licenseStatus: 'Aktif',
      beltLevel: 'Sarı',
      lastBeltDate: monthsAgoISO(4, 10), // 4 aydır Sarı -> Sınava hazır
      trainingGroup: 'Minik Başlangıç',
      parentName: 'Murat Demirtaş',
      parentPhone: '0532 418 72 90',
      healthNotes: 'Toz alerjisi var, salonda ekstra dikkat.',
      status: 'Aktif',
      createdAt: monthsAgoISO(8, 1),
      updatedAt: today,
    },
    {
      id: 'ath-002',
      fullName: 'Zeynep Sude Kaya',
      birthDate: yearsAgoISO(13, 7, 24),
      gender: 'Kadın',
      tcIdentityNo: '29481033418',
      licenseNo: '34-TKD-2024-0891',
      licenseStatus: 'Aktif',
      beltLevel: 'Mavi',
      lastBeltDate: monthsAgoISO(5, 20), // 5 aydır Mavi -> Sınava hazır
      trainingGroup: 'Yıldız Müsabık',
      parentName: 'Ayşe Kaya',
      parentPhone: '0544 612 35 14',
      healthNotes: 'Müsabaka kadrosu, sol ayak bileği bandajlı.',
      status: 'Aktif',
      createdAt: monthsAgoISO(18, 5),
      updatedAt: today,
    },
    {
      id: 'ath-003',
      fullName: 'Kerem Arslan',
      birthDate: yearsAgoISO(16, 11, 5),
      gender: 'Erkek',
      tcIdentityNo: '33910482756',
      licenseNo: '34-TKD-2023-0412',
      licenseStatus: 'Aktif',
      beltLevel: 'Kırmızı-Siyah',
      lastBeltDate: monthsAgoISO(6, 12),
      trainingGroup: 'Genç-Büyük Akşam Grubu',
      parentName: 'Hakan Arslan',
      parentPhone: '0533 890 11 47',
      healthNotes: '',
      status: 'Aktif',
      createdAt: monthsAgoISO(30, 10),
      updatedAt: today,
    },
    {
      id: 'ath-004',
      fullName: 'Elif Naz Öztürk',
      birthDate: yearsAgoISO(9, 1, 29),
      gender: 'Kadın',
      tcIdentityNo: '51204981234',
      licenseNo: '',
      licenseStatus: 'Beklemede',
      beltLevel: 'Beyaz',
      lastBeltDate: monthsAgoISO(2, 1),
      trainingGroup: 'Minik Başlangıç',
      parentName: 'Fatma Öztürk',
      parentPhone: '0505 349 88 21',
      healthNotes: 'Yeni kayıt, lisans evrakları teslim edildi.',
      status: 'Aktif',
      createdAt: monthsAgoISO(2, 1),
      updatedAt: today,
    },
    {
      id: 'ath-005',
      fullName: 'Yusuf Emre Şahin',
      birthDate: yearsAgoISO(14, 9, 11),
      gender: 'Erkek',
      tcIdentityNo: '41827364510',
      licenseNo: '34-TKD-2024-1190',
      licenseStatus: 'Aktif',
      beltLevel: 'Yeşil',
      lastBeltDate: monthsAgoISO(2, 18),
      trainingGroup: 'Yıldız Müsabık',
      parentName: 'Kemal Şahin',
      parentPhone: '0542 775 09 63',
      healthNotes: 'Okul sınav dönemi nedeniyle zaman zaman izinli.',
      status: 'Aktif',
      createdAt: monthsAgoISO(14, 15),
      updatedAt: today,
    },
    {
      id: 'ath-006',
      fullName: 'Defne Yıldırım',
      birthDate: yearsAgoISO(19, 5, 3),
      gender: 'Kadın',
      tcIdentityNo: '62019483722',
      licenseNo: '34-TKD-2021-0185',
      licenseStatus: 'Aktif',
      beltLevel: 'Siyah 1. Dan',
      lastBeltDate: monthsAgoISO(14, 8),
      trainingGroup: 'Poomsae Özel Grubu',
      parentName: 'Selim Yıldırım',
      parentPhone: '0535 204 66 78',
      healthNotes: 'Bölge Poomsae seçme adayı.',
      status: 'Aktif',
      createdAt: monthsAgoISO(48, 3),
      updatedAt: today,
    },
    {
      id: 'ath-007',
      fullName: 'Mert Can Çelik',
      birthDate: yearsAgoISO(12, 6, 14),
      gender: 'Erkek',
      tcIdentityNo: '27481920344',
      licenseNo: '34-TKD-2024-0529',
      licenseStatus: 'Aktif',
      beltLevel: 'Kırmızı',
      lastBeltDate: monthsAgoISO(5, 4),
      trainingGroup: 'Yıldız Müsabık',
      parentName: 'Gülşen Çelik',
      parentPhone: '0538 914 52 09',
      healthNotes: 'Son haftalarda devamsızlık artışı mevcut, veli ile görüşüldü.',
      status: 'Aktif',
      createdAt: monthsAgoISO(22, 12),
      updatedAt: today,
    },
    {
      id: 'ath-008',
      fullName: 'Asya Nur Aydın',
      birthDate: yearsAgoISO(15, 2, 22),
      gender: 'Kadın',
      tcIdentityNo: '48291038472',
      licenseNo: '34-TKD-2023-0764',
      licenseStatus: 'Pasif',
      beltLevel: 'Mavi-Kırmızı',
      lastBeltDate: monthsAgoISO(7, 15),
      trainingGroup: 'Genç-Büyük Akşam Grubu',
      parentName: 'Orhan Aydın',
      parentPhone: '0541 683 29 45',
      healthNotes: 'Diz sakatlığı nedeniyle 1 ay donduruldu.',
      status: 'Dondurulmuş',
      createdAt: monthsAgoISO(26, 9),
      updatedAt: today,
    },
  ];
}

/**
 * Generates ~32 days of realistic training sessions (Mon, Wed, Fri, Sat + today)
 * with varied individual attendance profiles so analytics, warnings, and matrix are immediately realistic.
 */
export function createSeedAttendance(athletes: Athlete[]): AttendanceRecord[] {
  const today = getTodayISO();
  const records: AttendanceRecord[] = [];

  // Deterministic attendance pattern profile per athlete
  const athleteProfiles: Record<string, { presentRate: number; excusedRate: number }> = {
    'ath-001': { presentRate: 0.90, excusedRate: 0.05 }, // Efe - yüksek devam
    'ath-002': { presentRate: 0.94, excusedRate: 0.04 }, // Zeynep - müsabık çok düzenli
    'ath-003': { presentRate: 0.84, excusedRate: 0.08 }, // Kerem - düzenli
    'ath-004': { presentRate: 0.78, excusedRate: 0.10 }, // Elif - yeni kayıt orta
    'ath-005': { presentRate: 0.45, excusedRate: 0.25 }, // Yusuf - devamsızlığı/izni yüksek
    'ath-006': { presentRate: 0.96, excusedRate: 0.04 }, // Defne - Siyah 1. Dan örnek sporcu
    'ath-007': { presentRate: 0.42, excusedRate: 0.12 }, // Mert Can - dikkat gerektiren devamsızlık
  };

  for (let offset = -34; offset <= 0; offset++) {
    const dateISO = shiftISODate(today, offset);
    const weekday = getWeekdayIndex(dateISO); // 0=Paz, 1=Pzt, 2=Sal, 3=Çar, 4=Per, 5=Cum, 6=Cmt
    const isTrainingDay = weekday === 1 || weekday === 3 || weekday === 5 || weekday === 6 || offset === 0;

    if (!isTrainingDay) continue;

    athletes.forEach((athlete, idx) => {
      if (athlete.status !== 'Aktif') return;

      const profile = athleteProfiles[athlete.id] ?? { presentRate: 0.85, excusedRate: 0.05 };
      // Deterministic pseudo-random score in [0, 1)
      const hash = Math.abs(Math.sin((offset + 41) * 13.37 + (idx + 1) * 7.91)) % 1;

      let status: AttendanceStatus = 'G';
      let note = '';

      if (offset === 0) {
        // Make today's seed clean & varied
        if (athlete.id === 'ath-007') {
          status = 'X';
        } else if (athlete.id === 'ath-005') {
          status = 'I';
          note = 'Okul sınavı nedeniyle izinli';
        } else {
          status = 'G';
        }
      } else {
        if (hash < profile.presentRate) {
          status = 'G';
          if (hash > profile.presentRate - 0.06 && idx % 2 === 0) {
            note = 'Antrenmana 10 dk geç katıldı';
          }
        } else if (hash < profile.presentRate + profile.excusedRate) {
          status = 'I';
          note = athlete.id === 'ath-005' ? 'Sınav hazırlık izni' : 'Ailevi / sağlık izni';
        } else {
          status = 'X';
        }
      }

      records.push({
        id: `${dateISO}_${athlete.id}`,
        date: dateISO,
        athleteId: athlete.id,
        status,
        note: note || undefined,
        updatedAt: `${dateISO}T19:30:00`,
      });
    });
  }

  return records;
}
