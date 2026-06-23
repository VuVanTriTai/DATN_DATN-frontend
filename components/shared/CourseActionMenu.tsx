import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MoreVertical, UserPlus, Share2, Globe, Trash2, X, Search,
  Send, Loader2, Users, CheckCircle, UserCheck, Tag, Sparkles
} from 'lucide-react';
import { MARKET_CATEGORIES } from '../../utils/marketConstants';

interface CourseActionMenuProps {
  plan: {
    _id: string;
    title: string;
    owner?: string | any;
    instructor?: string | any;
    isPublic?: boolean;
    originalPlanId?: string | null;
    progress?: number;
  };
  onRefresh: () => void;
}

export const CourseActionMenu: React.FC<CourseActionMenuProps> = ({ plan, onRefresh }) => {
  const { user, activeMode } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);

  // Instructor selection state
  const [instructors, setInstructors] = useState<any[]>([]);
  const [instructorSearch, setInstructorSearch] = useState('');
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // Share modal search state
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const [searchOtherUsersQuery, setSearchOtherUsersQuery] = useState('');
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [searchingOther, setSearchingOther] = useState(false);
  const [sharingUserId, setSharingUserId] = useState<string | null>(null);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);
  const [shareErrorMsg, setShareErrorMsg] = useState<string | null>(null);

  // Market share state
  const [marketCategories, setMarketCategories] = useState<string>('lap_trinh');
  const [marketLevel, setMarketLevel] = useState<string>('basic');
  const [marketTags, setMarketTags] = useState<string>('');
  const [submittingMarket, setSubmittingMarket] = useState(false);
  const [marketErrorMsg, setMarketErrorMsg] = useState<string | null>(null);

  // Instructor modal error state
  const [instructorErrorMsg, setInstructorErrorMsg] = useState<string | null>(null);
  const [instructorSuccessMsg, setInstructorSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Format initials
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // --- 1. HANDLE INSTRUCTOR ---
  const handleOpenInstructorModal = async () => {
    setMenuOpen(false);
    setInstructorErrorMsg(null);
    setInstructorSuccessMsg(null);
    setShowInstructorModal(true);
    setLoadingInstructors(true);
    try {
      const res = await api.auth.getInstructors();
      if (res && res.success) {
        setInstructors(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInstructors(false);
    }
  };

  const handleSelectInstructor = async (insId: string) => {
    setInstructorErrorMsg(null);
    setInstructorSuccessMsg(null);
    try {
      const res = await api.plan.updateInstructor(plan._id, insId);
      if (res && res.success) {
        if (!insId) {
          // Gỡ giáo viên → đóng modal luôn
          setShowInstructorModal(false);
          onRefresh();
        } else {
          // Gửi thành công → hiện thông báo trong modal rồi tự đóng
          setInstructorSuccessMsg("Đã gửi lộ trình cho giáo viên hướng dẫn thành công!");
          setTimeout(() => {
            setShowInstructorModal(false);
            onRefresh();
          }, 2000);
        }
      } else {
        // Hiện lỗi ngay trong modal (ví dụ: đã gửi rồi, nội dung trùng)
        setInstructorErrorMsg(res?.message || "Đã xảy ra lỗi cập nhật.");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Lỗi khi kết nối với Giáo viên hướng dẫn.";
      setInstructorErrorMsg(msg);
    }
  };

  // --- 2. HANDLE SHARING ---
  const handleOpenShareModal = async () => {
    setMenuOpen(false);
    setShowShareModal(true);
    setLoadingFriends(true);
    setShareSuccessMsg(null);
    setShareErrorMsg(null);
    setOtherUsers([]);
    setSearchOtherUsersQuery('');
    try {
      const res = await api.friends.getMyFriends();
      if (res && res.success) {
        setFriends(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFriends(false);
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
        // Filter out users who are already friends to maintain strict "non-friend" list
        const list = res.data || [];
        const nonFriends = list.filter((u: any) => u.friendshipStatus !== 'accepted');
        setOtherUsers(nonFriends);
      }
    } catch (err) {
      console.error("Search other users error:", err);
    } finally {
      setSearchingOther(false);
    }
  };

  const handleShareToUser = async (userId: string, userName: string) => {
    setSharingUserId(userId);
    setShareSuccessMsg(null);
    setShareErrorMsg(null);
    try {
      const res = await api.plan.sharePrivate(plan._id, userId);
      if (res && res.success) {
        setShareSuccessMsg(`Đã gửi bản sao lộ trình thành công cho "${userName}"!`);
        setTimeout(() => setShareSuccessMsg(null), 5000);
      } else {
        setShareErrorMsg(res?.message || "Lỗi khi chia sẻ lộ trình.");
        setTimeout(() => setShareErrorMsg(null), 6000);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Lỗi quy trình chia sẻ.";
      setShareErrorMsg(msg);
      setTimeout(() => setShareErrorMsg(null), 6000);
    } finally {
      setSharingUserId(null);
    }
  };

  // --- 3. HANDLE MARKET ---
  const handleOpenMarketModal = () => {
    setMenuOpen(false);
    setMarketErrorMsg(null);
    setShowMarketModal(true);
  };

  const handleShareToMarket = async () => {
    setSubmittingMarket(true);
    setMarketErrorMsg(null);
    try {
      const payload = {
        categories: [marketCategories],
        level: marketLevel,
        tags: marketTags.split(',').map(t => t.trim()).filter(Boolean)
      };
      const res = await api.plan.shareToMarket(plan._id, payload);
      if (res && res.success) {
        alert("Tuyệt vời! Lộ trình của bạn đã được đăng công khai lên Chợ lộ trình.");
        setShowMarketModal(false);
        onRefresh();
      } else {
        setMarketErrorMsg(res?.message || "Không thể đưa lên Market.");
      }
    } catch (err: any) {
      console.error(err);
      const msg = (err as any).response?.data?.message || "Lỗi khi đưa lên Market.";
      setMarketErrorMsg(msg);
    } finally {
      setSubmittingMarket(false);
    }
  };

  // --- 4. HANDLE DELETE ---
  const handleDeletePlan = async () => {
    setMenuOpen(false);
    if (window.confirm("Bạn có chắc chắn muốn xóa lộ trình học tập này không? Thao tác này không thể hoàn tác.")) {
      try {
        const res = await api.plan.delete(plan._id);
        if (res && res.success) {
          alert("Lộ trình học tập đã được xóa thành công!");
          onRefresh();
        } else {
          alert(res?.message || "Không thể xóa lộ trình.");
        }
      } catch (err: any) {
        console.error(err);
        // Hiển thị message từ server nếu có (ví dụ: lỗi không cho xóa bản Market)
        const serverMsg = err?.response?.data?.message;
        alert(serverMsg || "Lỗi khi xóa lộ trình học.");
      }
    }
  };

  // --- 5. HANDLE UNLIST FROM MARKET ---
  const handleUnlistFromMarket = async () => {
    setMenuOpen(false);
    if (window.confirm("Bạn có chắc chắn muốn gỡ lộ trình này khỏi Market không?")) {
      try {
        const res = await api.market.unlistCourse(plan._id);
        if (res && res.success) {
          alert("Đã gỡ lộ trình khỏi Market thành công!");
          onRefresh();
        } else {
          alert(res?.message || "Không thể gỡ lộ trình khỏi Market.");
        }
      } catch (err: any) {
        console.error(err);
        alert("Lỗi khi gỡ lộ trình khỏi Market: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const filteredInstructors = instructors.filter(ins => {
    // LỌC BỎ CHÍNH BẢN THÂN KHỎI DANH SÁCH GIÁO VIÊN
    if (user && ins._id === user.id) return false;

    const q = instructorSearch.toLowerCase();
    return ins.fullName.toLowerCase().includes(q) || ins.email.toLowerCase().includes(q);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 w-9 h-9 rounded-xl border border-slate-800 bg-[#121626] hover:bg-slate-850 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
        id={`menu-trigger-${plan._id}`}
      >
        <MoreVertical size={16} />
      </button>

      {/* DROPDOWN MENU */}
      {menuOpen && (
        <div className="absolute left-0 mt-2 w-52 bg-[#0d121f] border border-slate-800/80 rounded-2xl shadow-2xl p-2 z-[90] animate-in fade-in slide-in-from-top-2 duration-150">

          {/* Option: Chọn giáo viên (Chỉ khả dụng cho learner chế độ learner) */}
          {activeMode === 'learner' && (
            <button
              onClick={handleOpenInstructorModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850 rounded-xl transition-all"
            >
              <UserPlus size={14} className="text-blue-500" />
              <span>Chọn giáo viên</span>
            </button>
          )}

          {/* Option: Chia sẻ */}
          <button
            onClick={handleOpenShareModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850 rounded-xl transition-all"
          >
            <Share2 size={14} className="text-emerald-500" />
            <span>Chia sẻ lộ trình</span>
          </button>

          {/* Option: Đưa lên Market */}
          <button
            onClick={handleOpenMarketModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850 rounded-xl transition-all"
          >
            <Globe size={14} className="text-indigo-400" />
            <span>Đưa lên Market</span>
          </button>

          <div className="border-t border-slate-850/60 my-1"></div>

          {/* Option: Xóa */}
          <button
            onClick={handleDeletePlan}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <Trash2 size={14} />
            <span>Xóa lộ trình</span>
          </button>
        </div>
      )}

      {/* ── MODAL 1: CHỌN GIÁO VIÊN ── */}
      {showInstructorModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#101426] w-full max-w-md rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="text-blue-500" size={18} /> Chỉ định giảng viên
                </h3>
                <p className="text-[10px] text-slate-500 tracking-wider font-extrabold uppercase mt-1">Instructor Linking</p>
              </div>
              <button
                onClick={() => setShowInstructorModal(false)}
                className="p-1 px-2.5 text-slate-500 hover:text-white border border-slate-850 hover:border-slate-800 bg-slate-900/60 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Tìm giảng viên theo tên, email..."
                value={instructorSearch}
                onChange={(e) => setInstructorSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 p-3.5 pl-11 rounded-2xl text-xs text-white outline-none focus:border-blue-500 transition-all font-semibold"
                autoFocus
              />
            </div>

            {/* Instructor modal banners */}
            {instructorSuccessMsg && (
              <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-black animate-in fade-in duration-200">
                <CheckCircle size={14} className="shrink-0" />
                <span>{instructorSuccessMsg}</span>
              </div>
            )}
            {instructorErrorMsg && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400 text-xs font-black animate-in fade-in duration-200">
                <X size={14} className="shrink-0" />
                <span>{instructorErrorMsg}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[200px]">
              <button
                onClick={() => handleSelectInstructor("")}
                className="w-full p-4 bg-slate-900/40 hover:bg-slate-850 rounded-2xl border border-dashed border-slate-800 text-left text-xs font-bold text-slate-400 flex items-center gap-3 transition-colors"
              >
                <X size={14} className="text-slate-500" />
                <span>Không chọn giảng viên (Tự học)</span>
              </button>

              {loadingInstructors ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                  <span className="text-[10px] font-bold uppercase">Đang tải giảng viên...</span>
                </div>
              ) : filteredInstructors.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 font-bold">Không tìm thấy giảng viên phù hợp.</div>
              ) : (
                filteredInstructors.map(ins => (
                  <div
                    key={ins._id}
                    onClick={() => handleSelectInstructor(ins._id)}
                    className="w-full p-4 bg-slate-950/80 hover:bg-slate-900 rounded-2xl border border-slate-805/60 hover:border-blue-500/55 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-md">
                        {getInitials(ins.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">{ins.fullName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{ins.email}</p>
                      </div>
                    </div>
                    <UserCheck size={16} className="text-slate-700 group-hover:text-blue-400 transition-colors shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 2: CHIA SẺ LỘ TRÌNH (FORM 2 PHẦN) ── */}
      {showShareModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#101426] w-full max-w-4xl rounded-[3rem] p-8 lg:p-10 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-850/60">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="text-[#10b981]" size={18} /> Chia sẻ lộ trình học tập
                </h3>
                <p className="text-[10px] text-slate-500 tracking-wider font-extrabold uppercase mt-1">
                  Lộ trình: <span className="text-slate-300 normal-case font-semibold">{plan.title}</span>
                </p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 px-2.5 text-slate-500 hover:text-white border border-slate-850 hover:border-slate-800 bg-slate-900/60 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>

            {/* Success & Error message banners */}
            {shareSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-black animate-in fade-in duration-200">
                <CheckCircle size={14} />
                <span>{shareSuccessMsg}</span>
              </div>
            )}
            {shareErrorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400 text-xs font-black animate-in fade-in duration-200">
                <X size={14} className="shrink-0" />
                <span>{shareErrorMsg}</span>
              </div>
            )}

            {/* Double columns content */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto md:overflow-hidden min-h-[300px] md:min-h-[350px] py-1">

              {/* CỘT TRÁI: TÌM KIẾM NGƯỜI KHÁC (KHÔNG PHẢI BẠN BÈ) */}
              <div className="flex flex-col bg-slate-950/60 p-5 rounded-[2rem] border border-slate-850/60 overflow-hidden h-[340px] md:h-auto">
                <div className="mb-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                    <Search size={12} className="text-slate-500" /> Tìm kiếm người khác
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập tên hoặc email..."
                      value={searchOtherUsersQuery}
                      onChange={(e) => setSearchOtherUsersQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchOtherUsers()}
                      className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500/40 p-3 rounded-xl text-xs text-white outline-none font-semibold transition-all"
                    />
                    <button
                      onClick={handleSearchOtherUsers}
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-xs transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      Tìm
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold italic">Không bao gồm danh sách bạn bè đã kết nối.</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {searchingOther ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="animate-spin text-emerald-500" size={20} />
                      <span className="text-[9px] font-black uppercase tracking-wider">Đang truy vấn database...</span>
                    </div>
                  ) : otherUsers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-600 font-bold h-full flex flex-col items-center justify-center gap-2">
                      <Users size={20} className="text-slate-800" />
                      <span>Nhập email/tên để tìm kiếm người học bên ngoài</span>
                    </div>
                  ) : (
                    otherUsers.map(u => (
                      <div
                        key={u._id}
                        className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-850 hover:border-emerald-500/30 rounded-xl transition-all"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                            {getInitials(u.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate leading-tight">{u.fullName}</p>
                            <p className="text-[10px] text-slate-500 truncate leading-none mt-1">{u.email}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleShareToUser(u._id, u.fullName)}
                          disabled={sharingUserId === u._id}
                          className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-transparent text-emerald-400 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {sharingUserId === u._id ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Send size={10} />
                          )}
                          <span>Gửi copy</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT PHẢI: DANH SÁCH BẠN BÈ ĐÃ KẾT BẠN */}
              <div className="flex flex-col bg-slate-950/60 p-5 rounded-[2rem] border border-slate-850/60 overflow-hidden h-[340px] md:h-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Users size={12} className="text-slate-500" /> Bạn bè của bạn
                  </h4>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                    {friends.length} liên kết
                  </span>
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Lọc nhanh danh sách bạn bè..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white outline-none font-semibold transition-all"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {loadingFriends ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="animate-spin text-blue-500" size={20} />
                      <span className="text-[9px] font-black uppercase">Đang tải bạn bè...</span>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-600 font-bold h-full flex flex-col items-center justify-center gap-2">
                      <Users size={20} className="text-slate-800" />
                      <span>Bạn chưa kết nối với bạn bè nào</span>
                    </div>
                  ) : (() => {
                    const filtered = friends.filter(({ friend }) => {
                      const name = (friend?.fullName || "").toLowerCase();
                      const email = (friend?.email || "").toLowerCase();
                      const q = friendSearchQuery.toLowerCase();
                      return name.includes(q) || email.includes(q);
                    });

                    if (filtered.length === 0) {
                      return <div className="py-8 text-center text-xs text-slate-600 font-bold">Không tìm thấy ai khớp từ khóa.</div>;
                    }

                    return filtered.map(({ friendshipId, friend }) => {
                      const isInstructor = friend.role?.includes('instructor');
                      return (
                        <div
                          key={friendshipId}
                          className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850 hover:border-blue-500/20 rounded-xl transition-all"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 relative">
                              {getInitials(friend.fullName)}
                              {isInstructor && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500 border border-slate-900" title="Giảng viên" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                                {friend.fullName}
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${isInstructor ? 'text-purple-400 bg-purple-500/5 border border-purple-500/20' : 'text-blue-400 bg-blue-500/5 border border-blue-500/20'
                                  }`}>
                                  {isInstructor ? 'GV' : 'HV'}
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-500 truncate leading-none mt-1">{friend.email}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleShareToUser(friend._id, friend.fullName)}
                            disabled={sharingUserId === friend._id}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {sharingUserId === friend._id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Send size={10} />
                            )}
                            <span>Chia sẻ</span>
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 3: ĐƯA LÊN MARKETPLACE ── */}
      {showMarketModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#101426] w-full max-w-md rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl space-y-6 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="text-indigo-400" size={16} /> Đăng tải lên Market
                </h3>
                <p className="text-[10px] text-slate-500 tracking-wider font-extrabold uppercase mt-1">Share To Marketplace</p>
              </div>
              <button
                onClick={() => setShowMarketModal(false)}
                className="p-1 px-2.5 text-slate-500 hover:text-white border border-slate-850 hover:border-slate-800 bg-slate-900/60 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Chuyên mục chính</label>
                <select
                  value={marketCategories}
                  onChange={(e) => setMarketCategories(e.target.value)}
                  className="w-full bg-[#0d121f] border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {MARKET_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Cấp độ phù hợp</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'basic', label: 'Cơ bản' },
                    { id: 'intermediate', label: 'Trung cấp' },
                    { id: 'advanced', label: 'Nâng cao' }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setMarketLevel(lvl.id)}
                      className={`p-2.5 rounded-xl border text-[11px] font-black uppercase transition-all tracking-wider ${marketLevel === lvl.id
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                          : 'border-slate-800 bg-slate-900/45 text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Nhãn tìm kiếm (tags)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: python, oop, AI (cách nhau bằng dấu phẩy)..."
                  value={marketTags}
                  onChange={(e) => setMarketTags(e.target.value)}
                  className="w-full bg-[#0d121f] border border-slate-800 p-3 rounded-xl text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Market error banner */}
            {marketErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2 text-red-400 text-xs font-black animate-in fade-in duration-200">
                <X size={14} className="shrink-0 mt-0.5" />
                <span>{marketErrorMsg}</span>
              </div>
            )}

            <button
              onClick={handleShareToMarket}
              disabled={submittingMarket}
              className="w-full py-4.5 bg-gradient-to-tr from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-950/40 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submittingMarket ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> ĐANG XỬ LÝ...</span>
              ) : (
                <span className="flex items-center justify-center gap-1.5"><Sparkles size={14} /> HOÀN TẤT ĐĂNG TẢI</span>
              )}
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default CourseActionMenu;
