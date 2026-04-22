import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "../components/AuthContext";
import { RefreshCw } from "lucide-react";
import { AnimatedShapes } from "../components/AnimatedUI";

export default function LoginPage() {
  const { login, isAuthenticated, user: authUser } = useAuth();
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState("doctor");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      const dashboardMap: Record<string, string> = {
        doctor: "/doctor",
        patient: "/patient",
        admin: "/admin",
      };
      router.replace(dashboardMap[authUser.role] || "/");
    }
  }, [isAuthenticated, authUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | OA Detection Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main className="min-h-screen hero-gradient flex flex-col md:flex-row items-center justify-center p-6 md:p-12 relative overflow-x-hidden text-on-surface font-body selection:bg-primary/30">
        
        {/* Animated Background UI */}
        <div className="absolute inset-0 z-0">
           <AnimatedShapes />
        </div>

        <div className="z-10 w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mx-auto">
          {/* Left Editorial Side */}
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-lg text-2xl">
                🩺
              </div>
              <span className="font-headline text-2xl font-bold tracking-tight text-primary">OA Detection</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-headline text-5xl md:text-6xl text-on-surface leading-[1.1] font-bold tracking-tight">
                Welcome to <br /> <span className="text-primary italic">OA Detection Portal</span>
              </h1>
              <p className="font-headline text-xl md:text-2xl text-on-surface-variant font-light max-w-md">
                AI-Powered Osteoarthritis Detection & Severity Grading.
              </p>
            </div>
            
          </div>

          {/* Right Login Card */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="glass-panel ambient-shadow p-8 md:p-12 rounded-[2rem] w-full max-w-[520px] space-y-10 relative overflow-hidden ghost-border">
              {/* Role Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Identify your role</p>
                  {error && <p className="text-xs text-error font-bold">{error}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {[
                    { id: 'doctor', icon: 'stethoscope', label: 'Doctor' },
                    { id: 'patient', icon: 'person', label: 'Patient' },
                    { id: 'admin', icon: 'admin_panel_settings', label: 'Admin' }
                  ].map((role) => (
                    <button 
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all group ${
                        selectedRole === role.id 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/50'
                      }`}
                    >
                      <span className={`material-symbols-outlined mb-2 text-2xl md:text-3xl transition-transform ${selectedRole === role.id ? 'text-primary scale-110' : 'text-secondary group-hover:scale-110'}`}>
                        {role.icon}
                      </span>
                      <span className={`text-[11px] md:text-xs font-bold leading-none ${selectedRole === role.id ? 'text-primary' : 'text-on-surface'}`}>{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Login Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-on-surface ml-1">Username / Email</label>
                  <div className="relative group">
                    <input 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all outline-none text-on-surface placeholder:text-outline-variant font-medium" 
                      placeholder={`e.g. ${selectedRole === 'doctor' ? 'doctor1' : selectedRole === 'patient' ? 'patient1' : 'admin'}`}
                      type="text"
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">mail</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-on-surface">Password</label>
                  </div>
                  <div className="relative group">
                    <input 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all outline-none text-on-surface placeholder:text-outline-variant font-medium" 
                      placeholder="Enter password" 
                      type={showPassword ? "text" : "password"}
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">lock</span>
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors focus:outline-none flex items-center justify-center h-full px-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-4 mt-8 cta-gradient text-on-primary rounded-xl font-bold text-[15px] tracking-wide ambient-shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
                  type="submit"
                >
                  {loading ? <RefreshCw className="animate-spin" size={20} /> : "Initialize Access"}
                </button>
              </form>
              
              {/* Demo Credentials */}
              <div className="pt-4 border-t border-outline-variant/20 w-full text-center">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-on-surface-variant mb-3">Demo Credentials</p>
                  <div className="flex justify-center flex-col gap-2 mx-auto">
                      <div className="bg-surface-container-low rounded p-2 text-xs text-on-surface font-medium border border-outline-variant/10"><strong>Doctor:</strong> doctor1 / doctor123</div>
                      <div className="bg-surface-container-low rounded p-2 text-xs text-on-surface font-medium border border-outline-variant/10"><strong>Patient:</strong> patient1 / patient123</div>
                      <div className="bg-surface-container-low rounded p-2 text-xs text-on-surface font-medium border border-outline-variant/10"><strong>Admin:</strong> admin / admin123</div>
                  </div>
              </div>

            </div>
          </div>
        </div>


        {/* Visual Polish: Floating Shapes */}
        <div className="fixed top-20 left-10 opacity-20 pointer-events-none select-none hidden lg:block">
          <svg fill="none" height="120" viewBox="0 0 120 120" width="120" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 110C87.6142 110 110 87.6142 110 60C110 32.3858 87.6142 10 60 10C32.3858 10 10 32.3858 10 60C10 87.6142 32.3858 110 60 110Z" stroke="var(--primary)" strokeDasharray="4 4" strokeWidth="0.5"></path>
            <path d="M60 90C76.5685 90 90 76.5685 90 60C90 43.4315 76.5685 30 60 30C43.4315 30 30 43.4315 30 60C30 76.5685 43.4315 90 60 90Z" stroke="var(--primary)" strokeDasharray="2 2" strokeWidth="0.5"></path>
          </svg>
        </div>

      </main>
    </>
  );
}
