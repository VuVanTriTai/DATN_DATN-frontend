import React, { useState, useEffect } from 'react';
import {
  Star, ThumbsUp, ThumbsDown, MessageSquare,
  Trash2, Send, X, ChevronDown, ChevronLeft, ChevronRight,
  Award, TrendingUp, AlertCircle, Loader2, MessageCircle,
  Flag, AlertOctagon
} from 'lucide-react';
import { api } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reply {
  _id: string;
  userId: { _id: string; fullName: string; email: string } | null;
  content: string;
  likeCount: number;
  dislikeCount: number;
  myStatus: 'liked' | 'disliked' | null;
  createdAt: string;
  isRemovedPlaceholder?: boolean;
}

interface Review {
  _id: string;
  userId: { _id: string; fullName: string; email: string } | null;
  content: string;
  rating?: number;
  likeCount: number;
  dislikeCount: number;
  myStatus: 'liked' | 'disliked' | null;
  createdAt: string;
  replies: Reply[];
  isRemovedPlaceholder?: boolean;
}

interface Summary {
  avgRating: number;
  total: number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

interface ReviewSectionProps {
  planId: string;
  userId: string;
}

// ─── Lý do báo cáo ───────────────────────────────────────────────────────────
const REPORT_REASONS = [
  { value: 'spam', label: '🚫 Spam / Quảng cáo' },
  { value: 'inappropriate_content', label: '🔞 Nội dung không phù hợp' },
  { value: 'wrong_information', label: '❌ Thông tin sai lệch' },
  { value: 'hate_speech', label: '🤬 Ngôn từ thù địch' },
  { value: 'copyright', label: '©️ Vi phạm bản quyền' },
  { value: 'other', label: '📝 Lý do khác' },
];

// ─── Modal Báo cáo Vi phạm ───────────────────────────────────────────────────
const ReportModal = ({
  targetType,
  targetId,
  onClose,
}: {
  targetType: 'review' | 'instructorRating' | 'course';
  targetId: string;
  onClose: (success?: boolean) => void;
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) { setError('Vui lòng chọn lý do báo cáo.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.reports.create({ targetType, targetId, reason, description });
      if (res.success) {
        onClose(true);
      } else {
        setError(res.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
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
              <h3 className="text-white font-black text-base">Báo cáo Vi phạm</h3>
              <p className="text-slate-500 text-[10px] font-bold">Chọn lý do vi phạm</p>
            </div>
          </div>
          <button onClick={() => onClose()} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all border
                ${reason === r.value
                  ? 'bg-red-500/15 border-red-500/40 text-red-300'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          rows={2}
          placeholder="Mô tả thêm (không bắt buộc)..."
          className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-red-500/50 resize-none transition-all"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={13} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => onClose()} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm transition-colors">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
            {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) => {
  const colors = [
    'from-blue-600 to-indigo-700',
    'from-violet-600 to-purple-700',
    'from-emerald-600 to-teal-700',
    'from-rose-600 to-pink-700',
    'from-amber-600 to-orange-700',
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sizeClass = size === 'sm'
    ? 'w-7 h-7 text-[10px]'
    : 'w-10 h-10 text-sm';

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-black text-white shrink-0 shadow-lg`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
};

// ─── StarRating ───────────────────────────────────────────────────────────────
const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={`transition-all duration-150 ${readonly ? '' : 'cursor-pointer hover:scale-110'}
            ${s <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
        />
      ))}
    </div>
  );
};

// ─── RatingSummary ────────────────────────────────────────────────────────────
const RatingSummary = ({ summary }: { summary: Summary }) => {
  if (!summary || summary.total === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-3xl border border-slate-700/50 p-6 flex flex-col sm:flex-row gap-8 items-center">
      {/* Điểm trung bình */}
      <div className="text-center shrink-0">
        <p className="text-6xl font-black text-white tracking-tight">{summary.avgRating.toFixed(1)}</p>
        <StarRating value={Math.round(summary.avgRating)} readonly size={20} />
        <p className="text-xs text-slate-500 mt-1 font-bold">{summary.total} đánh giá</p>
      </div>

      {/* Phân phối sao */}
      <div className="flex-1 space-y-1.5 w-full">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = summary.distribution[star] || 0;
          const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">{star}</span>
              <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 w-5 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── RemovedPlaceholder ───────────────────────────────────────────────────────
const RemovedPlaceholder = ({ replies, currentUserId, onReact, onDelete, onReply, onReport }: {
  replies: Reply[];
  currentUserId: string;
  onReact: (id: string, type: 'like' | 'dislike') => void;
  onDelete: (id: string) => void;
  onReply: (replyToUser?: string) => void;
  onReport: (id: string) => void;
}) => {
  const [showReplies, setShowReplies] = useState(true);
  return (
    <div className="group">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
          <AlertOctagon size={16} className="text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-slate-900/40 rounded-3xl rounded-tl-sm px-5 py-4 border border-dashed border-slate-700/50">
            <p className="text-sm text-slate-600 italic">[Bình luận này đã bị gỡ do vi phạm]</p>
          </div>
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-400/10 mt-1.5"
            >
              {showReplies ? <ChevronDown size={11} /> : <ChevronLeft size={11} />}
              {replies.length} phản hồi
            </button>
          )}
          {showReplies && replies.length > 0 && (
            <div className="mt-3 ml-4 pl-4 border-l-2 border-slate-700/50 space-y-1">
              {replies.map((reply) => (
                <ReplyItem
                  key={reply._id}
                  reply={reply}
                  currentUserId={currentUserId}
                  onReact={onReact}
                  onDelete={onDelete}
                  onReply={() => onReply(reply.userId?.fullName || "Người dùng đã xoá")}
                  onReport={onReport}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ReplyItem ────────────────────────────────────────────────────────────────
const ReplyItem = ({
  reply,
  currentUserId,
  onReact,
  onDelete,
  onReply,
  onReport,
}: {
  reply: Reply;
  currentUserId: string;
  onReact: (id: string, type: 'like' | 'dislike') => void;
  onDelete: (id: string) => void;
  onReply: () => void;
  onReport?: (id: string) => void;
}) => {
  if (reply.isRemovedPlaceholder) {
    return (
      <div className="flex gap-3 py-2 animate-in fade-in">
        <div className="w-7 h-7 rounded-full bg-slate-800/40 border border-slate-700/30 flex items-center justify-center shrink-0">
          <AlertOctagon size={12} className="text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-slate-900/20 rounded-2xl rounded-tl-sm px-4 py-3 border border-dashed border-slate-800/50">
            <p className="text-xs text-slate-500 italic leading-relaxed">[Phản hồi này đã bị gỡ]</p>
          </div>
        </div>
      </div>
    );
  }

  const authorName = reply.userId?.fullName || "Người dùng đã xoá";
  return (
    <div className="flex gap-3 group/reply py-2">
      <Avatar name={authorName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-slate-800/60 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700/30 group-hover/reply:border-slate-600/50 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-black text-white">{authorName}</p>
            <p className="text-[9px] text-slate-600">{new Date(reply.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{reply.content}</p>
        </div>

        <div className="flex items-center gap-3 mt-1.5 ml-2">
          <button
            onClick={() => onReact(reply._id, 'like')}
            className={`flex items-center gap-1 text-[10px] font-bold transition-all hover:scale-105 active:scale-95
              ${reply.myStatus === 'liked' ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <ThumbsUp size={11} /> {reply.likeCount}
          </button>

          <button
            onClick={() => onReact(reply._id, 'dislike')}
            className={`flex items-center gap-1 text-[10px] font-bold transition-all hover:scale-105 active:scale-95
              ${reply.myStatus === 'disliked' ? 'text-red-400' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <ThumbsDown size={11} /> {reply.dislikeCount}
          </button>

          <button
            onClick={onReply}
            className="text-[10px] font-bold text-slate-600 hover:text-blue-400 transition-colors flex items-center gap-0.5"
          >
            <MessageCircle size={10} /> Phản hồi
          </button>

          {reply.userId?._id === currentUserId && (
            <button
              onClick={() => onDelete(reply._id)}
              className="text-[10px] font-bold text-slate-700 hover:text-red-400 transition-colors flex items-center gap-0.5"
            >
              <Trash2 size={10} /> Xóa
            </button>
          )}

          {reply.userId?._id !== currentUserId && onReport && (
            <button
              onClick={() => onReport(reply._id)}
              className="text-[10px] font-bold text-slate-700 hover:text-orange-400 transition-colors flex items-center gap-0.5 ml-auto"
            >
              <Flag size={10} /> Báo cáo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ReviewItem ───────────────────────────────────────────────────────────────
const ReviewItem = ({
  review,
  currentUserId,
  onReact,
  onDelete,
  onReply,
  onReport,
}: {
  review: Review;
  currentUserId: string;
  onReact: (id: string, type: 'like' | 'dislike') => void;
  onDelete: (id: string) => void;
  onReply: (r: Review, replyToUser?: string) => void;
  onReport: (id: string) => void;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const authorName = review.userId?.fullName || "Người dùng đã xoá";

  // Nếu là placeholder (bình luận đã bị gỡ nhưng có replies)
  if (review.isRemovedPlaceholder) {
    return (
      <RemovedPlaceholder
        replies={review.replies}
        currentUserId={currentUserId}
        onReact={onReact}
        onDelete={onDelete}
        onReply={(replyToUser) => onReply(review, replyToUser)}
        onReport={onReport}
      />
    );
  }

  return (
    <div className="group">
      <div className="flex gap-4">
        <Avatar name={authorName} />
        <div className="flex-1 min-w-0">
          {/* Card bình luận */}
          <div className="bg-slate-800/40 rounded-3xl rounded-tl-sm px-5 py-4 border border-slate-700/30 group-hover:border-slate-600/50 transition-all duration-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-black text-white">{authorName}</p>
                {review.rating && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating value={review.rating} readonly size={13} />
                    <span className="text-[10px] font-black text-amber-400">{review.rating}/5</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-600 shrink-0 mt-1">
                {new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{review.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 ml-1 flex-wrap">
            <button
              onClick={() => onReact(review._id, 'like')}
              className={`flex items-center gap-1.5 text-[10px] font-bold transition-all hover:scale-105 active:scale-95 px-2 py-1 rounded-lg
                ${review.myStatus === 'liked' ? 'text-blue-400 bg-blue-400/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              <ThumbsUp size={12} /> {review.likeCount}
            </button>

            <button
              onClick={() => onReact(review._id, 'dislike')}
              className={`flex items-center gap-1.5 text-[10px] font-bold transition-all hover:scale-105 active:scale-95 px-2 py-1 rounded-lg
                ${review.myStatus === 'disliked' ? 'text-red-400 bg-red-400/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              <ThumbsDown size={12} /> {review.dislikeCount}
            </button>

            <button
              onClick={() => onReply(review)}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-blue-400/10"
            >
              <MessageCircle size={12} /> Trả lời
            </button>

            {review.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-400/10"
              >
                {showReplies ? <ChevronDown size={11} /> : <ChevronLeft size={11} />}
                {review.replies.length} phản hồi
              </button>
            )}

            {review.userId?._id === currentUserId ? (
              <button
                onClick={() => onDelete(review._id)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-700 hover:text-red-400 transition-colors ml-auto px-2 py-1 rounded-lg hover:bg-red-400/10"
              >
                <Trash2 size={11} /> Xóa
              </button>
            ) : (
              <button
                onClick={() => onReport(review._id)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-700 hover:text-orange-400 transition-colors ml-auto px-2 py-1 rounded-lg hover:bg-orange-400/10"
              >
                <Flag size={11} /> Báo cáo
              </button>
            )}
          </div>

          {/* Replies */}
          {showReplies && review.replies.length > 0 && (
            <div className="mt-3 ml-4 pl-4 border-l-2 border-slate-700/50 space-y-1">
              {review.replies.map((reply) => (
                <ReplyItem
                  key={reply._id}
                  reply={reply}
                  currentUserId={currentUserId}
                  onReact={onReact}
                  onDelete={onDelete}
                  onReply={() => onReply(review, reply.userId?.fullName || "Người dùng đã xoá")}
                  onReport={onReport}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ReviewSection = ({ planId, userId }: ReviewSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [replyTo, setReplyTo] = useState<Review | null>(null);

  // Report modal state
  const [reportTarget, setReportTarget] = useState<{ id: string; type: 'review' } | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const LIMIT = 5;

  // ── Fetch data ──
  const loadReviews = async (page = 1) => {
    if (!planId) return;
    setLoading(true);
    try {
      const [reviewRes, summaryRes] = await Promise.all([
        api.reviews.get(planId, page, LIMIT),
        api.reviews.summary(planId),
      ]);
      if (reviewRes.success) {
        setReviews(reviewRes.data.reviews || []);
        setTotalPages(reviewRes.data.totalPages || 1);
        setTotalReviews(reviewRes.data.total || 0);
        setCurrentPage(page);
      }
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(1); }, [planId]);

  // ── Init reply ──
  const handleReplyInit = (review: Review, replyToUser?: string) => {
    setReplyTo(review);
    if (replyToUser) {
      setContent(`@${replyToUser} `);
    } else {
      setContent('');
    }
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.reviews.create(planId, {
        content: content.trim(),
        rating: replyTo ? undefined : rating,
        parentId: replyTo?._id,
      });
      if (res.success) {
        setContent('');
        setReplyTo(null);
        setRating(5);
        setSuccessMsg(replyTo ? 'Đã gửi phản hồi thành công!' : 'Cảm ơn bạn đã đánh giá!');
        setTimeout(() => setSuccessMsg(''), 3000);
        loadReviews(1);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── React (like/dislike) ──
  const handleReact = async (reviewId: string, type: 'like' | 'dislike') => {
    try {
      const res = await api.reviews.react(reviewId, type);
      if (res.success) {
        const { likeCount, dislikeCount, myStatus } = res.data;
        setReviews(prev => prev.map(r => {
          if (r._id === reviewId) return { ...r, likeCount, dislikeCount, myStatus };
          return {
            ...r,
            replies: r.replies.map(rep =>
              rep._id === reviewId ? { ...rep, likeCount, dislikeCount, myStatus } : rep
            )
          };
        }));
      }
    } catch { /* ignore */ }
  };

  // ── Delete ──
  const handleDelete = async (reviewId: string) => {
    try {
      await api.reviews.delete(reviewId);
      loadReviews(currentPage);
    } catch { /* ignore */ }
  };

  // ── Report ──
  const handleReportClose = (success?: boolean) => {
    setReportTarget(null);
    if (success) {
      setSuccessMsg('✅ Đã gửi báo cáo. Cảm ơn bạn đã góp phần xây dựng cộng đồng!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // ── Keyboard submit ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <MessageSquare size={18} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Thảo luận & Đánh giá</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {totalReviews > 0 ? `${totalReviews} đánh giá từ học viên` : 'Chưa có đánh giá nào'}
          </p>
        </div>
      </div>

      {/* Rating Summary */}
      {summary && summary.total > 0 && <RatingSummary summary={summary} />}

      {/* Form gửi bình luận */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-700/50 p-5 space-y-4 backdrop-blur-sm">
        {/* Banner đang trả lời */}
        {replyTo && (
          <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle size={13} className="text-blue-400" />
              <span className="text-[11px] text-blue-300 font-bold">
                Đang trả lời: <span className="text-white">{replyTo.userId?.fullName || "Người dùng đã xoá"}</span>
              </span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 hover:bg-blue-500/20 rounded-full transition-colors"
            >
              <X size={13} className="text-blue-400" />
            </button>
          </div>
        )}

        {/* Rating stars (chỉ khi không reply) */}
        {!replyTo && (
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} size={22} />
            <span className="text-xs text-slate-500 font-bold">
              {rating === 5 ? 'Xuất sắc' : rating === 4 ? 'Tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Tệ' : 'Rất tệ'}
            </span>
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 pt-3.5 pb-12 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/70 focus:bg-slate-800/80 transition-all resize-none"
            placeholder={replyTo ? `Phản hồi ${replyTo.userId?.fullName || "Người dùng đã xoá"}...` : 'Chia sẻ cảm nghĩ của bạn về khóa học này... (Ctrl+Enter để gửi)'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-[11px] font-black transition-all active:scale-95 shadow-lg shadow-blue-900/30"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitting ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>

        {/* Thông báo lỗi / thành công */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-300 font-medium">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Award size={14} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300 font-bold">{successMsg}</p>
          </div>
        )}
      </div>

      {/* Danh sách bình luận */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-800 rounded-xl w-1/4" />
                <div className="h-16 bg-slate-800 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-slate-900/30 rounded-3xl border border-dashed border-slate-700/50">
          <TrendingUp size={40} className="text-slate-700" />
          <p className="text-slate-500 font-black">Chưa có đánh giá nào</p>
          <p className="text-slate-700 text-xs">Hãy là người đầu tiên đánh giá khóa học này!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <ReviewItem
              key={review._id}
              review={review}
              currentUserId={userId}
              onReact={handleReact}
              onDelete={handleDelete}
              onReply={handleReplyInit}
              onReport={(id) => setReportTarget({ id, type: 'review' })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => loadReviews(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const pg = i + 1;
            const show = totalPages <= 5 || pg === 1 || pg === totalPages || Math.abs(pg - currentPage) <= 1;
            if (!show) return (pg === 2 || pg === totalPages - 1) ? <span key={pg} className="text-slate-600 font-black">···</span> : null;
            return (
              <button
                key={pg}
                onClick={() => loadReviews(pg)}
                className={`w-9 h-9 rounded-xl font-black text-xs transition-all active:scale-95
                  ${pg === currentPage
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {pg}
              </button>
            );
          })}

          <button
            onClick={() => loadReviews(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={handleReportClose}
        />
      )}
    </div>
  );
};

export default ReviewSection;