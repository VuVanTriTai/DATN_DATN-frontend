import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { LayoutGrid, BookOpen, Users, BarChart3, ChevronRight, User } from 'lucide-react';

const CourseDashboard = () => {
  const { planId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Load dữ liệu tổng hợp cho Dashboard khóa học
    api.instructor.getCourseStats(planId!).then(res => setData(res.data));
  }, [planId]);

  return (
    <div className="p-10 space-y-8 text-white">
      {/* Course Header */}
      <div className="flex items-center gap-4 text-slate-500 text-sm font-bold uppercase tracking-widest">
        <span>Khóa học</span> <ChevronRight size={14} /> <span>{data?.planTitle}</span>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 bg-[#1e293b] p-2 rounded-2xl border border-slate-800 w-fit">
        {[
          { id: 'overview', label: 'Tổng quan', icon: <LayoutGrid size={18} /> },
          { id: 'lessons', label: 'Bài học', icon: <BookOpen size={18} /> },
          { id: 'students', label: 'Học viên', icon: <Users size={18} /> },
          { id: 'progress', label: 'Tiến độ', icon: <BarChart3 size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
              ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Render */}
      <div className="mt-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            <div className="bg-[#1e293b] p-8 rounded-[2rem] border border-slate-800">
              <p className="text-slate-500 text-xs font-black uppercase mb-2">Tổng học viên</p>
              <p className="text-4xl font-black">{data?.studentCount || 0}</p>
            </div>
            <div className="bg-[#1e293b] p-8 rounded-[2rem] border border-slate-800">
              <p className="text-slate-500 text-xs font-black uppercase mb-2">Tiến độ trung bình</p>
              <p className="text-4xl font-black text-blue-500">{data?.avgProgress || 0}%</p>
            </div>
            <div className="bg-[#1e293b] p-8 rounded-[2rem] border border-slate-800">
              <p className="text-slate-500 text-xs font-black uppercase mb-2">Số bài học</p>
              <p className="text-4xl font-black text-emerald-500">{data?.lessonCount || 0}</p>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-800 overflow-hidden animate-in slide-in-from-right">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-6">Học viên</th>
                  <th className="p-6">Tiến độ</th>
                  <th className="p-6">Trạng thái</th>
                  <th className="p-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.students?.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold">{student.name[0]}</div>
                        <div>
                          <p className="font-bold text-sm">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${student.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold mt-1 block">{student.progress}%</span>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${student.progress === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {student.progress === 100 ? 'Hoàn thành' : 'Đang học'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button className="text-blue-400 font-bold text-xs hover:underline">Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default CourseDashboard;
