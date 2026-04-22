import { useEffect, useState } from "react";
import { withAuth } from "../../components/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { getAuditLogs, AuditLogData } from "../../services/api";
import { Search, Clock, User, Shield, Activity, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard } from "../../components/AnimatedUI";

function LogsPage() {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAuditLogs(500).then((r) => setLogs(r.logs)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) =>
    l.user_name.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.resource || "").toLowerCase().includes(search.toLowerCase())
  );

  const getActionClass = (action: string) => {
    if (action.includes("DELETE")) return "delete";
    if (action.includes("CREATE") || action.includes("UPLOAD")) return "create";
    if (action.includes("UPDATE")) return "update";
    if (action.includes("LOGIN")) return "login";
    return "default";
  };

  return (
    <DashboardLayout title="System Audit Logs">
      <div className="toolbar">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="search-wrap"
        >
          <Search size={18} />
          <input placeholder="Search logs by user, action, or resource..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </motion.div>
        
        <div className="log-stats">
          <div className="stat-pill">
            <Activity size={14} />
            <span>{filtered.length} Activity Records</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-shimmer">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="shimmer-row" />)}
        </div>
      ) : (
        <MotionCard className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Identity</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Network Address</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((l, idx) => (
                    <motion.tr 
                      key={l.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    >
                      <td className="ts-cell">
                        <Clock size={12} />
                        <span>{new Date(l.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <div className="user-info">
                          <div className="user-icon"><User size={14} /></div>
                          <span className="user-name">{l.user_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`action-badge ${getActionClass(l.action)}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="resource-cell">
                        <Terminal size={12} />
                        <span>{l.resource || "—"}</span>
                      </td>
                      <td className="ip-cell">{l.ip_address || "local"}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <Search size={40} />
                <p>No log entries found for your current filter.</p>
              </div>
            )}
          </div>
        </MotionCard>
      )}

      <style jsx>{`
        .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 32px; border-bottom: 1px solid var(--outline-variant); padding-bottom: 20px; }
        .search-wrap { display: flex; align-items: center; gap: 12px; background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 10px 16px; flex: 1; max-width: 460px; color: var(--outline); transition: all 0.2s; }
        .search-wrap:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-container); color: var(--primary); }
        .search-wrap input { background: none; border: none; outline: none; color: var(--on-surface); font-size: 0.9rem; flex: 1; font-family: inherit; }
        
        .stat-pill { display: flex; align-items: center; gap: 8px; background: var(--surface-container-low); color: var(--on-surface); padding: 8px 16px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--outline-variant); }

        .table-card { padding: 0; border: 1px solid var(--outline-variant); overflow: hidden; border-radius: var(--radius); }
        .table-wrap { width: 100%; border-radius: var(--radius); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px 20px; color: var(--on-surface-variant); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--outline-variant); background: var(--surface-container-low); }
        td { padding: 14px 20px; color: var(--on-surface-variant); font-size: 0.88rem; border-bottom: 1px solid var(--outline-variant); transition: background 0.2s; }
        
        tr:hover td { background: var(--surface-container-highest); }
        
        .ts-cell { display: flex; align-items: center; gap: 8px; color: var(--outline); font-weight: 400; font-size: 0.825rem; }
        
        .user-info { display: flex; align-items: center; gap: 10px; }
        .user-icon { width: 24px; height: 24px; border-radius: 6px; background: var(--surface-container); display: flex; align-items: center; justify-content: center; color: var(--on-surface-variant); border: 1px solid var(--outline-variant); }
        .user-name { font-weight: 600; color: var(--on-surface); }
        
        .action-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 6px; font-size: 0.725rem; font-weight: 600; text-transform: uppercase; border: 1px solid transparent; letter-spacing: 0.02em; }
        .action-badge.delete { background: var(--error-container); color: var(--on-error-container); border-color: var(--error); border-opacity: 0.2; }
        .action-badge.create { background: var(--primary-container); color: var(--on-primary-container); border-color: var(--primary); }
        .action-badge.update { background: var(--secondary-container); color: var(--on-secondary-container); border-color: var(--secondary); }
        .action-badge.login { background: var(--tertiary-container); color: var(--on-tertiary-container); border-color: var(--tertiary); }
        .action-badge.default { background: var(--surface-container-high); color: var(--on-surface-variant); border-color: var(--outline-variant); }
        
        .resource-cell { display: flex; align-items: center; gap: 8px; color: var(--on-surface-variant); font-weight: 500; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
        
        .ip-cell { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: var(--outline); }
        
        .empty-state { text-align: center; color: var(--on-surface-variant); padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .empty-state p { font-weight: 600; font-size: 0.95rem; }

        .loading-shimmer { display: flex; flex-direction: column; gap: 12px; }
        .shimmer-row { height: 60px; background: var(--surface-container-lowest); border-radius: 12px; border: 1px solid var(--outline-variant); }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(LogsPage, ["admin"]);
