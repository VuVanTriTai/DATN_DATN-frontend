import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor: Gắn token vào mỗi request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response Interceptor: Xử lý lỗi 401 (Hết hạn token)
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

export const api = {
  // 1. VAI TRÒ & TÀI KHOẢN (Auth & Profile)
  auth: {
    login: (data: any) => axiosInstance.post("/auth/login", data).then(res => res.data),
    register: (data: any) => axiosInstance.post("/auth/register", data).then(res => res.data),
    googleLogin: (token: string) => axiosInstance.post("/auth/google-login", { token }).then(res => res.data),
    getMe: () => axiosInstance.get("/auth/me").then(res => res.data),
    getInstructors: () => axiosInstance.get("/auth/instructors").then(res => res.data), // Lấy ds giáo viên cho Learner chọn
    updateProfile: (data: any) => axiosInstance.put("/auth/profile", data).then(res => res.data),
    changePassword: (data: any) => axiosInstance.post("/auth/change-password", data).then(res => res.data),
    registerInstructor: (data: any) => axiosInstance.post("/auth/register-instructor", data).then(res => res.data),
  },

  // 2. QUY TRÌNH TẠO LỘ TRÌNH AI (Learner Only)
  course: {
    analyze: (text: string, learningGoals?: { focus: "theory" | "practice"; depth: "basic" | "deep" }) =>
      axiosInstance.post("/plan/analyze", { text, learningGoals }).then(res => res.data),
    regenerate: (data: any) => axiosInstance.post("/plan/regenerate", data).then(res => res.data),
    finalizeCreate: (data: any) => axiosInstance.post("/plan/create", data).then(res => res.data),
  },

  // 3. QUẢN LÝ LỘ TRÌNH & BÀI TẬP (Learner)
  // --- QUẢN LÝ LỘ TRÌNH (PLAN) ---
  plan: {
    getMyPlans: () => axiosInstance.get("/plan/me").then(res => res.data),
    getDetail: (id: string) => axiosInstance.get(`/plan/${id}`).then(res => res.data),
    getLesson: (id: string, day: string | number) => axiosInstance.get(`/plan/${id}/lesson/${day}`).then(res => res.data),
    // HÀM XÓA: Gửi request DELETE tới /api/plan/:id
    delete: (id: string) =>
      axiosInstance.delete(`/plan/${id}`).then(res => res.data),
    // HÀM CẬP NHẬT GIÁO VIÊN: Gửi request PUT tới /api/plan/:id/instructor
    updateInstructor: (id: string, instructorId: string) =>
      axiosInstance.put(`/plan/${id}/instructor`, { instructorId }).then(res => res.data),
    share: (id: string) => axiosInstance.post(`/plan/${id}/share`).then(res => res.data),
    shareToMarket: (id: string, data: { categories: string[], level: string, tags: string[] }) =>
      axiosInstance.post(`/plan/${id}/share-market`, data).then(res => res.data),
    getResults: (id: string) => axiosInstance.get(`/plan/${id}/results`).then(res => res.data),
    // Tìm user theo email/tên để chia sẻ lộ trình
    searchUser: (email: string) =>
      axiosInstance.get(`/plan/search-user?email=${encodeURIComponent(email)}`).then(res => res.data),
    // Chia sẻ riêng tư cho 1 cá nhân (gửi targetUserId)
    sharePrivate: (id: string, targetUserId: string) =>
      axiosInstance.post(`/plan/${id}/share-private`, { targetUserId }).then(res => res.data),
    checkRecipientStatus: (id: string, recipientId: string) =>
      axiosInstance.get(`/plan/${id}/check-recipient/${recipientId}`).then(res => res.data),
    // Cập nhật hàm analyze nhận đủ 4 tham số
    analyze: (
      text: string,
      goals: { focus: string; depth: string },
      days: number,
      metadata?: any
    ) => axiosInstance.post("/plan/analyze", {
      text,
      learningGoals: goals, // Key này phải khớp với bóc tách ở Backend
      days,
      metadata
    }).then(res => res.data),

    // Lấy danh sách lộ trình người khác chia sẻ cho mình
    getSharedWithMe: () =>
      axiosInstance.get("/plan/shared/me").then(res => res.data),

    // Yêu cầu AI tạo lại nội dung bài học cho 1 ngày cụ thể
    regenerateLesson: (planId: string, dayNumber: number | string) =>
      axiosInstance.post(`/plan/${planId}/lesson/${dayNumber}/regenerate`).then(res => res.data),



  },
  market: {
    // Lấy danh sách khóa học (hỗ trợ filter search, category, level, instructorSearch)
    getCourses: (params: any) =>
      axiosInstance.get("/market/courses", { params }).then(res => res.data),
    getPreview: (id: string) =>
      axiosInstance.get(`/market/courses/${id}/preview`).then(res => res.data),
    importCourse: (id: string) =>
      axiosInstance.post(`/market/courses/${id}/import`).then(res => res.data),
    // Lấy khóa học public của 1 giảng viên cụ thể
    getCoursesByInstructor: (instructorId: string) =>
      axiosInstance.get(`/market/instructor/${instructorId}/courses`).then(res => res.data),
    // Instructor: Lấy danh sách khóa học của mình đang trên market
    getMyListings: () =>
      axiosInstance.get("/market/my-listings").then(res => res.data),
    // Instructor: Gỡ khóa học khỏi market
    unlistCourse: (id: string) =>
      axiosInstance.patch(`/market/courses/${id}/unlist`).then(res => res.data),
    // Learner: Lấy danh sách khoá học đã import từ Market về kho cá nhân
    getMyImports: () =>
      axiosInstance.get("/market/my-imports").then(res => res.data),
    // Learner: Xoá khoá học đã import khỏi kho cá nhân
    removeImport: (id: string) =>
      axiosInstance.delete(`/market/my-imports/${id}`).then(res => res.data),
    getRecommendations: () => axiosInstance.get("/market/recommendations").then(res => res.data),

  },

  // ── THƯ MỤC GIÁO VIÊN (Instructor Directory) ──────────────────────────────
  instructorDirectory: {
    // Lấy danh sách lĩnh vực hệ thống hỗ trợ
    getFields: () =>
      axiosInstance.get("/instructor-directory/fields").then(r => r.data),

    // Giáo viên lấy hồ sơ của mình
    getMyProfile: () =>
      axiosInstance.get("/instructor-directory/me").then(r => r.data),

    // Giáo viên cập nhật lĩnh vực + hồ sơ
    updateMyFields: (data: { teachingFields: string[]; specialization?: string; bio?: string }) =>
      axiosInstance.put("/instructor-directory/my-fields", data).then(r => r.data),

    // Học viên xem danh sách giáo viên
    getList: (params?: { field?: string; sort?: string; search?: string }) =>
      axiosInstance.get("/instructor-directory", { params }).then(r => r.data),

    // Học viên đánh giá giáo viên
    rate: (instructorId: string, data: { stars: number; comment?: string }) =>
      axiosInstance.post(`/instructor-directory/${instructorId}/rate`, data).then(r => r.data),

    // Lấy đánh giá của mình cho 1 giáo viên
    getMyRating: (instructorId: string) =>
      axiosInstance.get(`/instructor-directory/${instructorId}/my-rating`).then(r => r.data),

    // Lấy tất cả đánh giá của 1 giáo viên
    getRatings: (instructorId: string) =>
      axiosInstance.get(`/instructor-directory/${instructorId}/ratings`).then(r => r.data),

    // Học viên gỡ đánh giá của mình cho 1 giáo viên
    deleteMyRating: (instructorId: string) =>
      axiosInstance.delete(`/instructor-directory/${instructorId}/my-rating`).then(r => r.data),
  },

  // --- DÀNH CHO GIÁO VIÊN (INSTRUCTOR) ---
  instructor: {
    // Nếu bạn có trang danh sách học viên chung:
    getStudents: () =>
      axiosInstance.get("/instructor/my-students").then(res => res.data),
    getStudentProgress: (studentId: string) => axiosInstance.get(`/instructor/student/${studentId}/progress`).then(res => res.data),

    // 1. Lấy danh sách các lộ trình mà tôi đang hướng dẫn
    getMyCourses: () => axiosInstance.get("/instructor/my-courses").then(res => res.data),
    // 2. Lấy thông số tổng quan của 1 khóa học (số học viên, tiến độ tb...)
    getCourseStats: (planId: string) => axiosInstance.get(`/instructor/course/${planId}/stats`).then(res => res.data),

    // 3. Lấy danh sách học viên của 1 khóa học cụ thể
    getCourseStudents: (planId: string) => axiosInstance.get(`/instructor/course/${planId}/students`).then(res => res.data),

    // 4. Lấy chi tiết bài tập/tiến độ của 1 học viên trong 1 khóa học
    getStudentDetail: (planId: string, studentId: string) =>
      axiosInstance.get(`/instructor/course/${planId}/student/${studentId}`).then(res => res.data),

    // 3. (Mở rộng) Chấm điểm bài tập
    gradeAssignment: (assignmentId: string, data: { score: number; feedback: string }) =>
      axiosInstance.put(`/assignment/grade/${assignmentId}`, data).then(res => res.data),

    updateLesson: (lessonId: string, data: any) =>
      axiosInstance.put(`/instructor/lesson/${lessonId}`, data).then(res => res.data),
    saveLessonDraft: (lessonId: string, data: any) =>
      axiosInstance.post(`/instructor/lesson/${lessonId}/draft`, data).then(res => res.data),
    sendBackToStudent: (planId: string) =>
      axiosInstance.post(`/instructor/course/${planId}/send-back`).then(res => res.data),
    updateCourseTitle: (planId: string, title: string) =>
      axiosInstance.put(`/instructor/course/${planId}/title`, { title }).then(res => res.data),
    addLesson: (planId: string, afterDayNumber?: number) =>
      axiosInstance.post(`/instructor/course/${planId}/lesson`, { afterDayNumber }).then(res => res.data),
    deleteLesson: (lessonId: string) =>
      axiosInstance.delete(`/instructor/lesson/${lessonId}`).then(res => res.data),
    // Tạo khoá học thủ công — giảng viên nhập tiêu đề + số ngày, sinh khung bài rỗng
    createManualCourse: (data: { title: string; duration: number }) =>
      axiosInstance.post('/instructor/manual-course', data).then(r => r.data),
    cloneCourseAsSelf: (planId: string) =>
      axiosInstance.post(`/instructor/courses/${planId}/clone-as-self`).then(res => res.data),
    generateAIQuiz: (lessonId: string, data: { content: string }) =>
      axiosInstance.post(`/instructor/lesson/${lessonId}/generate-ai-quiz`, data).then(res => res.data),

  },

  // --- QUẢN LÝ BÀI TẬP (ASSIGNMENT) ---
  assignment: {
    // Học viên nộp bài tập (có hỗ trợ upload file)
    submit: (data: FormData) =>
      axiosInstance.post("/assignment/submit", data, { headers: { "Content-Type": "multipart/form-data" } }).then(res => res.data),
    // Học viên (hoặc giảng viên) yêu cầu AI chấm điểm
    aiGrade: (assignmentId: string) =>
      axiosInstance.post(`/assignment/ai-grade/${assignmentId}`).then(res => res.data),
    // Lấy bài nộp của tôi cho 1 bài học
    getMine: (lessonId: string) =>
      axiosInstance.get(`/assignment/lesson/${lessonId}/me`).then(res => res.data),
  },

  // 5. TƯƠNG TÁC AI & FILE
  file: {
    extract: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return axiosInstance.post("/file/extract", formData, { headers: { "Content-Type": "multipart/form-data" } }).then(res => res.data);
    },
    upload: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return axiosInstance.post("/file/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }).then(res => res.data);
    },

    getMyDocs: () => axiosInstance.get("/document").then(res => res.data),
    deleteDocument: (id: string) => axiosInstance.delete(`/document/${id}`).then(res => res.data),
    getLayout: (docId: string) => axiosInstance.get(`/documents/${docId}/display/layout`).then(res => res.data),
    getChunks: (docId: string) => axiosInstance.get(`/documents/${docId}/display/chunks`).then(res => res.data),



  },

  ai: {
    chat: (
      question: string,
      planId: string,
      history: Array<{ role: string; content: string }> = [],
      lessonContent?: string
    ) => axiosInstance.post("/ai/chat-doc", { question, planId, history, lessonContent }).then(res => res.data),
  },
  // 7. HỆ THỐNG TRẮC NGHIỆM (QUIZ)
  quiz: {
    /**
     * Chấm điểm Quiz trong bài học RAG 
     * HÀM QUAN TRỌNG NHẤT: Dùng để hoàn thành ngày học và mở khóa bài tiếp theo
     */
    submitLessonQuiz: async (data: { planId: string; dayNumber: number; answers: any }) => {
      const response = await axiosInstance.post("/quiz/submit-lesson", data);
      return response.data;
    },

    /**
     * Yêu cầu AI (Groq) tạo một bộ Quiz độc lập theo chủ đề
     */
    generate: async (data: {
      title: string;
      topic: string;
      numQuestions: number;
      difficulty: string;
      questionType: string
    }) => {
      const response = await axiosInstance.post("/quiz/generate", data);
      return response.data;
    },

    /**
     * Lấy toàn bộ danh sách Quiz do tôi tạo (Phân trang)
     */
    getMyQuizzes: async (page = 1, limit = 10) => {
      const response = await axiosInstance.get("/quiz", { params: { page, limit } });
      return response.data;
    },

    /**
     * Lấy chi tiết một bộ Quiz (Bao gồm cả đáp án - Dành cho chủ sở hữu)
     */
    getById: async (id: string) => {
      const response = await axiosInstance.get(`/quiz/${id}`);
      return response.data;
    },

    /**
     * Lấy bộ Quiz để làm bài (Ẩn đáp án - Dành cho người làm bài)
     */
    getPublic: async (id: string) => {
      const response = await axiosInstance.get(`/quiz/public/${id}`);
      return response.data;
    },

    /**
     * Nộp bài làm Quiz độc lập
     */
    submitStandalone: async (id: string, data: { answers: any; duration: number }) => {
      const response = await axiosInstance.post(`/quiz/submit/${id}`, data);
      return response.data;
    },

    /**
     * Lấy lịch sử tất cả các lần làm bài của tôi
     */
    getHistory: async () => {
      const response = await axiosInstance.get("/quiz/history/me");
      return response.data;
    },

    /**
     * Cập nhật nội dung bộ Quiz (Sửa câu hỏi, tiêu đề...)
     */
    update: async (id: string, data: any) => {
      const response = await axiosInstance.put(`/quiz/${id}`, data);
      return response.data;
    },

    /**
     * Xóa bộ Quiz (Soft delete)
     */
    delete: async (id: string) => {
      const response = await axiosInstance.delete(`/quiz/${id}`);
      return response.data;
    },

    /**
     * Tìm kiếm các bộ Quiz công khai trên hệ thống
     */
    search: async (keyword: string) => {
      const response = await axiosInstance.get("/quiz/search", { params: { keyword } });
      return response.data;
    }
  },

  // 8. ADAPTIVE LEARNING QUIZ ─────────────────────────────────────────────────
  lessonQuiz: {
    /**
     * Sinh pool 20 câu hỏi RAG cho bài học (gọi sau khi tạo khoá học)
     */
    generatePool: (lessonId: string) =>
      axiosInstance.post(`/lesson-quiz/${lessonId}/generate-pool`).then(r => r.data),

    /**
     * Lấy câu hỏi thích nghi theo trình độ (đáp án đã ẩn)
     * numQuestions: số câu muốn lấy (mặc định 10)
     */
    getQuestions: (lessonId: string, numQuestions = 10) =>
      axiosInstance.get(`/lesson-quiz/${lessonId}/questions`, { params: { numQuestions } }).then(r => r.data),

    /**
     * Nộp bài → nhận kết quả thích nghi
     * answers: mảng index đáp án người dùng chọn
     * action trả về: 'remedial' | 'normal' | 'advanced'
     */
    submitAdaptive: (lessonId: string, data: { planId: string; dayNumber: number; answers: { poolIndex: number; answer: number }[] | number[] }) =>
      axiosInstance.post(`/lesson-quiz/${lessonId}/submit-adaptive`, data).then(r => r.data),

    /**
     * Lấy lịch sử điểm từng bài của khoá học
     */
    getLessonScores: (planId: string) =>
      axiosInstance.get(`/lesson-quiz/scores/${planId}`).then(r => r.data),
  },

  // 9. BẠN BÈ ────────────────────────────────────────────────────────────────
  friends: {
    /** Lấy danh sách bạn bè đã kết nối */
    getMyFriends: () =>
      axiosInstance.get('/friends').then(r => r.data),

    /** Lấy lời mời kết bạn đang chờ */
    getRequests: () =>
      axiosInstance.get('/friends/requests').then(r => r.data),

    /** Tìm kiếm user theo email / tên */
    search: (q: string) =>
      axiosInstance.get('/friends/search', { params: { q } }).then(r => r.data),

    /** Gửi lời mời kết bạn */
    sendRequest: (userId: string) =>
      axiosInstance.post(`/friends/request/${userId}`).then(r => r.data),

    /** Chấp nhận lời mời */
    acceptRequest: (friendshipId: string) =>
      axiosInstance.put(`/friends/accept/${friendshipId}`).then(r => r.data),

    /** Từ chối lời mời */
    rejectRequest: (friendshipId: string) =>
      axiosInstance.put(`/friends/reject/${friendshipId}`).then(r => r.data),

    /** Hủy lời mời đã gửi */
    cancelRequest: (userId: string) =>
      axiosInstance.delete(`/friends/cancel/${userId}`).then(r => r.data),

    /** Hủy kết bạn */
    unfriend: (userId: string) =>
      axiosInstance.delete(`/friends/${userId}`).then(r => r.data),
  },

  reviews: {
    // Lấy danh sách bình luận (hỗ trợ phân trang)
    get: (planId: string, page = 1, limit = 10) =>
      axiosInstance.get(`/reviews/${planId}`, { params: { page, limit } }).then(res => res.data),
    // Lấy tổng kết rating (average + phân phối sao)
    summary: (planId: string) =>
      axiosInstance.get(`/reviews/summary/${planId}`).then(res => res.data),
    // Gửi bình luận / đánh giá mới
    create: (planId: string, data: { content: string; rating?: number; parentId?: string }) =>
      axiosInstance.post(`/reviews/${planId}`, data).then(res => res.data),
    // Toggle like / dislike
    react: (reviewId: string, type: 'like' | 'dislike') =>
      axiosInstance.post(`/reviews/react/${reviewId}`, { type }).then(res => res.data),
    // Xóa bình luận
    delete: (reviewId: string) =>
      axiosInstance.delete(`/reviews/${reviewId}`).then(res => res.data),
  },

  // 10. BÁO CÁO VI PHẠM ────────────────────────────────────────────────────────
  reports: {
    /** Gửi báo cáo vi phạm */
    create: (data: {
      targetType: 'course' | 'review' | 'instructorRating';
      targetId: string;
      reason: string;
      description?: string;
    }) => axiosInstance.post('/reports', data).then(res => res.data),

    /** Admin: Lấy danh sách báo cáo */
    getAll: (params?: { targetType?: string; status?: string; page?: number; limit?: number }) =>
      axiosInstance.get('/reports', { params }).then(res => res.data),

    /** Admin: Xử lý báo cáo (gỡ nội dung vi phạm) */
    resolve: (id: string, adminNote?: string) =>
      axiosInstance.patch(`/reports/${id}/resolve`, { adminNote }).then(res => res.data),

    /** Admin: Bỏ qua báo cáo (không gỡ nội dung) */
    dismiss: (id: string, adminNote?: string) =>
      axiosInstance.patch(`/reports/${id}/dismiss`, { adminNote }).then(res => res.data),
  },

};