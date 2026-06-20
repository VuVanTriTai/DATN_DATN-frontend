import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminService';
import {
  Users, BookOpen, Globe, UserPlus, BookMarked,
  GraduationCap, Ban, TrendingUp, Star, Clock, ArrowRight
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalPublicCourses: number;
  newUsersToday: number;
  newCoursesToday: number;
  totalInstructors: number;
  totalLearners: number;
  bannedUsers: number;
}

const StatCard = ({
  icon, label, value, sub, color, onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-[#12101f] border border-white/5 rounded-2xl p-6 flex items-start gap-4 
      hover:border-white/10 transition-all ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
  >
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-white text-3xl font-black mt-1">{value.toLocaleString()}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topInstructors, setTopInstructors] = useState<any[]>([]);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getStats();
        setStats(res.data.stats);
        setTopInstructors(res.data.topInstructors || []);
        setRecentCourses(res.data.recentMarketCourses || []);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 mt-4">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400 bg-red-500/10 px-6 py-3 rounded-2xl">{error}</p>
    </div>
  );

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Tổng quan hệ thống AI Course</p>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={<Users size={22} className="text-white" />}
          label="Tổng người dùng"
          value={stats?.totalUsers ?? 0}
          color="bg-gradient-to-br from-blue-500 to-blue-700"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          icon={<BookOpen size={22} className="text-white" />}
          label="Tổng khoá học"
          value={stats?.totalCourses ?? 0}
          color="bg-gradient-to-br from-purple-500 to-purple-700"
          onClick={() => navigate('/admin/courses')}
        />
        <StatCard
          icon={<Globe size={22} className="text-white" />}
          label="Trên Marketplace"
          value={stats?.totalPublicCourses ?? 0}
          color="bg-gradient-to-br from-green-500 to-green-700"
          onClick={() => navigate('/admin/courses?isPublic=true')}
        />
        <StatCard
          icon={<Ban size={22} className="text-white" />}
          label="Tài khoản bị khoá"
          value={stats?.bannedUsers ?? 0}
          color="bg-gradient-to-br from-red-500 to-red-700"
          onClick={() => navigate('/admin/users?banned=true')}
        />
      </div>

      {/* Stat Cards Row 2 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<UserPlus size={22} className="text-white" />}
          label="Đăng ký hôm nay"
          value={stats?.newUsersToday ?? 0}
          color="bg-gradient-to-br from-cyan-500 to-cyan-700"
        />
        <StatCard
          icon={<BookMarked size={22} className="text-white" />}
          label="Khoá học mới hôm nay"
          value={stats?.newCoursesToday ?? 0}
          color="bg-gradient-to-br from-orange-500 to-orange-700"
        />
        <StatCard
          icon={<GraduationCap size={22} className="text-white" />}
          label="Giảng viên"
          value={stats?.totalInstructors ?? 0}
          color="bg-gradient-to-br from-pink-500 to-pink-700"
        />
        <StatCard
          icon={<TrendingUp size={22} className="text-white" />}
          label="Người học"
          value={stats?.totalLearners ?? 0}
          color="bg-gradient-to-br from-indigo-500 to-indigo-700"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Top Instructors */}
        <div className="bg-[#12101f] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Star size={18} className="text-yellow-400" /> Top Giảng viên
            </h2>
            <button onClick={() => navigate('/admin/users?role=instructor')} className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors">
              Xem tất cả <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {topInstructors.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Chưa có dữ liệu</p>
            )}
            {topInstructors.map((inst, idx) => (
              <div key={inst._id} className="flex items-center gap-3 p-3 bg-white/3 hover:bg-white/5 rounded-xl transition-colors">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0
                  ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-600' : 'bg-slate-700'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{inst.fullName}</p>
                  <p className="text-slate-400 text-xs truncate">{inst.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-yellow-400 font-black text-sm">
                    ★ {inst.instructorProfile?.avgRating?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-slate-500 text-xs">{inst.instructorProfile?.ratingCount || 0} đánh giá</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Market Courses */}
        <div className="bg-[#12101f] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Clock size={18} className="text-purple-400" /> Khoá học mới trên Market
            </h2>
            <button onClick={() => navigate('/admin/courses?isPublic=true')} className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors">
              Xem tất cả <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentCourses.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Chưa có khoá học nào trên Market</p>
            )}
            {recentCourses.map((course) => (
              <div
                key={course._id}
                className="flex items-start gap-3 p-3 bg-white/3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                onClick={() => navigate('/admin/courses')}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{course.title}</p>
                  <p className="text-slate-400 text-xs truncate">
                    {course.owner?.fullName} · {course.topic || 'Không có chủ đề'}
                  </p>
                </div>
                <p className="text-slate-500 text-xs flex-shrink-0">
                  {new Date(course.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
