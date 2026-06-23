import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search, Star, Users, BookOpen, X, Loader2,
  GraduationCap, SortAsc, MessageSquare, ChevronDown,
  Award, Filter, RefreshCw, UserCheck, Sparkles,
  ExternalLink, Layers, Mail, User, Trash2, Flag, AlertCircle
} from 'lucide-react';

// ─── Lý do báo cáo ────────────────────────────────────────────────────────────
const REPORT_REASONS = [
  { value: 'spam', label: '🚫 Spam / Quảng cáo' },
  { value: 'inappropriate_content', label: '🔞 Nội dung không phù hợp' },
  { value: 'wrong_information', label: '❌ Thông tin sai lệch' },
  { value: 'hate_speech', label: '🤬 Ngôn từ thù địch' },
  { value: 'other', label: '📝 Lý do khác' },
];

// ─── Modal Báo cáo Đánh giá Giáo viên ───────────────────────────────────────────
const RatingReportModal: React.FC<{ ratingId: string; onClose: (success?: boolean) => void }> = ({ ratingId, onClose }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) { setError('Vui lòng chọn lý do báo cáo.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await api.reports.create({ targetType: 'instructorRating', targetId: ratingId, reason, description });
      if (res.success) onClose(true);
      else setError(res.message || 'Đã xảy ra lỗi.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-red-500/20 rounded-3xl p-7 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
              <Flag size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-black text-base">Báo cáo Đánh giá</h3>
              <p className="text-slate-500 text-[10px] font-bold">Chọn lý do vi phạm</p>
            </div>
          </div>
          <button onClick={() => onClose()} className="p-2 hover:bg-slate-800 rounded-full text-slate-500"><X size={18} /></button>
        </div>
        <div className="space-y-2">
          {REPORT_REASONS.map(r => (
            <button key={r.value} onClick={() => setReason(r.value)}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all border
                ${reason === r.value ? 'bg-red-500/15 border-red-500/40 text-red-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {r.label}
            </button>
          ))}
        </div>
        <textarea rows={2} placeholder="Mô tả thêm (không bắt buộc)..." className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-red-500/50 resize-none" value={description} onChange={e => setDescription(e.target.value)} />
        {error && <div className="flex items-center gap-2"><AlertCircle size={13} className="text-red-400" /><p className="text-xs text-red-400">{error}</p></div>}
        <div className="flex gap-3">
          <button onClick={() => onClose()} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm">Huỷ</button>
          <button onClick={handleSubmit} disabled={!reason || submitting}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
            {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

const StarDisplay: React.FC<{ value: number; size?: number }> = ({ value, size = 16 }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        className={`transition-colors ${i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
      />
    ))}
  </div>
);

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)} className="transition-transform hover:scale-125 active:scale-110">
          <Star size={32} className={`transition-colors ${i <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
        </button>
      ))}
    </div>
  );
};

const InstructorDirectory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [allFields, setAllFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedField, setSelectedField] = useState('all');
  const [sort, setSort] = useState<'rating' | 'ratingCount' | 'name'>('rating');

  // Modal
  const [selected, setSelected] = useState<any | null>(null);
  const [allRatings, setAllRatings] = useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [myRating, setMyRating] = useState<{ stars: number; comment: string } | null>(null);
  const [ratingInput, setRatingInput] = useState({ stars: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [deletingRating, setDeletingRating] = useState(false);
  const [reportRatingId, setReportRatingId] = useState<string | null>(null);
  const [reportToast, setReportToast] = useState('');

  // Instructor's market courses sub-panel
  const [marketCourses, setMarketCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCourses, setShowCourses] = useState(false);

  useEffect(() => { loadFields(); }, []);
  useEffect(() => { loadInstructors(); }, [selectedField, sort, search]);

  const loadFields = async () => {
    try {
      const res = await api.instructorDirectory.getFields();
      if (res.success) setAllFields(res.data);
    } catch (err) { console.error(err); }
  };

  const loadInstructors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.instructorDirectory.getList({ field: selectedField, sort, search });
      if (res.success) setInstructors(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedField, sort, search]);

  const openDetail = async (instructor: any) => {
    setSelected(instructor);
    setRatingInput({ stars: 0, comment: '' });
    setRatingDone(false);
    setShowCourses(false);
    setMarketCourses([]);
    setLoadingRatings(true);
    try {
      const [ratingsRes, myRes] = await Promise.all([
        api.instructorDirectory.getRatings(instructor._id),
        api.instructorDirectory.getMyRating(instructor._id),
      ]);
      if (ratingsRes.success) setAllRatings(ratingsRes.data);
      if (myRes.success && myRes.data) {
        setMyRating(myRes.data);
        setRatingInput({ stars: myRes.data.stars, comment: myRes.data.comment || '' });
      } else { setMyRating(null); }
    } catch (err) { console.error(err); }
    finally { setLoadingRatings(false); }
  };

  const loadMarketCourses = async () => {
    if (!selected) return;
    setLoadingCourses(true);
    setShowCourses(true);
    try {
      const res = await api.market.getCoursesByInstructor(selected._id);
      if (res.success) setMarketCourses(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingCourses(false); }
  };

  const closeDetail = () => { setSelected(null); setAllRatings([]); setMyRating(null); setShowCourses(false); };

  const submitRating = async () => {
    if (!selected || ratingInput.stars === 0) return;
    try {
      setSubmitting(true);
      const res = await api.instructorDirectory.rate(selected._id, { stars: ratingInput.stars, comment: ratingInput.comment });
      if (res.success) {
        setRatingDone(true);
        setInstructors(prev => prev.map(ins =>
          ins._id === selected._id
            ? { ...ins, instructorProfile: { ...ins.instructorProfile, avgRating: res.data.avgRating, ratingCount: res.data.ratingCount } }
            : ins
        ));
        const ratingsRes = await api.instructorDirectory.getRatings(selected._id);
        if (ratingsRes.success) setAllRatings(ratingsRes.data);
      }
    } catch (err) { alert('Đánh giá thất bại, thử lại sau.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteMyRating = async () => {
    if (!selected) return;
    if (!window.confirm('Bạn có chắc muốn gỡ đánh giá này không?')) return;
    try {
      setDeletingRating(true);
      const res = await api.instructorDirectory.deleteMyRating(selected._id);
      if (res.success) {
        setMyRating(null);
        setRatingInput({ stars: 0, comment: '' });
        setRatingDone(false);
        setInstructors(prev => prev.map(ins =>
          ins._id === selected._id
            ? { ...ins, instructorProfile: { ...ins.instructorProfile, avgRating: res.data.avgRating, ratingCount: res.data.ratingCount } }
            : ins
        ));
        const ratingsRes = await api.instructorDirectory.getRatings(selected._id);
        if (ratingsRes.success) setAllRatings(ratingsRes.data);
      }
    } catch { alert('Gỡ đánh giá thất bại, thử lại sau.'); }
    finally { setDeletingRating(false); }
  };

  const resetFilters = () => { setSearch(''); setSelectedField('all'); setSort('rating'); };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Users size={28} />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
            Thư mục <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Giáo viên</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm font-medium leading-relaxed">
            Tìm kiếm giáo viên theo lĩnh vực, xem đánh giá từ cộng đồng và để lại nhận xét của bạn.
          </p>
        </header>

        {/* FILTERS */}
        <div className="bg-[#1e293b] rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input type="text" placeholder="Tìm tên giáo viên..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl pl-12 pr-5 py-3.5 text-sm outline-none focus:border-blue-500 transition-all placeholder:text-slate-600" />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
              <select value={selectedField} onChange={e => setSelectedField(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl pl-12 pr-5 py-3.5 text-sm outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                <option value="all">Tất cả lĩnh vực</option>
                {allFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            </div>
            <div className="relative">
              <SortAsc className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
              <select value={sort} onChange={e => setSort(e.target.value as any)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl pl-12 pr-5 py-3.5 text-sm outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                <option value="rating">Sắp xếp theo điểm đánh giá</option>
                <option value="ratingCount">Sắp xếp theo số lượt đánh giá</option>
                <option value="name">Sắp xếp theo tên</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            </div>
          </div>
          <div className="flex justify-between items-center pt-1">
            <p className="text-xs text-slate-500 font-medium">
              Tìm thấy <span className="text-white font-bold">{instructors.length}</span> giáo viên
            </p>
            <button onClick={resetFilters} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors font-bold">
              <RefreshCw size={13} /> Đặt lại
            </button>
          </div>
        </div>

        {/* FIELD CHIPS */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <button onClick={() => setSelectedField('all')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedField === 'all' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1e293b] border-slate-700 text-slate-400 hover:border-slate-600'}`}>
            Tất cả
          </button>
          {allFields.map(f => (
            <button key={f} onClick={() => setSelectedField(f)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedField === f ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1e293b] border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* GRID */}
        {loading ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Đang tải danh sách...</p>
          </div>
        ) : instructors.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <UserCheck size={64} className="text-slate-700" />
            <p className="text-slate-500 font-bold">Chưa có giáo viên nào trong lĩnh vực này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {instructors.map(ins => {
              const avg = ins.instructorProfile?.avgRating || 0;
              const count = ins.instructorProfile?.ratingCount || 0;
              const fields: string[] = ins.instructorProfile?.teachingFields || [];
              return (
                <div key={ins._id} onClick={() => openDetail(ins)}
                  className="bg-[#1e293b] rounded-3xl border border-slate-800 p-6 cursor-pointer hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300 shadow-xl group flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xl font-black shadow-lg group-hover:shadow-blue-900/40 transition-all shrink-0">
                      {ins.fullName?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-base leading-tight truncate group-hover:text-blue-400 transition-colors">{ins.fullName}</p>
                      {ins.instructorProfile?.specialization && (
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{ins.instructorProfile.specialization}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-[#0f172a]/60 rounded-2xl px-4 py-3">
                    <div className="flex flex-col">
                      <StarDisplay value={avg} size={14} />
                      <p className="text-[10px] text-slate-500 font-bold mt-1">{count} lượt đánh giá</p>
                    </div>
                    <span className={`text-2xl font-black ${avg >= 4 ? 'text-amber-400' : avg >= 3 ? 'text-yellow-500' : 'text-slate-500'}`}>
                      {avg > 0 ? avg.toFixed(1) : '—'}
                    </span>
                  </div>
                  {fields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fields.slice(0, 4).map(f => (
                        <span key={f} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">{f}</span>
                      ))}
                      {fields.length > 4 && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-700 text-slate-400">+{fields.length - 4}</span>
                      )}
                    </div>
                  )}
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest group-hover:text-blue-400 flex items-center gap-1 mt-auto">
                    Xem chi tiết <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ MODAL CHI TIẾT ═══ */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e293b] w-full max-w-2xl rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Modal Header */}
            <div className="p-8 border-b border-slate-800 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-black shadow-lg shrink-0">
                    {selected.fullName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{selected.fullName}</h2>
                    {selected.instructorProfile?.specialization && (
                      <p className="text-blue-400 text-sm font-bold mt-0.5">{selected.instructorProfile.specialization}</p>
                    )}
                    {selected.email && (
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                        <Mail size={11} /> {selected.email}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <StarDisplay value={selected.instructorProfile?.avgRating || 0} size={15} />
                      <span className="text-slate-400 text-xs font-bold">
                        {(selected.instructorProfile?.avgRating || 0).toFixed(1)} · {selected.instructorProfile?.ratingCount || 0} đánh giá
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={closeDetail} className="p-2.5 hover:bg-slate-800 rounded-2xl transition-all shrink-0">
                  <X size={22} />
                </button>
              </div>

              {/* Nút xem khóa học trên Market */}
              <button
                onClick={e => { e.stopPropagation(); showCourses ? setShowCourses(false) : loadMarketCourses(); }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl text-sm font-black transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              >
                <Layers size={16} />
                {showCourses ? 'Ẩn khóa học' : 'Xem khóa học trên Market'}
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

              {/* Khóa học trên Market */}
              {showCourses && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={12} /> Khóa học công khai ({marketCourses.length})
                  </h3>
                  {loadingCourses ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-500" size={28} /></div>
                  ) : marketCourses.length === 0 ? (
                    <p className="text-center text-slate-600 text-sm py-4">Giáo viên chưa có khóa học nào trên Market.</p>
                  ) : (
                    <div className="space-y-2">
                      {marketCourses.map((c: any) => (
                        <div key={c._id}
                          onClick={() => navigate('/market')}
                          className="flex items-center justify-between bg-[#0f172a]/60 rounded-2xl border border-slate-800 px-5 py-4 hover:border-indigo-500/40 cursor-pointer transition-all group">
                          <div className="flex items-center gap-3">
                            <BookOpen size={16} className="text-indigo-400 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{c.title}</p>
                              <p className="text-[10px] text-slate-500">{c.duration} ngày · {c.level}</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bio */}
              {selected.instructorProfile?.bio && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} /> Giới thiệu
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed bg-[#0f172a]/60 rounded-2xl p-5 border border-slate-800">
                    {selected.instructorProfile.bio}
                  </p>
                </div>
              )}

              {/* Lĩnh vực */}
              {(selected.instructorProfile?.teachingFields || []).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Award size={12} /> Lĩnh vực giảng dạy
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.instructorProfile.teachingFields.map((f: string) => (
                      <span key={f} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs font-bold">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating form */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Star size={12} /> {myRating ? 'Cập nhật đánh giá của bạn' : 'Đánh giá giáo viên này'}
                </h3>
                {ratingDone ? (
                  <div className="flex flex-col items-center gap-3 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                    <Sparkles size={32} className="text-emerald-400" />
                    <p className="font-black text-emerald-400">Cảm ơn bạn đã đánh giá!</p>
                    <StarDisplay value={ratingInput.stars} size={20} />
                    <button onClick={handleDeleteMyRating} disabled={deletingRating}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                      {deletingRating ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Gỡ đánh giá
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#0f172a]/60 rounded-2xl border border-slate-800 p-6 space-y-5">
                    <div className="flex flex-col items-center gap-3">
                      <StarPicker value={ratingInput.stars} onChange={v => setRatingInput(p => ({ ...p, stars: v }))} />
                      {ratingInput.stars > 0 && (
                        <p className="text-sm font-bold text-amber-400">
                          {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][ratingInput.stars]}
                        </p>
                      )}
                    </div>
                    <textarea value={ratingInput.comment}
                      onChange={e => setRatingInput(p => ({ ...p, comment: e.target.value }))}
                      placeholder="Nhận xét về giáo viên (tùy chọn)..." rows={3}
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 resize-none" />
                    <div className="flex gap-3">
                      <button onClick={submitRating} disabled={submitting || ratingInput.stars === 0}
                        className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} className="fill-white" />}
                        {myRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                      </button>
                      {myRating && (
                        <button onClick={handleDeleteMyRating} disabled={deletingRating}
                          className="px-4 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center"
                          title="Gỡ đánh giá">
                          {deletingRating ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Đánh giá cộng đồng */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={12} /> Đánh giá từ cộng đồng ({allRatings.length})
                </h3>
                {loadingRatings ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-500" size={28} /></div>
                ) : allRatings.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-sm font-medium">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
                ) : (
                  <div className="space-y-3">
                    {allRatings.map((r: any) => {
                      const isMyReview = r.learner?._id === user?.id || r.learner?.id === user?.id;
                      return (
                        <div key={r._id} className={`bg-[#0f172a]/60 rounded-2xl border p-5 space-y-2 ${
                          isMyReview ? 'border-amber-500/30' : 'border-slate-800'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-xs font-black">
                                {r.learner?.fullName?.[0]?.toUpperCase() || 'N'}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-slate-300">{r.learner?.fullName || 'Người dùng đã xoá'}</span>
                                {isMyReview && (
                                  <span className="ml-2 text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">Bạn</span>
                                )}
                              </div>
                            </div>
                          <div className="flex items-center gap-2">
                              <StarDisplay value={r.stars} size={13} />
                              {isMyReview ? (
                                <button
                                  onClick={handleDeleteMyRating}
                                  disabled={deletingRating}
                                  title="Gỡ đánh giá của bạn"
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 rounded-lg transition-all disabled:opacity-50"
                                >
                                  {deletingRating ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setReportRatingId(r._id)}
                                  title="Báo cáo đánh giá vi phạm"
                                  className="p-1.5 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/15 text-slate-600 hover:text-orange-400 rounded-lg transition-all"
                                >
                                  <Flag size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                          {r.comment && <p className="text-slate-400 text-sm leading-relaxed pl-10">{r.comment}</p>}
                          <p className="text-[10px] text-slate-600 pl-10">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal cho InstructorRating */}
      {reportRatingId && (
        <RatingReportModal
          ratingId={reportRatingId}
          onClose={(success) => {
            setReportRatingId(null);
            if (success) {
              setReportToast('✅ Đã gửi báo cáo. Cảm ơn bạn!');
              setTimeout(() => setReportToast(''), 4000);
            }
          }}
        />
      )}
      {reportToast && (
        <div className="fixed bottom-6 right-6 z-[400] px-5 py-3.5 bg-emerald-950 border border-emerald-500/30 text-emerald-300 rounded-2xl text-sm font-bold shadow-2xl">
          {reportToast}
        </div>
      )}
    </div>
  );
};

export default InstructorDirectory;
