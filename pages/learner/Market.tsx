import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { 
  Search, RotateCcw, Eye, 
  DownloadCloud, X, Lock, BookOpen, 
  Layers, Info, Loader2, Sparkles, User,
  CheckCircle2, AlertTriangle, Star,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      <div className="flex gap-2">
        <div className="h-9 bg-white/5 rounded-xl flex-1" />
        <div className="h-9 bg-white/5 rounded-xl flex-1" />
      </div>
    </div>
  </div>
);


const Market = () => {
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [confirmCourse, setConfirmCourse] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
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


  const fetchMarketCourses = useCallback(async (pageToFetch = 1) => {
    try {
      setLoading(true);
      const res = await api.market.getCourses({ 
        ...filters, 
        page: pageToFetch, 
        limit: 12, 
        isPublic: true 
      });
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
    fetchMarketCourses(1);
  }, [filters, fetchMarketCourses]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchMarketCourses(page);
  };

  const handleOpenPreview = async (course: any) => {
    setSelectedCourse(course);
    setLoadingPreview(true);
    try {
      const res = await api.market.getPreview(course._id);
      if (res.success) setPreviewData(res.data);
    } catch (err) { showToast('Không thể tải bản xem trước.', 'error'); }
    finally { setLoadingPreview(false); }
  };

  const handleImport = async (id: string) => {
    if (isImporting) return;
    // Tìm course để hiện modal confirm
    const course = courses.find(c => c._id === id) || selectedCourse;
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

  return (
    <>
    <div className="p-6 lg:p-8 space-y-8 text-white min-h-screen">
      
      {/* HEADER */}
      <header className="space-y-2 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tighter flex items-center justify-center gap-3">
          <Sparkles className="text-blue-500" size={40}/> AI Course Market
        </h1>
        <p className="text-slate-500 font-medium italic">
          Khám phá và tải về các lộ trình học tập tối ưu được chia sẻ bởi cộng đồng và chuyên gia.
        </p>
      </header>

      {/* BỘ LỌC */}
      <div className="bg-[#1e293b] p-6 rounded-[2rem] border border-slate-800 space-y-4 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Tìm theo tên khóa học */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Tên khóa học</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Tìm tên khóa học..."
                className="w-full bg-[#0f172a] border border-slate-700 p-3.5 pl-12 rounded-2xl outline-none focus:border-blue-500 text-sm transition-all placeholder:text-slate-600"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>

          {/* Tìm theo giảng viên */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-1">Tên / Email giảng viên</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Tìm theo giảng viên..."
                className="w-full bg-[#0f172a] border border-slate-700 p-3.5 pl-12 rounded-2xl outline-none focus:border-violet-500 text-sm transition-all placeholder:text-slate-600"
                value={filters.instructorSearch}
                onChange={(e) => setFilters({...filters, instructorSearch: e.target.value})}
              />
            </div>
          </div>

          {/* Danh mục */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Danh mục</label>
            <select 
              className="w-full bg-[#0f172a] border border-slate-700 p-3.5 rounded-2xl outline-none text-sm cursor-pointer hover:border-slate-600 transition-all appearance-none"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="all">Tất cả danh mục</option>
              <option value="lap_trinh">Lập trình</option>
              <option value="ai_ml">AI & Machine Learning</option>
              <option value="kinh_doanh">Kinh doanh</option>
              <option value="ngoai_ngu">Ngoại ngữ</option>
              <option value="khoa_hoc">Khoa học</option>
            </select>
          </div>

          {/* Cấp độ + Reset */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Cấp độ</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-[#0f172a] border border-slate-700 p-3.5 rounded-2xl outline-none text-sm cursor-pointer hover:border-slate-600 transition-all appearance-none"
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
              >
                <option value="all">Tất cả</option>
                <option value="Easy">Cơ bản</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Nâng cao</option>
              </select>
              <button 
                onClick={resetFilters}
                className="bg-slate-800 hover:bg-slate-700 p-3.5 rounded-2xl text-xs font-black flex items-center gap-1 transition-all border border-slate-700 active:scale-95 shrink-0"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw size={16}/>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">
            Tìm thấy <span className="text-white font-bold">{totalCourses}</span> khóa học
            {filters.instructorSearch && (
              <span className="ml-2 text-violet-400 font-bold">· Giảng viên: "{filters.instructorSearch}"</span>
            )}
          </p>
          {(filters.search || filters.instructorSearch || filters.category !== 'all' || filters.level !== 'all') && (
            <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold transition-colors">
              <RotateCcw size={12}/> Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BookOpen size={64} className="text-slate-700" />
          <p className="text-slate-500 font-bold">Không tìm thấy khóa học phù hợp.</p>
          <button onClick={resetFilters} className="text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {courses.map((course) => (
            <div key={course._id} className="bg-[#1e293b] rounded-[2.5rem] overflow-hidden border border-slate-800 group hover:border-blue-500/50 transition-all shadow-xl flex flex-col hover:-translate-y-1 duration-300">
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                   <Layers size={100} className="absolute -right-5 -bottom-5" />
                </div>
                <BookOpen size={48} className="text-slate-700 group-hover:text-blue-500/50 transition-colors" />
                <span className={`absolute top-4 right-4 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-tighter shadow-lg
                  ${course.level === 'Hard' ? 'bg-red-500/20 text-red-400' : course.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {course.level}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">{course.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                     <Layers size={12}/> <span>{course.duration} ngày học</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-4 border-t border-slate-800/50">
                   <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                      {course.owner?.fullName?.[0] || 'U'}
                   </div>
                   <div className="text-[10px] min-w-0 flex-1">
                      <p className="text-slate-500 font-bold uppercase tracking-tighter">Chia sẻ bởi</p>
                      <p className="text-slate-300 font-black truncate">{course.owner?.fullName}</p>
                      {course.owner?.email && (
                        <p className="text-slate-600 truncate">{course.owner.email}</p>
                      )}
                   </div>
                </div>

                {course.instructorId && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl mt-[-8px]">
                    <CheckCircle2 size={13} className="text-purple-400 shrink-0" />
                    <span className="text-[10px] text-purple-300 font-medium truncate">
                      Đã qua chỉnh sửa bởi: <strong className="font-bold">{course.instructorId.fullName}</strong>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleOpenPreview(course)}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase transition-all"
                  >
                    <Eye size={14}/> Khái quát
                  </button>
                  <button 
                    onClick={() => handleImport(course._id)}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-900/20"
                  >
                    <DownloadCloud size={14}/> Lấy bài
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none text-slate-300 active:scale-95"
            title="Trang trước"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const isSelected = pageNum === currentPage;
            const showPage = 
              totalPages <= 7 || 
              pageNum === 1 || 
              pageNum === totalPages || 
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

            if (!showPage) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return (
                  <span key={`ellipsis-${pageNum}`} className="w-10 h-10 flex items-center justify-center text-slate-500 font-bold text-sm">
                    ...
                  </span>
                );
              }
              return null;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all active:scale-95 border
                  ${isSelected 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-800 border-slate-700/50 hover:bg-slate-700 hover:text-white text-slate-300'
                  }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none text-slate-300 active:scale-95"
            title="Trang sau"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmCourse && (
        <ConfirmImportModal
          course={confirmCourse}
          onConfirm={doImport}
          onCancel={() => setConfirmCourse(null)}
          loading={isImporting}
        />
      )}

      {/* MODAL XEM KHÁI QUÁT */}
      {previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-[3rem] p-10 border border-slate-700 shadow-2xl space-y-8 flex flex-col max-h-[85vh]">
            
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white leading-tight">{selectedCourse?.title}</h3>
                <p className="text-blue-500 text-xs font-black uppercase tracking-widest">Cấu trúc chi tiết các ngày</p>
                {selectedCourse?.owner && (
                  <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-1 font-medium">
                    <User size={12} className="text-slate-500 shrink-0"/>
                    <span>Chia sẻ bởi: <strong className="text-slate-300">{selectedCourse.owner.fullName}</strong></span>
                  </p>
                )}
                {selectedCourse?.instructorId && (
                  <p className="text-purple-400 text-xs flex items-center gap-1.5 mt-1.5 font-medium">
                    <CheckCircle2 size={12} className="text-purple-400 shrink-0"/>
                    <span>Đã qua chỉnh sửa bởi: <strong className="text-purple-300 font-bold">{selectedCourse.instructorId.fullName}</strong></span>
                  </p>
                )}
              </div>
              <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-slate-800 rounded-full transition-all">
                <X size={24}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {previewData.map((item: any) => (
                <div 
                  key={item._id}
                  onClick={() => alert("Bạn cần 'Lấy bài' về kho cá nhân để xem nội dung chi tiết bài này.")}
                  className="p-5 bg-[#0f172a]/50 rounded-[1.5rem] border border-slate-800 flex justify-between items-center group cursor-pointer hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] font-black text-blue-500 border border-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      {item.dayNumber}
                    </span>
                    <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item.title}</p>
                  </div>
                  <Lock size={16} className="text-slate-700 group-hover:text-blue-400 transition-colors"/>
                </div>
              ))}
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <Info size={20} className="text-blue-500 shrink-0"/>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    Nhấn <strong>Lấy bài</strong> để AI đồng bộ nội dung bài giảng, công thức và bộ câu hỏi trắc nghiệm vào tài khoản của bạn.
                  </p>
               </div>
               <button 
                onClick={() => handleImport(selectedCourse?._id)}
                disabled={isImporting}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/30 disabled:opacity-50"
               >
               {isImporting ? <Loader2 className="animate-spin"/> : <DownloadCloud size={24}/>}
               Lấy lộ trình học ngay
               </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default Market;