import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Save, Send, ArrowLeft, BookOpen,Sparkles,
  CheckCircle, Loader2, MessageSquare, ExternalLink, Eye,
  Plus, Trash2, Star, ListChecks, Edit3, HelpCircle, Video, FileText
} from 'lucide-react';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

const StudentPlanView = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // Tab: content | important | quiz
  const [uploadingAssignment, setUploadingAssignment] = useState(false);
  const [uploadingSolution, setUploadingSolution] = useState(false);
  // --- MODAL LƯU ---
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftLessonIds, setDraftLessonIds] = useState<Set<string>>(new Set()); // Theo dõi bài đã tạo bản nháp
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);

const [isGeneratingAIQuiz, setIsGeneratingAIQuiz] = useState(false);
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false);
  const [editCourseTitleVal, setEditCourseTitleVal] = useState("");
  const handleSaveCourseTitle = async () => {
    if (!editCourseTitleVal.trim()) return;
    try {
      await (api.instructor as any).updateCourseTitle(planId!, editCourseTitleVal);
      setData((prev: any) => prev ? { ...prev, planTitle: editCourseTitleVal } : null);
      setIsEditingCourseTitle(false);
    } catch (e: any) {
      alert("❌ Lỗi khi đổi tên lộ trình: " + (e?.response?.data?.message || e.message));
    }
  };

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    uploadImage: true,
    imageUploadFunction: async (file: File, onSuccess: (url: string) => void, onError: (err: string) => void) => {
      try {
        const res = await api.file.upload(file);
        if (res.success && res.fileUrl) {
          onSuccess(res.fileUrl);
        } else {
          onError("Tải hình ảnh thất bại");
        }
      } catch (err) {
        console.error("Image upload failed:", err);
        onError("Lỗi khi tải ảnh lên");
      }
    },
    toolbar: [
      "bold", "italic", "heading", "|",
      "quote", "unordered-list", "ordered-list", "|",
      "link", "image", "table", "|",
      "preview", "side-by-side", "fullscreen", "|",
      "guide"
    ] as any
  }), []);

  useEffect(() => {
    fetchData();
  }, [planId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.instructor.getCourseStats(planId!);
      if (res.success) {
        setData(res.data);
        setEditCourseTitleVal(res.data.planTitle || "");
        if (res.data.lessons?.length > 0) setSelectedLesson(res.data.lessons[0]);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };
// Helper — đặt gần đầu component hoặc file utils riêng
function mergeDraft(lesson: any) {
  if (!lesson) return lesson;
  if (lesson.hasDraft && lesson.instructorDraft) {
    return {
      ...lesson,
      title: lesson.instructorDraft.title || lesson.title,
      content: lesson.instructorDraft.content || lesson.content,
      summary: lesson.instructorDraft.summary || lesson.summary,
      importantNotes: lesson.instructorDraft.importantNotes ?? lesson.importantNotes,
      quizPool: lesson.instructorDraft.quizPool ?? lesson.quizPool,
      videoUrl: lesson.instructorDraft.videoUrl ?? lesson.videoUrl,
      assignmentUrl: lesson.instructorDraft.assignmentUrl ?? lesson.assignmentUrl,
      solutionUrl: lesson.instructorDraft.solutionUrl ?? lesson.solutionUrl,
      _hasDraft: true,
    };
  }
  return { ...lesson, _hasDraft: lesson._hasDraft ?? false };
}
  const handleAddLessonAfter = async (afterDayNumber: number) => {
    if (!planId) return;
    setIsAddingLesson(true);
    try {
      const res = await api.instructor.addLesson(planId, afterDayNumber);
      if (res.success) {
        const statsRes = await api.instructor.getCourseStats(planId);
        if (statsRes.success) {
          setData(statsRes.data);
          const newLesson = statsRes.data.lessons.find((l: any) => l._id === res.data._id);
          if (newLesson) setSelectedLesson(newLesson);
        }
      }
    } catch (err: any) {
      alert("Lỗi thêm ngày học: " + (err.response?.data?.message || err.message));
    } finally {
      setIsAddingLesson(false);
    }
  };

  const handleAddLesson = () => handleAddLessonAfter(data?.lessons?.length || 0);

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;
    if (window.confirm(`⚠️ Bạn có chắc chắn muốn xóa bài học "${selectedLesson.title}" (Ngày ${selectedLesson.dayNumber}) khỏi lộ trình?\nCác ngày tiếp theo sẽ được tự động dồn lên.`)) {
      setIsDeletingLesson(true);
      try {
        const res = await api.instructor.deleteLesson(selectedLesson._id);
        if (res.success) {
          const statsRes = await api.instructor.getCourseStats(planId!);
          if (statsRes.success) {
            setData(statsRes.data);
            if (statsRes.data.lessons?.length > 0) {
              setSelectedLesson(statsRes.data.lessons[0]);
            } else {
              setSelectedLesson(null);
            }
          }
        }
      } catch (err: any) {
        alert("Lỗi xóa bài học: " + (err.response?.data?.message || err.message));
      } finally {
        setIsDeletingLesson(false);
      }
    }
  };

  // Mở modal chọn cách lưu
const handleSaveLesson = () => {
  if (!selectedLesson) return;
  setShowSaveModal(true);
};
// Lựa chọn 1: "Ghi đè" — thực chất vẫn gọi updateLesson như bình thường,
// backend tự quyết định ghi thẳng (khoá tự tạo) hay lưu vào instructorDraft (khoá có học viên)
const handleOverwrite = async () => {
  if (!selectedLesson) return;
  setShowSaveModal(false);
  setIsSaving(true);
  try {
    const res = await api.instructor.updateLesson(selectedLesson._id, selectedLesson);
    if (res?.data) {
      const merged = mergeDraft(res.data);
      setData((prev: any) => prev ? {
        ...prev,
        lessons: prev.lessons.map((l: any) => l._id === selectedLesson._id ? merged : l)
      } : prev);
      setSelectedLesson(merged);
    }
    alert('✅ ' + (res?.message || 'Đã lưu.'));
  } catch (e: any) {
    alert('❌ ' + (e?.response?.data?.message || e?.message || 'Lỗi không xác định'));
  } finally {
    setIsSaving(false);
  }
};

const handleSaveAsNew = async () => {
  if (!selectedLesson || !planId) return;
  setShowSaveModal(false);
  setIsSaving(true);
  try {
    // Lưu các thay đổi hiện tại vào draft trước, để bản clone lấy đúng nội dung mới nhất
    await api.instructor.updateLesson(selectedLesson._id, selectedLesson);

    const res = await (api.instructor as any).cloneCourseAsSelf(planId);
    if (res.success) {
      alert('💾 ' + (res?.message || 'Đã tạo bản sao khoá học tự tạo.'));
      navigate('/instructor/courses'); // điều hướng về danh sách, tab "Khoá học tự tạo"
    }
  } catch (e: any) {
    alert('❌ Lỗi khi lưu bản sao: ' + (e?.response?.data?.message || e?.message));
  } finally {
    setIsSaving(false);
  }
};

  // Đảm bảo nút "Gửi bản chỉnh sửa" gọi đến:
  const handleSendBack = async () => {
    // Thêm dòng này ở đầu hàm
    if (!planId) {
      alert("Không tìm thấy mã lộ trình!");
      return;
    }

    if (window.confirm('Xác nhận gửi bản chỉnh sửa hoàn chỉnh cho học viên?')) {
      setIsSending(true);
      try {
        const res = await api.instructor.sendBackToStudent(planId);
        if (res.success) {
          alert('✅ Đã gửi thành công!');
          navigate('/instructor/courses');
        }
      } catch (e: any) {
        // Cách này không cần import axios, vẫn lấy được message lỗi từ server
        alert('❌ Lỗi: ' + (e.response?.data?.message || e.message || 'Không thể gửi bài'));
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'assignment' | 'solution') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === 'assignment') setUploadingAssignment(true);
      else setUploadingSolution(true);

      const res = await api.file.upload(file);
      if (res.success) {
        if (type === 'assignment') {
          setSelectedLesson({ ...selectedLesson, assignmentUrl: res.fileUrl });
        } else {
          setSelectedLesson({ ...selectedLesson, solutionUrl: res.fileUrl });
        }
      }
    } catch (err: any) {
      alert("Lỗi upload file: " + (err?.response?.data?.message || err.message));
    } finally {
      if (type === 'assignment') setUploadingAssignment(false);
      else setUploadingSolution(false);
    }
  };

  // Logic xử lý "Kiến thức trọng tâm"
  const handleUpdateNote = (index: number, val: string) => {
    const newNotes = [...(selectedLesson.importantNotes || [])];
    newNotes[index] = val;
    setSelectedLesson({ ...selectedLesson, importantNotes: newNotes });
  };

  const addNote = () => {
    const newNotes = [...(selectedLesson.importantNotes || []), ""];
    setSelectedLesson({ ...selectedLesson, importantNotes: newNotes });
  };

  const removeNote = (index: number) => {
    const newNotes = (selectedLesson.importantNotes || []).filter((_: any, i: number) => i !== index);
    setSelectedLesson({ ...selectedLesson, importantNotes: newNotes });
  };

  // ✅ FIX: Logic xử lý Quiz — dùng quizPool (trường học sinh thực tế dùng)
  const handleUpdateQuiz = (qIdx: number, field: string, value: any) => {
    const updatedPool = [...(selectedLesson.quizPool || [])];
    updatedPool[qIdx] = { ...updatedPool[qIdx], [field]: value };
    setSelectedLesson({ ...selectedLesson, quizPool: updatedPool });
  };

  const addQuiz = () => {
    const newQuestion = {
      question: "Câu hỏi mới là gì?",
      options: ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
      correctAnswer: 0,
      explanation: "Giải thích đáp án...",
      difficulty: "medium",
      bloomLevel: "Thông hiểu"
    };
    setSelectedLesson({
      ...selectedLesson,
      quizPool: [...(selectedLesson.quizPool || []), newQuestion]
    });
  };
