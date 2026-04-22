import { useState, useEffect, useCallback } from "react";
import { withAuth, useAuth } from "../components/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { getProfile, updateProfile } from "../services/api";
import { Save, Eye, EyeOff, CheckCircle, User, Mail, Lock, Shield, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../components/AnimatedUI";

function ProfilePage() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getProfile();
      setForm((f) => ({ ...f, full_name: r.user.full_name || "", email: r.user.email || "" }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    if (form.password && form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password && form.password.length < 4) { setError("Password must be at least 4 characters."); return; }

    setSaving(true);
    try {
      const payload: Record<string, string> = { full_name: form.full_name, email: form.email };
      if (form.password) payload.password = form.password;

      const res = await updateProfile(payload);
      if (res.token) {
        localStorage.setItem("oa_token", res.token);
        login(res.token, res.user);
      }
      setSuccess("Your profile has been successfully updated!");
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to synchronize profile updates");
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = { doctor: "Physician", patient: "Patient", admin: "System Admin" };
  const roleColors: Record<string, string> = { doctor: "#0ea5e9", patient: "#8b5cf6", admin: "#1e293b" };

  return (
    <DashboardLayout title="Account Settings">
      {loading ? (
        <div className="loading-state">
          <div className="shimmer-header" />
          <div className="shimmer-card" />
          <div className="shimmer-card" />
        </div>
      ) : (
        <div className="profile-container">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="profile-masthead">
            <div className="avatar-section">
              <div className="avatar-frame">
                <div className="avatar-inner" style={{ background: `${roleColors[user?.role || "patient"]}10`, color: roleColors[user?.role || "patient"] }}>
                  {(form.full_name || user?.username || "U").charAt(0).toUpperCase()}
                </div>
                <div className="avatar-badge"><Sparkles size={12} /></div>
              </div>
              <div className="masthead-info">
                <h2>{form.full_name || user?.username}</h2>
                <div className="tag-group">
                  <span className="role-chip" style={{ background: `${roleColors[user?.role || "patient"]}15`, color: roleColors[user?.role || "patient"] }}>
                    <Shield size={12} /> {roleLabels[user?.role || "patient"]}
                  </span>
                  <span className="username-chip">@{user?.username}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="feedback-msg error">
                <AlertCircle size={18} /> <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="feedback-msg success">
                <CheckCircle size={18} /> <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="settings-grid">
            <MotionCard className="settings-card">
              <div className="card-header">
                <User size={18} className="header-icon" />
                <h3>Personal Identity</h3>
              </div>
              <div className="form-group">
                <div className="field">
                  <label>Display Name</label>
                  <div className="input-box">
                    <User size={16} />
                    <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter your preferred name" />
                  </div>
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <div className="input-box">
                    <Mail size={16} />
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@institution.com" />
                  </div>
                </div>
              </div>
            </MotionCard>

            <MotionCard className="settings-card">
              <div className="card-header">
                <Lock size={18} className="header-icon" />
                <h3>Security Credentials</h3>
              </div>
              <p className="security-notice">Maintain account safety by updating your password periodically.</p>
              <div className="form-group">
                <div className="field">
                  <label>Update Password</label>
                  <div className="input-box">
                    <Lock size={16} />
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New secure password" />
                    <button className="eye-toggle" onClick={() => setShowPass(!showPass)} type="button">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Verify Password</label>
                  <div className="input-box">
                    <Lock size={16} />
                    <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm new password" />
                  </div>
                </div>
              </div>
            </MotionCard>
          </div>

          <div className="actions-bar">
            <MotionButton className="btn-save" onClick={handleSave} disabled={saving}>
              <Save size={20} />
              <span>{saving ? "Synchronizing..." : "Finalize Changes"}</span>
            </MotionButton>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-container { max-width: 800px; margin: 0 auto; }
        
        .profile-masthead { background: white; border: 1.5px solid #f1f5f9; border-radius: 32px; padding: 40px; margin-bottom: 32px; box-shadow: 0 12px 32px -8px rgba(0,0,0,0.03); }
        .avatar-section { display: flex; align-items: center; gap: 32px; }
        .avatar-frame { position: relative; }
        .avatar-inner { width: 96px; height: 96px; border-radius: 28px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 900; letter-spacing: -0.02em; border: 2px solid white; box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1); }
        .avatar-badge { position: absolute; bottom: -4px; right: -4px; width: 32px; height: 32px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #f59e0b; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
        
        .masthead-info h2 { font-size: 1.8rem; font-weight: 900; color: #1e293b; margin: 0 0 12px; letter-spacing: -0.03em; }
        .tag-group { display: flex; align-items: center; gap: 12px; }
        .role-chip { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 12px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .username-chip { color: #94a3b8; font-size: 0.9rem; font-weight: 600; padding: 6px 0; }

        .feedback-msg { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 20px; font-size: 0.95rem; font-weight: 700; margin-bottom: 24px; }
        .feedback-msg.error { background: #fef2f2; border: 1.5px solid #fee2e2; color: #ef4444; }
        .feedback-msg.success { background: #f0fdf4; border: 1.5px solid #dcfce7; color: #16a34a; }

        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        .settings-card { padding: 32px; border: 1px solid #f1f5f9; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .settings-card:hover { border-color: #0ea5e940; box-shadow: 0 16px 32px -4px rgba(0,0,0,0.04); }
        
        .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .header-icon { color: #0ea5e9; }
        .card-header h3 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
        
        .security-notice { color: #64748b; font-size: 0.82rem; font-weight: 500; margin-bottom: 20px; line-height: 1.5; }
        .form-group { display: flex; flex-direction: column; gap: 20px; }
        .field label { display: block; font-size: 0.72rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        
        .input-box { display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1.5px solid #f1f5f9; border-radius: 16px; padding: 0 18px; color: #94a3b8; transition: all 0.2s; position: relative; }
        .input-box:focus-within { background: white; border-color: #0ea5e9; color: #0ea5e9; box-shadow: 0 0 0 4px rgba(14,165,233,0.08); }
        .input-box input { flex: 1; height: 52px; background: none; border: none; outline: none; color: #1e293b; font-size: 0.95rem; font-family: inherit; font-weight: 600; }
        .eye-toggle { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 8px; border-radius: 8px; transition: all 0.2s; }
        .eye-toggle:hover { color: #0ea5e9; background: #f0f9ff; }

        .actions-bar { display: flex; justify-content: flex-end; }
        .btn-save { display: flex; align-items: center; gap: 12px; padding: 16px 36px; border-radius: 20px; border: none; background: #0ea5e9; color: white; font-size: 1rem; font-weight: 800; cursor: pointer; box-shadow: 0 12px 24px -6px rgba(14,165,233,0.4); transition: all 0.2s; }
        .btn-save:hover { background: #0284c7; transform: translateY(-2px); box-shadow: 0 16px 32px -12px rgba(14,165,233,0.5); }
        .btn-save:active { transform: translateY(0); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        .loading-state { display: flex; flex-direction: column; gap: 24px; padding: 20px 0; }
        .shimmer-header { height: 180px; background: white; border-radius: 32px; border: 1.5px solid #f1f5f9; }
        .shimmer-card { height: 320px; background: white; border-radius: 28px; border: 1.5px solid #f1f5f9; }

        @media (max-width: 768px) {
          .settings-grid { grid-template-columns: 1fr; }
          .avatar-section { flex-direction: column; text-align: center; gap: 20px; }
          .tag-group { justify-content: center; }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(ProfilePage, ["doctor", "patient", "admin"]);
