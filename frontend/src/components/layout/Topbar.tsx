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

  // Dropdown'lardan biri açıkken sayfanın başka bir yerine tıklanırsa kapanmasını sağlıyoruz.
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

  return (
    <header className="topbar">
      <div className="topbar-left" />

      <div className="topbar-right">
        <div className="company-selector" ref={companyRef}>
          <button
            type="button"
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
            <ul className="company-selector-menu" role="listbox">
              {companies.map((company) => (
                <li key={company.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onCompanyChange(company);
                      setCompanyOpen(false);
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
            className="icon-button"
            aria-label="Kullanıcı menüsü"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((open) => !open)}
          >
            <User size={20} />
          </button>

          {userMenuOpen && (
            <ul className="user-menu-dropdown" role="menu">
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User size={15} />
                  Profilim
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
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
                  className="user-menu-logout"
                  onClick={() => setUserMenuOpen(false)}
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
