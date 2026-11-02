import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Building2,
  ShieldCheck,
  Wrench,
  Navigation,
  ArrowLeftRight,
  Bus,
  UserCheck,
  Users,
  Cpu,
  Radio,
  Link2,
  Gauge,
  BarChart3,
  LayoutDashboard,
  Radar,
  Ticket
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

export const ManagementNav: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  return (
    <nav className="mgmt-nav-bar" aria-label="Management Navigation">
      <NavLink
        to="/operations/admin-dashboard"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={16} />
        <span>{isTa ? 'நிர்வாக களம்' : 'Admin Hub'}</span>
      </NavLink>

      <NavLink
        to="/operations/depot-dashboard"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Building2 size={16} />
        <span>{isTa ? 'பணிமனை களம்' : 'Depot Console'}</span>
      </NavLink>

      <NavLink
        to="/operations/dispatcher-dashboard"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Radar size={16} />
        <span>{isTa ? 'அனுப்பீட்டாளர் ரேடார்' : 'Dispatch Radar'}</span>
      </NavLink>

      <NavLink
        to="/operations"
        end
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Activity size={16} />
        <span>{isTa ? 'கண்காணிப்பு மையம்' : 'Operations Hub'}</span>
      </NavLink>

      <NavLink
        to="/operations/fleet"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Bus size={16} />
        <span>{isTa ? 'பேருந்துகள்' : 'Fleet Registry'}</span>
      </NavLink>

      <NavLink
        to="/operations/drivers"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <UserCheck size={16} />
        <span>{isTa ? 'ஓட்டுநர்கள்' : 'Drivers'}</span>
      </NavLink>

      <NavLink
        to="/operations/conductors"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Users size={16} />
        <span>{isTa ? 'நடத்துநர்கள்' : 'Conductors'}</span>
      </NavLink>

      <NavLink
        to="/operations/etms"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Cpu size={16} />
        <span>{isTa ? 'டிக்கெட் இயந்திரங்கள்' : 'ETM Registry'}</span>
      </NavLink>

      <NavLink
        to="/operations/gps-trackers"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Radio size={16} />
        <span>{isTa ? 'ஜிபிஎஸ் கருவிகள்' : 'GPS Trackers'}</span>
      </NavLink>

      <NavLink
        to="/operations/assignments"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Link2 size={16} />
        <span>{isTa ? 'ஒதுக்கீடுகள்' : 'Assignments'}</span>
      </NavLink>

      <NavLink
        to="/operations/monitoring"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Gauge size={16} />
        <span>{isTa ? 'நேரலை நிலை' : 'Monitoring'}</span>
      </NavLink>

      <NavLink
        to="/operations/analytics"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <BarChart3 size={16} />
        <span>{isTa ? 'பகுப்பாய்வு & AI' : 'Analytics & AI'}</span>
      </NavLink>

      <NavLink
        to="/operations/depots"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Building2 size={16} />
        <span>{isTa ? 'பணிமனைகள்' : 'Depots'}</span>
      </NavLink>

      <NavLink
        to="/operations/reserve-fleet"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <ShieldCheck size={16} />
        <span>{isTa ? 'ரிசர்வ் பேருந்துகள்' : 'Reserve Fleet'}</span>
      </NavLink>

      <NavLink
        to="/operations/workshops"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Wrench size={16} />
        <span>{isTa ? 'பணிமனைப் பட்டறைகள்' : 'Workshops'}</span>
      </NavLink>

      <NavLink
        to="/operations/bus-stands"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Navigation size={16} />
        <span>{isTa ? 'பேருந்து நிலையங்கள்' : 'Bus Stands'}</span>
      </NavLink>

      <NavLink
        to="/operations/transfers"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <ArrowLeftRight size={16} />
        <span>{isTa ? 'இடமாற்றங்கள்' : 'Depot Transfers'}</span>
      </NavLink>

      <NavLink
        to="/driver"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <UserCheck size={16} />
        <span>{isTa ? 'ஓட்டுநர் திரை' : 'Driver App'}</span>
      </NavLink>

      <NavLink
        to="/conductor"
        className={({ isActive }) => `mgmt-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Ticket size={16} />
        <span>{isTa ? 'நடத்துநர் திரை' : 'Conductor App'}</span>
      </NavLink>
    </nav>
  );
};

