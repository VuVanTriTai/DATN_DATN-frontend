//Document quản lý tài liệu của học viên: xem danh sách, xem chi tiết, tải về, xóa tài liệu đã upload lên hệ thống. Đây là nơi lưu trữ các nguồn tri thức mà AI sẽ sử dụng để thiết kế lộ trình và huấn luyện trợ lý AI cá nhân hóa cho học viên.
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  FileText, Download, Trash2, Clock, 
  Eye, X, FileSearch, Loader2, Sparkles 
} from 'lucide-react';

const Documents = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái xem: 'text' (Văn bản AI đọc) hoặc 'original' (File gốc PDF/Word)
  const [viewMode, setViewMode] = useState<'text' | 'original'>('text');

  // Helper chuyển đổi URL tương đối (uploads/temp/...) thành tuyệt đối từ API Base
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

  useEffect(() => { 
    fetchDocs(); 
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await api.file.getMyDocs();
      if (res.success) setDocs(res.data);
    } catch (error) {
      console.error("Lỗi lấy tài liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Xóa tài liệu này sẽ làm mất dữ liệu hỗ trợ AI cho các câu hỏi liên quan. Xác nhận xóa?")) {
      try {
        const res = await api.file.deleteDocument(id);
        if (res.success) fetchDocs();
      } catch (error) {
        alert("Không thể xóa tài liệu lúc này.");
      }
    }
  };

  const handleDownload = (url: string) => {
    window.open(getAbsoluteFileUrl(url), "_blank");
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 text-white min-h-screen bg-[#0f172a] animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
          <FileText className="text-blue-500" size={32} /> Kho tài liệu của tôi
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Quản lý các nguồn tri thức dùng để thiết kế lộ trình và huấn luyện trợ lý AI.
        </p>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Đang truy xuất kho dữ liệu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          
          
          {docs.map((doc) => (
  <div 
    key={doc._id} 
    className="bg-[#1e293b] p-5 lg:p-6 rounded-[2rem] border border-slate-800 flex items-center justify-between group hover:border-blue-500/40 transition-all shadow-lg"
  >
    {/* ĐÂY CHÍNH LÀ NƠI BẠN CẦN SỬA: */}
    <div 
      className="flex items-center gap-5 cursor-pointer flex-1"
      onClick={() => {
        // --- THÊM DÒNG NÀY ĐỂ KIỂM TRA ---
        console.log("🔍 Dữ liệu tài liệu đang chọn:", doc); 
        console.log("🔗 Link file (fileUrl):", doc.fileUrl);
        // ---------------------------------

        setSelectedDoc(doc);
        setViewMode('original'); // Mặc định mở tab TÀI LIỆU GỐC khi click vào doc
      }}
    >



                <div className="p-4 bg-slate-800 rounded-2xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  <FileText size={24}/>
                </div>
                <div>
                  <p className="text-lg font-bold group-hover:text-blue-400 transition-colors line-clamp-1">{doc.title}</p>

                  
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-slate-500 text-[10px] font-black uppercase flex items-center gap-1">
                      <Clock size={12}/> {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-blue-500/50 text-[10px] font-black uppercase tracking-tighter">
                      {doc.fileUrl?.split('.').pop()?.toUpperCase() || 'DOC'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownload(doc.fileUrl)}
                  className="p-3 bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
                  title="Tải về"
                >
                  <Download size={20}/>
                </button>
                <button 
                  onClick={() => handleDelete(doc._id)}
                  className="p-3 bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Xóa vĩnh viễn"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>
          ))}






          {docs.length === 0 && (
            <div className="py-24 text-center bg-[#1e293b]/30 rounded-[3rem] border-2 border-dashed border-slate-800">
               <FileSearch className="mx-auto mb-4 text-slate-700" size={64} />
               <p className="text-slate-500 font-bold italic">Kho tài liệu đang trống.</p>
               <button onClick={() => window.location.href='/create-plan'} className="mt-4 text-blue-500 text-xs font-black uppercase tracking-widest hover:underline">
                 Tải tài liệu đầu tiên ngay
               </button>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL XEM CHI TIẾT TÀI LIỆU --- */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-6xl h-full rounded-[3rem] border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                  <FileText size={24} className="text-white"/>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white max-w-md truncate">{selectedDoc.title}</h3>
                  <div className="flex gap-6 mt-2">
                     <button 
                      onClick={() => setViewMode('original')}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] pb-1 transition-all ${viewMode === 'original' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       Tài liệu gốc (Bản in)
                     </button>
                     <button 
                      onClick={() => setViewMode('text')}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] pb-1 transition-all ${viewMode === 'text' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       Văn bản trích xuất
                     </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-3 hover:bg-slate-800 rounded-full text-slate-500 transition-all"><X size={24}/></button>
            </div>
            
<div className="flex-1 overflow-hidden bg-[#0f172a] relative">
  {viewMode === 'text' ? (
    <div className="h-full overflow-y-auto p-8 lg:p-16 custom-scrollbar">
       <div className="max-w-4xl mx-auto">
          <pre className="text-slate-300 whitespace-pre-wrap font-sans leading-relaxed text-base lg:text-lg">
            {selectedDoc.content || "Không có nội dung văn bản."}
          </pre>
       </div>
    </div>
  ) : (
    <div className="h-full w-full bg-slate-900 flex flex-col">
      {selectedDoc?.fileUrl ? (
        (() => {
          const rawUrl: string = getAbsoluteFileUrl(selectedDoc.fileUrl);
          const urlLower = rawUrl.toLowerCase();
          const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

          const googleViewerEmbedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
          const googleViewerTabUrl   = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}`;
          const isPdf        = urlLower.includes('.pdf') || urlLower.includes('f_pdf') || urlLower.includes('/pdf/');
          const isOffice     = /\.(docx|doc|pptx|ppt|xlsx|xls)$/.test(urlLower);
          const isCloudinary = urlLower.includes('/raw/upload/');

          const ActionBar = ({ hint }: { hint: string }) => (
            <div className="shrink-0 px-6 py-3 bg-[#1e293b] border-t border-slate-700 flex items-center gap-3">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex-1 hidden sm:block">{hint}</p>
              {!isLocal && (
                <button
                  onClick={() => window.open(googleViewerTabUrl, '_blank')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all"
                >↗ Mở với Google Docs</button>
              )}
              <button
                onClick={() => window.open(rawUrl, '_blank')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
              >↓ Tải xuống</button>
            </div>
          );

          if (isPdf) {
            return (
              <>
                <iframe
                  key={rawUrl}
                  src={`${rawUrl}#toolbar=1&navpanes=0&view=FitH`}
                  className="w-full flex-1 border-none bg-white"
                  title="PDF Preview"
                />
                <ActionBar hint={isLocal ? "PDF chạy trực tiếp từ Localhost" : "Nếu không hiện PDF → dùng nút bên phải"} />
              </>
            );
          }

          if (isLocal && (isOffice || isCloudinary || urlLower.includes('uploads/temp/'))) {
            return (
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
                  <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 max-w-md">
                    <Sparkles size={32} className="mx-auto mb-2 animate-pulse" />
                    <h4 className="font-bold text-lg mb-1">Môi trường Localhost</h4>
                    <p className="text-xs text-slate-300">
                      Hệ thống đang chạy offline trên máy của bạn. Google Docs không thể truy cập tài liệu Word/Excel cục bộ này.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.open(rawUrl, '_blank')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-900/30"
                    >
                      ↓ Tải xuống & Xem bằng Office
                    </button>
                  </div>
                </div>
                <ActionBar hint="Môi trường Localhost - Không thể preview trực tuyến file Word" />
              </div>
            );
          }

          if (isOffice || isCloudinary) {
            return (
              <>
                <iframe
                  key={rawUrl}
                  src={googleViewerEmbedUrl}
                  className="w-full flex-1 border-none"
                  title="Document Preview"
                />
                <ActionBar hint='Nếu thấy lỗi "Đã xuất hiện lỗi" → nhấn Mở với Google Docs' />
              </>
            );
          }

          return (
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <FileSearch size={56} className="text-slate-700" />
              <div className="text-center space-y-1">
                <p className="text-slate-300 font-bold">Định dạng này không hỗ trợ xem trước</p>
                <p className="text-slate-500 text-sm">Hãy tải xuống để mở bằng ứng dụng trên máy tính.</p>
              </div>
              <div className="flex gap-3">
                {!isLocal && (
                  <button onClick={() => window.open(googleViewerTabUrl, '_blank')}
                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold rounded-xl transition-all">
                    ↗ Thử Google Docs
                  </button>
                )}
                <button onClick={() => window.open(rawUrl, '_blank')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all">
                  ↓ Tải xuống
                </button>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
          <FileSearch size={48} className="text-slate-700" />
          <p className="font-bold">Không tìm thấy đường dẫn tệp tin.</p>
          <p className="text-xs text-slate-600">Thử tải xuống từ nút bên dưới.</p>
        </div>
      )}
    </div>
  )}
</div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-800 bg-[#1e293b] flex justify-between items-center px-10">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden md:block">
                  Hệ thống trích xuất tri thức AI Course
              </p>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setSelectedDoc(null)} className="flex-1 md:flex-none px-8 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-all">Đóng</button>
                <button 
                  onClick={() => handleDownload(selectedDoc.fileUrl)}
                  className="flex-1 md:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                  <Download size={18}/> Tải xuống bản gốc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;