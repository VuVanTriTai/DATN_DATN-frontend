import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { getCategoryLabel } from '../../utils/marketConstants';
import {
  DownloadCloud, BookOpen, Layers, Clock, Play,
  Loader2, Trash2, AlertTriangle, X, CheckCircle2,
  ShoppingBag, RefreshCw, Search, RotateCcw
} from 'lucide-react';

interface ImportedCourse {
  _id: string;
  title: string;
  topic?: string;
  duration: number;
  level?: string;
  categories?: string[];
  tags?: string[];
  createdAt: string;
}

const LEVEL_MAP: Record<string, { label: string; cls: string }> = {
  Easy:   { label: 'Cơ bản',    cls: 'bg-emerald-500/20 text-emerald-400' },
  Medium: { label: 'Trung bình', cls: 'bg-yellow-500/20 text-yellow-400'  },
  Hard:   { label: 'Nâng cao',   cls: 'bg-red-500/20    text-red-400'     },
};

const LearnerImportedCourses: React.FC = () => {
  const navigate = useNavigate();

  const [courses, setCourses]       = useState<ImportedCourse[]>([]);
  const [filtered, setFiltered]     = useState<ImportedCourse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmCourse, setConfirmCourse] = useState<ImportedCourse | null>(null);
  const [search, setSearch]         = useState('');
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  /* ── helpers ───────────────────────────────────────────── */
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const applySearch = (list: ImportedCourse[], q: string) =>
    q.trim()
      ? list.filter(c => c.title.toLowerCase().includes(q.toLowerCase()))
      : list;

  /* ── fetch ──────────────────────────────────────────────── */
  const fetchImports = async () => {
    try {
      setLoading(true);
      const res = await api.market.getMyImports();
      if (res.success) {
        setCourses(res.data);
        setFiltered(applySearch(res.data, search));
      }
    } catch {
      showToast('Không thể tải danh sách khoá học.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImports(); }, []);
  useEffect(() => { setFiltered(applySearch(courses, search)); }, [search, courses]);

  /* ── remove ─────────────────────────────────────────────── */
  const confirmRemove = async () => {
    if (!confirmCourse) return;
    try {
      setRemovingId(confirmCourse._id);
      setConfirmCourse(null);
      const res = await api.market.removeImport(confirmCourse._id);
      if (res.success) {
        setCourses(prev => prev.filter(c => c._id !== confirmCourse._id));
        showToast('Đã xoá khoá học khỏi kho của bạn!');
      } else {
        showToast(res.message || 'Xoá thất bại.', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="p-6 lg:p-10 space-y-10 text-white bg-[#0f172a] min-h-screen animate-in fade-in duration-500">

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold
          animate-in slide-in-from-right-5 duration-300
          ${toast.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20    border border-red-500/40    text-red-300'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}
          {toast.msg}
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmCourse && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-400"/>
              </div>
              <button onClick={() => setConfirmCourse(null)} className="p-2 hover:bg-slate-800 rounded-full transition-all">
                <X size={20}/>
              </button>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black">Xoá khỏi kho của bạn?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Khoá học <span className="text-white font-bold">"{confirmCourse.title}"</span> sẽ bị xoá khỏi kho cá nhân.
                Bạn có thể import lại từ Market bất cứ lúc nào.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCourse(null)}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all text-sm"
              >
                Huỷ
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black transition-all text-sm
                  flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
              >
                <Trash2 size={16}/> Xoá ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <DownloadCloud className="text-blue-400" size={38}/>
              Khoá học đã lấy về
            </h1>
            <p className="text-slate-500 font-medium">
              Danh sách khoá học bạn đã import từ Market. Vào học hoặc xoá bất cứ lúc nào.
            </p>
          </div>
          <button
            onClick={fetchImports}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm font-bold transition-all border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
            Làm mới
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      {!loading && courses.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={17}/>
            <input
              type="text"
              placeholder="Tìm kiếm khoá học..."
              className="w-full bg-[#1e293b] border border-slate-700 p-3.5 pl-11 rounded-2xl outline-none focus:border-blue-500 text-sm transition-all placeholder:text-slate-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700"
            >
              <RotateCcw size={13}/> Xoá lọc
            </button>
          )}
          <span className="text-slate-500 text-xs font-bold">
            {filtered.length}/{courses.length} khoá học
          </span>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-500" size={42}/>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Đang tải kho học tập...</p>
        </div>

      /* EMPTY — chưa import gì */
      ) : courses.length === 0 ? (
        <div className="bg-[#1e293b]/50 border-2 border-dashed border-slate-800 rounded-[3rem] p-20 text-center space-y-5">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
            <DownloadCloud size={38} className="text-slate-600"/>
          </div>
          <p className="text-slate-500 font-bold">Bạn chưa import khoá học nào từ Market.</p>
          <button
            onClick={() => navigate('/market')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-900/30"
          >
            <ShoppingBag size={16}/> Khám phá Market ngay
          </button>
        </div>

      /* EMPTY — search không khớp */
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <BookOpen size={48} className="text-slate-700"/>
          <p className="text-slate-500 font-bold">Không tìm thấy khoá học phù hợp.</p>
          <button onClick={() => setSearch('')} className="text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors">
            Xoá bộ lọc
          </button>
        </div>

      /* GRID */
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(course => {
            const lvl = LEVEL_MAP[course.level || ''] || { label: course.level || '—', cls: 'bg-slate-700 text-slate-400' };
            const isRemoving = removingId === course._id;

            return (
              <div
                key={course._id}
                className="bg-[#1e293b] rounded-[2.5rem] border border-slate-800 hover:border-blue-500/40 transition-all shadow-xl flex flex-col overflow-hidden group"
              >
                {/* Top accent */}
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 opacity-70"/>

                <div className="p-6 flex-1 flex flex-col gap-4">
                  {/* Level badge + title */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors flex-1">
                      {course.title}
                    </h3>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight shrink-0 ${lvl.cls}`}>
                      {lvl.label}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} className="text-slate-600"/> {course.duration} ngày
                    </span>
                    {course.categories && course.categories.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={12} className="text-slate-600"/>
                        {getCategoryLabel(course.categories[0])}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-600"/>
                      {new Date(course.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Tags */}
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {course.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-500 rounded-lg">
                          #{tag}
                        </span>
                      ))}
                      {course.tags.length > 3 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-600 rounded-lg">
                          +{course.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Import badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10 text-xs text-blue-400 font-bold">
                    <DownloadCloud size={13}/> Đã import từ Market
                  </div>

                  {/* Actions */}
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/plan/${course._id}`)}
                      className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                    >
                      <Play size={13} fill="currentColor"/> Vào học
                    </button>
                    <button
                      onClick={() => setConfirmCourse(course)}
                      disabled={isRemoving}
                      className="flex items-center justify-center gap-2 py-3.5 bg-red-600/10 hover:bg-red-600 border border-red-600/30 hover:border-red-600
                        text-red-400 hover:text-white rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isRemoving
                        ? <Loader2 size={13} className="animate-spin"/>
                        : <Trash2 size={13}/>}
                      Xoá
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearnerImportedCourses;
