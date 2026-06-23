import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import {
  Search, RotateCcw,
  DownloadCloud, X, BookOpen,
  Layers, Info, Loader2, Sparkles, User,
  CheckCircle2, AlertTriangle, Star,
  ChevronLeft, ChevronRight, TrendingUp, Compass,
  MessageSquare, Flag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReviewSection from '../../components/shared/ReviewSection';
import { useAuth } from '../../context/AuthContext';
import { MARKET_CATEGORIES } from '../../utils/marketConstants';

// ─── Lý do báo cáo ────────────────────────────────────────────────────────────
const REPORT_REASONS = [
  { value: 'spam', label: '🚫 Spam / Quảng cáo' },
  { value: 'inappropriate_content', label: '🔞 Nội dung không phù hợp' },
  { value: 'wrong_information', label: '❌ Thông tin sai lệch' },
  { value: 'hate_speech', label: '🤬 Ngôn từ thù địch' },
  { value: 'copyright', label: '©️ Vi phạm bản quyền' },
  { value: 'other', label: '📝 Lý do khác' },
];

// ─── Modal Báo cáo Khóa học ───────────────────────────────────────────────────
const CourseReportModal = ({ courseId, onClose }: { courseId: string; onClose: (success?: boolean) => void }) => {
  const [reason, setReason] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async () => {
    if (!reason) {
      setError('Vui lòng chọn lý do báo cáo.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.reports.create({ targetType: 'course', targetId: courseId, reason, description });
      if (res.success) onClose(true);
      else setError(res.message || 'Đã xảy ra lỗi.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4">

      {/* Nội dung modal */}
      <div className="bg-[#0d1117] border border-red-500/20 rounded-3xl p-7 max-w-md w-full shadow-2xl space-y-5">

        {/* Phần đầu modal */}
        <div className="flex items-center justify-between">

          {/* Icon báo cáo và tiêu đề */}
          <div className="flex items-center gap-3">
            {/* Icon báo cáo  */}
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
              <Flag size={18} className="text-red-400" />
            </div>

            {/* Tiêu đề báo cáo */}
            <div>
              <h3 className="text-white font-black text-base">Báo cáo Khóa học</h3>
              <p className="text-slate-500 text-[10px] font-bold">Chọn lý do vi phạm</p>
            </div>

          </div>
          {/* Icon đóng */}
          <button onClick={() => onClose()} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors"> <X size={18} /></button>
        </div>

        {/* Phần chọn lý do */}
        <div className="space-y-2">

          {/* Danh sách các lý do báo cáo */}
          {REPORT_REASONS.map(r => (
            <button key={r.value} onClick={() => setReason(r.value)}

              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all border
                ${reason === r.value ? 'bg-red-500/15 border-red-500/40 text-red-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {r.label}
            </button>

          ))}
        </div>

        <textarea rows={2} placeholder="Mô tả thêm (không bắt buộc)..." className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-red-500/50 resize-none" value={description} onChange={e => setDescription(e.target.value)} />

        {error && <p className="text-xs text-blue-400">{error}</p>}

        {/* Nút gửi và hủy */}
        <div className="flex gap-3">
          <button onClick={() => onClose()} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm transition-colors">Huỷ</button>
          <button onClick={handleSubmit} disabled={!reason || submitting} className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
            {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border transition-all animate-in slide-in-from-bottom-4 duration-300
    ${type === 'success' ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300' : 'bg-red-950 border-red-500/30 text-red-300'}`}>
    {type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
    <span className="text-sm font-bold">{message}</span>
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmImportModal = ({ course, onConfirm, onCancel, loading }: {
  course: any; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
    <div className="bg-[#0d1117] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
      <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <DownloadCloud size={28} className="text-blue-400" />
      </div>
      <h3 className="text-white font-black text-lg mb-2">Lấy lộ trình này?</h3>
      <p className="text-slate-400 text-sm mb-1 font-bold">{course?.title}</p>
      <p className="text-slate-600 text-xs mb-6">Lộ trình sẽ được thêm vào mục "Khoá học đã lấy về" của bạn.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-sm transition-colors">Huỷ</button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
          Lấy ngay
        </button>
      </div>
    </div>
  </div>
);

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-[#0d1117] border border-white/5 rounded-[2.5rem] overflow-hidden animate-pulse">
    <div className="aspect-video bg-white/3" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-white/5 rounded-lg w-3/4" />
      <div className="h-4 bg-white/5 rounded-lg w-1/2" />
      <div className="h-px bg-white/5 my-3" />
      <div className="flex gap-2"><div className="h-9 bg-white/5 rounded-xl flex-1" /><div className="h-9 bg-white/5 rounded-xl flex-1" /></div>
    </div>
  </div>
);

const Market = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null); // Ref để điều khiển Carousel

  const [courses, setCourses] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [confirmCourse, setConfirmCourse] = useState<any>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [reportCourseId, setReportCourseId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    instructorSearch: '',
    category: 'all',
    level: 'all',
    sort: 'newest'
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Hàm cuộn Carousel
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // 2. Lấy đề cử
  const fetchRecommendations = async () => {
    try {
      setLoadingRecs(true);
      const res = await api.market.getRecommendations();
      if (res.success) setRecs(res.data.courses || []);
    } catch (err) {
      console.error("Lỗi lấy đề cử:", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  // 3. Lấy danh sách chính
  const fetchMarketCourses = useCallback(async (pageToFetch = 1) => {
    try {
      setLoading(true);
      const params: any = { page: pageToFetch, limit: 12, isPublic: true };
      if (filters.search) params.search = filters.search;
      if (filters.instructorSearch) params.instructorSearch = filters.instructorSearch;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.level !== 'all') params.level = filters.level;

      const res = await api.market.getCourses(params);
      if (res.success) {
        setCourses(res.data.courses || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCourses(res.data.total || 0);
        setCurrentPage(res.data.currentPage || pageToFetch);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách Market:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecommendations();
    fetchMarketCourses(1);
  }, [filters, fetchMarketCourses]);

  const handleOpenPreview = async (course: any) => {
    setSelectedCourse(course);
    setLoadingPreview(true);
    try {
      // Tải Syllabus của khóa học
      const previewRes = await api.market.getPreview(course._id);
      if (previewRes.success) setPreviewData(previewRes.data);
    } catch (err) {
      showToast('Không thể tải dữ liệu.', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchMarketCourses(page);
  };

  const handleImport = async (id: string) => {
    if (isImporting) return;
    const course = courses.find(c => c._id === id) || recs.find(c => c._id === id) || selectedCourse;
    setConfirmCourse(course);
  };

  const doImport = async () => {
    if (!confirmCourse || isImporting) return;
    setIsImporting(true);
    try {
      const res = await api.market.importCourse(confirmCourse._id);
      if (res.success) {
        setConfirmCourse(null);
        setPreviewData(null);
        showToast('🎉 Lấy lộ trình thành công! Đang chuyển về Lộ trình học...');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) { showToast('Lỗi khi sao chép lộ trình.', 'error'); }
    finally { setIsImporting(false); }
  };

  const resetFilters = () => setFilters({ search: '', instructorSearch: '', category: 'all', level: 'all', sort: 'newest' });
  const isFiltering = filters.search || filters.instructorSearch || filters.category !== 'all' || filters.level !== 'all';

  return (
    <>
      <div className="p-6 lg:p-10 space-y-12 text-white min-h-screen bg-[#0f172a]">
        {/* HEADER */}
        <header className="space-y-3 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <TrendingUp size={12} /> Marketplace Cộng đồng
          </div>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter flex items-center justify-center gap-3 text-white">
            <Sparkles className="text-blue-500" size={48} /> AI Course Market
          </h1>
          <p className="text-slate-400 font-medium text-sm lg:text-base max-w-xl mx-auto leading-relaxed">
            Khám phá tri thức từ chuyên gia. Hệ thống đề cử lộ trình học phù hợp nhất dựa trên sở thích của bạn.
          </p>
        </header>

        {/* PHẦN 1: 🌟 GỢI Ý DÀNH CHO BẠN */}
        {!isFiltering && recs.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black italic flex items-center gap-3 text-white">
                <Star className="text-amber-400 fill-amber-400" size={24} /> Gợi ý dành cho bạn
              </h2>
              <div className="flex gap-2">
                <button onClick={() => scroll('left')} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all"><ChevronLeft size={20} /></button>
                <button onClick={() => scroll('right')} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>

            <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
              {loadingRecs ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="min-w-[320px] h-[250px] bg-white/5 rounded-[2.5rem] animate-pulse" />)
              ) : (
                recs.map((course) => (
                  <div key={course._id} className="min-w-[320px] md:min-w-[420px] snap-start bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2.5rem] border border-blue-500/10 hover:border-blue-500/40 transition-all p-8 relative overflow-hidden group shadow-2xl flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Sparkles size={100} /></div>
                    <div className="relative z-10 space-y-5">
                      <div className="flex justify-between items-start">
                        <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest">Gợi ý AI</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase">{course.duration} ngày học</span>
                      </div>
                      {course.categories && course.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {course.categories.map((cat: string) => {
                            const found = MARKET_CATEGORIES.find(c => c.value === cat);
                            return (
                              <span key={cat} className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold">
                                {found ? found.label : cat}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <h3 className="text-2xl font-black leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">{course.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <Compass size={14} className="text-emerald-500" />
                          <span>{course.studentCount || 0} học viên</span>
                        </div>
                        {course.avgRating > 0 && (
                          <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
                            <Star size={12} className="fill-amber-400" />
                            <span>{course.avgRating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative z-10 flex gap-2 mt-8">
                      <button onClick={() => handleOpenPreview(course)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase transition-all border border-white/10">Khái quát</button>
                      <button onClick={() => handleImport(course._id)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2"><DownloadCloud size={14} /> Lấy ngay</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* PHẦN 2: BỘ LỌC & DANH SÁCH TẤT CẢ */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black italic flex items-center gap-3 px-2">
            <Layers className="text-blue-500" size={24} /> {isFiltering ? 'Kết quả tìm kiếm' : 'Tất cả lộ trình'}
          </h2>

          {/* BỘ LỌC */}
          <div className="bg-[#1e293b]/50 p-6 rounded-[2.5rem] border border-slate-800 backdrop-blur-md shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Tên khóa học</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500" size={18} />
                  <input type="text" placeholder="Tìm tên..." className="w-full bg-[#0f172a] border border-slate-700 p-3.5 pl-12 rounded-2xl outline-none focus:border-blue-500 text-sm transition-all" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-1">Giảng viên hướng dẫn</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400" size={18} />
                  <input type="text" placeholder="Tên / Email..." className="w-full bg-[#0f172a] border border-slate-700 p-3.5 pl-12 rounded-2xl outline-none focus:border-violet-500 text-sm transition-all" value={filters.instructorSearch} onChange={(e) => setFilters({ ...filters, instructorSearch: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Danh mục</label>
                <select className="w-full bg-[#0f172a] border border-slate-700 p-3.5 rounded-2xl outline-none text-sm cursor-pointer appearance-none animate-none" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                  <option value="all">Tất cả danh mục</option>
                  {MARKET_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest ml-1">Cấp độ</label>
                <div className="flex gap-2">
                  <select className="flex-1 bg-[#0f172a] border border-slate-700 p-3.5 rounded-2xl outline-none text-sm appearance-none" value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
                    <option value="all">Tất cả</option>
                    <option value="Easy">Cơ bản</option>
                    <option value="Medium">Trung bình</option>
                    <option value="Hard">Nâng cao</option>
                  </select>
                  <button onClick={resetFilters} className="bg-slate-800 hover:bg-red-500/20 hover:text-red-400 p-3.5 rounded-2xl transition-all border border-slate-700"><RotateCcw size={18} /></button>
                </div>
              </div>
            </div>
          </div>

          {/* GRID KẾT QUẢ */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {courses.map((course) => (
                <div key={course._id} className="bg-[#1e293b] rounded-[2.5rem] overflow-hidden border border-slate-800 group hover:border-blue-500/50 transition-all shadow-xl flex flex-col hover:-translate-y-1 duration-300">
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center overflow-hidden">
                    <BookOpen size={48} className="text-slate-700 group-hover:text-blue-500/50 transition-colors" />
                    <span className={`absolute top-4 right-4 text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-tighter shadow-lg
                    ${course.level === 'Hard' ? 'bg-red-500/20 text-red-400' : course.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {course.level}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <div className="flex-1 space-y-2">
                      {course.categories && course.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {course.categories.map((cat: string) => {
                            const found = MARKET_CATEGORIES.find(c => c.value === cat);
                            return (
                              <span key={cat} className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                                {found ? found.label : cat}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">{course.title}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-500 text-[10px] font-bold uppercase">{course.duration} ngày học</p>
                        {course.avgRating > 0 && (
                          <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                            <Star size={10} fill="currentColor" /> {course.avgRating}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* MENTOR INFO */}
                    {course.instructorId && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                        <CheckCircle2 size={12} className="text-purple-400 shrink-0" />
                        <span className="text-[9px] text-purple-300 font-bold uppercase truncate">Mentor: {course.instructorId.fullName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                      <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] border border-slate-700">{course.owner?.fullName?.[0]}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter leading-none">Tạo bởi</p>
                        <p className="text-[11px] text-slate-300 font-black truncate">{course.owner?.fullName}</p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black">
                        <Compass size={10} /> {course.studentCount}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleOpenPreview(course)} className="py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase transition-all">Khái quát</button>
                      <button onClick={() => handleImport(course._id)} className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Lấy bài</button>
                    </div>
                    <button
                      onClick={() => setReportCourseId(course._id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold text-slate-600 hover:text-orange-400 hover:bg-orange-400/5 rounded-xl transition-all border border-transparent hover:border-orange-400/20"
                    >
                      <Flag size={10} /> Báo cáo vi phạm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-12 pt-6 border-t border-white/5">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 disabled:opacity-20 hover:bg-slate-700 transition-all"><ChevronLeft size={20} /></button>
              <div className="bg-slate-800 px-6 h-12 rounded-2xl flex items-center justify-center font-black text-sm tracking-widest border border-white/5">
                TRANG {currentPage} / {totalPages}
              </div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 disabled:opacity-20 hover:bg-slate-700 transition-all"><ChevronRight size={20} /></button>
            </div>
          )}
        </section>
      </div>

      {/* MODAL PREVIEW (Đã tích hợp Review đúng cách) */}
      {previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-2xl h-[90vh] rounded-[3rem] p-10 border border-slate-700 shadow-2xl space-y-8 flex flex-col">
            <div className="flex justify-between items-start shrink-0">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white leading-tight">{selectedCourse?.title}</h3>
                <p className="text-blue-500 text-xs font-black uppercase tracking-widest">Cấu trúc lộ trình {selectedCourse?.duration} ngày</p>
              </div>
              <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-10 pr-2 custom-scrollbar">
              <div className="space-y-3">
                {previewData.map((item: any) => (
                  <div key={item._id} className="p-4 bg-[#0f172a]/50 rounded-2xl border border-slate-800 flex items-center gap-4 group hover:border-blue-500/50 transition-all">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-blue-500 border border-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all">{item.dayNumber}</span>
                    <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item.title}</p>
                  </div>
                ))}
              </div>

              {/* PHẦN ĐÁNH GIÁ & BÌNH LUẬN */}
              <div className="border-t border-slate-800 pt-8">
                <ReviewSection
                  planId={selectedCourse?._id}
                  userId={user?.id || ''}
                />
              </div>
            </div>

            <div className="space-y-3 shrink-0 pt-4 border-t border-slate-800">
              <button onClick={() => handleImport(selectedCourse?._id)} disabled={isImporting} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40">
                {isImporting ? <Loader2 className="animate-spin" /> : <DownloadCloud size={24} />} Lấy lộ trình ngay
              </button>
              <button
                onClick={() => selectedCourse && setReportCourseId(selectedCourse._id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold text-slate-600 hover:text-orange-400 hover:bg-orange-400/5 rounded-2xl transition-all border border-transparent hover:border-orange-400/20"
              >
                <Flag size={13} /> Báo cáo vi phạm
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCourse && <ConfirmImportModal course={confirmCourse} onConfirm={doImport} onCancel={() => setConfirmCourse(null)} loading={isImporting} />}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {reportCourseId && (
        <CourseReportModal
          courseId={reportCourseId}
          onClose={(success) => {
            setReportCourseId(null);
            if (success) showToast('✅ Đã gửi báo cáo. Cảm ơn bạn!', 'success');
          }}
        />
      )}
    </>
  );
};

export default Market;