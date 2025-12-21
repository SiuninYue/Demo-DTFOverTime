export const SINGAPORE_PUBLIC_HOLIDAYS: Record<string, string> = {
    // 2025
    '2025-01-01': '元旦', // New Year's Day
    '2025-01-29': '农历新年', // Chinese New Year
    '2025-01-30': '农历新年', // Chinese New Year
    '2025-03-31': '开斋节', // Hari Raya Puasa
    '2025-04-18': '耶稣受难日', // Good Friday
    '2025-05-01': '劳动节', // Labour Day
    '2025-05-12': '卫塞节', // Vesak Day
    '2025-06-07': '哈芝节', // Hari Raya Haji
    '2025-08-09': '国庆日', // National Day
    '2025-10-20': '屠妖节', // Deepavali
    '2025-12-25': '圣诞节', // Christmas Day

    // 2026
    '2026-01-01': '元旦', // New Year's Day
    '2026-02-17': '农历新年', // Chinese New Year
    '2026-02-18': '农历新年', // Chinese New Year
    '2026-03-20': '开斋节', // Hari Raya Puasa
    '2026-04-03': '耶稣受难日', // Good Friday
    '2026-05-01': '劳动节', // Labour Day
    '2026-05-31': '卫塞节', // Vesak Day
    '2026-06-01': '卫塞节 (补假)', // Vesak Day (Observed)
    '2026-05-27': '哈芝节', // Hari Raya Haji
    '2026-08-09': '国庆日', // National Day
    '2026-08-10': '国庆日 (补假)', // National Day (Observed)
    '2026-11-08': '屠妖节', // Deepavali
    '2026-11-09': '屠妖节 (补假)', // Deepavali (Observed)
    '2026-12-25': '圣诞节', // Christmas Day

    // 2027
    '2027-01-01': '元旦', // New Year's Day
    '2027-02-06': '农历新年', // Chinese New Year
    '2027-02-07': '农历新年', // Chinese New Year
    '2027-02-08': '农历新年 (补假)', // Chinese New Year (Observed)
    '2027-03-09': '开斋节', // Hari Raya Puasa
    '2027-03-26': '耶稣受难日', // Good Friday
    '2027-05-01': '劳动节', // Labour Day
    '2027-05-20': '卫塞节', // Vesak Day
    '2027-05-16': '哈芝节', // Hari Raya Haji
    '2027-08-09': '国庆日', // National Day
    '2027-10-29': '屠妖节 (预计)', // Deepavali (Tentative)
    '2027-12-25': '圣诞节', // Christmas Day
}

export const isPublicHoliday = (date: string): boolean => {
    return date in SINGAPORE_PUBLIC_HOLIDAYS
}

export const getPublicHolidayName = (date: string): string | undefined => {
    return SINGAPORE_PUBLIC_HOLIDAYS[date]
}
