import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { withAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getPatients, createPatient, updatePatient, PatientData } from "../../services/api";
import { Plus, X, Search, Edit3, User, Phone, Activity, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../../components/AnimatedUI";

function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientData | null>(null);
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", phone: "" });
  const [createdCreds, setCreatedCreds] = useState<{username: string, password: string} | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPatients = useCallback(() => {
    setLoading(true);
    getPatients().then((r) => setPatients(r.patients)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPatients();
    if (router.query.add === "1") setShowModal(true);
  }, [fetchPatients, router.query.add]);

  const openAdd = () => {
    setEditingPatient(null);
    setForm({ name: "", age: "", gender: "Male", phone: "" });
    setCreatedCreds(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (p: PatientData) => {
    setEditingPatient(p);
    setForm({ name: p.name, age: p.age?.toString() || "", gender: p.gender || "Male", phone: p.phone || "" });
    setCreatedCreds(null);
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Patient name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { name: form.name, age: form.age ? parseInt(form.age) : null, gender: form.gender, phone: form.phone };
      if (editingPatient) {
        await updatePatient(editingPatient.id, payload);
        setShowModal(false);
      } else {
        const res = await createPatient(payload);
        if (res.patient && res.patient.credentials) {
           setCreatedCreds(res.patient.credentials);
        } else {
           setShowModal(false);
        }
      }
      fetchPatients();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save patient data");
    } finally {
      setSaving(false);
    }
  };

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="Patient Management">
      <div className="toolbar">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="search-wrap">
          <Search size={18} />
          <input placeholder="Search patients by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </motion.div>
        <MotionButton className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> <span>Register New Patient</span>
        </MotionButton>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="loading-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>{search ? "No patients match your search criteria." : "Your patient roster is currently empty."}</p>
          {!search && <MotionButton className="btn-secondary" onClick={openAdd}>Register Your First Patient</MotionButton>}
        </div>
      ) : (
        <div className="cards-grid">
          <AnimatePresence>
            {filtered.map((p, idx) => (
              <MotionCard key={p.id} className="patient-card">
                <div className="card-header">
                  <div className="avatar-wrap">
                    <div className="avatar-bg" />
                    <User size={20} className="avatar-icon" />
                  </div>
                  <div className="header-info">
                    <h4 className="patient-name">{p.name}</h4>
                    <span className="patient-id">PID: #{p.id}</span>
                  </div>
                  <button className="edit-btn" title="Edit Profile" onClick={() => openEdit(p)}>
                    <Edit3 size={14} />
                  </button>
                </div>

                <div className="card-body">
                  <div className="info-pills">
                    <div className="pill">
                      <span className="pill-label">Age</span>
                      <span className="pill-value">{p.age ? `${p.age}y` : "—"}</span>
                    </div>
                    <div className="pill">
                      <span className="pill-label">Gender</span>
                      <span className="pill-value">{p.gender || "—"}</span>
                    </div>
                  </div>

                  <div className="contact-info">
                    <div className="info-item">
                      <Phone size={14} />
                      <span>{p.phone || "No phone added"}</span>
                    </div>
                    <div className="info-item">
                      <Activity size={14} />
                      <span>{p.scan_count} Analysis Record{p.scan_count !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <MotionButton className="btn-action" onClick={() => router.push(`/doctor/scans?patient_id=${p.id}`)}>
                    <span>View Scans</span>
                    <ArrowRight size={16} />
                  </MotionButton>
                </div>
              </MotionCard>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Register/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <div className="modal-subtitle">PATIENT ENROLLMENT</div>
                  <h3>{editingPatient ? `Edit Profile: ${editingPatient.name}` : "Register New Patient"}</h3>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              
              {createdCreds ? (
                <div className="creds-success">
                  <div className="success-icon-wrap">
                    <ShieldCheck size={40} />
                  </div>
                  <h4>Registration Successful!</h4>
                  <p>A secure profile has been created. Please provision the following credentials to the patient:</p>
                  
                  <div className="creds-card">
                    <div className="creds-row">
                      <span className="creds-label">USERNAME</span>
                      <span className="creds-value">{createdCreds.username}</span>
                    </div>
                    <div className="creds-row">
                      <span className="creds-label">PASSWORD</span>
                      <span className="creds-value">{createdCreds.password}</span>
                    </div>
                  </div>
                  
                  <div className="creds-alert">
                    <AlertCircle size={16} />
                    <span>Patients can update their password after their first successful login.</span>
                  </div>

                  <MotionButton className="btn-submit" style={{ width: '100%', marginTop: '8px' }} onClick={() => setShowModal(false)}>
                    Close & Redirect
                  </MotionButton>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="modal-error">
                        <AlertCircle size={16} /> <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="modal-form">
                    <div className="modal-field">
                      <label>Legal Full Name *</label>
                      <div className="input-wrap">
                        <User size={16} />
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                      </div>
                    </div>

                    <div className="modal-grid">
                      <div className="modal-field">
                        <label>Age</label>
                        <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Ex: 45" />
                      </div>
                      <div className="modal-field">
                        <label>Gender</label>
                        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                          <option>Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="modal-field">
                      <label>Contact Number</label>
                      <div className="input-wrap">
                        <Phone size={16} />
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn-secondary-modal" onClick={() => setShowModal(false)}>Cancel</button>
                    <MotionButton className="btn-submit" onClick={handleSave} disabled={saving}>
                      {saving ? "Processing..." : (editingPatient ? "Apply Changes" : "Create Profile")}
                    </MotionButton>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
        /* Global .search-wrap handles standardizing and centering icon */
        
        .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: var(--primary-hover); }

        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        
        .patient-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; transition: all 0.2s; }
        .patient-card:hover { border-color: var(--primary); box-shadow: var(--shadow-md); }
        
        .card-header { display: flex; align-items: center; gap: 12px; }
        .avatar-wrap { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
        .avatar-bg { position: absolute; inset: 0; background: var(--surface-container-high); border-radius: 8px; }
        .avatar-icon { position: relative; color: var(--on-surface-variant); }
        
        .header-info { flex: 1; }
        .patient-name { font-size: 1rem; font-weight: 700; color: var(--on-surface); margin: 0; }
        .patient-id { font-size: 0.65rem; font-weight: 600; color: var(--outline); text-transform: uppercase; letter-spacing: 0.02em; }
        
        .edit-btn { background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: 6px; color: var(--outline); padding: 6px; cursor: pointer; transition: all 0.2s; }
        .edit-btn:hover { color: var(--primary); border-color: var(--primary); }

        .info-pills { display: flex; gap: 8px; }
        .pill { flex: 1; background: var(--surface-container-low); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--outline-variant); display: flex; flex-direction: column; gap: 1px; }
        .pill-label { font-size: 0.6rem; font-weight: 600; color: var(--outline); text-transform: uppercase; letter-spacing: 0.05em; }
        .pill-value { font-size: 0.88rem; font-weight: 600; color: var(--on-surface); }

        .contact-info { display: flex; flex-direction: column; gap: 8px; }
        .info-item { display: flex; align-items: center; gap: 8px; color: var(--on-surface-variant); font-size: 0.85rem; font-weight: 400; }
        .info-item :global(svg) { color: var(--outline); }

        .btn-action { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: var(--surface-container-low); color: var(--primary); border: 1px solid var(--primary-container); border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
        .btn-action:hover { background: var(--primary); color: white; border-color: var(--primary); }

        .empty-state { text-align: center; color: var(--outline); padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--radius); }
        .empty-icon { font-size: 40px; opacity: 0.3; }
        .empty-state p { font-weight: 500; font-size: 1rem; }

        .loading-shimmer { height: 160px; background: var(--surface-container-lowest); border-radius: var(--radius); border: 1px solid var(--outline-variant); }

        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: var(--surface-container-lowest); border-radius: 20px; padding: 32px; width: 100%; max-width: 440px; border: 1px solid var(--outline-variant); box-shadow: 0 20px 50px -12px rgba(15, 23, 42, 0.15); position: relative; }
        
        .modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .modal-subtitle { font-size: 0.65rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .modal-header h3 { color: var(--on-surface); font-size: 1.25rem; font-weight: 700; margin: 0; }
        .modal-close { background: #f8fafc; border: none; color: var(--outline); cursor: pointer; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .modal-close:hover { background: var(--error-container); color: var(--error); }

        .modal-error { display: flex; align-items: center; gap: 10px; background: var(--error-container); border: 1px solid var(--error-dim); color: var(--on-error-container); padding: 12px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; margin-bottom: 20px; }
        
        .modal-field { margin-bottom: 20px; }
        .modal-field label { display: block; color: var(--on-surface-variant); font-size: 0.75rem; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .input-wrap { display: flex; align-items: center; gap: 10px; background: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: 10px; padding: 0 14px; color: var(--outline); transition: all 0.2s; }
        .input-wrap:focus-within { border-color: var(--primary); background: var(--surface-container-lowest); color: var(--primary); box-shadow: 0 0 0 3px var(--primary-container); }
        .input-wrap input { flex: 1; height: 48px; background: none; border: none; outline: none; color: var(--on-surface); font-size: 0.9rem; font-family: inherit; }
        
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .modal-field select, .modal-field input[type="number"] { width: 100%; height: 48px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--outline-variant); background: var(--surface-container-low); color: var(--on-surface); font-size: 0.9rem; outline: none; transition: all 0.2s; font-family: inherit; }
        .modal-field select:focus, .modal-field input[type="number"]:focus { border-color: var(--primary); background: var(--surface-container-lowest); box-shadow: 0 0 0 3px var(--primary-container); }

        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
        .btn-secondary-modal { padding: 12px 20px; border-radius: 10px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
        .btn-secondary-modal:hover { background: #f8fafc; color: var(--on-surface); }
        .btn-submit { padding: 12px 24px; border-radius: 10px; border: none; background: var(--primary); color: white; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
        .btn-submit:hover:not(:disabled) { background: var(--primary-hover); }
        .btn-submit:disabled { opacity: 0.5; }

        /* Success Creds */
        .creds-success { text-align: center; }
        .success-icon-wrap { width: 64px; height: 64px; background: #dcfce7; color: #22c55e; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .creds-success h4 { font-size: 1.25rem; font-weight: 700; color: var(--on-surface); margin: 0 0 10px; }
        .creds-success p { color: var(--on-surface-variant); font-size: 0.88rem; line-height: 1.5; margin-bottom: 24px; }
        
        .creds-card { background: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .creds-row { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .creds-label { font-size: 0.6rem; font-weight: 700; color: var(--outline); letter-spacing: 0.05em; }
        .creds-value { font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 600; color: var(--primary); background: var(--surface-container); padding: 8px 12px; border-radius: 8px; width: 100%; text-align: left; border: 1px solid var(--outline-variant); }
        
        .creds-alert { display: flex; align-items: center; gap: 10px; background: #f0f9ff; border: 1px solid #e0f2fe; padding: 12px; border-radius: 10px; color: #0369a1; font-size: 0.75rem; font-weight: 500; text-align: left; margin-bottom: 20px; }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(PatientsPage, ["doctor"]);
