import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen,
  LogOut, Shield, ChevronRight, Menu, X, Flag
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <Users size={20} />, label: 'Quản lý Tài khoản', path: '/admin/users' },
    { icon: <BookOpen size={20} />, label: 'Quản lý Khoá học', path: '/admin/courses' },
    { icon: <Flag size={20} />, label: 'Báo cáo Vi phạm', path: '/admin/reports' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-[#0a0a14] overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside
        className={`
          ${collapsed ? 'w-20' : 'w-72'} 
          h-screen bg-gradient-to-b from-[#130d2b] to-[#0d0a1e] 
          border-r border-purple-900/30 flex flex-col 
          transition-all duration-300 sticky top-0 flex-shrink-0
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 p-6 border-b border-purple-900/30 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40 flex-shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-black text-base tracking-tight">AI Course</p>
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-500 hover:text-white transition-colors"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {/* User Badge */}
        {!collapsed && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Đăng nhập với tư cách</p>
            <p className="text-white font-bold text-sm mt-0.5 truncate">{user?.fullName}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {!collapsed && (
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-4">
              Quản trị hệ thống
            </p>
          )}
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl font-bold transition-all group
                ${isActive(item.path)
                  ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg shadow-red-900/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <span className={`flex-shrink-0 ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-red-400'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="text-sm">{item.label}</span>}
              {!collapsed && isActive(item.path) && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-purple-900/30">
          <button
            onClick={logout}
            title={collapsed ? 'Đăng xuất' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-red-400 font-bold hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!collapsed && <span className="text-sm">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
