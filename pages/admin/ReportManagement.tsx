import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Flag, AlertTriangle, CheckCircle2, XCircle,
  BookOpen, MessageSquare, Star, Loader2,
  RefreshCw, Filter, ChevronLeft, ChevronRight,
  Eye, Trash2, X
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Report {
  _id: string;
  targetType: 'course' | 'review' | 'instructorRating';
  targetId: string;
  reportedBy: { fullName: string; email: string } | null;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  snapshot: any;
  createdAt: string;
}

// ─── Label helpers ────────────────────────────────────────────────────────────
const TARGET_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  course: { label: 'Khóa học', icon: <BookOpen size={13} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  review: { label: 'Bình luận', icon: <MessageSquare size={13} />, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  instructorRating: { label: 'Đánh giá GV', icon: <Star size={13} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
};

const REASON_LABELS: Record<string, string> = {
  spam: '🚫 Spam',
  inappropriate_content: '🔞 Nội dung không phù hợp',
  wrong_information: '❌ Thông tin sai lệch',
  hate_speech: '🤬 Ngôn từ thù địch',
  copyright: '©️ Vi phạm bản quyền',
  other: '📝 Lý do khác',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  resolved: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  dismissed: 'bg-slate-700/50 border-slate-600/30 text-slate-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  resolved: 'Đã xử lý',
  dismissed: 'Bỏ qua',
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({
  report,
  action,
  onConfirm,
  onCancel,
  loading,
}: {
  report: Report;
  action: 'resolve' | 'dismiss';
  onConfirm: (note: string) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const [note, setNote] = useState('');
  const isResolve = action === 'resolve';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isResolve ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800'}`}>
            {isResolve ? <Trash2 size={22} className="text-red-400" /> : <XCircle size={22} className="text-slate-400" />}
          </div>
          <div>
            <h3 className="text-white font-black text-base">
              {isResolve ? '⚠️ Gỡ nội dung vi phạm?' : 'Bỏ qua báo cáo này?'}
            </h3>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              {isResolve
                ? 'Nội dung sẽ bị xóa khỏi hệ thống. Không thể hoàn tác.'
                : 'Báo cáo sẽ được đánh dấu là không vi phạm.'}
            </p>
          </div>
        </div>

        {/* Snapshot */}
        {report.snapshot && (
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nội dung bị báo cáo</p>
            {report.snapshot.title && <p className="text-sm text-white font-bold">📚 {report.snapshot.title}</p>}
            {report.snapshot.content && <p className="text-sm text-slate-300 italic">"{report.snapshot.content}"</p>}
            {report.snapshot.comment && <p className="text-sm text-slate-300 italic">"{report.snapshot.comment}"</p>}
            {report.snapshot.stars && <p className="text-xs text-amber-400">⭐ {report.snapshot.stars}/5 — {report.snapshot.instructor}</p>}
          </div>
        )}

        <textarea
          rows={2}
          placeholder="Ghi chú xử lý (không bắt buộc)..."
          className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none resize-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm transition-colors">
            Huỷ
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className={`flex-1 py-3 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
              isResolve ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-600 hover:bg-slate-500'
            }`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : isResolve ? <Trash2 size={14} /> : <XCircle size={14} />}
            {loading ? 'Đang xử lý...' : isResolve ? 'Xác nhận gỡ' : 'Bỏ qua'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const [confirmData, setConfirmData] = useState<{ report: Report; action: 'resolve' | 'dismiss' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadReports = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.reports.getAll({ targetType: filterType, status: filterStatus, page, limit: LIMIT });
      if (res.success) {
        setReports(res.data.reports || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotal(res.data.pagination?.total || 0);
        setCurrentPage(page);
      }
    } catch { showToast('Lỗi tải dữ liệu.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReports(1); }, [filterType, filterStatus]);

  const handleConfirm = async (note: string) => {
    if (!confirmData) return;
    setActionLoading(true);
    try {
      const { report, action } = confirmData;
      const res = action === 'resolve'
        ? await api.reports.resolve(report._id, note)
        : await api.reports.dismiss(report._id, note);

      if (res.success) {
        showToast(res.message || 'Xử lý thành công!');
        setConfirmData(null);
        loadReports(currentPage);
      } else {
        showToast(res.message || 'Có lỗi xảy ra.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 text-white min-h-screen bg-[#0a0a14]">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40">
            <Flag size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Quản lý Báo cáo Vi phạm</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              {total} báo cáo · Trạng thái: {STATUS_LABELS[filterStatus] || 'Tất cả'}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadReports(1)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-300 transition-all"
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-[#1e293b]/60 rounded-3xl border border-slate-800 p-5 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-500" />
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Lọc theo</span>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'Tất cả loại' },
            { value: 'course', label: '📚 Khóa học' },
            { value: 'review', label: '💬 Bình luận' },
            { value: 'instructorRating', label: '⭐ Đánh giá GV' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterType === opt.value
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-700 hidden sm:block" />

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'pending', label: '🟠 Chờ xử lý' },
            { value: 'resolved', label: '✅ Đã xử lý' },
            { value: 'dismissed', label: '⚫ Bỏ qua' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterStatus === opt.value
                  ? 'bg-slate-600 border-slate-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#1e293b]/60 rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 size={28} className="animate-spin text-red-500" />
            <span className="font-bold text-sm">Đang tải dữ liệu...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-slate-600">
            <Flag size={48} className="opacity-30" />
            <p className="font-black text-base">Không có báo cáo nào</p>
            <p className="text-sm">Trạng thái: {STATUS_LABELS[filterStatus]}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/80">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Loại</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nội dung bị báo cáo</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lý do</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Người báo cáo</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ngày</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Trạng thái</th>
                  {filterStatus === 'pending' && (
                    <th className="text-center px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hành động</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => {
                  const typeInfo = TARGET_TYPE_LABELS[report.targetType];
                  const snap = report.snapshot;
                  const snapshotText = snap?.title || snap?.content || snap?.comment || '(không có nội dung)';

                  return (
                    <tr
                      key={report._id}
                      className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-900/20'}`}
                    >
                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border ${typeInfo?.color}`}>
                          {typeInfo?.icon} {typeInfo?.label}
                        </span>
                      </td>

                      {/* Snapshot */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-slate-300 text-xs font-medium truncate" title={snapshotText}>
                          {snapshotText}
                        </p>
                        {snap?.author && <p className="text-[10px] text-slate-600 mt-0.5">bởi {snap.author}</p>}
                        {snap?.owner && <p className="text-[10px] text-slate-600 mt-0.5">bởi {snap.owner}</p>}
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-slate-400">
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                        {report.description && (
                          <p className="text-[10px] text-slate-600 mt-0.5 max-w-[160px] truncate" title={report.description}>
                            {report.description}
                          </p>
                        )}
                      </td>

                      {/* Reporter */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-300">{report.reportedBy?.fullName || 'Ẩn danh'}</p>
                        <p className="text-[10px] text-slate-600">{report.reportedBy?.email}</p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black border ${STATUS_BADGE[report.status]}`}>
                          {STATUS_LABELS[report.status]}
                        </span>
                      </td>

                      {/* Actions */}
                      {filterStatus === 'pending' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setConfirmData({ report, action: 'resolve' })}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-sm"
                              title="Gỡ nội dung vi phạm"
                            >
                              <Trash2 size={11} /> Gỡ nội dung
                            </button>
                            <button
                              onClick={() => setConfirmData({ report, action: 'dismiss' })}
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-[10px] font-black transition-all active:scale-95"
                              title="Bỏ qua báo cáo này"
                            >
                              <XCircle size={11} /> Bỏ qua
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => loadReports(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 disabled:opacity-20 hover:bg-slate-700 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="bg-slate-800 px-5 h-10 rounded-xl flex items-center font-black text-sm border border-slate-700">
            {currentPage} / {totalPages}
          </div>
          <button
            onClick={() => loadReports(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 disabled:opacity-20 hover:bg-slate-700 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmData && (
        <ConfirmModal
          report={confirmData.report}
          action={confirmData.action}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmData(null)}
          loading={actionLoading}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border
          ${toast.type === 'success' ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300' : 'bg-red-950 border-red-500/30 text-red-300'}`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-bold">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
