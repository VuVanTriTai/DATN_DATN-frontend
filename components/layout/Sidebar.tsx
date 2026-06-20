import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, FilePlus, Users,
  Settings, LogOut, Share2, FolderOpen,
  ChevronDown, GraduationCap, School, Check,
  ShoppingBag, Star, Globe,
  ChevronLeft, ChevronRight, Sparkles, UserCheck
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, activeMode, switchMode, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const learnerMenu = [
    { icon: <LayoutDashboard size={20} />, label: 'Lộ trình học', path: '/dashboard' },
    { icon: <FilePlus size={20} />, label: 'Tạo lộ trình AI', path: '/create-plan' },
    { icon: <FolderOpen size={20} />, label: 'Tài liệu đã tải', path: '/documents' },
    { icon: <ShoppingBag size={20} />, label: 'Cửa hàng (Market)', path: '/market' },
    { icon: <Share2 size={20} />, label: 'Được chia sẻ', path: '/shared-plans' },
    { icon: <Users size={20} />, label: 'Thư mục Giáo viên', path: '/instructors' },
    { icon: <UserCheck size={20} />, label: 'Bạn bè', path: '/friends' },
    { icon: <Globe size={20} />, label: 'Quản lý Market', path: '/market-listings' },
  ];

  const instructorMenu = [
    { icon: <LayoutDashboard size={20} />, label: 'Khóa học của tôi', path: '/instructor/courses' },
    // { icon: <FilePlus size={20} />, label: 'Tạo lộ trình AI', path: '/create-plan' }, // tạm ẩn
    { icon: <Star size={20} />, label: 'Lĩnh vực giảng dạy', path: '/instructor/teaching-fields' },
    { icon: <Globe size={20} />, label: 'Quản lý Market', path: '/instructor/market-listings' },
  ];

  const menuItems = activeMode === 'instructor' ? instructorMenu : learnerMenu;

  const handleSwitchMode = (mode: 'learner' | 'instructor') => {
    switchMode(mode);
    setIsDropdownOpen(false);
    navigate(mode === 'instructor' ? '/instructor/courses' : '/dashboard');
  };

  const isLearner = activeMode === 'learner';
  const accentColor = isLearner ? 'blue' : 'purple';

  // Avatar initials
  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div
      className={`relative h-screen bg-[#0d1117] border-r border-white/5 flex flex-col sticky top-0 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-72'}`}
    >
      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-50 w-6 h-6 bg-[#1e293b] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#334155] transition-all shadow-lg"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className={`flex flex-col h-full ${collapsed ? 'px-3 py-5' : 'px-5 py-6'}`}>

        {/* ── Logo ── */}
        <div className={`flex items-center gap-3 mb-7 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-lg
            ${isLearner ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-900/40' : 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-purple-900/40'}`}>
            <Sparkles size={16} />
          </div>
          {!collapsed && (
            <div>
              <span className="text-base font-black text-white tracking-tight">AI Course</span>
              <p className={`text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5
                ${isLearner ? 'text-blue-500' : 'text-purple-500'}`}>
                {isLearner ? 'Học viên' : 'Giảng viên'}
              </p>
            </div>
          )}
        </div>

        {/* ── User Info Card ── */}
        {!collapsed && (
          <div className={`mb-5 p-3 rounded-2xl border
            ${isLearner ? 'bg-blue-500/5 border-blue-500/15' : 'bg-purple-500/5 border-purple-500/15'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0
                ${isLearner ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-violet-600'}`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-bold truncate leading-tight">{user?.fullName}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed avatar */}
        {collapsed && (
          <div className="flex justify-center mb-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white
              ${isLearner ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-violet-600'}`}>
              {initials}
            </div>
          </div>
        )}

        {/* ── Mode Switcher ── */}
        {user?.role.includes('instructor') && !collapsed && (
          <div className="relative mb-5">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-sm font-bold
                ${isLearner
                  ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 hover:bg-blue-600/15'
                  : 'bg-purple-600/10 border-purple-500/25 text-purple-400 hover:bg-purple-600/15'}`}
            >
              <div className="flex items-center gap-2.5">
                {isLearner ? <GraduationCap size={18} /> : <School size={18} />}
                <span>{isLearner ? 'Người học' : 'Giảng viên'}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                {[
                  { mode: 'learner' as const, icon: <GraduationCap size={16} />, label: 'Người học' },
                  { mode: 'instructor' as const, icon: <School size={16} />, label: 'Giảng viên' },
                ].map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => handleSwitchMode(mode)}
                    className={`w-full p-3.5 text-left flex items-center justify-between transition-colors text-sm
                      ${activeMode === mode
                        ? mode === 'learner' ? 'text-blue-400 bg-blue-500/10' : 'text-purple-400 bg-purple-500/10'
                        : 'text-slate-400 hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-2.5 font-bold">
                      {icon} {label}
                    </div>
                    {activeMode === mode && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-1">
          {!collapsed && (
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-3">
              Danh mục chính
            </p>
          )}
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.path} className="relative group/item">
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3.5 rounded-xl font-bold transition-all duration-150
                    ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                    ${isActive
                      ? isLearner
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                        : 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : isLearner ? 'group-hover/item:text-blue-400' : 'group-hover/item:text-purple-400'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                </button>

                {/* Tooltip khi collapsed */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1e293b] border border-white/10 rounded-xl text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1e293b]" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className={`pt-4 border-t border-white/5 space-y-1 ${collapsed ? '' : ''}`}>
          {/* Profile */}
          <div className="relative group/item">
            <button
              onClick={() => navigate('/profile')}
              className={`w-full flex items-center gap-3.5 rounded-xl text-sm font-bold transition-all
                ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                ${location.pathname === '/profile' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Settings size={18} className="flex-shrink-0" />
              {!collapsed && 'Hồ sơ cá nhân'}
            </button>
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1e293b] border border-white/10 rounded-xl text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                Hồ sơ cá nhân
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="relative group/item">
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3.5 rounded-xl text-sm font-bold transition-all text-red-400 hover:bg-red-500/10
                ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}`}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {!collapsed && 'Đăng xuất'}
            </button>
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1e293b] border border-white/10 rounded-xl text-red-400 text-xs font-bold whitespace-nowrap opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                Đăng xuất
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;