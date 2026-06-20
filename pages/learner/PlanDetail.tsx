//PlanDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, UploadCloud, Award, Share2,FileSearch,ArrowLeft,
  ChevronRight, Calendar, CheckCircle, Lock,
  PlayCircle, UserCheck, BarChart3,
  FileText, Trash2, Download, RefreshCw, X, Search, Info, Star, Target, Loader2, GraduationCap, Users, Send
} from 'lucide-react';

const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // States quản lý dữ liệu
  const [plan, setPlan] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [resultsData, setResultsData] = useState<any>(null);

  // States quản lý UI
  const [activeTab, setActiveTab] = useState('study');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // States quản lý chia sẻ bạn bè
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sharingFriendId, setSharingFriendId] = useState<string | null>(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [searchOtherUsersQuery, setSearchOtherUsersQuery] = useState("");
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [searchingOther, setSearchingOther] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);
  const [shareErrorMsg, setShareErrorMsg] = useState<string | null>(null);
  const [instructorErrorMsg, setInstructorErrorMsg] = useState<string | null>(null);

  // States quản lý phân mảnh Chunks tài liệu mẫu
  const [extractedChunks, setExtractedChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [chunkSubTab, setChunkSubTab] = useState<'text' | 'chunks'>('text');
  const [chunksError, setChunksError] = useState<string | null>(null);

  // 🔗 Quản lý trạng thái trùng lặp khi chia sẻ (Đã sở hữu, Có chỉnh sửa mới, Đang quét...)
  const [recipientStatuses, setRecipientStatuses] = useState<Record<string, { isShared: boolean, hasUpdates: boolean; loading: boolean }>>({});


const [docViewMode, setDocViewMode] = useState<'original' | 'text'>('original');
  const getAbsoluteFileUrl = (url: string) => {
  if (!url) return '';
  let normalized = url.replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace(/\/api\/?$/, '');
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  return `${backendBase}${normalized}`;
};

  const checkStatusForUser = async (userId: string) => {
    if (!userId || !id) return;
    setRecipientStatuses(prev => ({
      ...prev,
      [userId]: { isShared: false, hasUpdates: false, loading: true }
    }));
    try {
      const res = await api.plan.checkRecipientStatus(id, userId);
      if (res.success) {
        setRecipientStatuses(prev => ({
          ...prev,
          [userId]: { isShared: res.data.isShared, hasUpdates: res.data.hasUpdates, loading: false }
        }));
      } else {
        setRecipientStatuses(prev => ({
          ...prev,
          [userId]: { isShared: false, hasUpdates: false, loading: false }
        }));
      }
    } catch (err) {
      console.error("Lỗi kiểm tra trạng thái trùng lặp:", err);
      setRecipientStatuses(prev => ({
        ...prev,
        [userId]: { isShared: false, hasUpdates: false, loading: false }
      }));
    }
  };

  // Quét danh sách người dùng bên ngoài khi tìm thấy
  useEffect(() => {
    if (otherUsers.length > 0) {
      otherUsers.forEach(u => {
        if (u._id && !recipientStatuses[u._id]) {
          checkStatusForUser(u._id);
        }
      });
    }
  }, [otherUsers]);

  // Quét danh sách bạn bè khi tải xong
  useEffect(() => {
    if (friends.length > 0) {
      friends.forEach(({ friend }) => {
        if (friend?._id && !recipientStatuses[friend._id]) {
          checkStatusForUser(friend._id);
        }
      });
    }
  }, [friends]);

  // Quét danh sách giảng viên khi mở Modal hoặc cập nhật instructors
  useEffect(() => {
    if (instructors.length > 0) {
      instructors.forEach(ins => {
        if (ins._id && !recipientStatuses[ins._id]) {
          checkStatusForUser(ins._id);
        }
      });
    }
  }, [instructors, showInstructorModal]);

  const renderRecipientBadge = (userId: string) => {
    const status = recipientStatuses[userId];
    if (!status) return null;
    if (status.loading) {
      return (
        <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md animate-pulse shrink-0">
          Đang quét...
        </span>
      );
    }
    if (status.isShared) {
      if (status.hasUpdates) {
        return (
          <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-md shrink-0">
            Có chỉnh sửa mới
          </span>
        );
      } else {
        return (
          <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">
            Đã sở hữu
          </span>
        );
      }
    }
    return null;
  };

  useEffect(() => {
    loadData();
    fetchInstructors();
  }, [id]);

  // Tự động tải dữ liệu Thành tích, Bạn bè hoặc Chunks tài liệu khi chuyển Tab
  useEffect(() => {
    if (activeTab === 'result') {
      fetchResults();
    } else if (activeTab === 'share') {
      fetchFriends();
    }
  }, [activeTab]);


  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const res = await api.friends.getMyFriends();
      if (res.success) {
        setFriends(res.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách bạn bè:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleShareToFriend = async (friendId: string, userName?: string) => {
    setSharingFriendId(friendId);
    setShareSuccessMsg(null);
    setShareErrorMsg(null);
    try {
      const res = await api.plan.sharePrivate(id!, friendId);
      if (res.success) {
        setShareSuccessMsg(userName ? `Đã gửi bản sao lộ trình thành công cho "${userName}"!` : "Đã chia sẻ lộ trình học thành công dưới dạng bản sao!");
        setTimeout(() => setShareSuccessMsg(null), 5000);
        // Cập nhật lại trạng thái của người nhận
        checkStatusForUser(friendId);
      } else {
        setShareErrorMsg(res.message || "Lỗi khi chia sẻ");
        setTimeout(() => setShareErrorMsg(null), 6000);
      }
    } catch (err: any) {
      console.error("Lỗi chia sẻ:", err);
      const msg = err.response?.data?.message || "Lỗi khi chia sẻ lộ trình";
      setShareErrorMsg(msg);
      setTimeout(() => setShareErrorMsg(null), 6000);
    } finally {
      setSharingFriendId(null);
    }
  };

  const handleSearchOtherUsers = async () => {
    if (searchOtherUsersQuery.trim().length < 2) {
      alert("Vui lòng nhập ít nhất 2 ký tự để tìm kiếm!");
      return;
    }
    setSearchingOther(true);
    setShareSuccessMsg(null);
    try {
      const res = await api.friends.search(searchOtherUsersQuery);
      if (res && res.success) {
        const list = res.data || [];
        const nonFriends = list.filter((u: any) => u.friendshipStatus !== 'accepted');
        setOtherUsers(nonFriends);
      }
    } catch (err) {
      console.error("Search error in course detail share tab:", err);
    } finally {
      setSearchingOther(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.plan.getDetail(id!);
      if (res.success) {
        setPlan(res.data.plan);
        setLessons(res.data.lessons);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết lộ trình:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await api.auth.getInstructors();
      setInstructors(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchResults = async () => {
    try {
      const res = await api.plan.getResults(id!);
      if (res.success) setResultsData(res.data);
    } catch (err) { console.error("Lỗi tải thành tích:", err); }
  };

  const filteredInstructors = instructors.filter(ins => {
    // LỌC BỎ CHÍNH BẢN THÂN KHỎI DANH SÁCH GIÁO VIÊN
    if (user && ins._id === user.id) return false;

    const fullName = ins.fullName ? ins.fullName.toLowerCase() : "";
    const email = ins.email ? ins.email.toLowerCase() : "";
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleDeletePlan = async () => {
    if (window.confirm("Xác nhận xóa lộ trình? Hành động này không thể hoàn tác.")) {
      setIsDeleting(true);
      try {
        await api.plan.delete(id!);
        navigate('/dashboard');
      } catch (err) {
        alert("Lỗi khi xóa");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleChangeInstructor = async (instructorId: string) => {
    setInstructorErrorMsg(null);
    try {
      const res = await api.plan.updateInstructor(id!, instructorId);
      if (res.success) {
        setShowInstructorModal(false);
        setSearchTerm("");
        loadData();
        if (instructorId) {
          checkStatusForUser(instructorId);
        }
        setShareSuccessMsg(instructorId ? "Đã gửi lộ trình cho giáo viên hướng dẫn thành công!" : "Đã gỡ người hướng dẫn.");
        setActiveTab('share');
        setTimeout(() => setShareSuccessMsg(null), 5000);
      } else {
        // Hiện lỗi ngay trong Instructor Modal (ví dụ: đã gửi rồi, nội dung trùng khớp)
        setInstructorErrorMsg(res.message || "Lỗi cập nhật");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Lỗi cập nhật";
      setInstructorErrorMsg(msg);
    }
  };

  const getFocusLabel = (f: string) => f === 'practical' ? 'Thực hành ứng dụng' : 'Lý thuyết hệ thống';
  const getDepthLabel = (d: string) => d === 'advanced' ? 'Nghiên cứu chuyên sâu' : 'Tiếp cận cơ bản';

  if (loading) return (
    <div className="h-screen bg-[#0f172a] flex items-center justify-center">
      <RefreshCw className="animate-spin text-blue-500 w-10 h-10" />
    </div>
  );

  if (!plan) return <div className="p-10 text-white text-center">Lộ trình không tồn tại.</div>;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10 text-white animate-in fade-in duration-700">
{/* --- NÚT QUAY LẠI --- */}
<button
  onClick={() => navigate('/dashboard')} // Điều hướng thẳng về trang danh sách
  className="flex items-center gap-3 text-slate-500 hover:text-white transition-all group w-fit mb-6"
>
  <div className="p-2 rounded-xl bg-slate-800/50 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
    <ArrowLeft size={18} />
  </div>
  <span className="text-xs font-black uppercase tracking-[0.2em]">Quay lại danh sách</span>
</button>
      {/* --- HEADER: Thông tin tổng quan --- */}
      <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10"><BarChart3 size={120} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-6 flex-1">
            <div className="flex flex-wrap gap-3">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${plan.learningFocus === 'practical' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                {getFocusLabel(plan.learningFocus)}
              </span>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${plan.learningDepth === 'advanced' ? 'bg-purple-600' : 'bg-emerald-600'}`}>
                {getDepthLabel(plan.learningDepth)}
              </span>
              <span className="bg-slate-800/80 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black text-slate-300 flex items-center gap-2 border border-slate-700">
                <Calendar size={12} /> {plan.duration} NGÀY HỌC
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight max-w-3xl">{plan.title}</h1>

            {/* Người hướng dẫn Card */}
            <div className="flex items-center gap-4 bg-white/5 w-fit p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg">
                {plan.instructorId?.fullName ? plan.instructorId.fullName[0].toUpperCase() : 'AI'}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Người hướng dẫn</p>
                <p className="text-sm font-bold text-blue-400">
                  {plan.instructorId?.fullName ? `GV. ${plan.instructorId.fullName}` : "Chế độ Tự học"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowInstructorModal(true)} className="p-4 bg-slate-800 hover:bg-blue-600 rounded-2xl border border-slate-700 transition-all shadow-lg group">
              <RefreshCw size={20} className="text-blue-400 group-hover:text-white" />
            </button>
            <button onClick={handleDeletePlan} disabled={isDeleting} className="p-4 bg-red-500/10 hover:bg-red-600 rounded-2xl border border-red-500/20 transition-all shadow-lg group">
              <Trash2 size={20} className="text-red-500 group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex flex-wrap gap-3 bg-[#1e293b]/50 p-2 rounded-[1.5rem] border border-slate-800 w-fit">
        {[
          { id: 'study', label: 'Bài học', icon: <BookOpen size={18} /> },
          { id: 'document', label: 'Tài liệu gốc', icon: <FileText size={18} /> },
          //...(plan.instructorId ? [{ id: 'assignment', label: 'Bài tập', icon: <UploadCloud size={18} /> }] : []),
          { id: 'result', label: 'Thành tích', icon: <Award size={18} /> },
          { id: 'share', label: 'Chia sẻ', icon: <Share2 size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
              ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* --- CONTENT --- */}
      <div className="min-h-[400px]">
        {/* TAB BÀI HỌC */}
        {activeTab === 'study' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Banner: Giáo viên đã gửi bản chỉnh sửa */}
            {plan.status === 'reviewed' && (
              <div className="relative p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 flex items-start gap-4 overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 80% 50%, #10b981, transparent)' }} />
                <div className="p-3 bg-emerald-500/20 rounded-2xl shrink-0">
                  <GraduationCap className="text-emerald-400" size={24} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">✅ Giáo viên gửi</p>
                  <p className="font-bold text-white text-sm">Giáo viên đã xem xét và gửi bản chỉnh sửa hoàn chỉnh cho lộ trình học của bạn.</p>
                  <p className="text-xs text-slate-400 mt-1">Nội dung bài học dưới đây đã được cập nhật. Hãy tiếp tục học để khám phá các thay đổi mới!</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {lessons.map((lesson) => (
                <div
                  key={lesson._id}
                  onClick={() => lesson.status !== 'locked' && navigate(`/plan/${id}/lesson/${lesson.dayNumber}`)}
                  className={`group relative p-6 rounded-[2.5rem] border transition-all cursor-pointer h-56 flex flex-col justify-between
                  ${lesson.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/30' :
                      lesson.status === 'locked' ? 'bg-slate-900/50 border-slate-800 opacity-50 grayscale cursor-not-allowed' :
                        'bg-[#1e293b] border-slate-800 hover:border-blue-500/50'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className={`p-2.5 rounded-2xl ${lesson.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-blue-400'}`}>
                      {lesson.status === 'completed' ? <CheckCircle size={20} /> : lesson.status === 'locked' ? <Lock size={20} /> : <PlayCircle size={20} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">Ngày {lesson.dayNumber}</span>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-2 group-hover:text-blue-400">{lesson.title}</h3>
                  <div className="flex justify-end pt-2"><div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-all"><ChevronRight size={14} className="text-white" /></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB TÀI LIỆU GỐC - CHỈ GIỮ BẢN IN VÀ VĂN BẢN */}
{activeTab === 'document' && (
  <div className="bg-[#1e293b]/50 p-6 lg:p-10 rounded-[3rem] border border-slate-800 space-y-6 animate-in fade-in">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-white gap-4">
      <div>
        <h3 className="text-2xl font-black italic text-blue-400">Hồ sơ tài liệu tri thức</h3>
        <p className="text-slate-500 text-xs mt-1">Nguồn dữ liệu gốc dùng để thiết kế lộ trình học tập.</p>
      </div>
      {plan.documentId?.fileUrl && (
        <button 
          onClick={() => window.open(getAbsoluteFileUrl(plan.documentId.fileUrl), "_blank")}
          className="flex items-center gap-2 text-blue-400 font-bold hover:underline bg-blue-400/10 px-4 py-2 rounded-xl border border-blue-400/20 w-fit shrink-0 transition-all active:scale-95"
        >
          <Download size={18} /> Tải tệp bản gốc
        </button>
      )}
    </div>

    {/* Subtabs: Chỉ còn 2 nút Original | Text */}
    <div className="flex gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl w-fit border border-slate-800">
      <button
        onClick={() => setDocViewMode('original')}
        className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase
            ${docViewMode === 'original' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
      >
        Tài liệu gốc (Bản in)
      </button>
      <button
        onClick={() => setDocViewMode('text')}
        className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase
            ${docViewMode === 'text' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
      >
        Văn bản trích xuất
      </button>
    </div>

    {/* Nội dung hiển thị */}
    <div className="min-h-[500px] flex flex-col">
      {docViewMode === 'original' ? (
        <div className="flex-1 bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden flex flex-col min-h-[600px]">
          {plan.documentId?.fileUrl ? (
            (() => {
              const rawUrl = getAbsoluteFileUrl(plan.documentId.fileUrl);
              const urlLower = rawUrl.toLowerCase();
              const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');
              const isPdf = urlLower.includes('.pdf') || urlLower.includes('f_pdf') || urlLower.includes('/pdf/');
              const isOffice = /\.(docx|doc|pptx|ppt|xlsx|xls)$/.test(urlLower);
              const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;

              if (isPdf) {
                return <iframe src={`${rawUrl}#toolbar=1`} className="w-full flex-1 border-none bg-white" title="PDF Preview" />;
              }

              if (isOffice && !isLocal) {
                return <iframe src={googleViewerUrl} className="w-full flex-1 border-none bg-white" title="Office Preview" />;
              }

              return (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4">
                  <FileSearch size={48} className="text-slate-700" />
                  <div>
                    <p className="font-bold text-slate-200">Xem trước không khả dụng</p>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                      Vui lòng tải xuống để xem trực tiếp trên máy tính của bạn.
                    </p>
                  </div>
                  <button 
                    onClick={() => window.open(rawUrl, '_blank')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase transition-all"
                  >
                    Mở tệp / Tải xuống
                  </button>
                </div>
              );
            })()
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 italic">Không có file đính kèm.</div>
          )}
        </div>
      ) : (
        /* View Văn bản trích xuất */
        <div className="p-8 bg-slate-950/50 rounded-[2rem] border border-slate-800 text-slate-300 text-sm leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap custom-scrollbar font-sans">
          {plan.documentId?.content || "Không có nội dung văn bản trích xuất."}
        </div>
      )}
    </div>
  </div>
)}

        {/* TAB THÀNH TÍCH (BẢN ĐẦY ĐỦ) */}
        {activeTab === 'result' && (
          <div className="space-y-10 animate-in fade-in zoom-in duration-500 pb-20">
            {resultsData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2rem] text-center space-y-2">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Tiến độ tổng quát</p>
                    <p className="text-4xl font-black">{resultsData.summary.overallProgress}%</p>
                  </div>
                  <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-[2rem] text-center space-y-2">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Điểm TB Quiz</p>
                    <p className="text-4xl font-black">{resultsData.summary.averageScore}</p>
                  </div>
                  <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-[2rem] text-center space-y-2">
                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Đánh giá Trình độ</p>
                    <p className="text-xl font-black mt-2 text-purple-200">{resultsData.summary.currentLevel}</p>
                  </div>
                  <div className="bg-amber-600/10 border border-amber-500/20 p-6 rounded-[2rem] text-center space-y-2">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Số bài hoàn tất</p>
                    <p className="text-4xl font-black">{resultsData.summary.completedCount}/{resultsData.summary.totalLessons}</p>
                  </div>
                </div>

                <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-slate-800 flex items-center gap-3">
                    <Award className="text-yellow-500" />
                    <h3 className="text-xl font-black italic">Bảng theo dõi năng lực chi tiết</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <th className="p-6">Ngày</th>
                          <th className="p-6">Chủ đề kiến thức</th>
                          <th className="p-6">Kết quả đạt được</th>
                          <th className="p-6">AI Assessment</th>
                          <th className="p-6 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {resultsData.detailedResults.map((res: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-6 font-black text-slate-600">#{res.dayNumber}</td>
                            <td className="p-6 font-bold text-slate-200">{res.title}</td>
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="w-24 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all ${res.score >= 80 ? 'bg-emerald-500' : res.score >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${res.score}%` }} />
                                </div>
                                <span className="text-xs font-black">{res.score}đ</span>
                              </div>
                            </td>
                            <td className="p-6 text-[10px] font-black uppercase">
                              <span className={`px-2 py-1 rounded-lg ${res.status === 'EXPERT' ? 'text-emerald-500 bg-emerald-500/10' : res.status === 'BEGINNER' ? 'text-red-400 bg-red-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                                {res.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-6 text-center">
                              {res.isCompleted ? <CheckCircle className="mx-auto text-emerald-500" size={18} /> : <Lock className="mx-auto text-slate-700" size={18} />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>
            )}
          </div>
        )}

        {/* TAB CHIA SẺ */}
        {activeTab === 'share' && (
          <div className="bg-[#1e293b]/50 p-8 lg:p-10 rounded-[3rem] border border-slate-800 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-2xl font-black italic flex items-center gap-2">
                <Share2 className="text-blue-400" /> Chia sẻ lộ trình học tập
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Gửi tặng bản sao (clone) của lộ trình hiện tại cho các học viên khác hoặc bạn bè của bạn.
              </p>
            </div>

            {shareSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-black animate-in fade-in duration-200">
                <CheckCircle className="text-emerald-500" size={14} />
                <span>{shareSuccessMsg}</span>
              </div>
            )}

            {shareErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400 text-xs font-black animate-in fade-in duration-200">
                <X className="text-red-500 shrink-0" size={14} />
                <span>{shareErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* CỘT TRÁI: TÌM KIẾM NGƯỜI KHÁC (KHÔNG PHẢI BẠN BÈ) */}
              <div className="bg-[#0f172a]/50 p-6 rounded-[2rem] border border-slate-800 flex flex-col h-[450px]">
                <div className="mb-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                    <Search size={14} className="text-slate-500" /> Tìm kiếm người khác
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập email hoặc tên đầy đủ để tìm..."
                      value={searchOtherUsersQuery}
                      onChange={(e) => setSearchOtherUsersQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchOtherUsers()}
                      className="flex-1 bg-[#0f172a] border border-slate-850 p-3 rounded-2xl text-xs text-white outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                    <button
                      onClick={handleSearchOtherUsers}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase transition-all shrink-0 cursor-pointer"
                    >
                      Tìm
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold italic">Danh bạ người dùng bên ngoài hệ thống (không bao gồm bạn bè).</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {searchingOther ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
                      <span className="text-[9px] font-black uppercase tracking-wider">Đang kết nối cơ sở dữ liệu...</span>
                    </div>
                  ) : otherUsers.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-600 font-bold h-full flex flex-col items-center justify-center gap-2">
                      <Users size={24} className="text-slate-800" />
                      <span>Nhập từ khóa tìm kiếm học viên quốc tế</span>
                    </div>
                  ) : (
                    otherUsers.map(u => {
                      const initials = u.fullName ? u.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : '??';
                      const isDuplicateOwned = recipientStatuses[u._id]?.isShared && !recipientStatuses[u._id]?.hasUpdates;
                      return (
                        <div
                          key={u._id}
                          className="flex items-center justify-between p-3.5 bg-[#0f172a]/60 border border-slate-850 hover:border-blue-500/20 rounded-2xl transition-all"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center text-xs font-black shrink-0 shadow-md">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5 flex-wrap">
                                {u.fullName}
                                {renderRecipientBadge(u._id)}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate mt-1 leading-none">{u.email}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleShareToFriend(u._id, u.fullName)}
                            disabled={sharingFriendId === u._id || isDuplicateOwned}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${isDuplicateOwned
                              ? "bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed"
                              : "bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/20 hover:border-transparent"
                              }`}
                          >
                            {sharingFriendId === u._id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Send size={10} />
                            )}
                            {isDuplicateOwned ? "Đã sở hữu" : "Gửi copy"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CỘT PHẢI: DANH SÁCH BẠN BÈ ĐÃ KẾT BẠN */}
              <div className="bg-[#0f172a]/50 p-6 rounded-[2rem] border border-slate-800 flex flex-col h-[450px]">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Users size={14} className="text-slate-500" /> Bạn bè thân thiết
                  </h4>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                    {friends.length} bạn bè
                  </span>
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Lọc nhanh danh bạ bạn bè hoặc giảng viên..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-850 p-3 rounded-2xl text-xs text-white outline-none font-semibold transition-all"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {loadingFriends ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
                      <span className="text-[9px] font-black uppercase tracking-wider">Đang tìm danh bạ...</span>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="py-16 text-center bg-slate-950/20 rounded-2xl border border-dashed border-slate-800 space-y-4 h-full flex flex-col justify-center">
                      <div className="w-12 h-12 bg-slate-850 rounded-full flex items-center justify-center mx-auto text-slate-500">
                        <Users size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-bold text-xs">Chưa có bạn bè nào</p>
                        <p className="text-[10px] text-slate-500">Kết nối thêm bạn bè để dễ dàng chia sẻ lộ trình học.</p>
                      </div>
                      <button
                        onClick={() => navigate('/friends')}
                        className="mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md cursor-pointer"
                      >
                        Trang bạn bè
                      </button>
                    </div>
                  ) : (() => {
                    const filtered = friends.filter(({ friend }) => {
                      const name = (friend?.fullName || "").toLowerCase();
                      const email = (friend?.email || "").toLowerCase();
                      const query = friendSearchQuery.toLowerCase();
                      return name.includes(query) || email.includes(query);
                    });

                    if (filtered.length === 0) {
                      return <div className="py-10 text-center text-xs text-slate-600 font-bold">Không tìm thấy bạn bè phù hợp.</div>;
                    }

                    return filtered.map(({ friendshipId, friend }) => {
                      const initials = friend.fullName ? friend.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : '??';
                      const isInstructor = friend.role?.includes('instructor');
                      const isDuplicateOwned = recipientStatuses[friend._id]?.isShared && !recipientStatuses[friend._id]?.hasUpdates;

                      return (
                        <div
                          key={friendshipId}
                          className="flex items-center justify-between p-3.5 bg-[#0f172a] border border-slate-850 hover:border-blue-500/25 rounded-2xl transition-all"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md relative">
                              {initials}
                              {isInstructor && <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-purple-500 rounded-full border border-[#0f172a]" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5 flex-wrap">
                                {friend.fullName}
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${isInstructor ? 'text-purple-400 bg-purple-400/5' : 'text-blue-400 bg-blue-400/5'}`}>
                                  {isInstructor ? 'GV' : 'HV'}
                                </span>
                                {renderRecipientBadge(friend._id)}
                              </p>
                              <p className="text-[10px] text-slate-550 truncate mt-1 leading-none">{friend.email}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleShareToFriend(friend._id, friend.fullName)}
                            disabled={sharingFriendId === friend._id || isDuplicateOwned}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${isDuplicateOwned
                              ? "bg-slate-800 text-slate-550 border border-slate-750 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-505 text-white"
                              }`}
                          >
                            {sharingFriendId === friend._id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Send size={10} />
                            )}
                            {isDuplicateOwned ? "Đã sở hữu" : "Gửi ngay"}
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* --- MODAL CHỌN GIÁO VIÊN --- */}
      {showInstructorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-10 border border-slate-700 shadow-2xl space-y-6 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center">
              <div><h3 className="text-2xl font-black">Tìm giảng viên</h3><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Mentor Selection</p></div>
              <button onClick={() => { setShowInstructorModal(false); setInstructorErrorMsg(null); }}><X /></button>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" placeholder="Nhập tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" autoFocus />
            </div>

            {/* Error banner bên trong instructor modal */}
            {instructorErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2 text-red-400 text-xs font-black animate-in fade-in duration-200">
                <X size={14} className="shrink-0 mt-0.5" />
                <span>{instructorErrorMsg}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              <button onClick={() => handleChangeInstructor("")} className="w-full p-5 bg-slate-900/50 hover:bg-slate-800 rounded-3xl border border-dashed border-slate-700 text-left text-sm font-bold text-slate-500 flex items-center gap-3 transition-all"><X size={18} /> Không chọn (Tự học)</button>
              {filteredInstructors.map(ins => {
                const isDuplicateOwned = recipientStatuses[ins._id]?.isShared && !recipientStatuses[ins._id]?.hasUpdates;
                return (
                  <div
                    key={ins._id}
                    onClick={() => {
                      if (isDuplicateOwned) {
                        setInstructorErrorMsg("Đã gửi lộ trình cho giáo viên này và nội dung hoàn toàn trùng khớp. Chưa có cập nhật mới nào để gửi.");
                        return;
                      }
                      setInstructorErrorMsg(null);
                      handleChangeInstructor(ins._id);
                    }}
                    className={`w-full p-5 rounded-3xl border cursor-pointer transition-all flex items-center justify-between group ${isDuplicateOwned
                      ? "bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed"
                      : "bg-[#0f172a] hover:bg-blue-600/10 border-slate-800 hover:border-blue-500"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black">{ins.fullName[0].toUpperCase()}</div>
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          {ins.fullName}
                          {renderRecipientBadge(ins._id)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold">{ins.email}</p>
                      </div>
                    </div>
                    {isDuplicateOwned ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Đã sở hữu</span>
                    ) : (
                      <UserCheck size={20} className="text-slate-700 group-hover:text-blue-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlanDetail;