import { useEffect, useState } from "react";
import { withAuth, useAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getPatients, getScans, PatientData, ScanData } from "../../services/api";
import { useRouter } from "next/router";
import { Users, ScanLine, Plus, ArrowRight, Activity, Clock, AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../../components/AnimatedUI";

function DoctorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPatients(), getScans()])
      .then(([pRes, sRes]) => { 
        setPatients(pRes.patients); 
        setScans(sRes.scans); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const gradeColor = (g: number | null) => {
    const colors = ["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444"];
    return g !== null && g >= 0 && g <= 4 ? colors[g] : "#94a3b8";
  };

  const getSeverity = (g: number | null) => {
    const labels = ["Normal", "Doubtful", "Mild", "Moderate", "Severe"];
    return g !== null && g >= 0 && g <= 4 ? labels[g] : "Pending";
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout title={`Good Morning, ${user?.full_name?.split(' ')[0] || "Doctor"}`}>
      {loading ? (
        <div className="loading-grid">
          {[1,2,3].map(i => <div key={i} className="loading-shimmer" />)}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="stats-grid"
            style={{ display: 'flex', flexDirection: 'row', gap: '16px', marginBottom: '32px', width: '100%', flexWrap: 'nowrap' }}
          >
            <motion.div variants={item} className="stat-card" onClick={() => router.push("/doctor/patients")}>
              <div className="stat-icon" style={{ background: "#f0f9ff", color: "#0ea5e9" }}><Users size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{patients.length}</div>
                <div className="stat-label">Active Patients</div>
              </div>
            </motion.div>
            
            <motion.div variants={item} className="stat-card" onClick={() => router.push("/doctor/scans")}>
              <div className="stat-icon" style={{ background: "#f5f3ff", color: "#8b5cf6" }}><ScanLine size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{scans.length}</div>
                <div className="stat-label">Total Scans</div>
              </div>
            </motion.div>
            
            <motion.div variants={item} className="stat-card">
              <div className="stat-icon" style={{ background: "#fff7ed", color: "#f59e0b" }}><Activity size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{scans.filter(s => s.grade_index !== null && s.grade_index >= 3).length}</div>
                <div className="stat-label">Critical Cases</div>
              </div>
            </motion.div>
          </motion.div>

            <div className="actions-row">
              <MotionButton className="action-btn-small primary" onClick={() => router.push("/doctor/patients?add=1")}>
                <Plus size={18} />
                <span>New Patient</span>
              </MotionButton>
              
              <MotionButton className="action-btn-small secondary" onClick={() => router.push("/doctor/scans?upload=1")}>
                <Upload size={18} />
                <span>Upload Scan</span>
              </MotionButton>
            </div>

            <div className="section-header" style={{ marginTop: '32px' }}>
              <h2>Recent Diagnostics</h2>
              <button className="view-all" onClick={() => router.push("/doctor/scans")}>View all scans <ArrowRight size={14} /></button>
            </div>
            
            <MotionCard className="table-card">
              {scans.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📂</div>
                  <p>No diagnostics found. Start by uploading a scan.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Patient</th>
                        <th style={{ width: '15%' }}>Date</th>
                        <th style={{ width: '20%' }}>Diagnosis</th>
                        <th style={{ width: '25%' }}>Severity Grade</th>
                        <th style={{ width: '15%' }}>Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scans.slice(0, 6).map((scan, idx) => (
                        <motion.tr 
                          key={scan.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + (idx * 0.05) }}
                          onClick={() => router.push(`/doctor/scans?view=${scan.id}`)} 
                          className="table-row"
                        >
                          <td>
                            <div className="patient-cell">
                              <div className="patient-avatar">{scan.patient_name?.charAt(0)}</div>
                              <span>{scan.patient_name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              <Clock size={14} />
                              {new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </td>
                          <td>
                            <div className="diagnosis-cell">
                              {scan.predicted_class || "Analysis..."}
                            </div>
                          </td>
                          <td>
                            <div className="severity-cell">
                              <span className="grade-badge" style={{ background: `${gradeColor(scan.grade_index)}15`, color: gradeColor(scan.grade_index) }}>
                                {getSeverity(scan.grade_index)}
                                <span style={{ opacity: 0.6, fontSize: '0.7rem', marginLeft: '6px' }}>
                                  ({scan.grade_index !== null ? `KL ${scan.grade_index}` : "..."})
                                </span>
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="confidence-pill" style={{ background: `${gradeColor(scan.grade_index)}10`, color: gradeColor(scan.grade_index) }}>
                              {scan.confidence ? `${(scan.confidence * 100).toFixed(0)}% Match` : "N/A"}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </MotionCard>
        </>
      )}

      <style jsx>{`
        .stats-grid { display: flex !important; flex-wrap: nowrap !important; gap: 16px; margin-bottom: 32px; width: 100%; overflow-x: visible; }
        .stats-grid > * { flex: 1; min-width: 0; }
        @media (max-width: 639px) { .stats-grid { gap: 10px; } .stat-card { padding: 12px; gap: 8px; } .stat-icon { width: 36px; height: 36px; } .stat-value { font-size: 1.25rem; } .stat-label { font-size: 0.6rem; } }
        
        .stat-card { background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: 16px; padding: 24px; cursor: pointer; display: flex; align-items: center; gap: 20px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .stat-card:hover { transform: translateY(-3px); border-color: var(--primary); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); background: var(--surface-container-low); }
        .stat-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 2px 4px 0 rgba(255, 255, 255, 0.3); }
        .stat-value { font-size: 2rem; font-weight: 800; color: var(--on-surface); letter-spacing: -0.02em; line-height: 1; font-family: var(--headline-font, var(--display-font, serif)); }
        .stat-label { color: var(--on-surface-variant); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px; }

        .actions-row { display: flex; gap: 16px; margin-bottom: 24px; }
        .action-btn-small { flex: 1; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 18px; border-radius: 18px; font-weight: 700; font-size: 1rem; border: none; transition: all 0.2s; cursor: pointer; }
        .action-btn-small.primary { background: linear-gradient(135deg, var(--primary), var(--primary-dim)); color: var(--on-primary); box-shadow: 0 4px 12px -2px var(--primary-dim); }
        .action-btn-small.primary:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 8px 20px -4px var(--primary-dim); }
        .action-btn-small.secondary { background: var(--surface-container-lowest); color: var(--on-surface); border: 2px solid var(--outline-variant); }
        .action-btn-small.secondary:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 8px 20px -4px rgba(0,0,0,0.05); }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-header h2 { color: var(--on-surface); font-size: 1.25rem; font-weight: 800; margin: 0; letter-spacing: -0.01em; font-family: var(--headline-font, serif); }
        .view-all { display: flex; align-items: center; gap: 6px; background: none; border: none; color: var(--primary); font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: color 0.2s; padding: 4px 8px; border-radius: 6px; }
        .view-all:hover { color: var(--primary-dim); background: var(--surface-container-low); }

        .table-card { padding: 0; border: 1px solid var(--outline-variant); overflow: hidden; border-radius: 20px; background: var(--surface-container-lowest); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .table-wrap { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 18px 24px; color: var(--on-surface-variant); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid var(--outline-variant); background: var(--surface-container-low); }
        td { padding: 18px 24px; color: var(--on-surface); font-size: 0.95rem; border-bottom: 1px solid var(--outline-variant); transition: all 0.2s; }
        .table-row { cursor: pointer; }
        .table-row:hover td { background: var(--surface-container-low); }
        .table-row:last-child td { border-bottom: none; }
        
        .patient-cell { display: flex; align-items: center; gap: 14px; }
        .patient-avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--primary-container); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--on-primary-container); font-size: 0.85rem; border: 1px solid var(--outline-variant); }
        .patient-cell span { font-weight: 700; color: var(--on-surface); }
        
        .date-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--on-surface-variant); }
        .confidence-pill { display: inline-flex; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; border: 1px solid currentColor; }
        .grade-badge { display: inline-flex; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; border: 1px solid currentColor; }

        .loading-shimmer { height: 120px; background: var(--surface-container-lowest); border-radius: 16px; border: 1px solid var(--outline-variant); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .loading-grid { display: flex; gap: 16px; margin-bottom: 32px; }
        .loading-grid > * { flex: 1; }

        .empty-state { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-icon { font-size: 40px; opacity: 0.4; filter: grayscale(1); }
        .empty-state p { font-weight: 600; color: var(--on-surface-variant); font-size: 1rem; margin: 0; }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(DoctorDashboard, ["doctor"]);
