import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  LogIn, UserPlus, Mail, Lock, User as UserIcon,
  Sparkles, ShieldCheck, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'learner'
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const handleGoogleLoginResponse = async (response: any) => {
    try {
      const res = await api.auth.googleLogin(response.credential);
      if (res.success) {
        login(res.data.user, res.data.accessToken);
      } else {
        setError(res.message || 'Đăng nhập Google thất bại.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi xác thực với máy chủ.');
    }
  };

  useEffect(() => {
    const initGoogleSignIn = () => {
      const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const google = (window as any).google;
      if (google && clientID && clientID !== 'your-google-client-id-here.apps.googleusercontent.com') {
        try {
          google.accounts.id.initialize({ client_id: clientID, callback: handleGoogleLoginResponse });
          const btnDiv = document.getElementById('googleSignInButton');
          if (btnDiv) {
            google.accounts.id.renderButton(btnDiv, {
              theme: 'filled_blue', size: 'large', width: btnDiv.clientWidth || 368, shape: 'pill',
            });
          }
        } catch (error) { console.error('Google Sign-In error:', error); }
      }
    };
    const timer = setTimeout(initGoogleSignIn, 300);
    return () => clearTimeout(timer);
  }, [isLogin]);

  // Reset error khi đổi form
  const switchMode = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError('');
    setSuccessMsg('');
    if (!toLogin) setFormData(f => ({ ...f, password: '', fullName: '' }));
    else setFormData(f => ({ ...f, password: '' }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        // ── ĐĂNG NHẬP ──────────────────────────────────────────────────────
        const res = await api.auth.login({ email: formData.email, password: formData.password });
        if (res.success) {
          login(res.data.user, res.data.accessToken);
        } else {
          setError(res.message || 'Email hoặc mật khẩu không chính xác.');
        }
      } else {
        // ── ĐĂNG KÝ → chuyển về Login, không auto-login ────────────────────
        const res = await api.auth.register(formData);
        if (res.success) {
          const registeredEmail = formData.email;
          // Reset form, giữ lại email để điền sẵn bên login
          setFormData({ email: registeredEmail, password: '', fullName: '', role: 'learner' });
          setIsLogin(true);
          setSuccessMsg('🎉 Tài khoản đã được tạo thành công! Hãy đăng nhập để bắt đầu.');
        } else {
          setError(res.message || 'Đăng ký thất bại, vui lòng thử lại.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full bg-[#0a0f1a] border rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm outline-none transition-all placeholder:text-slate-600
    focus:border-blue-500 border-white/8 hover:border-white/15`;

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full relative z-10">

        {/* ── Card ── */}
        <div className="bg-[#0d1117] border border-white/8 rounded-[2.5rem] p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/30">
              <Sparkles className="text-white" size={26} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isLogin ? 'Chào mừng trở lại!' : 'Gia nhập AI Course'}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              {isLogin
                ? 'Đăng nhập để tiếp tục hành trình học tập'
                : 'Khởi tạo tài khoản để bắt đầu học tập thông minh'}
            </p>
          </div>

          {/* ── Tab switcher ── */}
          <div className="flex gap-1 p-1 bg-white/3 rounded-2xl border border-white/5 mb-6">
            {[
              { id: true, label: 'Đăng nhập', icon: <LogIn size={15} /> },
              { id: false, label: 'Đăng ký', icon: <UserPlus size={15} /> },
            ].map(tab => (
              <button
                key={String(tab.id)}
                onClick={() => switchMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all
                  ${isLogin === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── Success Banner ── */}
          {successMsg && (
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-5">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {/* ── Error Banner ── */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-5">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Họ tên — chỉ khi đăng ký */}
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text" required
                  placeholder="Họ và tên của bạn"
                  className={inputClass}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            )}

            {/* Vai trò — chỉ khi đăng ký */}
            {!isLogin && (
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-1.5">Vai trò của bạn</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'learner', label: '🎓 Học viên', sub: 'Học & khám phá' },
                    { val: 'instructor', label: '👨‍🏫 Giảng viên', sub: 'Hỗ trợ học viên' },
                  ].map(opt => (
                    <button
                      key={opt.val} type="button"
                      onClick={() => setFormData({ ...formData, role: opt.val })}
                      className={`p-3 rounded-2xl border text-left transition-all
                        ${formData.role === opt.val
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                          : 'bg-white/3 border-white/8 text-slate-400 hover:border-white/15'}`}
                    >
                      <p className="font-bold text-sm">{opt.label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{opt.sub}</p>
                    </button>
                  ))}
                </div>
                {formData.role === 'instructor' && (
                  <p className="text-[10px] text-slate-600 mt-1.5 ml-1">
                    * Giảng viên vẫn có đầy đủ quyền lợi của Học viên.
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email" required
                placeholder="Địa chỉ Email"
                className={inputClass}
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(''); }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type={showPassword ? 'text' : 'password'} required
                placeholder={isLogin ? 'Mật khẩu' : 'Mật khẩu (tối thiểu 6 ký tự)'}
                minLength={isLogin ? undefined : 6}
                className={`${inputClass} pr-11`}
                value={formData.password}
                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/25 active:scale-95 mt-2"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý...</>
                : isLogin
                  ? <><LogIn size={18} /> Đăng nhập ngay</>
                  : <><UserPlus size={18} /> Tạo tài khoản</>}
            </button>
          </form>

          {/* OR + Google */}
          <div className="relative my-5 flex items-center">
            <div className="flex-1 border-t border-white/5" />
            <span className="px-3 text-slate-600 text-xs font-bold uppercase tracking-wider">Hoặc</span>
            <div className="flex-1 border-t border-white/5" />
          </div>

          <div className="space-y-2">
            <div id="googleSignInButton" className="w-full flex justify-center min-h-[44px]" />
            {import.meta.env.VITE_GOOGLE_CLIENT_ID === 'your-google-client-id-here.apps.googleusercontent.com' && (
              <p className="text-[10px] text-center text-amber-500/70 font-medium">
                * Cập nhật VITE_GOOGLE_CLIENT_ID trong .env để bật đăng nhập Google.
              </p>
            )}
          </div>

          {/* Switch mode link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => switchMode(!isLogin)}
              className="text-slate-500 text-sm font-medium hover:text-blue-400 transition-colors"
            >
              {isLogin
                ? <>Chưa có tài khoản? <span className="text-blue-400 font-bold">Đăng ký ngay</span></>
                : <>Đã có tài khoản? <span className="text-blue-400 font-bold">Đăng nhập</span></>}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-4 font-medium">
          AI Course — Nền tảng học tập thích ứng cùng AI
        </p>
      </div>
    </div>
  );
};

export default Auth;