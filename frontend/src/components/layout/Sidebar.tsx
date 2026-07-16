import { NavLink } from "react-router-dom";
import {
  AudioWaveform,
  PhoneCall,
  BarChart2,
  FileText,
  Users,
  ShieldCheck,
  Building2,
  ClipboardList,
  Plug,
  Settings,
  Mic,
  type LucideIcon,
} from "lucide-react";
import { menuSections, type IconName } from "./menuData";
import "./Sidebar.css";

const iconMap: Record<IconName, LucideIcon> = {
  AudioWaveform,
  PhoneCall,
  BarChart2,
  FileText,
  Users,
  ShieldCheck,
  Building2,
  ClipboardList,
  Plug,
  Settings,
};

export interface CurrentUser {
  name: string;
  role: string;
  online: boolean;
}

interface SidebarProps {
  currentUser?: CurrentUser;
}

export default function Sidebar({ currentUser }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Mic size={20} className="sidebar-logo-icon" aria-hidden="true" />
        <span>Ses Kayıtları</span>
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section) => (
          <div className="sidebar-section" key={section.title}>
            <div className="sidebar-section-title">{section.title}</div>

            {section.items.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    "sidebar-item" + (isActive ? " sidebar-item-active" : "")
                  }
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {currentUser && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser.name}</div>
            <div className="sidebar-user-role">{currentUser.role}</div>
          </div>
          <span
            className={
              "sidebar-user-status " +
              (currentUser.online ? "is-online" : "is-offline")
            }
            title={currentUser.online ? "Çevrimiçi" : "Çevrimdışı"}
          />
        </div>
      )}
    </aside>
  );
}
