import { Construction } from "lucide-react";
import "./ComingSoonPage.css";

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

// Backend entegrasyonu tamamlanana kadar route'ların bazıları henüz
// gerçek bir sayfaya sahip değil (bkz. App.tsx route tanımları). Çıplak
// bir <div>Metin</div> yerine, uygulamanın geri kalanıyla (kart stili,
// renkler, tipografi) tutarlı bir "yakında" ekranı gösteriyoruz.
//
// Gerçek sayfa hazır olduğunda, ilgili route'ta bu bileşenin yerine
// asıl sayfa component'i konur; App.tsx dışında başka bir yer
// değiştirilmesi gerekmez.
export default function ComingSoonPage({
  title,
  description = "Bu sayfa henüz hazır değil. Backend entegrasyonu tamamlandığında burada gerçek içerik görüntülenecek.",
}: ComingSoonPageProps) {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-icon">
        <Construction size={28} />
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
