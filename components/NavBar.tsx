import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconHome, IconClock, IconList, IconCog } from './Icons';

const NavBar: React.FC = () => {
  const getLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <nav className="h-[70px] bg-surface border-t border-border flex items-center justify-around px-2 pb-safe">
      <NavLink to="/" className={getLinkClass}>
        <IconHome className="w-6 h-6" />
        <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
      </NavLink>
      <NavLink to="/schedule" className={getLinkClass}>
        <IconClock className="w-6 h-6" />
        <span className="text-[10px] font-medium uppercase tracking-wider">Timer</span>
      </NavLink>
      <NavLink to="/logs" className={getLinkClass}>
        <IconList className="w-6 h-6" />
        <span className="text-[10px] font-medium uppercase tracking-wider">Logs</span>
      </NavLink>
      <NavLink to="/settings" className={getLinkClass}>
        <IconCog className="w-6 h-6" />
        <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
      </NavLink>
    </nav>
  );
};

export default NavBar;