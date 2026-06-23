import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../services/adminService';
import { MARKET_CATEGORIES } from '../../utils/marketConstants';
import {
  Search, BookOpen, Globe, Lock, Star,
  Trash2, RefreshCw, Eye, ChevronLeft, ChevronRight,
  X, AlertTriangle, Tag
} from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  topic: string;
  isPublic: boolean;
  sourceType: string;
  level: string;
  categories: string[];
  tags: string[];
  owner: { _id: string; fullName: string; email: string };
  createdAt: string;
}

// ── Course Detail Modal ──────────────────────────────────────────────────────
const CourseDetailModal = ({ courseId, onClose }: { courseId: string; onClose: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getCourseDetail(courseId).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [courseId]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12101f] border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#12101f] z-10">
          <h2 className="text-white font-black text-lg">Chi tiết Khoá học</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10"><X size={18} /></button>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : data && (
          <div className="p-6 space-y-5">
            {/* Title & Status */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black text-base">{data.course.title}</h3>
                  <p className="text-slate-400 text-sm">{data.course.topic || 'Không có chủ đề'}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold
                  ${data.course.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {data.course.isPublic ? '🌐 Public' : '🔒 Private'}
                </span>
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">
                  {data.course.level}
                </span>
                <span className="px-2.5 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-bold">
                  {data.course.sourceType}
                </span>
                {data.course.tags?.includes('featured') && (
                  <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold">⭐ Featured</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white text-2xl font-black">{data.lessonCount}</p>
                <p className="text-slate-400 text-xs mt-1">Bài học</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white text-2xl font-black">{data.course.categories?.length || 0}</p>
                <p className="text-slate-400 text-xs mt-1">Danh mục</p>
              </div>
            </div>

            {/* Categories */}
            {data.course.categories?.length > 0 && (
              <div className="border border-white/10 rounded-2xl p-4">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Danh mục</p>
                <div className="flex gap-2 flex-wrap">
                  {data.course.categories.map((c: string) => {
                    const found = MARKET_CATEGORIES.find(cat => cat.value === c);
                    return (
                      <span key={c} className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg text-xs">
                        {found ? found.label : c}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Owner */}
            <div className="border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Chủ sở hữu</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                  {data.course.owner?.fullName?.[0]}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{data.course.owner?.fullName}</p>
                  <p className="text-slate-400 text-xs">{data.course.owner?.email}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {data.course.tags?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {data.course.tags.map((t: string) => (
                    <span key={t} className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-slate-600 text-xs text-center">
              Tạo ngày: {new Date(data.course.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Confirm Dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({
  message, onConfirm, onCancel, danger = false
}: { message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#12101f] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
      <AlertTriangle size={36} className={`mx-auto mb-4 ${danger ? 'text-red-400' : 'text-yellow-400'}`} />
      <p className="text-white font-bold text-base mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors text-sm">Huỷ</button>
        <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl font-bold transition-colors text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}>Xác nhận</button>
      </div>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publicFilter, setPublicFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ msg: string; action: () => void; danger?: boolean } | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCourses({ page, limit: 12, search, isPublic: publicFilter, sourceType: sourceFilter });
      setCourses(res.data.courses);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [page, search, publicFilter, sourceFilter]);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { setPage(1); }, [search, publicFilter, sourceFilter]);

  const handleDelete = (course: Course) => {
    setConfirm({
      msg: `Xoá khoá học "${course.title}"? Hành động này không thể hoàn tác!`,
      danger: true,
      action: async () => {
        await adminApi.deleteCourse(course._id);
        showToast(`Đã xoá: ${course.title}`);
        loadCourses();
        setConfirm(null);
      }
    });
  };

  const handleToggleFeatured = async (course: Course) => {
    const isFeatured = course.tags?.includes('featured');
    try {
      await adminApi.toggleFeatured(course._id);
      showToast(isFeatured ? 'Đã bỏ nổi bật' : '⭐ Đã gắn nổi bật!');
      loadCourses();
    } catch { showToast('Lỗi cập nhật'); }
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Quản lý Khoá học</h1>
          <p className="text-slate-400 mt-1">{pagination.total} khoá học trong hệ thống</p>
        </div>
        <button onClick={loadCourses} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, chủ đề hoặc tag..."
            className="w-full bg-[#12101f] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <select value={publicFilter} onChange={e => setPublicFilter(e.target.value)}
            className="bg-[#12101f] border border-white/10 rounded-2xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer">
            <option value="">Tất cả</option>
            <option value="true">Public (Market)</option>
            <option value="false">Private</option>
          </select>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
            className="bg-[#12101f] border border-white/10 rounded-2xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer">
            <option value="">Tất cả nguồn</option>
            <option value="self">Tự tạo (AI)</option>
            <option value="imported">Đã import</option>
            <option value="assigned">Được giao</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#12101f] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-black uppercase tracking-wider">Khoá học</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-black uppercase tracking-wider">Chủ sở hữu</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-black uppercase tracking-wider">Trạng thái</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-black uppercase tracking-wider">Cấp độ</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-black uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-6 py-4 text-slate-400 text-xs font-black uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : courses.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-500">Không tìm thấy khoá học nào.</td></tr>
              ) : (
                courses.map(course => (
                  <tr key={course._id} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen size={14} className="text-white" />
                        </div>
                        <div className="max-w-[220px]">
                          <p className="text-white font-bold text-sm truncate flex items-center gap-1.5">
                            {course.title}
                            {course.tags?.includes('featured') && <Star size={11} className="text-yellow-400 flex-shrink-0" />}
                          </p>
                          <p className="text-slate-400 text-xs truncate">{course.topic || 'Không có chủ đề'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-medium">{course.owner?.fullName}</p>
                      <p className="text-slate-400 text-xs">{course.owner?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {course.isPublic
                        ? <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold"><Globe size={12} />Public</span>
                        : <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold"><Lock size={12} />Private</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">{course.level}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(course.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* View */}
                        <button onClick={() => setSelectedCourseId(course._id)} title="Xem chi tiết"
                          className="p-2 bg-white/5 hover:bg-white/15 rounded-xl text-slate-400 hover:text-white transition-all">
                          <Eye size={14} />
                        </button>
                        {/* Toggle Featured — tạm ẩn */}
                        {/* {course.isPublic && (
                          <button onClick={() => handleToggleFeatured(course)}
                            title={course.tags?.includes('featured') ? 'Bỏ nổi bật' : 'Gắn nổi bật'}
                            className={`p-2 rounded-xl transition-all ${course.tags?.includes('featured') ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-white/5 text-slate-400 hover:bg-yellow-500/20 hover:text-yellow-400'}`}>
                            <Tag size={14} />
                          </button>
                        )} */}
                        {/* Delete */}
                        <button onClick={() => handleDelete(course)} title="Xoá khoá học"
                          className="p-2 bg-white/5 hover:bg-red-600/30 rounded-xl text-slate-400 hover:text-red-400 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <p className="text-slate-400 text-sm">Trang {page}/{pagination.totalPages} · {pagination.total} khoá học</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={16} />
              </button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCourseId && <CourseDetailModal courseId={selectedCourseId} onClose={() => setSelectedCourseId(null)} />}
      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1a1730] border border-white/10 rounded-2xl px-5 py-3 text-white text-sm font-medium shadow-2xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
