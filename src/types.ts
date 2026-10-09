export const DIRECTIONS = [
  'Web dasturlash',
  "Sun'iy intellekt",
  'Kompyuter savodxonligi',
  'Grafik dizayn',
] as const;

export const DIRECTION_INFO: Record<string, { emoji: string; color: string; text: string }> = {
  'Web dasturlash': { emoji: '🌐', color: 'var(--sky)', text: "HTML, CSS, JavaScript va React bilan o'z saytingizni yarating." },
  "Sun'iy intellekt": { emoji: '🤖', color: 'var(--pink)', text: "AI vositalari bilan ishlash, so'rov (prompt) yozish va oddiy modellar bilan tanishuv." },
  'Kompyuter savodxonligi': { emoji: '💻', color: 'var(--sun)', text: "Klaviatura, Word, Excel va internet xavfsizligi — noldan boshlang." },
  'Grafik dizayn': { emoji: '🎨', color: 'var(--mint)', text: "Logo, poster va ijtimoiy tarmoq dizayni yaratishni o'rganing." },
};

export const STATUS = {
  yangi: 'Yangi',
  bog_lanilmadi: "Bog'lanilmadi",
  bog_lanildi: "Bog'lanildi",
  qabul_qilindi: 'Qabul qilindi',
  rad_etildi: 'Rad etildi',
} as const;
export type StatusKey = keyof typeof STATUS;

export interface Application {
  id: string;
  full_name: string;
  grade: number;
  direction: string;
  phone: string;
  telegram: string | null;
  parent_phone: string;
  status: StatusKey;
  note: string | null;
  created_at: string;
}
