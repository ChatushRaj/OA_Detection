import { useState, useRef, useEffect, useCallback } from "react";
import { withAuth, useAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getPatients, uploadScan, PatientData, ScanData } from "../../services/api";
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Sparkles, Zap, ChevronRight, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../../components/AnimatedUI";

function PatientUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ScanData | null>(null);
  const [error, setError] = useState("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPatientInfo = useCallback(async () => {
    try {
      const r = await getPatients();
      if (r.patients.length > 0) setPatientId(r.patients[0].id);
    } catch (err) {
      console.error("Failed to sync patient ID:", err);
    }
  }, []);

  useEffect(() => {
    fetchPatientInfo();
  }, [fetchPatientInfo]);

  const handleFileChange = (f: File | null) => {
    setFile(f);
    setResult(null);
    setError("");
    if (f) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "image/jpeg" || f.type === "image/png")) handleFileChange(f);
  };

  const handleUpload = async () => {
    if (!file || !patientId) { setError("No file selected or patient record not found."); return; }
    setUploading(true);
    setError("");
    try {
      const res = await uploadScan(patientId, file);
      setResult(res.scan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis synchronization failed");
    } finally {
      setUploading(false);
    }
  };

  const gradeColor = (g: number | null) => {
    const c = ["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444"];
    return g !== null && g >= 0 && g <= 4 ? c[g] : "#94a3b8";
  };

  return (
    <DashboardLayout title="Deep Learning Analysis">
      <div className="upload-container">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="upload-grid">
          {/* Action Column */}
          <div className="action-col">
            <MotionCard className="upload-card">
              <div className="card-header">
                <div className="header-icon-wrap"><Upload size={20} /></div>
                <div>
                  <h3>Provision Analysis</h3>
                  <p>Upload a standard knee X-ray for instant segmentation and grading.</p>
                </div>
              </div>

              <div
                className={`drop-zone ${file ? "has-file" : ""} ${uploading ? "uploading" : ""}`}
                onClick={() => !uploading && fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <AnimatePresence mode="wait">
                  {preview ? (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="preview-wrap">
                      <img src={preview} alt="Scan Preview" className="preview-img" />
                      <div className="preview-overlay">
                        <Sparkles size={24} className="sparkle-icon" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="drop-placeholder">
                      <div className="upload-illustration">
                        <ImageIcon size={48} strokeWidth={1} />
                        <div className="plus-badge"><RefreshCw size={14} /></div>
                      </div>
                      <div className="text-group">
                        <span className="main-text">Repository Dropzone</span>
                        <span className="sub-text">Drag & drop DICOM/JPG or Click to Browse</span>
                        <div className="formats">SUPPORTED: PNG, JPEG, WEBP</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" hidden onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
              </div>

              {file && !uploading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="file-strip">
                  <div className="strip-info">
                    <ImageIcon size={16} />
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button className="remove-file" onClick={() => handleFileChange(null)}><X size={16} /></button>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="err-banner">
                  <AlertCircle size={18} /> <span>{error}</span>
                </motion.div>
              )}

              <MotionButton
                className="btn-trigger"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={20} className="spin" />
                    <span>Processing Neural Networks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Initialize AI Diagnostic</span>
                  </>
                )}
              </MotionButton>
            </MotionCard>

            <div className="guidelines">
              <h4>Submission Criteria</h4>
              <ul>
                <li>Ensure the view is weight-bearing AP</li>
                <li>Avoid excessive metallic artifacts</li>
                <li>Joint space must be clearly visible</li>
              </ul>
            </div>
          </div>

          {/* Result Column */}
          <div className="result-col">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <MotionCard className="result-card">
                    <div className="result-hero">
                      <div className="status-badge">
                        <CheckCircle size={16} /> Analysis Synchronized
                      </div>
                      <h3>Report Summary</h3>
                    </div>

                    <div className="metric-row">
                      <div className="metric">
                        <span className="label">Diagnosis</span>
                        <span className="value">{result.predicted_class || "Undetermined"}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Severity Grade</span>
                        <span className="value" style={{ color: gradeColor(result.grade_index) }}>
                          {result.grade_index !== null ? `KL Grade ${result.grade_index}` : "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="confidence-section">
                      <div className="conf-header">
                        <span className="label">Neural Confidence</span>
                        <span className="val">{result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : "0%"}</span>
                      </div>
                      <div className="bar-track">
                        <motion.div 
                          className="bar-fill" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(result.confidence || 0) * 100}%` }}
                          style={{ background: gradeColor(result.grade_index) }}
                        />
                      </div>
                    </div>

                    {result.suggestions?.urgency && (
                      <div className="urgency-callout">
                        <Zap size={18} />
                        <div>
                          <span className="u-label">CLINICAL URGENCY</span>
                          <span className="u-val">{result.suggestions.urgency}</span>
                        </div>
                      </div>
                    )}

                    <div className="assessment-rich">
                      <div className="assess-label">AI CLINICAL FINDINGS</div>
                      <p>{result.suggestions?.summary || "Clinical findings are being finalized by the system."}</p>
                      
                      <div className="rec-group">
                        {result.suggestions?.recommendations?.map((r, i) => (
                          <div key={i} className="rec-item">
                            <ChevronRight size={14} />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <MotionButton className="btn-secondary-outline" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                      Analyze Another Acquisition
                    </MotionButton>
                  </MotionCard>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="result-placeholder">
                  <div className="placeholder-content">
                    <div className="p-icon"><Sparkles size={40} /></div>
                    <h4>Diagnostic Output</h4>
                    <p>Complete the upload on the left to generate a real-time AI diagnostic report.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .upload-container { max-width: 1000px; margin: 0 auto; }
        .upload-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
        
        .upload-card { padding: 32px; border: 1px solid var(--outline-variant); overflow: hidden; }
        .card-header { display: flex; align-items: start; gap: 16px; margin-bottom: 24px; }
        .header-icon-wrap { width: 40px; height: 40px; border-radius: 10px; background: #f0f9ff; color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #e0f2fe; }
        .card-header h3 { font-size: 1.2rem; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
        .card-header p { color: var(--outline); font-size: 0.85rem; margin: 0; line-height: 1.4; }

        .drop-zone { border: 1px dashed var(--outline-variant); border-radius: 16px; padding: 10px; text-align: center; cursor: pointer; transition: all 0.2s; min-height: 240px; display: flex; align-items: center; justify-content: center; background: var(--surface-container-low); }
        .drop-zone:hover { border-color: var(--primary); background: var(--primary-container); }
        .drop-zone.has-file { border-style: solid; border-color: var(--outline-variant); background: var(--surface-container-lowest); }
        .drop-zone.uploading { pointer-events: none; opacity: 0.7; }

        .preview-wrap { width: 100%; height: 220px; position: relative; border-radius: 12px; overflow: hidden; background: var(--surface-container-high); border: 1px solid var(--outline-variant); }
        .preview-img { width: 100%; height: 100%; object-fit: contain; }
        .preview-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
        .preview-wrap:hover .preview-overlay { opacity: 1; }
        .sparkle-icon { color: white; filter: drop-shadow(0 0 8px rgba(255,255,255,0.4)); }

        .drop-placeholder { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .upload-illustration { position: relative; color: var(--outline); transition: transform 0.2s; }
        .plus-badge { position: absolute; bottom: -2px; right: -2px; width: 20px; height: 20px; background: var(--primary); color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 2px solid white; }
        
        .text-group { display: flex; flex-direction: column; gap: 2px; }
        .main-text { font-size: 0.95rem; font-weight: 600; color: var(--on-surface); }
        .sub-text { font-size: 0.8rem; font-weight: 500; color: var(--outline); }
        .formats { font-size: 0.65rem; font-weight: 700; color: var(--outline); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px; opacity: 0.6; }

        .file-strip { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface-container-low); border-radius: 10px; border: 1px solid var(--outline-variant); margin-top: 16px; }
        .strip-info { display: flex; align-items: center; gap: 10px; color: var(--on-surface-variant); font-weight: 600; font-size: 0.8rem; }
        .file-name { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-size { color: var(--outline); font-weight: 400; font-size: 0.75rem; }
        .remove-file { background: none; border: none; color: var(--outline); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s; }
        .remove-file:hover { background: #fee2e2; color: #ef4444; }

        .err-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; font-size: 0.85rem; font-weight: 600; margin-top: 12px; }

        .btn-trigger { width: 100%; margin-top: 24px; padding: 14px; border-radius: 12px; border: none; background: var(--primary); color: white; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; }
        .btn-trigger:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
        .btn-trigger:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .guidelines { margin-top: 24px; padding: 20px; background: var(--surface-container-low); border-radius: 12px; border: 1px solid var(--outline-variant); }
        .guidelines h4 { font-size: 0.75rem; font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; }
        .guidelines ul { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 8px; }
        .guidelines li { color: var(--outline); font-size: 0.85rem; font-weight: 400; line-height: 1.4; }

        .result-card { padding: 24px; border: 1px solid #dcfce7; background: #ffffff; }
        .result-hero { margin-bottom: 20px; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #f0fdf4; color: #166534; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; border: 1px solid #dcfce7; }
        .result-hero h3 { font-size: 1.15rem; font-weight: 700; color: var(--on-surface); margin: 0; }

        .metric-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .metric { background: var(--surface-container-low); padding: 14px; border-radius: 12px; border: 1px solid var(--outline-variant); }
        .metric .label { display: block; font-size: 0.65rem; font-weight: 700; color: var(--outline); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .metric .value { font-size: 1rem; font-weight: 700; color: var(--on-surface); }

        .confidence-section { margin-bottom: 24px; }
        .conf-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .conf-header .label { font-size: 0.75rem; font-weight: 600; color: var(--on-surface-variant); }
        .conf-header .val { font-size: 0.85rem; font-weight: 700; color: var(--on-surface); }
        .bar-track { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 3px; }

        .urgency-callout { display: flex; align-items: center; gap: 12px; padding: 14px; background: #fffdf2; border: 1px solid #fef3c7; border-radius: 12px; color: #92400e; margin-bottom: 24px; }
        .u-label { display: block; font-size: 0.6rem; font-weight: 800; opacity: 0.8; letter-spacing: 0.05em; margin-bottom: 2px; }
        .u-val { font-size: 0.9rem; font-weight: 700; }

        .assessment-rich { background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
        .assess-label { font-size: 0.65rem; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
        .assessment-rich p { color: #075985; font-size: 0.88rem; font-weight: 500; line-height: 1.5; margin: 0 0 16px; }
        .rec-group { display: flex; flex-direction: column; gap: 8px; }
        .rec-item { display: flex; align-items: center; gap: 8px; color: #0369a1; font-weight: 600; font-size: 0.8rem; }

        .btn-secondary-outline { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
        .btn-secondary-outline:hover { border-color: var(--primary); color: var(--primary); background: #f0f9ff; }

        .result-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; padding: 32px; background: var(--surface-container-low); border: 1px dashed var(--outline-variant); border-radius: 20px; }
        .placeholder-content { text-align: center; color: var(--outline); }
        .p-icon { width: 64px; height: 64px; background: var(--surface-container-lowest); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid var(--outline-variant); color: var(--outline); }
        .placeholder-content h4 { color: var(--on-surface-variant); font-size: 1rem; font-weight: 700; margin: 0 0 8px; }
        .placeholder-content p { font-size: 0.85rem; font-weight: 400; line-height: 1.4; max-width: 200px; margin: 0 auto; }

        @media (max-width: 900px) {
          .upload-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(PatientUpload, ["patient"]);
