import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BookOpen, ChevronRight, LayoutGrid, UserCheck,
  DownloadCloud, TrendingUp, CheckCircle2, Zap, Plus,
  ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CourseActionMenu from '../../components/shared/CourseActionMenu';

// ── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-[#161b27] rounded-[2rem] border border-white/5 p-6 animate-pulse space-y-4">
    <div className="flex justify-between">
      <div className="w-8 h-8 bg-white/5 rounded-xl" />
      <div className="w-16 h-5 bg-white/5 rounded-lg" />
    </div>
    <div className="space-y-2 pt-2">
      <div className="h-5 bg-white/5 rounded-lg w-3/4" />
      <div className="h-4 bg-white/5 rounded-lg w-1/2" />
    </div>
    <div className="h-1.5 bg-white/5 rounded-full" />
    <div className="flex justify-between items-center pt-2 border-t border-white/5">
      <div className="h-4 bg-white/5 rounded-lg w-24" />
      <div className="w-8 h-8 bg-white/5 rounded-full" />
    </div>
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) => (
  <div className={`flex items-center gap-4 p-4 rounded-2xl border ${color}`}>
    <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center opacity-80">
      {icon}
    </div>
    <div>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'self' | 'imported' | 'assigned'>('self');
  const [statusFilter, setStatusFilter] = useState<'not-started' | 'in-progress' | 'completed'>('in-progress');

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.plan.getMyPlans();
      if (res.success) setPlans(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Tính stats
  const getStatus = (p: any) => {
    if (p.progress >= 100) return 'completed';
    if (p.progress > 0) return 'in-progress';
    return 'not-started';
  };

  const totalCount = plans.length;
  const inProgressCount = plans.filter(p => getStatus(p) === 'in-progress').length;
  const completedCount = plans.filter(p => getStatus(p) === 'completed').length;

  // Client-side filter + sort by progress desc
  const filteredPlans = plans
    .filter(p => {
      const isAssigned = p.sourceType === 'assigned' || p.status === 'reviewed';
      let matchSource = false;
      if (sourceFilter === 'assigned') matchSource = isAssigned;
      else if (sourceFilter === 'self') matchSource = p.sourceType === 'self' && !isAssigned;
      else if (sourceFilter === 'imported') matchSource = p.sourceType === 'shared_import' || p.sourceType === 'imported';
      else matchSource = p.sourceType === sourceFilter;

      return matchSource && getStatus(p) === statusFilter;
    })
    .sort((a, b) => (b.progress || 0) - (a.progress || 0));

  const firstName = user?.fullName?.split(' ').pop() || 'bạn';

  return (
    <div className="p-8 space-y-8 text-white min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">Chào mừng trở lại 👋</p>
          <h1 className="text-3xl font-black tracking-tight">
            Xin chào, <span className="text-blue-400">{firstName}</span>!
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">Hãy tiếp tục hành trình tri thức hôm nay.</p>
        </div>
        <button
          onClick={() => navigate('/create-plan')}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-900/30 active:scale-95"
        >
          <Plus size={18} /> Tạo lộ trình mới
        </button>
      </div>

      {/* ── Stats Banner ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<BookOpen size={20} className="text-blue-400" />}
          label="Tổng lộ trình"
          value={totalCount}
          color="bg-blue-500/5 border-blue-500/15"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-amber-400" />}
          label="Đang học"
          value={inProgressCount}
          color="bg-amber-500/5 border-amber-500/15"
        />
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald-400" />}
          label="Hoàn thành"
          value={completedCount}
          color="bg-emerald-500/5 border-emerald-500/15"
        />
      </div>

      {/* ── Source Filter (Tabs) ── */}
      <div className="flex gap-1 border-b border-white/5 pb-0">
        {[
          { id: 'self', label: 'Tự tạo', icon: <LayoutGrid size={15} /> },
          { id: 'imported', label: 'Lấy về', icon: <DownloadCloud size={15} /> },
          { id: 'assigned', label: 'Giáo viên gửi', icon: <UserCheck size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSourceFilter(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all relative rounded-t-xl
              ${sourceFilter === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.icon} {tab.label}
            {sourceFilter === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Status Filter (Pills) ── */}
      <div className="flex items-center gap-3">
        <Zap size={14} className="text-slate-600" />
        <div className="flex gap-1.5 bg-white/3 p-1 rounded-xl border border-white/5">
          {[
            { id: 'not-started', label: 'Chưa làm' },
            { id: 'in-progress', label: 'Đang làm' },
            { id: 'completed', label: 'Hoàn thành' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all
                ${statusFilter === st.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-500 hover:text-slate-300'}`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Course Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <div
              key={plan._id}
              className="bg-[#0d1117] border border-white/5 hover:border-blue-500/30 rounded-[2rem] p-6 transition-all group relative shadow-xl flex flex-col justify-between hover:-translate-y-0.5 duration-200"
            >
              {/* Top row */}
              <div className="flex justify-between items-start mb-5 relative z-20">
                <div onClick={(e) => e.stopPropagation()}>
                  <CourseActionMenu plan={plan} onRefresh={fetchPlans} />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase bg-white/3 px-2.5 py-1 rounded-lg border border-white/5">
                  {plan.duration} ngày
                </span>
              </div>

              {/* Body */}
              <div onClick={() => navigate(`/plan/${plan._id}`)} className="cursor-pointer space-y-4 flex-1">
                <h3 className="text-base font-bold line-clamp-2 group-hover:text-blue-400 transition-colors min-h-[3rem] leading-snug">
                  {plan.title}
                </h3>

                {/* Imported badge */}
                {(plan.sourceType === 'imported' || plan.sourceType === 'shared_import') && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/15 px-2.5 py-1.5 rounded-lg w-fit">
                    <DownloadCloud size={11} /> Lấy từ Market
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                    <span>Tiến độ</span>
                    <span className={plan.progress >= 100 ? 'text-emerald-400' : 'text-blue-400'}>
                      {plan.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${plan.progress >= 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-500'}`}
                      style={{ width: `${plan.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                onClick={() => navigate(`/plan/${plan._id}`)}
                className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 cursor-pointer"
              >
                <span className="text-xs font-black uppercase tracking-wider text-blue-500 group-hover:text-blue-400 transition-colors">
                  {plan.progress >= 100 ? 'Xem lại' : 'Tiếp tục học'}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-white" />
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty State - context-aware */
          <div className="col-span-full py-20 text-center rounded-[2.5rem] border border-dashed border-white/8 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
              {sourceFilter === 'imported'
                ? <DownloadCloud size={28} className="text-slate-600" />
                : <BookOpen size={28} className="text-slate-600" />}
            </div>
            <div>
              {sourceFilter === 'imported' ? (
                <>
                  <p className="text-slate-400 font-bold">Bạn chưa lấy khoá học nào về.</p>
                  <p className="text-slate-600 text-sm mt-1">Hãy khám phá Market để tìm lộ trình phù hợp!</p>
                </>
              ) : (
                <>
                  <p className="text-slate-400 font-bold">Không có lộ trình nào trong mục này.</p>
                  <p className="text-slate-600 text-sm mt-1">Hãy tạo lộ trình mới để bắt đầu học!</p>
                </>
              )}
            </div>
            {sourceFilter === 'imported' ? (
              <button
                onClick={() => navigate('/market')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all"
              >
                <ShoppingBag size={16} /> Khám phá Market
              </button>
            ) : (
              <button
                onClick={() => navigate('/create-plan')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all"
              >
                <Plus size={16} /> Tạo lộ trình ngay
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;