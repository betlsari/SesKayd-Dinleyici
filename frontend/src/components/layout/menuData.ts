// Menü verisini component'ten ayrı tutuyoruz ve tipini net tanımlıyoruz.
// Yeni bir menü öğesi eklemek istediğinde sadece buraya bir satır eklersin,
// Sidebar.tsx'e dokunmana gerek kalmaz.

// İkon adlarını burada sabit bir liste olarak tanımlıyoruz ki
// menuData.ts içine yanlışlıkla var olmayan bir ikon adı yazarsan
// TypeScript sana derleme anında hata versin.
export type IconName =
  | "AudioWaveform"
  | "PhoneCall"
  | "BarChart2"
  | "FileText"
  | "Users"
  | "ShieldCheck"
  | "Building2"
  | "ClipboardList"
  | "Plug"
  | "Settings";

export interface MenuItem {
  label: string;
  icon: IconName;
  path: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const menuSections: MenuSection[] = [
  {
    title: "ANA MENÜ",
    items: [
      { label: "Kayıtlar", icon: "AudioWaveform", path: "/kayitlar" },
      { label: "Arama Kayıtları", icon: "PhoneCall", path: "/arama-kayitlari" },
      { label: "İstatistikler", icon: "BarChart2", path: "/istatistikler" },
      { label: "Raporlar", icon: "FileText", path: "/raporlar" },
    ],
  },
  {
    title: "YÖNETİM",
    items: [
      { label: "Kullanıcılar", icon: "Users", path: "/kullanicilar" },
      { label: "Roller", icon: "ShieldCheck", path: "/roller" },
      { label: "Şirketler", icon: "Building2", path: "/sirketler" },
      { label: "Audit Log", icon: "ClipboardList", path: "/audit-log" },
    ],
  },
  {
    title: "SİSTEM",
    items: [
      {
        label: "API Entegrasyonları",
        icon: "Plug",
        path: "/api-entegrasyonlari",
      },
      { label: "Ayarlar", icon: "Settings", path: "/ayarlar" },
    ],
  },
];

// TODO (.NET entegrasyonu): İleride bu dizi, kullanıcının rolüne göre
// backend'den (örn. GET /api/menu) çekilecek. O zaman bu dosyanın yerini
// bir API çağrısının sonucu alacak, ama component'lerde değişiklik gerekmeyecek
// çünkü aynı MenuSection[] şeklini koruyacağız.
