import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { getCategoryLabel } from '../../utils/marketConstants';
import {
  ShoppingBag, BookOpen, Layers, Clock, DownloadCloud,
  Loader2, Trash2, AlertTriangle, X, CheckCircle2, TrendingUp,
  Globe, Eye, RefreshCw
} from 'lucide-react';

interface MarketCourse {
  _id: string;
  title: string;
  topic?: string;
  duration: number;
  level?: string;
  categories?: string[];
  tags?: string[];
  isPublic: boolean;
  importCount: number;
  createdAt: string;
  updatedAt: string;
}

const LEVEL_MAP: Record<string, { label: string; cls: string }> = {
  Easy: { label: 'Cơ bản', cls: 'bg-emerald-500/20 text-emerald-400' },
  Medium: { label: 'Trung bình', cls: 'bg-yellow-500/20 text-yellow-400' },
  Hard: { label: 'Nâng cao', cls: 'bg-red-500/20 text-red-400' },
};

const InstructorMarketListings: React.FC = () => {
  const [courses, setCourses] = useState<MarketCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlistingId, setUnlistingId] = useState<string | null>(null);

  // Confirm modal state
  const [confirmCourse, setConfirmCourse] = useState<MarketCourse | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await api.market.getMyListings();
      if (res.success) setCourses(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách:', err);
      showToast('Không thể tải danh sách khóa học.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const handleUnlist = async (course: MarketCourse) => {
    setConfirmCourse(course);
  };

  const confirmUnlist = async () => {
    if (!confirmCourse) return;
    try {
      setUnlistingId(confirmCourse._id);
      setConfirmCourse(null);
      const res = await api.market.unlistCourse(confirmCourse._id);
      if (res.success) {
        setCourses(prev => prev.filter(c => c._id !== confirmCourse._id));
        showToast('Đã gỡ khóa học khỏi Market thành công!');
      } else {
        showToast(res.message || 'Gỡ thất bại.', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    } finally {
      setUnlistingId(null);
    }
  };

  const totalImports = courses.reduce((s, c) => s + (c.importCount || 0), 0);

  return (
    <div className="p-6 lg:p-10 space-y-10 text-white bg-[#0f172a] min-h-screen animate-in fade-in duration-500">

      {/* ── TOAST ────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold
          animate-in slide-in-from-right-5 duration-300
          ${toast.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── CONFIRM MODAL ────────────────────────────────────────── */}
      {confirmCourse && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <button onClick={() => setConfirmCourse(null)} className="p-2 hover:bg-slate-800 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Gỡ khỏi Market?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Khóa học <span className="text-white font-bold">"{confirmCourse.title}"</span> sẽ bị ẩn khỏi cửa hàng.
                Người dùng đã import vẫn giữ được bản sao của họ.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCourse(null)}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all text-sm"
              >
                Hủy
              </button>
              <button
                onClick={confirmUnlist}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
              >
                <Trash2 size={16} /> Gỡ ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <ShoppingBag className="text-purple-400" size={38} />
              Khóa học trên Market
            </h1>
            <p className="text-slate-500 font-medium">
              Quản lý những khóa học bạn đã công bố lên Cửa hàng. Gỡ bất kỳ lúc nào.
            </p>
          </div>
          <button
            onClick={fetchListings}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm font-bold transition-all border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </header>

      {/* ── STATS ROW ────────────────────────────────────────────── */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Globe size={22} className="text-purple-400" />,
              label: 'Đang trên Market',
              value: courses.length,
              bg: 'from-purple-600/10 to-purple-900/10',
              border: 'border-purple-500/20',
            },
            {
              icon: <DownloadCloud size={22} className="text-blue-400" />,
              label: 'Lượt import',
              value: totalImports,
              bg: 'from-blue-600/10 to-blue-900/10',
              border: 'border-blue-500/20',
            },
            {
              icon: <TrendingUp size={22} className="text-emerald-400" />,
              label: 'Avg. import / khóa',
              value: courses.length ? (totalImports / courses.length).toFixed(1) : '0',
              bg: 'from-emerald-600/10 to-emerald-900/10',
              border: 'border-emerald-500/20',
            },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-[1.75rem] p-6 flex items-center gap-4`}>
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                <p className="text-3xl font-black text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LOADING ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-purple-500" size={42} />
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Đang tải danh sách...</p>
        </div>

      /* ── EMPTY ─────────────────────────────────────────────────── */
      ) : courses.length === 0 ? (
        <div className="bg-[#1e293b]/50 border-2 border-dashed border-slate-800 rounded-[3rem] p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag size={38} className="text-slate-600" />
          </div>
          <p className="text-slate-500 font-bold">Bạn chưa đưa khóa học nào lên Market.</p>
          <p className="text-slate-600 text-sm max-w-xs mx-auto">
            Vào <span className="text-purple-400 font-bold">Khóa học của tôi</span>, nhấn nút
            <span className="text-purple-400 font-bold"> Chia sẻ lên Market</span> để bắt đầu.
          </p>
        </div>

      /* ── GRID ──────────────────────────────────────────────────── */
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => {
            const lvl = LEVEL_MAP[course.level || ''] || { label: course.level || '—', cls: 'bg-slate-700 text-slate-400' };
            const isUnlisting = unlistingId === course._id;

            return (
              <div
                key={course._id}
                className="bg-[#1e293b] rounded-[2.5rem] border border-slate-800 hover:border-purple-500/40 transition-all shadow-xl flex flex-col overflow-hidden group"
              >
                {/* Card top gradient band */}
                <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-80" />

                <div className="p-7 flex-1 flex flex-col gap-5">
                  {/* Title + level */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors flex-1">
                      {course.title}
                    </h3>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-tighter shrink-0 ${lvl.cls}`}>
                      {lvl.label}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} className="text-slate-600" />
                      {course.duration} ngày
                    </span>
                    {course.categories && course.categories.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={12} className="text-slate-600" />
                        {course.categories.map(c => getCategoryLabel(c)).join(', ')}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-600" />
                      {new Date(course.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Import stat */}
                  <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                    <DownloadCloud size={18} className="text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Đã được import</p>
                      <p className="text-xl font-black text-white">
                        {course.importCount}
                        <span className="text-slate-500 text-sm font-bold ml-1">lần</span>
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {course.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-[10px] font-bold px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg">
                          #{tag}
                        </span>
                      ))}
                      {course.tags.length > 4 && (
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-800 text-slate-500 rounded-lg">
                          +{course.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <button
                    onClick={() => handleUnlist(course)}
                    disabled={isUnlisting}
                    className="mt-auto w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-black text-sm transition-all
                      bg-red-600/10 hover:bg-red-600 border border-red-600/30 hover:border-red-600
                      text-red-400 hover:text-white shadow-lg hover:shadow-red-900/30
                      disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isUnlisting
                      ? <><Loader2 size={16} className="animate-spin" /> Đang gỡ...</>
                      : <><Trash2 size={16} /> Gỡ khỏi Market</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstructorMarketListings;
