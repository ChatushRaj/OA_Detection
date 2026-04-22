import { useEffect, useState } from "react";
import { withAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getUsers, createUser, UserData } from "../../services/api";
import { Plus, X, Search, UserCheck, Shield, Stethoscope, User as UserIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../../components/AnimatedUI";

function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "patient", full_name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = () => {
    getUsers().then((r) => setUsers(r.users)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.full_name) { setError("Username, password, and full name are required."); return; }
    setSaving(true);
    setError("");
    try {
      await createUser(form);
      setShowModal(false);
      setForm({ username: "", password: "", role: "patient", full_name: "", email: "" });
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const roleIcon = (role: string) => {
    switch(role) {
      case 'admin': return <Shield size={14} />;
      case 'doctor': return <Stethoscope size={14} />;
      default: return <UserIcon size={14} />;
    }
  };

  const roleBadge = (role: string) => {
    const m: Record<string, { bg: string; color: string }> = {
      admin: { bg: "var(--primary-container)", color: "var(--on-primary-container)" },
      doctor: { bg: "var(--secondary-container)", color: "var(--on-secondary-container)" },
      patient: { bg: "var(--tertiary-container)", color: "var(--on-tertiary-container)" },
    };
    const s = m[role] || m.patient;
    return (
      <span className="role-badge" style={{ background: s.bg, color: s.color, borderColor: `color-mix(in srgb, ${s.color}, transparent 80%)` }}>
        {roleIcon(role)}
        <span>{role}</span>
      </span>
    );
  };

  return (
    <DashboardLayout title="User Management">
      <div className="toolbar">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="search-wrap"
        >
          <Search size={18} />
          <input placeholder="Search by name or username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </motion.div>
        
        <MotionButton className="btn-primary" onClick={() => { setShowModal(true); setError(""); }}>
          <Plus size={18} /> 
          <span>Create New User</span>
        </MotionButton>
      </div>

      {loading ? (
        <div className="loading-shimmer">
          {[1,2,3,4,5].map(i => <div key={i} className="shimmer-row" />)}
        </div>
      ) : (
        <MotionCard className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Email Address</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((u, idx) => (
                    <motion.tr 
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ background: '#f8fafc' }}
                    >
                      <td>
                        <div className="user-info">
                          <div className="avatar" style={{ 
                            background: u.role === 'admin' ? 'var(--primary-container)' : u.role === 'doctor' ? 'var(--secondary-container)' : 'var(--tertiary-container)',
                            color: u.role === 'admin' ? 'var(--on-primary-container)' : u.role === 'doctor' ? 'var(--on-secondary-container)' : 'var(--on-tertiary-container)'
                          }}>
                            {u.full_name.charAt(0)}
                          </div>
                          <span className="full-name">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="username">@{u.username}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td className="email">{u.email || "—"}</td>
                      <td className="date">{new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <Search size={40} />
                <p>No users found matching "{search}"</p>
              </div>
            )}
          </div>
        </MotionCard>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Create New User</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="modal-error"
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="modal-content">
                <div className="modal-field">
                  <label>Full Name</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Dr. John Doe" />
                </div>
                <div className="modal-row">
                  <div className="modal-field">
                    <label>Username</label>
                    <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" />
                  </div>
                  <div className="modal-field">
                    <label>Password</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                  </div>
                </div>
                <div className="modal-row">
                  <div className="modal-field">
                    <label>System Role</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>Email Address</label>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <MotionButton 
                  className="btn-submit" 
                  onClick={handleCreate} 
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create User"}
                </MotionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style jsx>{`
        .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 32px; border-bottom: 1px solid var(--outline-variant); padding-bottom: 24px; }
        /* Global .search-wrap handles standardizing and centering icon */
        
        /* Buttons */
        .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--primary); color: white; border-radius: 10px; font-weight: 600; font-size: 0.875rem; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(14,165,233,0.2); transition: all 0.2s; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }

        /* Table Styling */
        .table-card { overflow: hidden; padding: 0; border: 1px solid var(--outline-variant); border-radius: var(--radius); }
        .table-wrap { width: 100%; border-radius: var(--radius); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px 20px; color: var(--on-surface-variant); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--outline-variant); background: var(--surface-container-low); }
        td { padding: 16px 20px; color: var(--on-surface-variant); font-size: 0.88rem; border-bottom: 1px solid var(--outline-variant); vertical-align: middle; }
        
        .user-info { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: inherit; font-size: 0.825rem; border: 1px solid rgba(0,0,0,0.05); }
        .full-name { font-weight: 600; color: var(--on-surface); }
        .username { font-family: 'JetBrains Mono', 'Cascadia Code', monospace; font-size: 0.78rem; color: var(--primary); font-weight: 500; }
        
        .role-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
        
        .empty-state { text-align: center; color: var(--on-surface-variant); padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; background: var(--surface-container-lowest); }
        .empty-state p { font-weight: 600; font-size: 0.95rem; }

        .loading-shimmer { display: flex; flex-direction: column; gap: 12px; }
        .shimmer-row { height: 64px; background: var(--surface-container-lowest); border-radius: 12px; border: 1px solid var(--outline-variant); }

        /* Modal Refinement */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: var(--surface-container-lowest); border-radius: 20px; padding: 32px; width: 100%; max-width: 520px; box-shadow: 0 20px 50px -12px rgba(15, 23, 42, 0.15); position: relative; border: 1px solid var(--outline-variant); }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid var(--outline-variant); padding-bottom: 16px; }
        .modal-header h3 { color: var(--on-surface); font-size: 1.25rem; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
        .modal-close { background: var(--surface-container-low); border: none; color: var(--outline); cursor: pointer; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .modal-close:hover { background: var(--surface-container-high); color: var(--error); }
        
        .modal-error { display: flex; align-items: center; gap: 10px; background: var(--error-container); border: 1px solid var(--error-dim); color: var(--on-error-container); padding: 12px; border-radius: 10px; font-size: 0.825rem; font-weight: 600; margin-bottom: 16px; }
        
        .modal-field { margin-bottom: 20px; }
        .modal-field label { display: block; color: var(--on-surface-variant); font-size: 0.725rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .modal-field input, .modal-field select { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--outline-variant); background: var(--surface-container-low); color: var(--on-surface); font-size: 0.925rem; outline: none; transition: all 0.2s; font-family: inherit; box-sizing: border-box; }
        .modal-field input:focus, .modal-field select:focus { border-color: var(--primary); background: var(--surface-container-lowest); box-shadow: 0 0 0 3px var(--primary-container); }
        
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
        .btn-secondary { padding: 10px 20px; border-radius: 10px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
        .btn-secondary:hover { background: var(--surface-container-low); color: var(--on-surface); border-color: var(--outline); }
        .btn-submit { padding: 11px 24px; border-radius: 10px; border: none; background: var(--primary); color: white; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; box-shadow: 0 4px 12px rgba(14,165,233,0.2); }
        .btn-submit:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(UsersPage, ["admin"]);
