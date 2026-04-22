import { useEffect, useState } from "react";
import { withAuth, useAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getScans, ScanData, getScanImageUrl, exportScans, exportScansPdf } from "../../services/api";
import { FileText, X, Eye, Download, Printer, Info, CheckCircle2, AlertCircle, Calendar, Zap } from "lucide-react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../../components/AnimatedUI";

function PatientDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScan, setViewScan] = useState<ScanData | null>(null);
  const [selectedScans, setSelectedScans] = useState<number[]>([]);

  useEffect(() => {
    getScans().then((r) => setScans(r.scans)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const gradeColor = (g: number | null) => {
    const c = ["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444"];
    return g !== null && g >= 0 && g <= 4 ? c[g] : "#94a3b8";
  };

  const getSeverity = (g: number | null) => {
    const labels = ["Normal", "Doubtful", "Mild", "Moderate", "Severe"];
    return g !== null && g >= 0 && g <= 4 ? labels[g] : "Pending";
  };

  const urgencyProps = (u?: string) => {
    if (!u) return { color: "#64748b", bg: "#f1f5f9" };
    const l = u.toLowerCase();
    if (l.includes("critical")) return { color: "#ef4444", bg: "#fee2e2" };
    if (l.includes("high")) return { color: "#f97316", bg: "#ffedd5" };
    if (l.includes("moderate")) return { color: "#eab308", bg: "#fef9c3" };
    return { color: "#10b981", bg: "#dcfce7" };
  };

  return (
    <DashboardLayout title={`Welcome Back, ${user?.full_name?.split(' ')[0] || "Patient"}`}>
      {/* Info Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="info-banner"
      >
        <div className="info-banner-icon"><Info size={20} /></div>
        <div className="info-banner-content">
          <div className="info-banner-title">Medical Assistant</div>
          <div className="info-banner-desc">Your latest diagnostic reports are available below. Our AI provides an initial assessment which your doctor will review.</div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="stats-row">
        <MotionCard className="mini-stat" delay={0.1}>
          <div className="mini-stat-label">Total Scans</div>
          <div className="mini-stat-value">{scans.length}</div>
        </MotionCard>
        <MotionCard className="mini-stat" delay={0.2}>
          <div className="mini-stat-label">Needs Attention</div>
          <div className="mini-stat-value" style={{ color: "#ef4444" }}>{scans.filter(s => s.grade_index !== null && s.grade_index >= 3).length}</div>
        </MotionCard>
        <MotionCard className="mini-stat" delay={0.3}>
          <div className="mini-stat-label">Normal Results</div>
          <div className="mini-stat-value" style={{ color: "#10b981" }}>{scans.filter(s => s.grade_index !== null && s.grade_index <= 1).length}</div>
        </MotionCard>
      </div>

      {/* Section Header */}
      <div className="section-header">
        <div className="header-left">
          <h3>Your Reports</h3>
          <span className="count-pill">{scans.length} Total</span>
        </div>
        
        {scans.length > 0 && (
          <div className="header-actions">
            <MotionButton className="btn-secondary" onClick={() => selectedScans.length === scans.length ? setSelectedScans([]) : setSelectedScans(scans.map(s => s.id))}>
              {selectedScans.length === scans.length ? "Deselect All" : "Select All"}
            </MotionButton>
            <div className="divider" />
            <MotionButton className="btn-action" onClick={() => exportScans(undefined, selectedScans)}>
              <Download size={16} />
              <span>Export CSV</span>
            </MotionButton>
            <MotionButton className="btn-action" onClick={() => {
               const toExport = scans.filter(s => selectedScans.length === 0 || selectedScans.includes(s.id));
               exportScansPdf(toExport, "Medical_Report_" + user?.full_name);
            }}>
               <Printer size={16} />
               <span>Print PDF</span>
            </MotionButton>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4].map(i => <div key={i} className="shimmer-card" />)}
        </div>
      ) : scans.length === 0 ? (
        <MotionCard className="empty-state-card">
          <div className="empty-icon">📂</div>
          <h4>No Reports Yet</h4>
          <p>Once you upload a scan or your doctor performs an analysis, your reports will appear here.</p>
          <MotionButton className="btn-primary" onClick={() => router.push("/patient/upload")}>
            Upload Your First Scan
          </MotionButton>
        </MotionCard>
      ) : (
        <div className="scan-grid">
          <AnimatePresence>
            {scans.map((scan, idx) => {
              const urgency = urgencyProps(scan.suggestions?.urgency);
              return (
                <MotionCard 
                  key={scan.id} 
                  className={`report-card ${selectedScans.includes(scan.id) ? 'selected' : ''}`}
                  onClick={() => setSelectedScans(p => p.includes(scan.id) ? p.filter(x => x !== scan.id) : [...p, scan.id])}
                  delay={0.1 * idx}
                >
                  <div className="report-header">
                    <div className="report-date">
                      <Calendar size={14} />
                      {new Date(scan.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                    <div className="grade-pill" style={{ background: `${gradeColor(scan.grade_index)}15`, color: gradeColor(scan.grade_index) }}>
                      {getSeverity(scan.grade_index)} {scan.grade_index !== null ? `(KL ${scan.grade_index})` : ""}
                    </div>
                  </div>
                  
                  <div className="report-body">
                    <h4 className="report-title">{scan.predicted_class || "Analysis in Progress"}</h4>
                    <div className="report-meta">
                      <div className="conf-bar-wrap">
                        <div className="conf-bar" style={{ width: `${(scan.confidence || 0) * 100}%`, background: gradeColor(scan.grade_index) }} />
                      </div>
                      <span>{((scan.confidence || 0) * 100).toFixed(0)}% Confidence</span>
                    </div>
                  </div>

                  {scan.suggestions?.urgency && (
                    <div className="urgency-tag" style={{ background: urgency.bg, color: urgency.color }}>
                      <Zap size={12} fill="currentColor" />
                      {scan.suggestions.urgency}
                    </div>
                  )}

                  <div className="report-footer">
                    <input 
                      type="checkbox" 
                      className="report-checkbox"
                      checked={selectedScans.includes(scan.id)} 
                      onChange={() => {}} // Handled by card click
                    />
                    <MotionButton 
                      className="btn-view" 
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setViewScan(scan); }}
                    >
                      <Eye size={16} />
                      View Details
                    </MotionButton>
                  </div>
                </MotionCard>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {viewScan && (
          <div className="modal-overlay" onClick={() => setViewScan(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <CheckCircle2 size={24} color="#10b981" />
                  <div>
                    <h3>Diagnostic Summary</h3>
                    <p>{new Date(viewScan.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                </div>
                <div className="modal-actions">
                  <MotionButton className="btn-icon" onClick={() => window.print()}><Printer size={18} /></MotionButton>
                  <MotionButton className="btn-icon close" onClick={() => setViewScan(null)}><X size={18} /></MotionButton>
                </div>
              </div>

              <div className="modal-body" id="printable-report">
                <div className="image-preview">
                  <img src={getScanImageUrl(viewScan.id)} alt="X-ray Scan" />
                  <div className="image-overlay">Reference ID: #{viewScan.id}</div>
                </div>

                <div className="metrics-grid">
                  <div className="metric">
                    <span className="label">Primary Diagnosis</span>
                    <span className="value">{viewScan.predicted_class || "Pending"}</span>
                  </div>
                  <div className="metric">
                    <span className="label">KL Severity Grade</span>
                    <span className="value" style={{ color: gradeColor(viewScan.grade_index) }}>
                      {getSeverity(viewScan.grade_index)} {viewScan.grade_index !== null ? `(KL ${viewScan.grade_index})` : "—"}
                    </span>
                  </div>
                </div>

                {viewScan.suggestions?.summary && (
                  <div className="report-section">
                    <h5>AI ASSESSMENT</h5>
                    <p className="summary-text">{viewScan.suggestions.summary}</p>
                    <ul className="rec-list">
                      {viewScan.suggestions.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {viewScan.notes && (
                  <div className="report-section secondary">
                    <h5>DOCTOR'S CLINICAL NOTES</h5>
                    <p className="notes-text">{viewScan.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .info-banner { display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px; background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 12px; margin-bottom: 24px; }
        .info-banner-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--surface-container-lowest); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: var(--shadow-soft); }
        .info-banner-title { color: #0369a1; font-weight: 700; font-size: 0.9rem; }
        .info-banner-desc { color: #075985; font-size: 0.82rem; margin-top: 2px; line-height: 1.4; opacity: 0.8; }

        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
        .mini-stat { text-align: center; padding: 16px; border: 1px solid var(--outline-variant); }
        .mini-stat-value { font-size: 1.75rem; font-weight: 700; color: var(--on-surface); letter-spacing: -0.02em; }
        .mini-stat-label { color: var(--outline); font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .header-left h3 { font-size: 1.15rem; font-weight: 700; color: var(--on-surface); margin: 0; }
        .count-pill { padding: 2px 10px; background: var(--surface-container-high); border-radius: 999px; font-size: 0.7rem; font-weight: 600; color: var(--on-surface-variant); }
        
        .header-actions { display: flex; align-items: center; gap: 10px; }
        .btn-secondary { background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); color: var(--on-surface-variant); padding: 8px 14px; font-size: 0.8rem; font-weight: 600; border-radius: 8px; }
        .btn-action { background: var(--surface-container-low); color: var(--on-surface); border: 1px solid var(--outline-variant); padding: 8px 14px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 8px; border-radius: 8px; }
        .divider { width: 1px; height: 18px; background: var(--outline-variant); margin: 0 4px; }

        .scan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .report-card { padding: 20px; cursor: pointer; border: 1px solid var(--outline-variant); transition: all 0.2s; position: relative; }
        .report-card.selected { border-color: var(--primary); background: #f0f9ff40; }
        
        .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .report-date { display: flex; align-items: center; gap: 6px; color: var(--outline); font-size: 0.75rem; font-weight: 500; }
        .grade-pill { padding: 2px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        
        .report-title { color: var(--on-surface); font-size: 1rem; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.01em; }
        .report-meta { display: flex; align-items: center; gap: 10px; color: var(--on-surface-variant); font-size: 0.75rem; font-weight: 500; }
        .conf-bar-wrap { flex: 1; height: 4px; background: var(--surface-container-high); border-radius: 2px; overflow: hidden; }
        .conf-bar { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
        
        .urgency-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; margin-top: 12px; }
        
        .report-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--outline-variant); }
        .report-checkbox { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid var(--outline); accent-color: var(--primary); }
        .btn-view { background: #f0f9ff; color: var(--primary); padding: 6px 12px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; border-radius: 6px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: var(--surface-container-lowest); border-radius: 20px; padding: 32px; width: 100%; max-width: 600px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.15); max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .modal-title-wrap { display: flex; gap: 12px; align-items: center; }
        .modal-title-wrap h3 { font-size: 1.25rem; font-weight: 700; color: var(--on-surface); margin: 0; }
        .modal-title-wrap p { color: var(--outline); font-size: 0.8rem; margin: 2px 0 0; font-weight: 500; }
        
        .btn-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--surface-container-low); border: none; color: var(--on-surface-variant); font-size: 0.9rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-icon:hover { background: var(--surface-container-high); color: var(--on-surface); }
        .btn-icon.close:hover { background: #fee2e2; color: #ef4444; }
        
        .image-preview { background: #0f172a; border-radius: 12px; overflow: hidden; position: relative; margin-bottom: 24px; }
        .image-preview img { width: 100%; height: auto; display: block; }
        .image-overlay { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.4); color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.65rem; font-family: monospace; }
        
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .metric { background: var(--surface-container-lowest); padding: 16px; border-radius: 12px; border: 1px solid var(--outline-variant); }
        .metric .label { display: block; font-size: 0.65rem; font-weight: 700; color: var(--outline); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .metric .value { font-size: 1.1rem; font-weight: 700; color: var(--on-surface); }
        
        .report-section { margin-bottom: 20px; padding: 20px; border-radius: 16px; background: #f0fdf440; border: 1px solid #dcfce7; }
        .report-section.secondary { background: #f0f9ff40; border-color: #e0f2fe; }
        .report-section h5 { color: #166534; font-size: 0.7rem; font-weight: 700; margin: 0 0 10px; letter-spacing: 0.05em; text-transform: uppercase; }
        .report-section.secondary h5 { color: #0369a1; }
        
        .summary-text { font-size: 0.95rem; font-weight: 600; color: var(--on-surface); line-height: 1.5; margin-bottom: 12px; }
        .rec-list { margin: 0; padding-left: 16px; color: var(--on-surface-variant); font-weight: 400; font-size: 0.85rem; }
        .rec-list li { margin-bottom: 6px; line-height: 1.4; }
        .notes-text { font-size: 0.9rem; color: var(--on-surface-variant); line-height: 1.5; font-weight: 400; }

        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(PatientDashboard, ["patient"]);