const handleAIGenerateQuiz = async () => {
  if (!selectedLesson?.content || selectedLesson.content.length < 100) {
    alert("Vui lòng soạn nội dung bài giảng dài hơn một chút để AI tạo câu hỏi chính xác.");
    return;
  }

  setIsGeneratingAIQuiz(true);
  try {
    // Gọi API vừa tạo
    const res = await (api.instructor as any).generateAIQuiz(selectedLesson._id, {
        content: selectedLesson.content // Gửi text từ editor sang
    });

    if (res.success) {
      // Hợp nhất câu hỏi AI vào danh sách hiện tại của trình soạn thảo
      const newQuestions = res.data.quiz;
      setSelectedLesson({
        ...selectedLesson,
        quizPool: [...(selectedLesson.quizPool || []), ...newQuestions]
      });
      alert("✅ AI đã tạo câu hỏi thành công!");
    }
  } catch (err: any) {
    alert("Lỗi AI: " + (err.response?.data?.message || err.message));
  } finally {
    setIsGeneratingAIQuiz(false);
  }
};
  const removeQuiz = (index: number) => {
    const newPool = (selectedLesson.quizPool || []).filter((_: any, i: number) => i !== index);
    setSelectedLesson({ ...selectedLesson, quizPool: newPool });
  };


  if (loading) return (
    <div className="h-screen bg-[#0f172a] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">
      <style>{`
        /* EasyMDE Dark Mode Stylesheet */
        .EasyMDEContainer .editor-toolbar {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-bottom: none !important;
          border-top-left-radius: 16px !important;
          border-top-right-radius: 16px !important;
          padding: 8px 12px !important;
          opacity: 1 !important;
        }

        .EasyMDEContainer .editor-toolbar button {
          color: #94a3b8 !important;
          border-radius: 8px !important;
          margin-right: 4px !important;
          width: 32px !important;
          height: 32px !important;
          transition: all 0.2s ease !important;
        }

        .EasyMDEContainer .editor-toolbar button:hover {
          background-color: #334155 !important;
          color: #ffffff !important;
        }

        .EasyMDEContainer .editor-toolbar button.active {
          background-color: #2563eb !important;
          color: #ffffff !important;
        }

        .EasyMDEContainer .editor-toolbar i.separator {
          border-left: 1px solid #334155 !important;
          border-right: none !important;
          margin: 0 8px !important;
        }

        .EasyMDEContainer .CodeMirror {
          background-color: #0f172a !important;
          color: #cbd5e1 !important;
          border: 1px solid #334155 !important;
          border-top: none !important;
          border-bottom-left-radius: 16px !important;
          border-bottom-right-radius: 16px !important;
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif !important;
          font-size: 15px !important;
          line-height: 1.75 !important;
          padding: 24px !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }

        /* Elements inside CodeMirror editor */
        .EasyMDEContainer .CodeMirror .cm-header-1 {
          font-size: 2rem !important;
          line-height: 1.3 !important;
          font-weight: 800 !important;
          color: #ffffff !important;
        }

        .EasyMDEContainer .CodeMirror .cm-header-2 {
          font-size: 1.5rem !important;
          line-height: 1.4 !important;
          font-weight: 700 !important;
          color: #ffffff !important;
        }

        .EasyMDEContainer .CodeMirror .cm-header-3 {
          font-size: 1.25rem !important;
          line-height: 1.4 !important;
          font-weight: 600 !important;
          color: #ffffff !important;
        }

        .EasyMDEContainer .CodeMirror .cm-comment {
          background-color: #1e293b !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-family: monospace !important;
          color: #f43f5e !important;
        }

        .EasyMDEContainer .CodeMirror .cm-string {
          color: #10b981 !important;
        }

        .EasyMDEContainer .CodeMirror .cm-link {
          color: #3b82f6 !important;
          text-decoration: underline !important;
        }

        .EasyMDEContainer .CodeMirror .cm-url {
          color: #64748b !important;
        }

        .EasyMDEContainer .CodeMirror-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
        }

        .EasyMDEContainer .CodeMirror-cursor {
          border-left: 2px solid #3b82f6 !important;
        }

        .EasyMDEContainer .CodeMirror-selected {
          background-color: #1e3a8a !important;
        }

        .EasyMDEContainer .editor-statusbar {
          color: #64748b !important;
          padding: 10px 16px !important;
          font-size: 11px !important;
        }

        /* EasyMDE side-by-side or normal Preview styling */
        .EasyMDEContainer .editor-preview-active-side,
        .EasyMDEContainer .editor-preview {
          background-color: #0f172a !important;
          color: #cbd5e1 !important;
          border: 1px solid #334155 !important;
          padding: 24px !important;
        }

        .EasyMDEContainer .editor-preview h1,
        .EasyMDEContainer .editor-preview h2,
        .EasyMDEContainer .editor-preview h3,
        .EasyMDEContainer .editor-preview h4 {
          color: #ffffff !important;
          font-weight: 800 !important;
          margin-top: 1.5em !important;
          margin-bottom: 0.5em !important;
        }

        .EasyMDEContainer .editor-preview h1 { font-size: 2.25rem !important; }
        .EasyMDEContainer .editor-preview h2 { font-size: 1.875rem !important; }
        .EasyMDEContainer .editor-preview h3 { font-size: 1.5rem !important; }

        .EasyMDEContainer .editor-preview p {
          margin-bottom: 1.25em !important;
          line-height: 1.75 !important;
        }

        .EasyMDEContainer .editor-preview ul,
        .EasyMDEContainer .editor-preview ol {
          margin-bottom: 1.25em !important;
          padding-left: 1.5em !important;
        }

        .EasyMDEContainer .editor-preview ul {
          list-style-type: disc !important;
        }

        .EasyMDEContainer .editor-preview ol {
          list-style-type: decimal !important;
        }

        .EasyMDEContainer .editor-preview code {
          background-color: #1e293b !important;
          color: #f43f5e !important;
          padding: 2px 6px !important;
          border-radius: 6px !important;
          font-size: 0.9em !important;
        }

        .EasyMDEContainer .editor-preview pre {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 12px !important;
          padding: 16px !important;
          overflow-x: auto !important;
          margin-bottom: 1.25em !important;
        }

        .EasyMDEContainer .editor-preview pre code {
          background-color: transparent !important;
          color: #cbd5e1 !important;
          padding: 0 !important;
          border-radius: 0 !important;
          font-size: 0.95em !important;
        }

        .EasyMDEContainer .editor-preview blockquote {
          border-left: 4px solid #3b82f6 !important;
          background-color: #1e293b/30 !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          margin-bottom: 1.25em !important;
          color: #94a3b8 !important;
        }

        .EasyMDEContainer .editor-preview table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin-bottom: 1.25em !important;
        }

        .EasyMDEContainer .editor-preview th,
        .EasyMDEContainer .editor-preview td {
          border: 1px solid #334155 !important;
          padding: 10px 14px !important;
        }

        .EasyMDEContainer .editor-preview th {
          background-color: #1e293b !important;
          color: #ffffff !important;
          font-weight: bold !important;
        }
      `}</style>


      {/* --- SIDEBAR TRÁI --- */}
      <div className="w-80 border-r border-slate-800 bg-[#1e293b]/30 flex flex-col p-6 space-y-6">
        <button
          onClick={() => navigate('/instructor/courses')}
          className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        <div className="space-y-1">
          {isEditingCourseTitle ? (
            <div className="space-y-2">
              <input
                type="text"
                className="w-full bg-[#0f172a] border border-blue-500 rounded-xl p-2 text-sm text-slate-200 outline-none font-bold"
                value={editCourseTitleVal}
                onChange={(e) => setEditCourseTitleVal(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingCourseTitle(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded font-bold uppercase"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveCourseTitle}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-[10px] text-white rounded font-bold uppercase"
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group/title gap-2">
              <h2 className="text-xl font-black text-blue-400 line-clamp-2 leading-tight">
                {data?.planTitle}
              </h2>
              <button
                onClick={() => {
                  setEditCourseTitleVal(data?.planTitle || "");
                  setIsEditingCourseTitle(true);
                }}
                className="p-1.5 rounded bg-[#1e293b]/50 hover:bg-slate-800 text-slate-400 hover:text-blue-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0"
                title="Chỉnh sửa tên khóa học"
              >
                <Edit3 size={14} />
              </button>
            </div>
          )}

          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {data?.ownerId && String(data.ownerId) === String(user?.id)
              ? "Khoá học tự tạo"
              : `Học viên: ${data?.studentName}`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
          {data?.lessons?.map((l: any, index: number) => (
            <React.Fragment key={l._id}>
              {/* Chèn trước Ngày 1 */}
              {index === 0 && (
                <div className="group flex justify-center py-0.5">
                  <button
                    onClick={() => handleAddLessonAfter(0)}
                    disabled={isAddingLesson}
                    title="Chèn bài học trước Ngày 1"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-2.5 py-1 rounded-lg text-[9px] font-bold border border-blue-500/20 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={10} /> Chèn vào đầu
                  </button>
                </div>
              )}

              {/* Bài học chính */}
              <button
                onClick={() => setSelectedLesson(l)}
                className={`w-full p-4 rounded-2xl text-left transition-all border ${selectedLesson?._id === l._id ? 'bg-blue-600 border-blue-500 shadow-lg' : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black uppercase opacity-60">Ngày {l.dayNumber}</p>
                </div>
                <p className="text-sm font-bold truncate">{l.title}</p>
              </button>

              {/* Chèn sau Ngày X */}
              <div className="group flex justify-center py-0.5">
                <button
                  onClick={() => handleAddLessonAfter(l.dayNumber)}
                  disabled={isAddingLesson}
                  title={`Chèn bài học sau Ngày ${l.dayNumber}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-2.5 py-1 rounded-lg text-[9px] font-bold border border-blue-500/20 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={10} /> Chèn sau Ngày {l.dayNumber}
                </button>
              </div>
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={handleAddLesson}
          disabled={isAddingLesson}
          className="w-full py-3.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl font-bold flex items-center justify-center gap-2 border border-blue-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {isAddingLesson ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Thêm ngày học
        </button>
      </div>

      {/* --- VÙNG BIÊN TẬP PHẢI --- */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Editor Toolbar */}
        <div className="p-6 border-b border-slate-800 bg-[#1e293b]/20 flex justify-between items-center">
          <div className="flex gap-2">
            {[
              { id: 'content', label: '1. Soạn nội dung', icon: <Edit3 size={16} /> },
              { id: 'important', label: '2. Trọng tâm', icon: <Star size={16} /> },
              { id: 'quiz', label: '3. Trắc nghiệm', icon: <ListChecks size={16} /> },
              { id: 'video', label: '4. Video', icon: <Video size={16} /> },
              { id: 'assignment', label: '5. Bài tập', icon: <FileText size={16} /> },
              { id: 'document', label: '6. Tài liệu gốc', icon: <FileText size={16} /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {selectedLesson && (
              <button
                onClick={handleDeleteLesson}
                disabled={isDeletingLesson}
                className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeletingLesson ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Xóa ngày học
              </button>
            )}

            <button
              onClick={handleSaveLesson}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 relative"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Lưu bài học
            </button>
          </div>
        </div>

        {/* Modal Lưu */}
        {/* Modal Lưu */}
{showSaveModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 max-w-sm w-full space-y-4">
      <h3 className="font-black text-xl">Lưu bài học</h3>
      <p className="text-sm text-slate-400">Bạn muốn lưu bài học này như thế nào?</p>
      <button onClick={handleOverwrite} className="w-full bg-blue-600 p-4 rounded-xl font-bold hover:bg-blue-500 transition-all">Ghi đè</button>
      <button onClick={handleSaveAsNew} className="w-full bg-slate-800 p-4 rounded-xl font-bold hover:bg-slate-700 transition-all">Lưu thành bản khác</button>
      <button onClick={() => setShowSaveModal(false)} className="w-full text-slate-500 py-2 hover:text-white transition-all">Hủy</button>
    </div>
  </div>
)}

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeTab === 'document' ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
              <div className="space-y-8 pb-10 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-black flex items-center gap-2 text-blue-400">
                      <FileText size={24} /> Tài liệu gốc của lộ trình
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Sử dụng file đính kèm/nội dung do học viên upload làm căn cứ để biên tập lại lộ trình.
                    </p>
                  </div>
                </div>

                {data?.document ? (
                  <div className="space-y-6">
                    {/* Thẻ hiển thị file đính kèm */}
                    <div className="bg-[#1e293b]/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <FileText size={24} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-base">
                            {data.document.title || "Tài liệu đính kèm"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Định dạng: Tài liệu nghiên cứu / Bài luận / Bài giảng / Sách giáo khoa
                          </p>
                        </div>
                      </div>

                      {data.document.fileUrl ? (
                        <a
                          href={data.document.fileUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition-all tracking-wider uppercase active:scale-95 shadow-md shadow-blue-900/30 shrink-0"
                        >
                          <ExternalLink size={14} /> Xem / Tải file gốc
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Không có liên kết file trực tiếp</span>
                      )}
                    </div>

                    {/* Thẻ hiển thị nội dung Text trích xuất từ file (nếu có) */}
                    {data.document.content ? (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                          <Eye size={12} className="text-slate-500" /> Nội dung text trích xuất từ tài liệu (Sách/Bài viết/Slide)
                        </label>
                        <div className="bg-[#1e293b]/35 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 leading-relaxed font-sans max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text custom-scrollbar">
                          {data.document.content}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-[#1e293b]/20 rounded-2xl border border-dashed border-slate-800">
                        <p className="text-sm text-slate-500 italic">Không có dữ liệu văn bản trích xuất.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#1e293b]/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                    <HelpCircle size={48} className="text-slate-600 mx-auto opacity-40" />
                    <p className="font-bold text-slate-300">Không tìm thấy tài liệu gốc đính kèm</p>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Khóa học này được khởi tạo trực tiếp hoặc không gắn kèm tài liệu nghiên cứu ban đầu từ người học.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : selectedLesson ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">

              {/* --- TAB: NỘI DUNG HỌC --- */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Tiêu đề bài học / ngày học (Title)</label>
                    <input
                      type="text"
                      className="w-full bg-[#1e293b] border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:border-blue-500 transition-all font-bold"
                      value={selectedLesson.title || ""}
                      onChange={(e) => setSelectedLesson({ ...selectedLesson, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Tóm tắt ngắn (Summary)</label>
                    <textarea
                      className="w-full bg-[#1e293b] border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:border-blue-500 transition-all"
                      rows={2}
                      value={selectedLesson.summary || ""}
                      onChange={(e) => setSelectedLesson({ ...selectedLesson, summary: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Bài giảng chi tiết (Markdown)</label>
                    <div className="rounded-2xl overflow-hidden bg-[#0f172a]">
                      <SimpleMDE
                        value={selectedLesson.content || ""}
                        onChange={(val: string) => setSelectedLesson({ ...selectedLesson, content: val })}
                        options={mdeOptions}
                      />
                    </div>
                    <p className="text-xs text-slate-500 ml-2 mt-2">
                      💡 <strong>Mẹo:</strong> Bạn có thể kéo thả hình ảnh vào ô nhập liệu, hoặc dán hình ảnh từ clipboard để tự động tải lên. Để tạo bảng, hãy nhấn nút <strong>Table</strong> trên thanh công cụ.
                    </p>
                  </div>
                </div>
              )}

              {/* --- TAB: KIẾN THỨC TRỌNG TÂM --- */}
              {activeTab === 'important' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black flex items-center gap-2"><Star className="text-yellow-500" size={20} /> Kiến thức then chốt</h3>
                    <button onClick={addNote} className="bg-slate-800 hover:bg-blue-600 p-2 rounded-lg text-blue-400 hover:text-white transition-all"><Plus size={20} /></button>
                  </div>
                  <div className="grid gap-3">
                    {selectedLesson.importantNotes?.map((note: string, idx: number) => (
                      <div key={idx} className="flex gap-3 group animate-in slide-in-from-right">
                        <div className="flex-1 relative">
                          <span className="absolute -left-8 top-4 text-[10px] font-black text-slate-600">{idx + 1}</span>
                          <input
                            className="w-full bg-[#1e293b] border border-slate-800 p-4 rounded-xl text-sm focus:border-yellow-500 outline-none transition-all"
                            value={note}
                            onChange={(e) => handleUpdateNote(idx, e.target.value)}
                          />
                        </div>
                        <button onClick={() => removeNote(idx)} className="p-4 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAB: TRẮC NGHIỆM --- */}
{activeTab === 'quiz' && (
  <div className="space-y-8 pb-10">
    <div className="flex justify-between items-end bg-[#1e293b]/30 p-6 rounded-[2rem] border border-slate-800/50">
      <div>
        <h3 className="text-xl font-black flex items-center gap-2">
          <ListChecks className="text-emerald-500" size={24} />
          Hệ thống câu hỏi trắc nghiệm
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          ✅ Đang chỉnh sửa <strong className="text-emerald-400">quizPool</strong> — bộ câu hỏi học sinh thực tế đang dùng ({(selectedLesson.quizPool || []).length} câu)
        </p>
      </div>
      
      <div className="flex gap-3">
        {/* NÚT AI TẠO CÂU HỎI MỚI */}
        <button
          onClick={handleAIGenerateQuiz}
          disabled={isGeneratingAIQuiz}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGeneratingAIQuiz ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} className="text-amber-300" />
          )}
          {isGeneratingAIQuiz ? "AI đang suy nghĩ..." : "AI Tạo câu hỏi"}
        </button>

        <button
          onClick={addQuiz}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          <Plus size={18} /> Thêm thủ công
        </button>
      </div>
    </div>

    <div className="grid gap-8">
      {(selectedLesson.quizPool || []).map((q: any, qIdx: number) => (
        <div key={qIdx} className="bg-[#1e293b]/50 rounded-[2.5rem] border border-slate-800 p-8 space-y-6 relative group animate-in slide-in-from-bottom-4">
          <button 
            onClick={() => removeQuiz(qIdx)} 
            className="absolute top-6 right-6 p-2 text-slate-600 hover:text-red-500 transition-colors bg-slate-900/50 rounded-xl"
          >
            <Trash2 size={18} />
          </button>

          {/* Câu hỏi + badge độ khó */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Câu hỏi {qIdx + 1}</label>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                q.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>{q.difficulty || 'medium'}</span>
              
              <select
                value={q.difficulty || 'medium'}
                onChange={(e) => handleUpdateQuiz(qIdx, 'difficulty', e.target.value)}
                className="ml-auto text-[10px] bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
              >
                <option value="easy">🟢 Dễ</option>
                <option value="medium">🟡 Trung bình</option>
                <option value="hard">🔴 Khó</option>
              </select>
            </div>
            <textarea
              className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-4 text-lg font-bold text-white outline-none focus:border-blue-500 transition-all"
              rows={2} 
              value={q.question}
              placeholder="Nhập nội dung câu hỏi..."
              onChange={(e) => handleUpdateQuiz(qIdx, 'question', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(q.options || []).map((opt: string, oIdx: number) => (
              <div key={oIdx} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${q.correctAnswer === oIdx ? 'bg-emerald-500/5 border-emerald-500/50' : 'bg-[#0f172a] border-slate-800'}`}>
                <button
                  onClick={() => handleUpdateQuiz(qIdx, 'correctAnswer', oIdx)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${q.correctAnswer === oIdx ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}
                >
                  {q.correctAnswer === oIdx && <CheckCircle size={14} className="text-white" />}
                </button>
                <input
                  className="bg-transparent flex-1 text-sm font-medium outline-none text-slate-200"
                  value={opt}
                  placeholder={`Lựa chọn ${oIdx + 1}`}
                  onChange={(e) => {
                    const newOptions = [...(q.options || [])];
                    newOptions[oIdx] = e.target.value;
                    handleUpdateQuiz(qIdx, 'options', newOptions);
                  }}
                />
                {q.correctAnswer === oIdx && <span className="text-[10px] font-black text-emerald-500 uppercase mr-2">Đáp án đúng</span>}
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 space-y-2">
            <label className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2">
              <Star size={12} fill="currentColor" /> Giải thích đáp án (Giải thích cho học sinh)
            </label>
            <textarea
              className="w-full bg-transparent text-sm text-slate-400 outline-none italic placeholder:text-slate-700"
              rows={2} 
              value={q.explanation || ""}
              placeholder="Tại sao đáp án này đúng? Giải thích các bước suy luận..."
              onChange={(e) => handleUpdateQuiz(qIdx, 'explanation', e.target.value)}
            />
          </div>
        </div>
      ))}
      
      {(!selectedLesson.quizPool || selectedLesson.quizPool.length === 0) && (
        <div className="py-20 text-center text-slate-600 bg-[#1e293b]/20 rounded-[3rem] border border-dashed border-slate-800">
          <Sparkles className="mx-auto mb-4 opacity-20 text-indigo-400" size={60} />
          <p className="font-bold text-lg">Chưa có câu hỏi nào</p>
          <p className="text-sm mt-1 opacity-60 max-w-xs mx-auto">
            Hãy sử dụng nút <strong className="text-indigo-400">AI Tạo câu hỏi</strong> để hệ thống tự động soạn bài dựa trên nội dung giảng dạy của bạn.
          </p>
        </div>
      )}
    </div>
  </div>
)}

              {/* --- TAB: VIDEO --- */}
              {activeTab === 'video' && (
                <div className="space-y-8 pb-10 animate-in fade-in">
                  <h3 className="text-xl font-black flex items-center gap-2 text-purple-400">
                    <Video size={24} /> Video Bài Giảng
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Video Bài giảng (Link YouTube)</label>
                      <input
                        className="w-full bg-[#1e293b] border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-blue-500 transition-all text-white"
                        placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
                        value={selectedLesson.videoUrl || ""}
                        onChange={(e) => setSelectedLesson({ ...selectedLesson, videoUrl: e.target.value })}
                      />
                      <p className="text-xs text-slate-500 ml-2 mt-1">Học viên có thể xem video này trực tiếp trong bài học.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: BÀI TẬP --- */}
              {activeTab === 'assignment' && (
                <div className="space-y-8 pb-10 animate-in fade-in">
                  <h3 className="text-xl font-black flex items-center gap-2 text-blue-400">
                    <FileText size={24} /> Đề bài & Đáp án
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center justify-between">
                        <span>Link file Đề bài / Bài tập</span>
                        <label className="text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1">
                          {uploadingAssignment ? <Loader2 size={12} className="animate-spin" /> : null}
                          <input type="file" className="hidden" onChange={(e) => handleUploadFile(e, 'assignment')} />
                          Hoặc tải file lên
                        </label>
                      </label>
                      <input
                        className="w-full bg-[#1e293b] border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-blue-500 transition-all text-white"
                        placeholder="Ví dụ: Link Google Drive, Dropbox, hoặc dán link vào đây..."
                        value={selectedLesson.assignmentUrl || ""}
                        onChange={(e) => setSelectedLesson({ ...selectedLesson, assignmentUrl: e.target.value })}
                      />
                      <p className="text-xs text-slate-500 ml-2 mt-1">Học viên sẽ tải file này về để làm bài.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center justify-between">
                        <span>Link file Lời giải / Đáp án</span>
                        <label className="text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1">
                          {uploadingSolution ? <Loader2 size={12} className="animate-spin" /> : null}
                          <input type="file" className="hidden" onChange={(e) => handleUploadFile(e, 'solution')} />
                          Hoặc tải file lên
                        </label>
                      </label>
                      <input
                        className="w-full bg-[#1e293b] border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-blue-500 transition-all text-white"
                        placeholder="Ví dụ: Link file giải bài tập chi tiết..."
                        value={selectedLesson.solutionUrl || ""}
                        onChange={(e) => setSelectedLesson({ ...selectedLesson, solutionUrl: e.target.value })}
                      />
                      <p className="text-xs text-slate-500 ml-2 mt-1">Dùng để AI đối chiếu chấm điểm hoặc cho học viên xem sau khi nộp bài.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20">
              <BookOpen size={80} /><p className="font-black uppercase tracking-[0.3em] mt-4">Chọn bài học để bắt đầu</p>
            </div>
          )}
        </div>

        {/* Footer Actions — Chỉ hiển thị khi là khoá học học viên gửi (ownerId khác user.id) */}
        {data?.ownerId && String(data.ownerId) !== String(user?.id) && (
          <div className="p-6 bg-[#1e293b]/40 border-t border-slate-800 space-y-3">
            <button
              onClick={handleSendBack}
              disabled={isSending}
              className="w-full max-w-4xl mx-auto block py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-50"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Gửi bản chỉnh sửa hoàn chỉnh cho học viên
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPlanView;
