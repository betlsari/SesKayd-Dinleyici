import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Bell,
  HelpCircle,
  User,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import "./Topbar.css";

export interface Company {
  id: number;
  name: string;
}

interface TopbarProps {
  currentCompany?: Company;
  companies?: Company[];
  notificationCount?: number;
  onCompanyChange?: (company: Company) => void;
}

export default function Topbar({
  currentCompany,
  companies = [],
  notificationCount = 0,
  onCompanyChange = () => {},
}: TopbarProps) {
  const [companyOpen, setCompanyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const companyTriggerRef = useRef<HTMLButtonElement>(null);
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null);
  // Menü açıkken her öğenin buton referansını tutuyoruz ki ok tuşlarıyla
  // aralarında gezinebilelim (roving focus). Menü her açıldığında/
  // kapandığında bu diziler yeniden dolduruluyor.
  const companyItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const userMenuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        companyRef.current &&
        event.target instanceof Node &&
        !companyRef.current.contains(event.target)
      ) {
        setCompanyOpen(false);
      }
      if (
        userMenuRef.current &&
        event.target instanceof Node &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Şirket menüsü açılınca ilk öğeye odak veriyoruz; klavye ile açan
  // kullanıcı hemen ok tuşlarıyla gezinebilsin.
  useEffect(() => {
    if (companyOpen) {
      companyItemRefs.current[0]?.focus();
    }
  }, [companyOpen]);

  useEffect(() => {
    if (userMenuOpen) {
      userMenuItemRefs.current[0]?.focus();
    }
  }, [userMenuOpen]);

  // Ortak roving-focus + Escape mantığı. `itemRefs`, o an açık olan
  // menünün buton listesidir; `close`, menüyü kapatıp odağı tetikleyici
  // butona geri döndüren fonksiyondur.
  function handleMenuKeyDown(
    event: React.KeyboardEvent,
    itemRefs: React.RefObject<(HTMLButtonElement | null)[]>,
    close: () => void,
  ) {
    const items = itemRefs.current.filter((el): el is HTMLButtonElement =>
      Boolean(el),
    );
    if (items.length === 0) return;

    const currentIndex = items.findIndex((el) => el === document.activeElement);

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "ArrowDown": {
        event.preventDefault();
        const nextIndex =
          currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const prevIndex =
          currentIndex < 0
            ? items.length - 1
            : (currentIndex - 1 + items.length) % items.length;
        items[prevIndex]?.focus();
        break;
      }
      case "Home":
        event.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
      default:
        break;
    }
  }

  function closeCompanyMenu() {
    setCompanyOpen(false);
    companyTriggerRef.current?.focus();
  }

  function closeUserMenu() {
    setUserMenuOpen(false);
    userMenuTriggerRef.current?.focus();
  }

  return (
    <header className="topbar">
      <div className="topbar-left" />

      <div className="topbar-right">
        <div className="company-selector" ref={companyRef}>
          <button
            type="button"
            ref={companyTriggerRef}
            className="company-selector-button"
            onClick={() => setCompanyOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={companyOpen}
          >
            <span className="company-selector-label">Şirket:</span>
            <span className="company-selector-value">
              {currentCompany?.name ?? "Seçiniz"}
            </span>
            <ChevronDown size={16} />
          </button>

          {companyOpen && (
            <ul
              className="company-selector-menu"
              role="listbox"
              onKeyDown={(event) =>
                handleMenuKeyDown(event, companyItemRefs, closeCompanyMenu)
              }
            >
              {companies.map((company, index) => (
                <li key={company.id}>
                  <button
                    type="button"
                    ref={(el) => {
                      companyItemRefs.current[index] = el;
                    }}
                    onClick={() => {
                      onCompanyChange(company);
                      closeCompanyMenu();
                    }}
                  >
                    {company.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" className="icon-button" aria-label="Yardım">
          <HelpCircle size={20} />
        </button>

        <button type="button" className="icon-button" aria-label="Bildirimler">
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </button>

        <div className="user-menu" ref={userMenuRef}>
          <button
            type="button"
            ref={userMenuTriggerRef}
            className="icon-button"
            aria-label="Kullanıcı menüsü"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((open) => !open)}
          >
            <User size={20} />
          </button>

          {userMenuOpen && (
            <ul
              className="user-menu-dropdown"
              role="menu"
              onKeyDown={(event) =>
                handleMenuKeyDown(event, userMenuItemRefs, closeUserMenu)
              }
            >
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  ref={(el) => {
                    userMenuItemRefs.current[0] = el;
                  }}
                  onClick={closeUserMenu}
                >
                  <User size={15} />
                  Profilim
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  ref={(el) => {
                    userMenuItemRefs.current[1] = el;
                  }}
                  onClick={closeUserMenu}
                >
                  <SettingsIcon size={15} />
                  Ayarlar
                </button>
              </li>
              <li className="user-menu-divider" role="none" />
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  ref={(el) => {
                    userMenuItemRefs.current[2] = el;
                  }}
                  className="user-menu-logout"
                  onClick={closeUserMenu}
                >
                  <LogOut size={15} />
                  Çıkış Yap
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
