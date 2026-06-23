import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Play, GraduationCap, Clock,
  TrendingUp, Plus, Star, Inbox, CheckCircle,
  Sparkles, X, AlertCircle, Loader2, PenSquare,
} from 'lucide-react';
import CourseActionMenu from '../../components/shared/CourseActionMenu';
import { useAuth } from '../../context/AuthContext';

// ── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-[#0d1117] border border-white/5 rounded-[2rem] p-6 animate-pulse space-y-5">
    <div className="flex justify-between">
      <div className="w-8 h-8 bg-white/5 rounded-xl" />
      <div className="w-16 h-5 bg-white/5 rounded-lg" />
    </div>
    <div className="space-y-2">
      <div className="h-5 bg-white/5 rounded-lg w-3/4" />
      <div className="h-4 bg-white/5 rounded-lg w-1/2" />
    </div>
    <div className="h-10 bg-white/5 rounded-xl" />
  </div>
);

// ── Modal Tạo thủ công ────────────────────────────────────────────────────────
interface ManualModalProps {
  onClose: () => void;
  onCreated: (planId: string) => void;
}
const ManualCourseModal: React.FC<ManualModalProps> = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề khoá học.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await (api.instructor as any).createManualCourse({ title: title.trim(), duration });
      if (res.success) onCreated(res.data.planId);
      else setError(res.message || 'Tạo khoá học thất bại.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0d1117] border border-white/10 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <PenSquare size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Tạo khoá học thủ công</h2>
              <p className="text-xs text-slate-500">Khung bài học rỗng, bạn tự soạn nội dung</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Tiêu đề khoá học</label>
            <input
              id="manual-course-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ví dụ: Lập trình Python cơ bản"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-400">Số ngày học</label>
              <span className="text-emerald-400 font-black text-sm">{duration} ngày</span>
            </div>
            <input
              id="manual-course-duration"
              type="range"
              min={1} max={30} step={1}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>1 ngày</span><span>30 ngày</span>
            </div>
          </div>

          {/* Preview skeleton */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              Bộ khung bài học ({duration} bài rỗng)
            </label>
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5">
              {Array.from({ length: duration }, (_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-white/3">
                  <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-500">{i + 1}</span>
                  <span className="text-xs text-slate-500 italic">Ngày {i + 1} — (Chưa có nội dung)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/15 rounded-xl px-4 py-3">
              <AlertCircle size={15} />{error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-bold transition-all">
              Huỷ
            </button>
            <button
              id="manual-course-save"
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Đang tạo...</> : <><Plus size={15} /> Lưu khoá học</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Tab type ──────────────────────────────────────────────────────────────────
type TabKey = 'submitted' | 'self' | 'reviewed';

// ── Main ──────────────────────────────────────────────────────────────────────
const InstructorCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('submitted');
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.instructor.getMyCourses();
      if (res.success) {
        setCourses(res.data);

        // DEBUG: kiểm tra tab Học viên gửi
        const submitted = res.data.filter((c: any) => {
          if (String(c.owner?._id || '') === String(user?.id || '')) return false;
          if (c.status === 'teaching') return true;
          return false;
        });

        console.log('=== DEBUG getMyCourses ===');
        console.log('Total courses:', res.data.length);
        console.log('studentSubmitted count:', submitted.length);
        res.data.forEach((c: any) => {
          console.log({
            id: c._id,
            title: c.title,
            owner: c.owner,
            instructorId: c.instructorId,
            status: c.status,
            sourceType: c.sourceType,
            originalPlanId: c.originalPlanId,
          });
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  
  // ── Tab 1: Học viên gửi (Đang chờ duyệt) ──
  // Điều kiện: Bạn là instructorId VÀ owner KHÔNG PHẢI là bạn VÀ status là 'teaching'
  // InstructorCourses.tsx

// 1. Tab: Học viên gửi (Đang cần giảng viên duyệt/sửa)
const studentSubmitted = courses.filter((c) => 
  // Bạn là giảng viên
  String(c.instructorId || '') === String(user?.id || '') && 
  // Bạn KHÔNG PHẢI là chủ sở hữu (Chủ là sinh viên)
  String(c.owner?._id || String(c.owner) || '') !== String(user?.id || '') &&
  // Trạng thái đang giảng dạy
  c.status === 'teaching'
);

// 2. Tab: Khoá học tự tạo (Kho riêng của giảng viên)
const selfCourses = courses.filter((c) => 
  // Bạn PHẢI là chủ sở hữu
  String(c.owner?._id || String(c.owner) || '') === String(user?.id || '') &&
  // Loại bỏ các bản clone trung gian nếu có
  (c.sourceType === 'manual' || c.sourceType === 'self' || !c.originalPlanId) &&
  // Không hiển thị các khóa đang ở trạng thái 'teaching' của học viên khác
  c.status !== 'teaching' &&
  // Ẩn các bản clone đang trên chợ
  !c.isPublic
);

// 3. Tab: Đã qua chỉnh sửa (Các khóa đã xong và gửi lại sinh viên)
const reviewedCourses = courses.filter((c) => 
  String(c.instructorId || '') === String(user?.id || '') && 
  String(c.owner?._id || String(c.owner) || '') !== String(user?.id || '') &&
  c.status === 'reviewed'
);
  const tabMap: Record<TabKey, any[]> = {
    submitted: studentSubmitted,
    self: selfCourses,
    reviewed: reviewedCourses,
  };
  const displayCourses = tabMap[activeTab];

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    { key: 'submitted', label: 'Học viên gửi', icon: <Inbox size={15} />, count: studentSubmitted.length, color: 'purple' },
    { key: 'self', label: 'Khoá học tự tạo', icon: <Sparkles size={15} />, count: selfCourses.length, color: 'emerald' },
    { key: 'reviewed', label: 'Đã qua chỉnh sửa', icon: <CheckCircle size={15} />, count: reviewedCourses.length, color: 'blue' },
  ];

  const colorMap: Record<string, { active: string; badge: string; underline: string }> = {
    purple: { active: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400', underline: 'bg-purple-500' },
    emerald: { active: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400', underline: 'bg-emerald-500' },
    blue: { active: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400', underline: 'bg-blue-500' },
  };

  // Khi tạo thành công → chuyển đến dashboard + reload
  const handleCreated = (planId: string) => {
    setShowModal(false);
    fetchCourses();
    navigate(`/instructor/course/${planId}`);
  };

  return (
    <div className="p-8 space-y-8 text-white min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">Giảng viên</p>
          <h1 className="text-3xl font-black tracking-tight">Khoá học đang hướng dẫn</h1>
          <p className="text-slate-500 text-sm mt-1.5">Quản lý nội dung và theo dõi tiến độ học viên.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tạo thủ công — tạm ẩn */}
          {/* <button
            id="btn-create-manual-course"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 active:scale-95 border border-emerald-500/30"
          >
            <PenSquare size={16} /> Tạo thủ công
          </button> */}
          {/* Tạo lộ trình AI — tạm ẩn */}
          {/* <button
            onClick={() => navigate('/create-plan')}
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-purple-900/30 active:scale-95"
          >
            <Plus size={18} /> Tạo lộ trình AI
          </button> */}
        </div>
      </div>

      {/* ── Stats Banner ── */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: <BookOpen size={20} className="text-purple-400" />,
              label: 'Danh sách khoá học',
              // Đếm tổng từ 3 tab đã lọc, không dùng courses.length
              value: studentSubmitted.length + selfCourses.length + reviewedCourses.length,
              color: 'bg-purple-500/5 border-purple-500/15'
            },
            { icon: <Users size={20} className="text-blue-400" />, label: 'Tổng học viên', value: totalStudents, color: 'bg-blue-500/5 border-blue-500/15' },
            {
              icon: <Star size={20} className="text-amber-400" />,
              label: 'Trên Marketplace',
              value: courses.filter(c => c.isPublic).length,
              color: 'bg-amber-500/5 border-amber-500/15'
            },
          ].map((stat, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${stat.color}`}>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">{stat.icon}</div>
              <div>
                <p className="text-2xl font-black text-white leading-none">{stat.value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6 border-b border-white/5 pb-px">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          const c = colorMap[tab.color];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 pb-4 px-2 text-sm font-bold transition-all relative ${isActive ? c.active : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full font-black ${isActive ? c.badge : 'bg-white/5 text-slate-400'
                }`}>
                {tab.count}
              </span>
              {isActive && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${c.underline} rounded-full`} />}
            </button>
          );
        })}
      </div>

      {/* ── Mô tả tab ── */}
      {activeTab === 'self' && (
        <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
          <Sparkles size={16} className="text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-400">Khoá học tự tạo</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Bao gồm khoá học bạn tạo thủ công và khoá học từ tài khoản học viên của bạn gửi sang.
            </p>
          </div>
        </div>
      )}

      {/* ── Course Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : displayCourses.length > 0 ? (
          displayCourses.map((course) => (
            <div
              key={course._id}
              className="bg-[#0d1117] border border-white/5 hover:border-purple-500/30 rounded-[2rem] p-6 transition-all group shadow-xl relative overflow-hidden hover:-translate-y-0.5 duration-200"
            >
              {/* BG Decor */}
              <div className="absolute -right-6 -top-6 text-purple-500/5 group-hover:text-purple-500/10 transition-colors duration-300">
                <GraduationCap size={100} />
              </div>

              <div className="relative z-10 space-y-5">
                {/* Top */}
                <div className="flex justify-between items-start">
                  <div onClick={(e) => e.stopPropagation()}>
                    <CourseActionMenu plan={course} onRefresh={fetchCourses} />
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {/* Badge sourceType: Thủ công */}
                    {course.sourceType === 'manual' && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/15">
                        Thủ công
                      </span>
                    )}

                    {/* ❌ XOÁ TOÀN BỘ BLOCK BADGE STATUS (Bản gốc / Đang chỉnh sửa / Đã gửi học viên) */}

                    {/* Badge level */}
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border
      ${course.level === 'Hard'
                        ? 'bg-red-500/10 text-red-400 border-red-500/15'
                        : course.level === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'}`}>
                      {course.level || 'Medium'}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-bold mb-1.5 line-clamp-2 group-hover:text-purple-400 transition-colors leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                    <Users size={12} className="text-slate-600" />
                    {String(course.owner?._id || '') === String(user?.id || '')
                      ? 'Khoá học của bạn'
                      : `Chủ sở hữu: ${course.owner?.fullName || 'Học viên'}`}
                  </p>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 py-3 border-t border-b border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                    <Clock size={13} className="text-slate-600" />
                    {course.duration} ngày
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <TrendingUp size={13} className="text-emerald-500" />
                    <span className="text-emerald-400">{course.studentCount || 0} học viên</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate(`/instructor/course/${course._id}`)}
                  className="w-full py-3 bg-white/5 hover:bg-purple-600 border border-white/5 hover:border-purple-500 text-slate-300 hover:text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  Quản lý khoá học <Play size={14} fill="currentColor" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center rounded-[2.5rem] border border-dashed border-white/8 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
              {activeTab === 'submitted' ? <Inbox size={28} className="text-slate-500" />
                : activeTab === 'self' ? <Sparkles size={28} className="text-slate-500" />
                  : <CheckCircle size={28} className="text-slate-500" />}
            </div>
            <div>
              <p className="text-slate-400 font-bold">
                {activeTab === 'submitted' ? 'Không có khoá học học viên gửi đang chờ.'
                  : activeTab === 'self' ? 'Bạn chưa có khoá học tự tạo nào.'
                    : 'Không có khoá học nào đã qua chỉnh sửa.'}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {activeTab === 'submitted'
                  ? 'Khi học viên đăng ký lộ trình của bạn làm hướng dẫn, nó sẽ xuất hiện ở đây.'
                  : activeTab === 'self'
                    ? 'Nhấn "Tạo thủ công" để soạn khoá học riêng hoặc tạo lộ trình AI từ tài liệu.'
                    : 'Hãy xem qua các lộ trình học viên gửi và hoàn tất chỉnh sửa để gửi lại.'}
              </p>
            </div>
            {activeTab === 'self' && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all"
              >
                <PenSquare size={16} /> Tạo thủ công ngay
              </button>
            )}
            {activeTab === 'reviewed' && (
              <button
                onClick={() => navigate('/create-plan')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm transition-all"
              >
                <Plus size={16} /> Tạo lộ trình ngay
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Modal Tạo thủ công ── */}
      {showModal && (
        <ManualCourseModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default InstructorCourses;