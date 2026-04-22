import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { withAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getScans, ScanData, getPatients, PatientData, uploadScan, updateScan, getScanImageUrl, exportScans, exportScansPdf } from "../../services/api";
import { Upload, X, Search, Edit3, Eye, Image as ImageIcon, Download, Printer, AlertCircle, FileText, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../../components/AnimatedUI";

function ScansPage() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanData[]>([]);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [viewScan, setViewScan] = useState<ScanData | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [uploadForm, setUploadForm] = useState({ patient_id: "", notes: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedScans, setSelectedScans] = useState<number[]>([]);

  const fetchData = useCallback(() => {
    const patientId = router.query.patient_id ? parseInt(router.query.patient_id as string) : undefined;
    setLoading(true);
    Promise.all([getScans(patientId), getPatients()])
      .then(([sRes, pRes]) => { 
        setScans(sRes.scans); 
        setPatients(pRes.patients); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router.query.patient_id]);

  useEffect(() => {
    fetchData();
    if (router.query.upload === "1") setShowUpload(true);
  }, [fetchData, router.query.upload]);

  useEffect(() => {
    if (router.query.view) {
      const scanId = parseInt(router.query.view as string);
      getScans().then((r) => {
        const s = r.scans.find((sc: ScanData) => sc.id === scanId);
        if (s) { setViewScan(s); setEditNotes(s.notes || ""); }
      });
    }
  }, [router.query.view]);

  const handleUpload = async () => {
    if (!uploadForm.patient_id || !uploadFile) { setError("Please select a patient and an image file."); return; }
    setUploading(true);
    setError("");
    try {
      await uploadScan(parseInt(uploadForm.patient_id), uploadFile, uploadForm.notes);
      setShowUpload(false);
      setUploadFile(null);
      setUploadForm({ patient_id: "", notes: "" });
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!viewScan) return;
    try {
      await updateScan(viewScan.id, { notes: editNotes });
      fetchData();
      setViewScan({ ...viewScan, notes: editNotes });
    } catch (err) {
      console.error(err);
    }
  };

  const gradeColor = (g: number | null) => {
    const c = ["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444"];
    return g !== null && g >= 0 && g <= 4 ? c[g] : "#94a3b8";
  };

  const getSeverity = (g: number | null) => {
    const labels = ["Normal", "Doubtful", "Mild", "Moderate", "Severe"];
    return g !== null && g >= 0 && g <= 4 ? labels[g] : "Pending";
  };

  const filtered = scans.filter((s) =>
    (s.patient_name?.toLowerCase().includes(search.toLowerCase())) ||
    (s.predicted_class?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedScans.length === filtered.length) {
      setSelectedScans([]);
    } else {
      setSelectedScans(filtered.map(s => s.id));
    }
  };

  return (
    <DashboardLayout title="Diagnostic Scans">
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <Search size={18} />
            <input placeholder="Search by patient or result..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        
        <div className="toolbar-right">
          {selectedScans.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="selection-actions">
              <span className="selection-count">{selectedScans.length} selected</span>
              <button className="btn-secondary sm" onClick={toggleSelectAll}>
                {selectedScans.length === filtered.length ? "Deselect All" : "Select All"}
              </button>
              <div className="divider" />
              <button className="btn-secondary" onClick={() => exportScans(router.query.patient_id ? parseInt(router.query.patient_id as string) : undefined, selectedScans)}>
                <Download size={16} /> Export CSV
              </button>
              <button className="btn-secondary" onClick={() => exportScansPdf(filtered.filter(s => selectedScans.includes(s.id)), "Diagnostic Scans Report")}>
                <Printer size={16} /> Export PDF
              </button>
            </motion.div>
          )}
          <MotionButton className="btn-primary" onClick={() => { setShowUpload(true); setError(""); }}>
            <Upload size={18} /> <span>New Scan Analysis</span>
          </MotionButton>
        </div>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4,5].map(i => <div key={i} className="loading-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <p>{search ? "No results found matching your search." : "No scans found. Upload a scan to begin analysis."}</p>
        </div>
      ) : (
        <MotionCard className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "48px" }}>
                    <input type="checkbox" checked={selectedScans.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="custom-checkbox" />
                  </th>
                  <th>Patient Name</th>
                  <th>Analysis Date</th>
                  <th>AI Prediction</th>
                  <th>Confidence</th>
                  <th>Severity Grade</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((sc) => (
                    <motion.tr 
                      key={sc.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={selectedScans.includes(sc.id) ? "row-selected" : ""}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedScans.includes(sc.id)} 
                          onChange={() => setSelectedScans(p => p.includes(sc.id) ? p.filter(x => x !== sc.id) : [...p, sc.id])}
                          className="custom-checkbox"
                        />
                      </td>
                      <td>
                        <div className="patient-info">
                          <div className="patient-avatar">{sc.patient_name?.charAt(0)}</div>
                          <span className="patient-name">{sc.patient_name}</span>
                        </div>
                      </td>
                      <td className="date-cell">{new Date(sc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>
                        <span className="diagnosis-text">{sc.predicted_class || "Pending"}</span>
                      </td>
                      <td>
                        <div className="conf-wrap">
                          <div className="conf-bar-bg"><div className="conf-bar" style={{ width: `${(sc.confidence || 0) * 100}%`, background: gradeColor(sc.grade_index) }} /></div>
                          <span className="conf-text">{sc.confidence ? `${(sc.confidence * 100).toFixed(0)}%` : "—"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="grade-badge" style={{ background: `${gradeColor(sc.grade_index)}10`, color: gradeColor(sc.grade_index), borderColor: `${gradeColor(sc.grade_index)}20` }}>
                          {getSeverity(sc.grade_index)}
                          <span style={{ opacity: 0.6, fontSize: '0.65rem', marginLeft: '6px' }}>
                            ({sc.grade_index !== null ? `KL ${sc.grade_index}` : "..."})
                          </span>
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn" title="Detailed Report" onClick={() => { setViewScan(sc); setEditNotes(sc.notes || ""); }}><Eye size={16} /></button>
                          <button className="icon-btn" title="Add Clinical Notes" onClick={() => { setViewScan(sc); setEditNotes(sc.notes || ""); }}><Edit3 size={16} /></button>
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

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>New Scan Analysis</h3>
                <button className="modal-close" onClick={() => setShowUpload(false)}><X size={20} /></button>
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="modal-error">
                    <AlertCircle size={16} /> <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="modal-content">
                <div className="modal-field">
                  <label>Patient Selection *</label>
                  <select value={uploadForm.patient_id} onChange={(e) => setUploadForm({ ...uploadForm, patient_id: e.target.value })}>
                    <option value="">Choose a patient profile...</option>
                    {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.age}y, {p.gender})</option>)}
                  </select>
                </div>
                
                <div className="modal-field">
                  <label>Diagnostic X-Ray Image *</label>
                  <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                    <AnimatePresence mode="wait">
                      {uploadFile ? (
                        <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="upload-sel">
                          <div className="file-badge"><ImageIcon size={20} /></div>
                          <div className="file-info">
                            <span className="file-name">{uploadFile.name}</span>
                            <span className="file-size">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <CheckCircle2 size={18} className="success-icon" />
                        </motion.div>
                      ) : (
                        <motion.div key="ph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="upload-ph">
                          <div className="upload-icon-wrap"><Upload size={24} /></div>
                          <div className="upload-text">
                            <strong>Drop X-ray here</strong> or click to browse
                            <span>Recommended: AP View (PNG, JPG)</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" hidden onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                <div className="modal-field">
                  <label>Consultation Notes</label>
                  <textarea value={uploadForm.notes} onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })} rows={3} placeholder="Add any initial clinical context..." />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowUpload(false)}>Discard</button>
                <MotionButton className="btn-submit" onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Analyzing Patterns..." : "Secure Analysis"}
                </MotionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View/Detail Modal */}
      <AnimatePresence>
        {viewScan && (
          <div className="modal-overlay" onClick={() => setViewScan(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal modal-lg" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <div className="modal-subtitle">CLINICAL DIAGNOSTIC REPORT</div>
                  <h3>Patient: {viewScan.patient_name}</h3>
                </div>
                <button className="modal-close" onClick={() => setViewScan(null)}><X size={20} /></button>
              </div>

              <div className="detail-grid">
                <div className="scan-img-card">
                  <img src={getScanImageUrl(viewScan.id)} alt="Diagnostic Scan" />
                  <div className="img-overlay">
                    <span className="img-id">REQUISITION ID: #{viewScan.id}</span>
                  </div>
                </div>
                
                <div className="report-content">
                  <div className="result-main-card" style={{ borderLeft: `6px solid ${gradeColor(viewScan.grade_index)}` }}>
                    <div className="res-header">
                      <span className="res-label">CLASSIFICATION</span>
                      <span className="res-date">{new Date(viewScan.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="res-value">{viewScan.predicted_class || "Analysis Pending"}</div>
                    
                    <div className="res-meta">
                      <div className="meta-item">
                        <span className="meta-label">PROBABILITY</span>
                        <span className="meta-value">{viewScan.confidence ? `${(viewScan.confidence * 100).toFixed(2)}%` : "N/A"}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">SEVERITY GRADE</span>
                        <span className="meta-value" style={{ color: gradeColor(viewScan.grade_index) }}>
                          {getSeverity(viewScan.grade_index)} {viewScan.grade_index !== null ? `(KL ${viewScan.grade_index})` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {viewScan.suggestions?.summary && (
                    <div className="ai-assessment">
                      <h4><Sparkles size={14} /> AI-Powered Differential Insight</h4>
                      <p>{viewScan.suggestions.summary}</p>
                    </div>
                  )}

                  <div className="notes-area">
                    <label>Physician Observations</label>
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} placeholder="Record clinical findings..." />
                    <MotionButton className="btn-save-notes" onClick={handleSaveNotes}>
                      Finalize & Save Report
                    </MotionButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        /* Toolbar & Global Search overrides are now managed in globals.css */
        .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
        .toolbar-left { flex: 1; min-width: 0; }
        .toolbar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        
        .selection-actions { display: flex; align-items: center; gap: 8px; background: var(--surface-container-low); padding: 4px 12px; border-radius: 8px; border: 1px solid var(--outline-variant); }
        .selection-count { font-size: 0.75rem; font-weight: 600; color: var(--on-surface-variant); margin-right: 4px; }
        .divider { width: 1px; height: 16px; background: var(--outline-variant); }
        
        .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: var(--primary-hover); }
        
        .btn-secondary { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .btn-secondary:hover { background: var(--surface-container-low); color: var(--on-surface); border-color: var(--outline); }
        .btn-secondary.sm { padding: 4px 10px; font-size: 0.72rem; }

        .table-card { padding: 0; border: 1px solid var(--outline-variant); overflow: hidden; }
        .table-wrap { width: 100%; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px 20px; color: var(--outline); font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--outline-variant); background: var(--surface-container-low); }
        td { padding: 14px 20px; color: var(--on-surface-variant); font-size: 0.88rem; border-bottom: 1px solid var(--outline-variant); }
        
        tr:hover td { background: var(--surface-container-low); }
        tr.row-selected td { background: var(--primary-container); }

        .custom-checkbox { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid var(--outline); accent-color: var(--primary); cursor: pointer; }

        .patient-info { display: flex; align-items: center; gap: 10px; }
        .patient-avatar { width: 28px; height: 28px; border-radius: 6px; background: var(--surface-container-high); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--on-surface-variant); font-size: 0.75rem; border: 1px solid var(--outline-variant); }
        .patient-name { font-weight: 600; color: var(--on-surface); }
        .date-cell { color: var(--outline); font-weight: 400; font-size: 0.8rem; }
        .diagnosis-text { font-weight: 600; color: var(--on-surface); }
        
        .conf-wrap { display: flex; align-items: center; gap: 8px; }
        .conf-bar-bg { flex: 1; min-width: 60px; height: 4px; background: var(--surface-container-high); border-radius: 2px; overflow: hidden; }
        .conf-bar { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
        .conf-text { font-size: 0.75rem; font-weight: 600; color: var(--on-surface-variant); min-width: 32px; }
        
        .grade-badge { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; border: 1px solid transparent; }
        
        .action-btns { display: flex; justify-content: flex-end; gap: 6px; }
        .icon-btn { background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: 6px; color: var(--outline); padding: 6px; cursor: pointer; display: flex; transition: all 0.2s; }
        .icon-btn:hover { color: var(--primary); border-color: var(--primary); }

        .empty-state { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--radius); }
        .empty-icon { font-size: 40px; opacity: 0.3; }
        .empty-state p { font-weight: 500; font-size: 0.95rem; color: var(--outline); }

        .loading-shimmer { height: 72px; background: var(--surface-container-lowest); border-radius: 12px; border: 1px solid var(--outline-variant); margin-bottom: 12px; }

        /* Modals */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: var(--surface-container-lowest); border-radius: 20px; padding: 32px; width: 100%; max-width: 480px; box-shadow: 0 20px 50px -12px rgba(15, 23, 42, 0.15); border: 1px solid var(--outline-variant); position: relative; max-height: 90vh; overflow-y: auto; }
        .modal-lg { max-width: 800px; padding: 40px; }
        
        .modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .modal-subtitle { font-size: 0.65rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .modal-header h3 { color: var(--on-surface); font-size: 1.25rem; font-weight: 700; margin: 0; }
        .modal-close { background: var(--surface-container-low); border: none; color: var(--outline); cursor: pointer; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .modal-close:hover { background: var(--error-container); color: var(--error); }

        .modal-error { display: flex; align-items: center; gap: 10px; background: var(--error-container); border: 1px solid var(--error-dim); color: var(--on-error-container); padding: 12px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; margin-bottom: 20px; }
        
        .modal-field { margin-bottom: 20px; }
        .modal-field label { display: block; color: var(--on-surface-variant); font-size: 0.75rem; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .modal-field input, .modal-field select, .modal-field textarea { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--outline-variant); background: var(--surface-container-low); color: var(--on-surface); font-size: 0.9rem; outline: none; transition: all 0.2s; font-family: inherit; box-sizing: border-box; resize: none; }
        .modal-field input:focus, .modal-field select:focus, .modal-field textarea:focus { border-color: var(--primary); background: var(--surface-container-lowest); }
        
        .upload-zone { border: 2px dashed var(--outline-variant); border-radius: 12px; padding: 32px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--surface-container-low); }
        .upload-zone:hover { border-color: var(--primary); background: var(--primary-container); }
        .upload-icon-wrap { width: 44px; height: 44px; border-radius: 10px; background: var(--surface-container-lowest); color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; border: 1px solid var(--outline-variant); }
        .upload-text { color: var(--on-surface-variant); font-size: 0.85rem; }
        .upload-text strong { color: var(--on-surface); font-weight: 600; }
        .upload-text span { display: block; font-size: 0.7rem; margin-top: 4px; color: var(--outline); }
        
        .upload-sel { display: flex; align-items: center; gap: 12px; text-align: left; }
        .file-badge { width: 36px; height: 36px; border-radius: 8px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; }
        .file-info { flex: 1; }
        .file-name { display: block; font-weight: 600; color: var(--on-surface); font-size: 0.88rem; }
        .file-size { font-size: 0.7rem; color: var(--outline); font-weight: 500; }
        .success-icon { color: #22c55e; }

        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
        .btn-submit { padding: 12px 24px; border-radius: 10px; border: none; background: var(--primary); color: white; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
        .btn-submit:hover:not(:disabled) { background: var(--primary-hover); }
        .btn-submit:disabled { opacity: 0.5; }

        /* Detail Modal */
        .detail-grid { display: grid; grid-template-columns: 340px 1fr; gap: 32px; }
        .scan-img-card { position: relative; border-radius: 12px; overflow: hidden; background: var(--surface-container-high); border: 1px solid var(--outline-variant); }
        .scan-img-card img { width: 100%; height: auto; display: block; }
        .img-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; background: linear-gradient(to top, rgba(0,0,0,0.5), transparent); }
        .img-id { font-size: 0.6rem; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 0.05em; font-family: monospace; }

        .result-main-card { background: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .res-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .res-label { font-size: 0.65rem; font-weight: 700; color: var(--outline); letter-spacing: 0.05em; }
        .res-date { font-size: 0.75rem; font-weight: 500; color: var(--on-surface-variant); }
        .res-value { font-size: 1.5rem; font-weight: 700; color: var(--on-surface); letter-spacing: -0.01em; margin-bottom: 16px; }
        
        .res-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 16px; border-top: 1px dashed var(--outline-variant); }
        .meta-label { display: block; font-size: 0.6rem; font-weight: 700; color: var(--outline); text-transform: uppercase; margin-bottom: 2px; }
        .meta-value { font-size: 0.95rem; font-weight: 700; color: var(--on-surface); }

        .ai-assessment { background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
        .ai-assessment h4 { display: flex; align-items: center; gap: 6px; color: #0369a1; font-size: 0.75rem; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; }
        .ai-assessment p { font-size: 0.85rem; color: #075985; line-height: 1.5; font-weight: 400; margin: 0; }

        .btn-save-notes { width: 100%; margin-top: 8px; padding: 12px; border-radius: 10px; border: none; background: var(--on-surface); color: white; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
        .btn-save-notes:hover { opacity: 0.9; }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(ScansPage, ["doctor"]);
