import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { withAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getPatients, createPatient, updatePatient, deletePatient, PatientData } from "../../services/api";
import { Plus, X, Search, Edit3, Trash2, User, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../../components/AnimatedUI";

function AdminPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientData | null>(null);
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPatients = () => { getPatients().then((r) => setPatients(r.patients)).catch(console.error).finally(() => setLoading(false)); };
  useEffect(() => { fetchPatients(); }, []);

  const openAdd = () => { setEditingPatient(null); setForm({ name: "", age: "", gender: "Male", phone: "" }); setError(""); setShowModal(true); };
  const openEdit = (p: PatientData) => { setEditingPatient(p); setForm({ name: p.name, age: p.age?.toString() || "", gender: p.gender || "Male", phone: p.phone || "" }); setError(""); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = { name: form.name, age: form.age ? parseInt(form.age) : null, gender: form.gender, phone: form.phone };
      if (editingPatient) await updatePatient(editingPatient.id, payload);
      else await createPatient(payload);
      setShowModal(false); fetchPatients();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); } finally { setSaving(false); }
  };

  const handleDelete = async (p: PatientData) => {
    if (!confirm(`Delete patient "${p.name}"? This will also delete all their scans.`)) return;
    try { await deletePatient(p.id); fetchPatients(); } catch (err) { console.error(err); }
  };

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="All Patients (Admin)">
      <div className="toolbar">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="search-wrap">
          <Search size={18} />
          <input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </motion.div>
        <MotionButton className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> 
          <span>Add Patient</span>
        </MotionButton>
      </div>

      {loading ? (
        <div className="loading-state">
          {[1,2,3,4].map(i => <div key={i} className="shimmer-row" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <User size={40} />
          <p>No patients found.</p>
        </div>
      ) : (
        <MotionCard className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Phone Number</th>
                  <th>Primary Physician</th>
                  <th>Scans</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((p, idx) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <td className="name-cell">{p.name}</td>
                      <td>{p.age || "—"}</td>
                      <td>
                        <span className={`gender-badge ${p.gender?.toLowerCase()}`}>
                          {p.gender || "—"}
                        </span>
                      </td>
                      <td className="phone-cell">{p.phone || "—"}</td>
                      <td className="doc-cell">{p.doctor_name || "Unassigned"}</td>
                      <td>
                        <span className="scan-count">{p.scan_count}</span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn" title="View Scans" onClick={() => router.push(`/admin/scans?patient_id=${p.id}`)}><User size={16} /></button>
                          <button className="icon-btn" title="Edit Profile" onClick={() => openEdit(p)}><Edit3 size={16} /></button>
                          <button className="icon-btn del" title="Delete Patient" onClick={() => handleDelete(p)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
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
                <div className="modal-title-wrap">
                  <UserPlus size={20} className="modal-icon" />
                  <h3>{editingPatient ? "Edit Patient Case" : "Register New Patient"}</h3>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="modal-error">
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="modal-content">
                <div className="modal-field">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Robert Smith" />
                </div>
                <div className="modal-row">
                  <div className="modal-field">
                    <label>Age</label>
                    <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Years" />
                  </div>
                  <div className="modal-field">
                    <label>Gender</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="modal-field">
                  <label>Contact Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <MotionButton className="btn-submit" onClick={handleSave} disabled={saving}>
                  {saving ? "Processing..." : editingPatient ? "Save Updates" : "Complete Registration"}
                </MotionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 32px; border-bottom: 1px solid var(--outline-variant); padding-bottom: 24px; }
        /* Global .search-wrap handles standardizing and centering icon */
        
        .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--primary); color: white; border-radius: 10px; font-weight: 600; font-size: 0.9rem; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(14,165,233,0.2); transition: all 0.2s; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }

        /* Table Styling */
        .table-card { overflow: hidden; padding: 0; border: 1px solid var(--outline-variant); border-radius: var(--radius); }
        .table-wrap { width: 100%; border-radius: var(--radius); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px 20px; color: var(--on-surface-variant); font-size: 0.725rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--outline-variant); background: var(--surface-container-low); }
        td { padding: 16px 20px; color: var(--on-surface-variant); font-size: 0.9rem; border-bottom: 1px solid var(--outline-variant); vertical-align: middle; }
        
        tr:hover td { background: var(--surface-container-highest); }
        
        .name-cell { font-weight: 600; color: var(--on-surface); }
        .phone-cell { font-family: 'Inter', sans-serif; font-variant-numeric: tabular-nums; }
        .doc-cell { color: var(--primary); font-weight: 500; font-size: 0.85rem; }
        .scan-count { display: inline-flex; width: 24px; height: 24px; background: var(--surface-container-high); border-radius: 6px; align-items: center; justify-content: center; font-weight: 700; color: var(--on-surface-variant); font-size: 0.75rem; }

        .gender-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.725rem; font-weight: 600; text-transform: uppercase; }
        .gender-badge.male { background: var(--primary-container); color: var(--on-primary-container); }
        .gender-badge.female { background: var(--secondary-container); color: var(--on-secondary-container); }
        
        .action-btns { display: flex; justify-content: flex-end; gap: 8px; }
        .icon-btn { background: var(--surface-container); border: 1px solid var(--outline-variant); border-radius: 8px; color: var(--outline); padding: 7px; cursor: pointer; display: flex; transition: all 0.2s; }
        .icon-btn:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-container); }
        .icon-btn.del:hover { color: var(--on-error-container); border-color: var(--error-container); background: var(--error-container); }

        .empty-state { text-align: center; color: var(--on-surface-variant); padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; background: var(--surface-container-lowest); border-radius: var(--radius); }
        .loading-state { display: flex; flex-direction: column; gap: 12px; }
        .shimmer-row { height: 64px; background: var(--surface-container-lowest); border-radius: 12px; border: 1px solid var(--outline-variant); }

        /* Modal Refinement */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: var(--surface-container-lowest); border-radius: 20px; padding: 32px; width: 100%; max-width: 520px; box-shadow: 0 20px 50px -12px rgba(15, 23, 42, 0.15); border: 1px solid var(--outline-variant); position: relative; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid var(--outline-variant); padding-bottom: 16px; }
        .modal-title-wrap { display: flex; align-items: center; gap: 12px; }
        .modal-icon { color: var(--primary); }
        .modal-header h3 { color: var(--on-surface); font-size: 1.25rem; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
        .modal-close { background: var(--surface-container); border: none; color: var(--outline); cursor: pointer; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .modal-close:hover { background: var(--surface-container-high); color: var(--error); }
        
        .modal-error { background: var(--error-container); border: 1px solid var(--error); color: var(--on-error-container); padding: 12px; border-radius: 10px; font-size: 0.825rem; font-weight: 600; margin-bottom: 20px; text-align: center; }
        
        .modal-field { margin-bottom: 20px; }
        .modal-field label { display: block; color: var(--on-surface-variant); font-size: 0.725rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .modal-field input, .modal-field select { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--outline-variant); background: var(--surface-container-low); color: var(--on-surface); font-size: 0.95rem; outline: none; transition: all 0.2s; font-family: inherit; box-sizing: border-box; }
        .modal-field input:focus, .modal-field select:focus { border-color: var(--primary); background: var(--surface-container-lowest); box-shadow: 0 0 0 3px var(--primary-container); }
        
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
        .btn-secondary { padding: 10px 20px; border-radius: 10px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
        .btn-secondary:hover { background: var(--surface-container); color: var(--on-surface); border-color: var(--outline); }
        .btn-submit { padding: 11px 24px; border-radius: 10px; border: none; background: var(--on-surface); color: white; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
        .btn-submit:hover { background: var(--inverse-surface); }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(AdminPatientsPage, ["admin"]);
