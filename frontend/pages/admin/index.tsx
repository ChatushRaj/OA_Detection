import { useEffect, useState, useCallback } from "react";
import { withAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getStats, getAuditLogs, StatsData, AuditLogData } from "../../services/api";
import { useRouter } from "next/router";
import { Users, ScanLine, ShieldCheck, ClipboardList, Activity, UserPlus, ArrowRight, Zap, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard, MotionButton } from "../../components/AnimatedUI";

function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([getStats(), getAuditLogs(10)]);
      setStats(sRes.stats);
      setLogs(lRes.logs);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = stats ? [
    { label: "Total Platform Users", value: stats.total_users, icon: Users, color: "var(--primary)", trend: "+12%" },
    { label: "Active Doctors", value: stats.total_doctors, icon: Activity, color: "var(--secondary)", trend: "Stable" },
    { label: "Registered Patients", value: stats.total_patients, icon: UserPlus, color: "var(--tertiary)", trend: "+5%" },
    { label: "Clinical Records", value: stats.total_patient_records, icon: ClipboardList, color: "var(--primary-dim)", trend: "+8%" },
    { label: "Processed Scans", value: stats.total_scans, icon: ScanLine, color: "var(--secondary-dim)", trend: "+24%" },
    { label: "Security Logs", value: stats.total_logs, icon: ShieldCheck, color: "var(--outline)", trend: "Live" },
  ] : [];

  return (
    <DashboardLayout title="System Administration">
      {loading ? (
        <div className="loading-state">
          <div className="shimmer-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="shimmer-card" />)}
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="dashboard-content">
          <div className="stats-grid">
            {statCards.map((s, idx) => {
              const Icon = s.icon;
              return (
                <MotionCard key={s.label} className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrap" style={{ background: s.color === 'var(--outline)' ? 'var(--surface-container-high)' : `color-mix(in srgb, ${s.color}, transparent 90%)`, color: s.color }}>
                      <Icon size={20} />
                    </div>
                    <span className="stat-trend" style={{ color: s.color }}>
                      {s.trend.startsWith('+') ? <TrendingUp size={12} /> : <Zap size={12} />}
                      {s.trend}
                    </span>
                  </div>
                  <div className="stat-value">{s.value.toLocaleString()}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-progress-bg"><div className="stat-progress" style={{ width: '65%', background: s.color }} /></div>
                </MotionCard>
              );
            })}
          </div>

          <div className="actions-section">
            <div className="section-title-wrap">
              <Sparkles size={18} className="title-icon" />
              <h3>Administrative Quick Actions</h3>
            </div>
            <div className="actions-grid">
              {[
                { label: "Manage Patients", icon: Users, path: "/admin/patients", gradient: "linear-gradient(135deg, var(--primary), var(--primary-dim))" },
                { label: "Review All Scans", icon: ScanLine, path: "/admin/scans", gradient: "linear-gradient(135deg, var(--secondary), var(--secondary-dim))" },
                { label: "System Users", icon: UserPlus, path: "/admin/users", gradient: "linear-gradient(135deg, var(--tertiary), var(--tertiary-dim))" },
                { label: "Security Audit", icon: ClipboardList, path: "/admin/logs", gradient: "linear-gradient(135deg, var(--outline), var(--outline-variant))" },
              ].map((act) => (
                <MotionButton key={act.label} className="act-card" onClick={() => router.push(act.path)}>
                  <div className="act-icon-wrap" style={{ background: act.gradient }}>
                    <act.icon size={20} />
                  </div>
                  <span className="act-label">{act.label}</span>
                  <ArrowRight size={16} className="act-arrow" />
                </MotionButton>
              ))}
            </div>
          </div>

          <div className="activity-section">
            <div className="section-header">
              <div className="title-group">
                <h3>Real-time Platform Activity</h3>
                <p>Monitoring latest security and operational events</p>
              </div>
              <MotionButton className="btn-view-all" onClick={() => router.push("/admin/logs")}>
                <span>Access Audit Vault</span>
                <ArrowRight size={16} />
              </MotionButton>
            </div>

            <MotionCard className="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Initiator</th>
                      <th>Operational Event</th>
                      <th>Target Resource</th>
                      <th style={{ textAlign: "right" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{l.user_name?.charAt(0)}</div>
                            <span className="user-name">{l.user_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`action-badge ${l.action.toLowerCase()}`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="resource-cell">{l.resource || "System General"}</td>
                        <td className="time-cell">
                          {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="date-sub"> / {new Date(l.timestamp).toLocaleDateString()}</span>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="empty-row">No documented activity found in current period</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </MotionCard>
          </div>
        </motion.div>
      )}

      <style jsx>{`
        .dashboard-content { animation: fadeIn 0.5s ease-out; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 40px; }
        .stat-card { padding: 24px; border: 1px solid var(--outline-variant); display: flex; flex-direction: column; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .stat-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.05); }
        
        .stat-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .stat-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .stat-trend { display: flex; align-items: center; gap: 4px; font-size: 0.725rem; font-weight: 600; background: var(--surface-container); padding: 4px 10px; border-radius: 8px; border: 1px solid var(--outline-variant); }
        
        .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--on-surface); letter-spacing: -0.025em; line-height: 1; margin-bottom: 6px; }
        .stat-label { color: var(--on-surface-variant); font-size: 0.85rem; font-weight: 500; margin-bottom: 16px; }
        
        .stat-progress-bg { height: 4px; background: var(--surface-container-high); border-radius: 999px; overflow: hidden; }
        .stat-progress { height: 100%; border-radius: 999px; opacity: 0.9; }

        .actions-section { margin-bottom: 48px; }
        .section-title-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--outline-variant); padding-bottom: 12px; }
        .title-icon { color: var(--primary); }
        .section-title-wrap h3 { color: var(--on-surface); font-size: 1rem; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .actions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .act-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: var(--radius); border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); cursor: pointer; transition: all 0.2s; text-align: left; }
        .act-card:hover { border-color: var(--primary); background: var(--surface-container-low); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .act-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; }
        .act-label { flex: 1; font-weight: 600; color: var(--on-surface); font-size: 0.95rem; }
        .act-arrow { color: var(--outline); transition: all 0.2s; opacity: 0.5; }
        .act-card:hover .act-arrow { color: var(--primary); transform: translateX(3px); opacity: 1; }

        .activity-section { }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid var(--outline-variant); padding-bottom: 16px; }
        .title-group h3 { color: var(--on-surface); font-size: 1.15rem; font-weight: 700; margin: 0 0 4px; letter-spacing: -0.01em; }
        .title-group p { color: var(--on-surface-variant); font-size: 0.85rem; font-weight: 400; margin: 0; }
        
        .btn-view-all { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border: 1px solid var(--outline-variant); border-radius: 10px; background: var(--surface-container-lowest); color: var(--on-surface-variant); font-weight: 600; font-size: 0.825rem; cursor: pointer; transition: all 0.2s; }
        .btn-view-all:hover { border-color: var(--primary); color: var(--primary); background: var(--surface-container-low); }

        .table-card { padding: 0; border: 1px solid var(--outline-variant); overflow: hidden; border-radius: var(--radius); }
        .table-wrap { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 600px; }
        th { text-align: left; padding: 16px 24px; color: var(--on-surface-variant); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--outline-variant); background: var(--surface-container-low); }
        td { padding: 16px 24px; color: var(--on-surface); font-size: 0.9rem; border-bottom: 1px solid var(--outline-variant); vertical-align: middle; }
        
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: var(--surface-container-highest); }

        .user-cell { display: flex; align-items: center; gap: 12px; }
        .user-avatar { width: 32px; height: 32px; border-radius: 8px; background: var(--surface-container); color: var(--on-surface-variant); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.8rem; border: 1px solid var(--outline-variant); }
        .user-name { font-weight: 600; color: var(--on-surface); }
        
        .action-badge { display: inline-flex; padding: 3px 10px; border-radius: 6px; font-size: 0.725rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; border: 1px solid transparent; }
        .action-badge.create { background: var(--primary-container); color: var(--on-primary-container); border-color: var(--primary); }
        .action-badge.update { background: var(--secondary-container); color: var(--on-secondary-container); border-color: var(--secondary); }
        .action-badge.delete { background: var(--error-container); color: var(--on-error-container); border-color: var(--error); }
        .action-badge.login { background: var(--tertiary-container); color: var(--on-tertiary-container); border-color: var(--tertiary); }
        
        .resource-cell { font-family: 'Inter', sans-serif; font-size: 0.85rem; color: var(--on-surface-variant); }
        .time-cell { text-align: right; font-weight: 500; color: var(--on-surface-variant); font-size: 0.85rem; }
        .date-sub { color: var(--outline); font-size: 0.75rem; font-weight: 400; }
        
        .empty-row { text-align: center; color: var(--outline); padding: 48px !important; font-size: 0.9rem; }

        .loading-state { padding: 8px 0; }
        .shimmer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .shimmer-card { height: 160px; background: var(--surface-container-lowest); border-radius: var(--radius); border: 1px solid var(--outline-variant); }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(AdminDashboard, ["admin"]);
