import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import TextField from "../components/common/TextField";
import { useCurrentUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../api/client";

const ADMIN_URL = (import.meta.env.VITE_ADMIN_URL || "http://localhost:5174").replace(/\/$/, "");
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const { login, register, loginWithGoogle } = useCurrentUser();
  const { showToast } = useToast();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const afterAuthenticated = (user, successMessage) => {
    if (user.role === "ADMIN") {
      const at = localStorage.getItem(ACCESS_TOKEN_KEY);
      const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
      window.location.href = `${ADMIN_URL}/handoff?at=${encodeURIComponent(at)}&rt=${encodeURIComponent(rt)}`;
      return;
    }
    showToast(successMessage);
    navigate(user.onboarded ? "/" : "/onboarding");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    setSubmitting(true);
    try {
      const user =
        mode === "register"
          ? await register(email, password)
          : await login(email, password);
      afterAuthenticated(user, mode === "register" ? "Tạo tài khoản thành công" : "Đăng nhập thành công");
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    setError("");
    try {
      const user = await loginWithGoogle(response.credential);
      afterAuthenticated(user, "Đăng nhập thành công");
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra, vui lòng thử lại sau");
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const renderButton = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 336,
        text: "continue_with",
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = renderButton;
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-zm-bg bg-noise flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-zm-card rounded-2xl shadow-2xl border border-zm-border overflow-hidden glow-violet animate-card-in">
        <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-[#8b5cf6] via-[#6d28d9] to-[#0a0c14] text-white p-10 gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-[#22d3ee]/30 blur-3xl pointer-events-none animate-aurora-a" />
          <div className="absolute -bottom-16 -left-14 w-60 h-60 rounded-full bg-[#8b5cf6]/30 blur-3xl pointer-events-none animate-aurora-b" />
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center font-black text-[#8b5cf6] text-3xl mb-2 relative animate-logo-glow">
            M
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">
            Mingo kết nối mọi khoảnh khắc của bạn
          </h1>
          <p className="text-white/90 text-sm leading-relaxed">
            Đăng bài, trò chuyện, kết bạn và chia sẻ cuộc sống cùng bạn bè — tất
            cả trong một mạng xã hội mini nhanh gọn, gần gũi.
          </p>
          <ul className="text-sm text-white/90 mt-4 flex flex-col gap-2">
            <li>✓ Đăng bài & bình luận theo thời gian thực</li>
            <li>✓ Chat trực tuyến với bạn bè</li>
            <li>✓ Theo dõi & kết bạn dễ dàng</li>
          </ul>
        </div>

        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="relative flex mb-6 bg-zm-bg border border-zm-border rounded-full p-1">
            <div
              aria-hidden="true"
              className={`absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full bg-gradient-to-r from-zm-blue to-zm-blue-light transition-transform duration-300 ease-out ${
                mode === "register" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`relative z-10 flex-1 min-h-11 rounded-full text-sm font-semibold ${
                mode === "login" ? "text-white" : "text-zm-muted"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`relative z-10 flex-1 min-h-11 rounded-full text-sm font-semibold ${
                mode === "register" ? "text-white" : "text-zm-muted"
              }`}
            >
              Đăng ký
            </button>
          </div>

          <h2 className="text-xl font-bold mb-1">
            {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
          </h2>
          <p className="text-sm text-zm-muted mb-6">
            {mode === "login"
              ? "Đăng nhập để tiếp tục vào Mingo"
              : "Chỉ mất vài giây để tham gia Mingo"}
          </p>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <TextField
              icon={FaEnvelope}
              label="Email"
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              icon={FaLock}
              label="Mật khẩu"
              type="password"
              required
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mode === "register" && (
              <TextField
                icon={FaLock}
                label="Nhập lại mật khẩu"
                type="password"
                required
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}

            {mode === "login" && (
              <div className="text-right -mt-1">
                <button type="button" className="text-xs text-zm-blue-light font-semibold hover:underline">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {error && <p className="text-xs text-zm-heart font-medium">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-zm-blue to-zm-blue-light disabled:opacity-60 hover:opacity-90 text-white font-bold rounded-lg py-2.5 text-sm mt-2 transition-opacity"
            >
              {submitting ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-zm-border" />
            <span className="text-xs text-zm-muted">hoặc</span>
            <hr className="flex-1 border-zm-border" />
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div ref={googleButtonRef} className="flex justify-center min-h-11" />
          ) : (
            <button
              type="button"
              disabled
              title="Đăng nhập Google chưa được cấu hình"
              className="border border-zm-border rounded-lg py-2.5 text-sm font-semibold text-zm-muted opacity-60 cursor-not-allowed"
            >
              Tiếp tục với Google
            </button>
          )}

          <p className="text-center text-xs text-zm-muted mt-6">
            {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="text-zm-blue-light font-semibold hover:underline"
            >
              {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
