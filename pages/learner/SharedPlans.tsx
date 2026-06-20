//SharedPlans.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Share2, User, ChevronRight, DownloadCloud,
  Clock, FileSearch, Loader2, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseActionMenu from '../../components/shared/CourseActionMenu';

const SharedPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSharedPlans();
  }, []);

  const fetchSharedPlans = async () => {
    try {
      setLoading(true);
      const res = await api.plan.getSharedWithMe();
      if (res.success) setPlans(res.data);
    } catch (error) {
      console.error("Lỗi tải lộ trình chia sẻ:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (id: string) => {
    if (window.confirm("Bạn muốn lấy lộ trình này về kho cá nhân?")) {
      setImportingId(id);
      try {
        const res = await api.market.importCourse(id);
        if (res.success) {
          alert("Đã thêm thành công vào mục 'Lộ trình lấy về'");
          navigate('/dashboard'); // Chuyển về Dashboard để bắt đầu học
        }
      } catch (err: any) {
        alert("Lỗi khi sao chép lộ trình: " + (err.response?.data?.message || err.message));
      } finally {
        setImportingId(null);
      }
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-10 text-white min-h-screen bg-[#0f172a] animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <Share2 className="text-purple-400" size={36} /> Lộ trình được chia sẻ
        </h1>
        <p className="text-slate-500 font-medium italic">
          Nơi lưu giữ những kiến thức quý giá được bạn bè và giáo viên gửi tặng riêng cho bạn.
        </p>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-purple-500" size={40} />
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Đang kiểm tra hòm thư...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.length > 0 ? (
            plans.map((p: any) => (
              <div
                key={p._id}
                className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-800 hover:border-purple-500/50 transition-all group shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-6">
                  {/* Người gửi */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 bg-purple-500/5 p-3 rounded-2xl border border-purple-500/10 w-fit">
                      <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center font-black text-xs">
                        {(p.instructorId?.fullName || p.owner?.fullName)?.[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Được gửi từ</p>
                        <p className="text-xs font-bold text-purple-300">
                          {p.instructorId?.fullName || p.owner?.fullName}
                        </p>
                      </div>
                    </div>
                    {/* Menu hành động */}
                    <CourseActionMenu plan={p} onRefresh={fetchSharedPlans} />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-4 text-slate-500 text-xs font-bold">
                      <span className="flex items-center gap-1"><BookOpen size={14} /> {p.duration} ngày</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleImport(p._id)}
                  disabled={importingId === p._id}
                  className="mt-8 w-full py-4 bg-slate-800 hover:bg-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {importingId === p._id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <DownloadCloud size={20} />
                  )}
                  {importingId === p._id ? "Đang đồng bộ..." : "Lấy lộ trình về học"}
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-[#1e293b]/30 rounded-[3rem] border-2 border-dashed border-slate-800 space-y-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                <FileSearch size={40} />
              </div>
              <p className="text-slate-500 font-bold italic">Bạn chưa nhận được lộ trình chia sẻ nào.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SharedPlans;