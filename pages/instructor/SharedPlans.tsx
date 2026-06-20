import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  Share2, User, DownloadCloud, 
  Clock, FileSearch, Loader2, BookOpen 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseActionMenu from '../../components/shared/CourseActionMenu';

const SharedPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSharedPlans();
  }, []);

  const fetchSharedPlans = async () => {
    try {
      setLoading(true);
      const res = await api.plan.getSharedWithMe();
      // res.data là mảng các plan từ backend
      if (res.success) {
        setPlans(res.data || []);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (id: string) => {
    if (window.confirm("Bạn muốn lấy lộ trình này về kho cá nhân?")) {
      try {
        const res = await api.market.importCourse(id);
        if (res.success) {
          alert("Thành công! Lộ trình đã nằm trong mục 'Lộ trình lấy về'.");
          navigate('/dashboard'); 
        }
      } catch (err: any) {
        alert("Không thể lấy lộ trình: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="p-10 space-y-10 text-white min-h-screen animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <Share2 className="text-purple-400" size={36} /> Lộ trình được chia sẻ
        </h1>
        <p className="text-slate-500 font-medium">Những kiến thức được gửi tặng riêng cho bạn.</p>
      </header>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.length > 0 ? (
            plans.map((p: any) => (
              <div key={p._id} className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-800 hover:border-purple-500/50 transition-all group shadow-xl flex flex-col justify-between h-80">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20 w-fit">
                      <User className="text-purple-400" size={16}/>
                      <span className="text-[10px] font-black uppercase text-purple-300">Từ: {p.owner?.fullName}</span>
                    </div>
                    {/* Menu hành động */}
                    <CourseActionMenu plan={p} onRefresh={fetchSharedPlans} />
                  </div>
                  <h3 className="text-xl font-bold line-clamp-2">{p.title}</h3>
                  <div className="text-slate-500 text-xs flex gap-4">
                    <span className="flex items-center gap-1"><BookOpen size={14}/> {p.duration} ngày</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleImport(p._id)}
                  className="w-full py-4 bg-slate-800 hover:bg-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <DownloadCloud size={20}/> Lấy về lộ trình học
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-[#1e293b]/30 rounded-[3rem] border-2 border-dashed border-slate-800">
              <FileSearch className="mx-auto mb-4 text-slate-700" size={48} />
              <p className="text-slate-500 italic font-bold">Hòm thư chia sẻ đang trống.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SharedPlans;