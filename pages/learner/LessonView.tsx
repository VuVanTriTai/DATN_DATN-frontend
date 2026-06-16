import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  BookOpen, CheckSquare, Star, Trophy,
  MessageCircle, ArrowLeft, Loader2, CheckCircle,
  AlertTriangle, Video, UploadCloud, Download, FileText,
  X, Sparkles, BookMarked, ExternalLink, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AIChatBox from '../../components/ai/AIChatBox';

// ─── Low Score Modal ──────────────────────────────────────────────────────────
interface SuggestedCourse {
  _id: string;
  title: string;
  topic?: string;
  level?: string;
  categories?: string[];
  owner?: { fullName: string; email: string };
  duration?: number;
}

const LowScoreModal: React.FC<{
  score: number;
  total: number;
  percentage: number;
  lessonTitle?: string;
  planTopic?: string;
  onClose: () => void;
  onGoToMarket: () => void;
}> = ({ score, total, percentage, lessonTitle, planTopic, onClose, onGoToMarket }) => {
  const [courses, setCourses]     = useState<SuggestedCourse[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        setLoading(true);
        // Tìm khóa học gợi ý từ Market theo topic của bài học
        const keyword = planTopic || lessonTitle || '';
        const res = await api.market.getCourses({ search: keyword, limit: 4, page: 1 });
        if (res.success && res.data?.courses?.length > 0) {
          setCourses(res.data.courses);
        } else {
          // Fallback: lấy khóa học mới nhất từ Market
          const fallback = await api.market.getCourses({ limit: 4, page: 1 });
          if (fallback.success) setCourses(fallback.data?.courses || []);
        }
      } catch (e) {
        console.error('LowScoreModal fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggested();
  }, [planTopic, lessonTitle]);

  const levelColor = (level?: string) => {
    if (level === 'advanced') return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (level === 'intermediate') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const levelLabel = (level?: string) => {
    if (level === 'advanced') return 'Nâng cao';
    if (level === 'intermediate') return 'Trung bình';
    return 'Cơ bản';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,22,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#0f1e3a] to-[#0a0f1e] border border-orange-500/30 rounded-[2rem] shadow-2xl shadow-orange-900/20 animate-in zoom-in-95 duration-300">
        {/* Glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-10"
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl shadow-lg shadow-orange-900/30">
              📚
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Kết quả bài kiểm tra</p>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                Hãy ôn lại trước khi tiếp tục!
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Bạn đạt <span className="font-black text-orange-400">{score}/{total} câu ({percentage}%)</span>. Điểm chưa đủ 60% — đừng nản nhé!
              </p>
            </div>
          </div>

          {/* Score visual */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
              <span className="text-slate-500">Điểm của bạn</span>
              <span className="text-orange-400">{percentage}% / 60% cần đạt</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${percentage}%`,
                  background: 'linear-gradient(to right, #f97316, #ef4444)'
                }}
              />
            </div>
            <div
              className="h-0 border-0 border-t-2 border-dashed border-emerald-500/40 relative -mt-1.5"
              style={{ marginLeft: '60%' }}
            >
              <span className="absolute left-0 -top-4 text-[9px] font-black text-emerald-500 whitespace-nowrap">Ngưỡng đạt (60%)</span>
            </div>
          </div>

          {/* Tips */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
            <Sparkles size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              Bài học đã được mở khóa. Bạn có thể <strong className="text-white">đọc lại nội dung</strong>, ôn thêm tài liệu rồi thử lại bài quiz. Các khóa học dưới đây từ Market cũng có thể giúp bạn nắm vững kiến thức hơn!
            </p>
          </div>

          {/* Suggested courses */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookMarked size={16} className="text-violet-400" />
              <p className="text-xs font-black uppercase tracking-widest text-violet-400">Khoá học gợi ý từ Market</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
                <Loader2 size={20} className="animate-spin text-violet-400" />
                <span className="text-sm font-bold">Đang tìm khóa học phù hợp...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm italic border border-dashed border-slate-800 rounded-2xl">
                Chưa có khóa học phù hợp trên Market.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className="group p-4 bg-slate-900/60 border border-slate-800 hover:border-violet-500/50 rounded-2xl transition-all cursor-pointer hover:bg-slate-800/60 hover:shadow-lg hover:shadow-violet-900/10"
                    onClick={onGoToMarket}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-bold text-sm text-white line-clamp-2 group-hover:text-violet-300 transition-colors leading-snug">
                        {course.title}
                      </p>
                      <ExternalLink size={14} className="shrink-0 mt-0.5 text-slate-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {course.level && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${levelColor(course.level)}`}>
                          {levelLabel(course.level)}
                        </span>
                      )}
                      {course.duration && (
                        <span className="text-[9px] text-slate-500 font-bold">{course.duration} ngày</span>
                      )}
                      {course.owner?.fullName && (
                        <span className="text-[9px] text-slate-600 font-bold truncate">by {course.owner.fullName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Thử lại bài quiz
            </button>
            <button
              onClick={onGoToMarket}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-violet-900/30 transition-all flex items-center justify-center gap-2"
            >
              <BookMarked size={16} /> Xem Market
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Hằng số ─────────────────────────────────────────────────────────────────
const QUESTIONS_PER_PAGE = 10;

// ─── Quiz Loading Panel ───────────────────────────────────────────────────────
const QUIZ_STEPS = [
  { label: 'Đọc nội dung bài học', sub: 'AI phân tích lý thuyết & công thức trong bài...' },
  { label: 'Xây dựng ngân hàng câu hỏi', sub: 'Sinh câu hỏi theo 3 cấp độ: Dễ / Trung bình / Khó...' },
  { label: 'Kiểm tra & chuẩn hoá', sub: 'Đảm bảo đủ số lượng, loại bỏ câu trùng lặp...' },
  { label: 'Hoàn tất', sub: 'Lưu vào hệ thống, sẵn sàng hiển thị...' },
];

const QuizGeneratingPanel: React.FC<{ dayNumber?: string }> = ({ dayNumber }) => {
  const [elapsed, setElapsed] = React.useState(0);
  const [stepIdx, setStepIdx]   = React.useState(0);
  const [dots, setDots]         = React.useState('');

  React.useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    const stepper = setInterval(() => setStepIdx(i => Math.min(i + 1, QUIZ_STEPS.length - 1)), 12000);
    const dotsT = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => { clearInterval(timer); clearInterval(stepper); clearInterval(dotsT); };
  }, []);

  const pct = Math.min(Math.round((elapsed / 60) * 90), 90); // max 90% — thực tế mới 100%

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1e3a] to-[#0f172a] border border-blue-800/40 rounded-3xl p-8 space-y-6">
        {/* Glow bg */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center text-2xl shadow-lg shadow-blue-900/30">
              🧠
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-[#0f172a] animate-pulse" />
          </div>
          <div>
            <p className="font-black text-white text-base">AI đang sinh câu hỏi Ngày {dayNumber}</p>
            <p className="text-blue-400/70 text-xs font-medium mt-0.5">
              Đã xử lý: <span className="font-black text-blue-300">{elapsed}s</span>
              <span className="text-slate-600 mx-2">·</span>
              Tối đa ~60s
            </p>
          </div>
        </div>

        {/* Progress bar thực tế */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black">
            <span className="text-slate-500 uppercase tracking-widest">Tiến độ ước tính</span>
            <span className="text-blue-400">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-violet-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${pct}%` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ animation: 'shimmer 1.5s infinite' }} />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 font-medium italic text-right">
            * Tiến độ ước tính, không phản ánh chính xác thời gian thực
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {QUIZ_STEPS.map((s, i) => {
            const done   = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={i} className={`flex items-center gap-3 transition-all duration-500
                ${active ? 'opacity-100' : done ? 'opacity-50' : 'opacity-20'}`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0
                  ${done ? 'bg-emerald-500/20' : active ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                  {done ? (
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : active ? (
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-2 h-2 bg-slate-700 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${done ? 'text-emerald-400' : active ? 'text-white' : 'text-slate-700'}`}>
                    {s.label}
                  </p>
                  {active && (
                    <p className="text-[10px] text-blue-400/70 mt-0.5">{s.sub}{dots}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint note */}
      <div className="flex items-start gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <span className="text-base shrink-0">💡</span>
        <p className="text-xs text-slate-500 leading-relaxed">
          Bạn có thể chuyển sang tab <strong className="text-slate-400">Học tập</strong> hoặc{' '}
          <strong className="text-slate-400">Nội dung chính</strong> để đọc bài trong khi chờ quiz được tạo xong.
        </p>
      </div>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const LessonView = () => {
  const { id, dayNumber } = useParams();
  const navigate = useNavigate();

  const [lesson,  setLesson]  = useState<any>(null);
  const [plan,    setPlan]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('study');

  const [quizQuestions,    setQuizQuestions]    = useState<any[]>([]);
  const [selectedAnswers,  setSelectedAnswers]  = useState<any>({});
  const [quizResult,       setQuizResult]       = useState<any>(null);
  const [submittingQuiz,   setSubmittingQuiz]   = useState(false);
  const [loadingPool,      setLoadingPool]      = useState(false);
  const [quizFailed,       setQuizFailed]       = useState(false); // true khi AI sinh quiz thất bại
  const [currentPage,      setCurrentPage]      = useState(1);

  // Low-score modal state
  const [showLowScoreModal, setShowLowScoreModal] = useState(false);

  // Assignment states
  const [assignment, setAssignment] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingAssignment, setUploadingAssignment] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState(false);

  // Regenerate lesson content state
  const [regeneratingContent, setRegeneratingContent] = useState(false);

  const handleGoToMarket = useCallback(() => {
    setShowLowScoreModal(false);
    navigate('/market');
  }, [navigate]);

  // ── Tạo lại nội dung bài học bằng AI ──────────────────────────────────────
  const handleRegenerateContent = async () => {
    const confirmed = window.confirm(
      '⚠️ AI sẽ viết lại toàn bộ nội dung bài học này dựa trên tài liệu gốc.\n' +
      'Nội dung hiện tại sẽ bị thay thế và bộ câu hỏi trắc nghiệm cũng sẽ bị xoá để tạo mới.\n\n' +
      'Bạn có chắc muốn tiếp tục không?'
    );
    if (!confirmed) return;

    try {
      setRegeneratingContent(true);
      await api.plan.regenerateLesson(id!, dayNumber!);

      // Tải lại dữ liệu bài học mới từ server
      const refreshed = await api.plan.getLesson(id!, dayNumber!);
      if (refreshed.success) {
        setLesson(refreshed.data);
        // Reset trạng thái quiz vì quizPool đã bị xoá
        setQuizQuestions([]);
        setQuizResult(null);
        setSelectedAnswers({});
        setQuizFailed(false);
        alert('✅ Đã tạo lại nội dung bài học thành công! Bộ câu hỏi mới sẽ được tạo khi bạn vào tab Trắc nghiệm.');
      }
    } catch (e: any) {
      alert('❌ Lỗi khi tạo lại nội dung: ' + (e?.response?.data?.message || e.message));
    } finally {
      setRegeneratingContent(false);
    }
  };

  // ── Tải dữ liệu bài học ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Reset states to avoid showing data from the previous day
        setQuizQuestions([]);
        setSelectedAnswers({});
        setQuizResult(null);
        setQuizFailed(false);
        setAssignment(null);
        setUploadFile(null);
        setLoadingPool(false);

        const [planRes, lessonRes] = await Promise.all([
          api.plan.getDetail(id!),
          api.plan.getLesson(id!, dayNumber!),
        ]);

        if (!lessonRes.success) {
          setLoading(false);
          return;
        }
        const lessonData = lessonRes.data;
        setLesson(lessonData);
        setPlan(planRes.data.plan);

        // Fetch assignment
        try {
          const assignRes = await api.assignment.getMine(lessonData._id);
          if (assignRes.success && assignRes.data) {
            setAssignment(assignRes.data);
          }
        } catch (e) {}

        // Set loading to false so the component renders the main container
        setLoading(false);

        await _initQuizQuestions(lessonData);
      } catch (err) {
        console.error('[LessonView] fetchData:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, [id, dayNumber]);

  /**
   * Chờ và kiểm tra pool đến khi đủ câu.
   * Frontend chỉ gọi generatePool 1 lần duy nhất rồi poll kết quả.
   * Tránh double-call gây 2 pool cho cùng 1 bài.
   */
  const _initQuizQuestions = async (lessonData: any) => {
    const loadFromPool = (poolData: any[]) => {
      const seen = new Set<string>();
      const indexed = poolData
        .map((q: any, i: number) => ({ ...q, _poolIndex: i }))
        .filter((q: any) => {
          const key = (q.question || '').trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      setQuizQuestions(indexed);
    };

    // Đã có pool → dùng luôn
    if (lessonData.quizPool?.length > 0) {
      loadFromPool(lessonData.quizPool);
      setLoadingPool(false);
      return;
    }

    // Pool rỗng (kể cả bài đã completed do lần tạo cũ thất bại) → tạo lại
    // Kích hoạt loading và gọi generate đúng 1 lần
    setLoadingPool(true);
    try {
      await api.lessonQuiz.generatePool(lessonData._id);
    } catch (e: any) {
      console.warn('[LessonView] generatePool error:', e?.message);
    }

    // Poll lại DB (tối đa 12 lần × 5s = 60s)
    const MAX_TRIES = 12;
    for (let i = 0; i < MAX_TRIES; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const refreshed = await api.plan.getLesson(id!, dayNumber!);
        if (refreshed.success && refreshed.data.quizPool?.length > 0) {
          setLesson(refreshed.data);
          loadFromPool(refreshed.data.quizPool);
          setLoadingPool(false);
          return;
        }
      } catch (pollErr) {
        console.warn('[LessonView] poll error:', pollErr);
      }
    }

    console.warn('[LessonView] Quiz pool không sẵn sàng sau 60s.');
    setQuizFailed(true);
    setLoadingPool(false);
  };

  // ── Xử lý chọn đáp án ─────────────────────────────────────────────────────
  const handleSelectAnswer = (qIdx: number, aIdx: number) => {
    if (quizResult) return; // Đã nộp bài → không cho chọn lại
    setSelectedAnswers({ ...selectedAnswers, [qIdx]: aIdx });
  };

  // ── Nộp bài ───────────────────────────────────────────────────────────────
  const handleSubmitQuiz = async () => {
    if (quizQuestions.length === 0) {
      const confirmBypass = window.confirm("Bài học này chưa có câu hỏi trắc nghiệm. Bạn có muốn bỏ qua bài quiz để hoàn thành ngày học này và mở khóa bài tiếp theo?");
      if (!confirmBypass) return;
    } else if (Object.keys(selectedAnswers).length < quizQuestions.length) {
      alert(`Vui lòng trả lời hết ${quizQuestions.length} câu hỏi!`);
      return;
    }

    try {
      setSubmittingQuiz(true);

      const answersPayload = quizQuestions.map((q: any, idx: number) => ({
        poolIndex: q._poolIndex ?? idx,
        answer:    selectedAnswers[idx] ?? -1,
      }));

      const res = await api.lessonQuiz.submitAdaptive(lesson._id, {
        planId:    id!,
        dayNumber: Number(dayNumber),
        answers:   answersPayload,
      });

      if (res.success) {
        setQuizResult(res.data);
        // Nếu quiz bị bỏ qua (pool rỗng) → không hiện modal điểm thấp
        if (!res.data?.quizBypassed && (res.data?.percentage ?? 0) < 60) {
          setShowLowScoreModal(true);
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi nộp bài.';
      alert(`❌ ${msg}`);
      console.error('[handleSubmitQuiz]', err?.response?.data || err);
    } finally {
      setSubmittingQuiz(false);
    }
  };
 
  const handleRegenerateQuiz = async () => {
    const confirmRegen = window.confirm("Bạn có muốn tạo bộ câu hỏi trắc nghiệm mới cho ngày học này không? (Kết quả hiện tại sẽ bị xóa)");
    if (!confirmRegen) return;

    try {
      setLoadingPool(true);
      setQuizResult(null);
      setSelectedAnswers({});
      setQuizQuestions([]);
      setCurrentPage(1);

      await api.lessonQuiz.generatePool(lesson._id);

      // Poll lại DB để lấy pool mới (tối đa 12 lần × 5s = 60s)
      const MAX_TRIES = 12;
      for (let i = 0; i < MAX_TRIES; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const refreshed = await api.plan.getLesson(id!, dayNumber!);
          if (refreshed.success && refreshed.data.quizPool?.length > 0) {
            setLesson(refreshed.data);
            const seen = new Set<string>();
            const indexed = refreshed.data.quizPool
              .map((q: any, idx: number) => ({ ...q, _poolIndex: idx }))
              .filter((q: any) => {
                const key = (q.question || '').trim().toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            setQuizQuestions(indexed);
            setLoadingPool(false);
            return;
          }
        } catch (pollErr) {
          console.warn('[LessonView] regenerate poll error:', pollErr);
        }
      }
      setQuizFailed(true);
    } catch (e: any) {
      alert("Lỗi khi tạo quiz mới: " + (e?.response?.data?.message || e.message));
    } finally {
      setLoadingPool(false);
    }
  };

  // ── Xử lý Assignment ──────────────────────────────────────────────────────
  const handleUploadAssignment = async () => {
    if (!uploadFile) return alert("Vui lòng chọn file bài làm.");
    try {
      setUploadingAssignment(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("planId", plan._id);
      formData.append("lessonId", lesson._id);
      
      const res = await api.assignment.submit(formData);
      if (res.success) {
        setAssignment(res.data);
        
        // --- Tự động gọi AI chấm điểm sau khi nộp thành công ---
        if (lesson.solutionUrl) {
          try {
            setGradingAssignment(true);
            const gradeRes = await api.assignment.aiGrade(res.data._id);
            if (gradeRes.success) {
              setAssignment(gradeRes.data);
              alert("Đã nộp bài và AI đã chấm điểm xong!");
            }
          } catch (e: any) {
            alert("Nộp bài thành công nhưng AI chấm lỗi: " + (e?.response?.data?.message || e.message));
          } finally {
            setGradingAssignment(false);
          }
        } else {
          alert("Đã nộp bài thành công! (Chưa có đáp án để AI chấm)");
        }
      }
    } catch (e: any) {
      alert("Lỗi khi nộp bài: " + (e?.response?.data?.message || e.message));
    } finally {
      setUploadingAssignment(false);
    }
  };

  const handleAIGrade = async () => {
    if (!assignment) return;
    try {
      setGradingAssignment(true);
      const res = await api.assignment.aiGrade(assignment._id);
      if (res.success) {
        setAssignment(res.data);
        alert("AI đã chấm điểm xong!");
      }
    } catch (e: any) {
      alert("Lỗi khi chấm điểm: " + (e?.response?.data?.message || e.message));
    } finally {
      setGradingAssignment(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen bg-[#0f172a] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
    </div>
  );

  if (!lesson) return (
    <div className="h-screen bg-[#0f172a] flex items-center justify-center flex-col gap-4">
      <AlertTriangle className="text-red-400 w-12 h-12" />
      <p className="text-slate-400 font-bold">Không tìm thấy bài học. Vui lòng thử lại.</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {

      // ── Tab: Học tập ───────────────────────────────────────────────────────
      case 'study':
        return (
          <div className="prose prose-invert max-w-none animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#1e293b]/10 backdrop-blur-md p-8 lg:p-12 rounded-[2.5rem] border border-slate-800/80 leading-relaxed text-slate-300 shadow-xl relative">

              {/* ── Nút Tạo lại nội dung AI ───────────────────────────────── */}
              <div className="flex justify-end mb-6">
                <button
                  id="btn-regenerate-lesson-content"
                  onClick={handleRegenerateContent}
                  disabled={regeneratingContent}
                  title="Yêu cầu AI viết lại nội dung bài học này"
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                    transition-all duration-300
                    ${regeneratingContent
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-70'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-violet-500/25 hover:scale-105 active:scale-95'
                    }
                  `}
                >
                  {regeneratingContent ? (
                    <>
                      <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>AI đang tạo lại nội dung…</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Tạo lại nội dung với AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* ── Loading overlay khi AI đang xử lý ───────────────────── */}
              {regeneratingContent && (
                <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center gap-4 z-10">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
                    <div className="absolute w-10 h-10 rounded-full border-4 border-indigo-500/30 border-b-indigo-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.9s' }} />
                  </div>
                  <p className="text-slate-300 font-semibold text-base">AI đang viết lại bài giảng…</p>
                  <p className="text-slate-500 text-sm">Quá trình này mất khoảng 30–60 giây, vui lòng chờ.</p>
                </div>
              )}

              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-black text-white mt-8 mb-4 border-b border-slate-800 pb-2 flex items-center gap-2" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-black text-blue-400 mt-8 mb-4 flex items-center gap-2" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-bold text-slate-100 mt-6 mb-3" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-base text-slate-300 mb-6 leading-relaxed font-medium" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-300" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-6 mb-6 space-y-2 text-slate-300" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-slate-300 leading-relaxed font-medium" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 bg-blue-500/5 p-6 rounded-r-2xl italic my-6 text-slate-300" {...props} />
                  ),
                  // Table rendering
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto w-full my-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 shadow-2xl backdrop-blur-sm custom-scrollbar">
                      <table className="w-full border-collapse text-left" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-[#1e293b]/60 border-b border-slate-800" {...props} />
                  ),
                  tbody: ({ node, ...props }) => (
                    <tbody className="divide-y divide-slate-800/40" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-6 py-4 font-black text-xs uppercase tracking-wider text-blue-400" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-6 py-4 text-sm text-slate-300 font-medium align-middle" {...props} />
                  ),
                  tr: ({ node, ...props }) => (
                    <tr className="hover:bg-slate-800/30 transition-colors duration-200" {...props} />
                  ),
                  // Image rendering with zoom-in modal
                  img: ({ node, ...props }) => {
                    const [isOpen, setIsOpen] = useState(false);
                    return (
                      <span className="my-8 flex flex-col items-center">
                        <span className="relative group overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl block">
                          <img
                            className="max-w-full md:max-w-2xl hover:scale-[1.01] hover:border-slate-700 cursor-zoom-in transition-all duration-300 block"
                            onClick={() => setIsOpen(true)}
                            alt={props.alt || "Hình ảnh bài giảng"}
                            {...props}
                          />
                          <span 
                            onClick={() => setIsOpen(true)}
                            className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-zoom-in transition-opacity duration-300"
                          >
                            <span className="px-4 py-2 bg-slate-900/80 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 shadow-lg">
                              🔍 Click để phóng to
                            </span>
                          </span>
                        </span>
                        {props.alt && (
                          <span className="text-xs text-slate-500 italic mt-3 font-medium">
                            {props.alt}
                          </span>
                        )}
                        
                        {/* Image Modal for Zoom In */}
                        {isOpen && (
                          <span 
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
                            onClick={() => setIsOpen(false)}
                          >
                            <img 
                              src={props.src} 
                              alt={props.alt || "Hình ảnh bài giảng"} 
                              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
                            />
                            <button 
                              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 p-2.5 rounded-full transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                              }}
                            >
                              <X size={24} />
                            </button>
                          </span>
                        )}
                      </span>
                    );
                  },
                  // Code block styling
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const inline = !match;
                    return inline ? (
                      <code className="bg-slate-800/60 text-blue-300 px-2 py-0.5 rounded-md font-mono text-sm border border-slate-700/30" {...props}>
                        {children}
                      </code>
                    ) : (
                      <div className="relative my-6 group">
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              alert("Đã sao chép mã nguồn!");
                            }}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-all active:scale-95"
                            title="Sao chép mã"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                        <pre className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl overflow-x-auto font-mono text-sm text-slate-300 shadow-inner">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  }
                }}
              >
                {lesson?.content}
              </ReactMarkdown>
            </div>
          </div>
        );

      // ── Tab: Nội dung chính ────────────────────────────────────────────────
      case 'important':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-2xl font-black text-yellow-500 flex items-center gap-3">
              <Star fill="currentColor" /> Kiến thức trọng tâm &amp; Công thức
            </h2>
            <div className="grid gap-4">
              {lesson?.importantNotes?.length > 0 ? (
                lesson.importantNotes.map((note: string, idx: number) => (
                  <div key={idx} className="bg-yellow-500/5 border-l-4 border-yellow-500 p-6 rounded-r-2xl font-mono text-yellow-100 shadow-xl leading-relaxed">
                    {note}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic p-10 bg-slate-900/50 rounded-3xl text-center border border-dashed border-slate-800">
                  AI không tìm thấy lưu ý đặc biệt hoặc công thức nào trong bài học này.
                </p>
              )}
            </div>
          </div>
        );

      // ── Tab: Trắc nghiệm ──────────────────────────────────────────────────
      case 'quiz':
        return (
          <div className="space-y-8 animate-in fade-in pb-20">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-black italic">Kiểm tra kiến thức Ngày {dayNumber}</h2>
              <div className="flex items-center gap-3">
                {quizQuestions.length > 0 && (
                  <button
                    onClick={handleRegenerateQuiz}
                    disabled={loadingPool || submittingQuiz}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl text-xs font-black border border-slate-700 transition-all shadow-md"
                  >
                    <RefreshCw size={14} className={loadingPool ? "animate-spin" : ""} />
                    {quizResult ? "Làm thêm quiz mới" : "Đổi bộ câu hỏi khác"}
                  </button>
                )}
                {quizResult && (
                  <div className={`px-6 py-2 rounded-2xl font-black shadow-lg ${
                    quizResult.percentage >= 90 ? 'bg-yellow-500 text-black shadow-yellow-900/40' :
                    quizResult.percentage >= 60 ? 'bg-blue-600 shadow-blue-900/40' :
                                                  'bg-red-600 shadow-red-900/40'
                  }`}>
                    {quizResult.score}/{quizResult.total} ({quizResult.percentage}%)
                  </div>
                )}
              </div>
            </div>

            {/* Thông báo kết quả sau khi nộp */}
            {quizResult?.adaptive && (
              <div className={`p-5 rounded-2xl border flex items-start gap-4 animate-in zoom-in ${
                quizResult.percentage >= 60
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-orange-500/10 border-orange-500/40'
              }`}>
                {quizResult.percentage >= 60
                  ? <Trophy className="text-emerald-400 shrink-0 mt-0.5" size={22} />
                  : <AlertTriangle className="text-orange-400 shrink-0 mt-0.5" size={22} />
                }
                <div>
                  <p className={`font-black text-sm ${quizResult.percentage >= 60 ? 'text-emerald-300' : 'text-orange-300'}`}>
                    {quizResult.percentage >= 60 ? 'Hoàn thành xuất sắc!' : 'Cần cố gắng hơn'}
                  </p>
                  <p className="text-slate-400 text-sm mt-0.5">{quizResult.adaptive.message}</p>
                </div>
              </div>
            )}

            {/* Đang sinh quiz pool — Loading UI đẹp */}
            {loadingPool && (
              <QuizGeneratingPanel dayNumber={dayNumber} />
            )}

            {/* Quiz sinh thất bại — Banner thông báo */}
            {!loadingPool && quizFailed && quizQuestions.length === 0 && !quizResult && (
              <div className="flex items-start gap-4 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in fade-in">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">
                  ⚠️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-amber-300 text-sm">AI chưa tạo được câu hỏi cho ngày này</p>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Có thể do lỗi tạm thời từ AI hoặc nội dung bài học quá ngắn.
                  </p>
                  <button
                    onClick={() => { setQuizFailed(false); _initQuizQuestions(lesson); }}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-black text-xs rounded-xl transition-all active:scale-95"
                  >
                    <RefreshCw size={13} /> Thử tạo lại quiz
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách câu hỏi */}
            <div className="space-y-6">
              {quizQuestions.slice((currentPage - 1) * QUESTIONS_PER_PAGE, currentPage * QUESTIONS_PER_PAGE).map((q: any, pIdx: number) => {
                const idx              = (currentPage - 1) * QUESTIONS_PER_PAGE + pIdx;
                const result           = quizResult?.detailedResults?.[idx];
                const correctAnswerIdx = result?.correctAnswer as number | undefined;

                return (
                  <div
                    key={idx}
                    className={`bg-[#1e293b]/50 p-8 rounded-[2.5rem] border transition-all ${
                      result
                        ? result.isCorrect
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-red-500/50 bg-red-500/5'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Số thứ tự + câu hỏi */}
                    <div className="flex gap-4 mb-6">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${
                        result
                          ? result.isCorrect
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-red-600 border-red-500 text-white'
                          : 'bg-slate-800 border-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-lg font-bold">{q.question}</p>
                        {q.difficulty && (
                          <span className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            q.difficulty === 'hard'   ? 'bg-red-500/20 text-red-400' :
                            q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {q.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Đáp án */}
                    <div className="grid grid-cols-1 gap-3 pl-12">
                      {(q.options || []).map((opt: string, oIdx: number) => {
                        let btnClass = 'bg-slate-900/50 border-slate-800 text-slate-400';
                        if (quizResult) {
                          if (oIdx === correctAnswerIdx) {
                            btnClass = 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20';
                          } else if (selectedAnswers[idx] === oIdx && !result?.isCorrect) {
                            btnClass = 'bg-red-600 text-white border-red-500';
                          } else {
                            btnClass = 'bg-slate-900/30 border-slate-800/60 text-slate-500 opacity-60';
                          }
                        } else if (selectedAnswers[idx] === oIdx) {
                          btnClass = 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/20';
                        }
                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectAnswer(idx, oIdx)}
                            disabled={!!quizResult}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${btnClass}`}
                          >
                            <span className="text-[10px] font-black uppercase opacity-70">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="text-sm font-bold flex-1">{opt}</span>
                            {quizResult && oIdx === correctAnswerIdx && (
                              <CheckCircle size={16} className="shrink-0 text-white/80" />
                            )}
                            {quizResult && selectedAnswers[idx] === oIdx && !result?.isCorrect && (
                              <span className="shrink-0 text-white/80 text-sm">✗</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Giải thích sau khi nộp */}
                    {quizResult && result && (
                      <div className="mt-6 ml-12 p-4 bg-slate-900/80 rounded-2xl border border-slate-700 text-sm animate-in zoom-in">
                        <p className={`font-black uppercase text-[10px] mb-2 tracking-widest ${
                          result.isCorrect ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {result.isCorrect ? '✓ Chính xác' : '✗ Chưa đúng'}
                        </p>
                        {result.explanation && (
                          <>
                            <p className="text-blue-400 font-black uppercase text-[10px] mb-1 tracking-widest">Giải thích</p>
                            <p className="text-slate-300 leading-relaxed italic">{result.explanation}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Phân trang */}
            {quizQuestions.length > QUESTIONS_PER_PAGE && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all"
                >
                  Trang trước
                </button>
                <span className="font-bold text-slate-400">
                  Trang {currentPage} / {Math.ceil(quizQuestions.length / QUESTIONS_PER_PAGE)}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, Math.ceil(quizQuestions.length / QUESTIONS_PER_PAGE)));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === Math.ceil(quizQuestions.length / QUESTIONS_PER_PAGE)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all"
                >
                  Trang sau
                </button>
              </div>
            )}

            {/* Nút nộp bài / quay lại */}
            {!quizResult ? (
              <div className="space-y-4">
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submittingQuiz || loadingPool}
                  className={`w-full py-5 text-white rounded-[1.5rem] font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${
                    quizQuestions.length === 0
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/30'
                  }`}
                >
                  {submittingQuiz ? <Loader2 className="animate-spin" /> : <CheckCircle size={24} />}
                  {quizQuestions.length === 0 ? `Bỏ qua Quiz & Mở khoá Ngày ${Number(dayNumber) + 1}` : `Nộp bài & Hoàn thành Ngày ${dayNumber}`}
                </button>
                {quizQuestions.length > 0 && (
                  <button
                    onClick={handleRegenerateQuiz}
                    disabled={submittingQuiz || loadingPool}
                    className="w-full py-4 bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-[1.5rem] font-bold text-base border border-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} /> Đổi bộ câu hỏi khác (Tạo lại Quiz)
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleRegenerateQuiz}
                  disabled={loadingPool}
                  className="flex-1 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-[1.5rem] font-black text-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={22} /> Làm thêm quiz mới
                </button>
                <button
                  onClick={() => navigate(`/plan/${id}`)}
                  className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-[1.5rem] font-black text-xl border border-slate-700 transition-all"
                >
                  ← Quay lại Lộ trình
                </button>
              </div>
            )}
          </div>
        );

      // ── Tab: Video ─────────────────────────────────────────────────────────
      case 'video':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
            {/* Video Box */}
            {lesson?.videoUrl ? (
              <div className="bg-[#1e293b]/40 border border-slate-800 rounded-3xl overflow-hidden p-2">
                <div className="flex items-center gap-2 p-4 border-b border-slate-800/50 text-blue-400 mb-2">
                  <Video size={20}/>
                  <h3 className="font-black">Video Bài Giảng</h3>
                </div>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative">
                  {/* Chuyển đổi link youtube thông thường sang dạng embed để iframe có thể hiển thị */}
                  <iframe 
                    className="w-full h-full absolute top-0 left-0"
                    src={lesson.videoUrl.replace("watch?v=", "embed/")} 
                    title="Video bài giảng" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="bg-[#1e293b]/40 border border-slate-800 rounded-3xl p-8 text-center text-slate-500">
                <Video size={40} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold">Chưa có video bài giảng cho ngày này.</p>
                {plan?.instructorId ? (
                  <p className="text-xs mt-2 opacity-70">Người hướng dẫn của bạn chưa tải lên video.</p>
                ) : (
                  <p className="text-xs mt-2 opacity-70">Hãy thêm người hướng dẫn để họ cung cấp video cho bạn nhé!</p>
                )}
              </div>
            )}
          </div>
        );

      // ── Tab: Bài tập ───────────────────────────────────────────────────────
      case 'assignment':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
            {/* Assignment Box */}
            <div className="bg-[#1e293b]/40 border border-slate-800 rounded-3xl p-6 lg:p-8">
              <div className="flex items-center gap-2 text-purple-400 mb-6">
                <FileText size={24}/>
                <h3 className="text-xl font-black">Bài tập thực hành</h3>
              </div>

              {!lesson?.assignmentUrl ? (
                <p className="text-slate-500 italic p-6 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-center">
                  Không có bài tập đính kèm từ người hướng dẫn.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Tải đề bài */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div>
                      <p className="font-bold text-slate-300">File Đề Bài / Yêu Cầu</p>
                      <p className="text-xs text-slate-500">Tải về để xem chi tiết yêu cầu bài tập.</p>
                    </div>
                    <a href={lesson.assignmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all font-bold text-sm">
                      <Download size={16}/> Tải xuống
                    </a>
                  </div>

                  {/* Tải lời giải (Nếu có) */}
                  {lesson.solutionUrl && (
                    <div className="flex items-center justify-between p-4 bg-purple-900/20 rounded-2xl border border-purple-500/30">
                      <div>
                        <p className="font-bold text-purple-300">File Đáp Án / Lời Giải</p>
                        <p className="text-xs text-purple-400/70">Tải về để xem đáp án chuẩn từ người hướng dẫn.</p>
                      </div>
                      <a href={lesson.solutionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-xl transition-all font-bold text-sm">
                        <Download size={16}/> Tải xuống
                      </a>
                    </div>
                  )}

                  {/* Nộp bài làm */}
                  <div className="border-t border-slate-800 pt-6">
                    <h4 className="font-black text-slate-300 mb-4 flex items-center gap-2"><UploadCloud size={18}/> Nộp bài làm của bạn</h4>
                    
                    {assignment ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                              <CheckCircle size={20}/>
                            </div>
                            <div>
                              <p className="font-bold text-emerald-400">Bạn đã nộp bài!</p>
                              <p className="text-xs text-emerald-500/70">Thời gian nộp: {new Date(assignment.createdAt).toLocaleString('vi-VN')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-400 hover:text-white underline">Xem file nộp</a>
                            <button 
                              onClick={() => {
                                setAssignment(null);
                                setUploadFile(null);
                              }} 
                              className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all shadow-md active:scale-95"
                            >
                              Nộp Lại
                            </button>
                          </div>
                        </div>

                        {/* Điểm số AI */}
                        {assignment.aiScore !== undefined ? (
                          <div className="p-6 bg-blue-900/20 border border-blue-500/30 rounded-2xl space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl font-black text-blue-400">{assignment.aiScore}/10</span>
                              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-800 rounded-full">Điểm AI chấm</span>
                            </div>
                            <div className="text-sm text-slate-300 leading-relaxed italic bg-slate-900/50 p-4 rounded-xl">
                              "{assignment.aiFeedback}"
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={handleAIGrade}
                            disabled={gradingAssignment || !lesson.solutionUrl}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg transition-all"
                          >
                            {gradingAssignment ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} />}
                            {lesson.solutionUrl ? "Yêu cầu AI chấm điểm" : "Đang chờ người hướng dẫn cung cấp file đáp án để chấm điểm..."}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <label className="flex-1 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 cursor-pointer text-center group transition-all">
                          <input type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                          <UploadCloud size={24} className="mx-auto mb-2 text-slate-500 group-hover:text-blue-400 transition-colors"/>
                          <p className="text-sm font-bold text-slate-400 group-hover:text-blue-300">{uploadFile ? uploadFile.name : "Nhấn để chọn file bài làm (.docx, .pdf, ...)"}</p>
                        </label>
                        <button 
                          onClick={handleUploadAssignment}
                          disabled={!uploadFile || uploadingAssignment || gradingAssignment}
                          className="h-full px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          {(uploadingAssignment || gradingAssignment) ? <Loader2 className="animate-spin"/> : <UploadCloud size={18} />}
                          {(uploadingAssignment || gradingAssignment) ? "ĐANG XỬ LÝ..." : (lesson.solutionUrl ? "NỘP & AI CHẤM" : "NỘP BÀI")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        );

      default:
        return null;
    }
  };
  const isGeneratingQuiz = loadingPool && quizQuestions.length === 0;

  return (
    <React.Fragment>
    {/* Low-Score Modal */}
    {showLowScoreModal && quizResult && (
      <LowScoreModal
        score={quizResult.score}
        total={quizResult.total}
        percentage={quizResult.percentage}
        lessonTitle={lesson?.title}
        planTopic={plan?.topic || plan?.title}
        onClose={() => setShowLowScoreModal(false)}
        onGoToMarket={handleGoToMarket}
      />
    )}
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">

      {/* LEFT: CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">

        {/* Navigation Header */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(`/plan/${id}`)}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">{lesson?.title}</h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                Ngày {dayNumber} • {plan?.title}
              </p>
            </div>
          </div>
        </div>

        {isGeneratingQuiz ? (
          <div className="max-w-xl mx-auto py-10">
            <QuizGeneratingPanel dayNumber={dayNumber} />
          </div>
        ) : (
          <>
            {/* Tab Menu */}
            <div className="flex gap-2 bg-[#1e293b]/80 backdrop-blur-md p-1.5 rounded-2xl w-fit mb-10 border border-slate-800 sticky top-0 z-10 shadow-xl">
              {[
                { id: 'study',      label: 'Học tập',       icon: <BookOpen size={16}/>      },
                { id: 'important',  label: 'Nội dung chính', icon: <Star size={16}/>          },
                { id: 'video',      label: 'Video',         icon: <Video size={16}/>         },
                { id: 'assignment', label: 'Bài tập',       icon: <FileText size={16}/>      },
                { id: 'quiz',       label: 'Trắc nghiệm',   icon: <CheckSquare size={16}/>   },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                    ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Nội dung tab */}
            <div className="max-w-4xl">
              {renderContent()}
            </div>
          </>
        )}

        <div className="h-20" />
      </div>

      {/* RIGHT: AI CHAT SIDEBAR */}
      {!isGeneratingQuiz && (
        <div className="w-[420px] border-l border-slate-800 bg-[#0f172a] hidden xl:flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/20">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-black text-xs uppercase tracking-widest text-slate-400">Trợ lý tài liệu AI</span>
            </div>
            <MessageCircle size={18} className="text-slate-600" />
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <AIChatBox 
              planId={id} 
              lessonTitle={lesson?.title}
              lessonContent={lesson?.content}
              dayNumber={Number(dayNumber)}
            />
          </div>
        </div>
      )}

    </div>
    </React.Fragment>
  );
};

export default LessonView;