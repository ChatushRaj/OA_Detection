import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import { AnimatedShapes } from "./AnimatedUI";
import { useTheme } from "next-themes";
import { LogOut } from "lucide-react";

interface NavItem { label: string; href: string; icon: string; }

const navByRole: Record<string, NavItem[]> = {
  doctor: [
    { label: "Dashboard", href: "/doctor", icon: "home_health" },
    { label: "My Patients", href: "/doctor/patients", icon: "group" },
    { label: "Scans", href: "/doctor/scans", icon: "biotech" },
    { label: "My Profile", href: "/profile", icon: "settings" },
  ],
  patient: [
    { label: "Dashboard", href: "/patient", icon: "home_health" },
    { label: "My Reports", href: "/patient", icon: "analytics" },
    { label: "Upload Scan", href: "/patient/upload", icon: "upload_file" },
    { label: "My Profile", href: "/profile", icon: "settings" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "home_health" },
    { label: "Patients", href: "/admin/patients", icon: "group" },
    { label: "Scans", href: "/admin/scans", icon: "biotech" },
    { label: "Users", href: "/admin/users", icon: "manage_accounts" },
    { label: "Audit Logs", href: "/admin/logs", icon: "plagiarism" },
    { label: "My Profile", href: "/profile", icon: "settings" },
  ],
};

export default function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const nav = navByRole[user?.role || "patient"] || [];
  useEffect(() => {
    nav.forEach((item) => router.prefetch(item.href));
    setMounted(true);
  }, [nav, router]);

  if (!user) return null;

  const roleTitle = user.role === "doctor" ? "Medical Doctor" : user.role === "patient" ? "Patient" : "System Admin";
  const roleSubtitle = user.role === "doctor" ? "Clinical Interface" : user.role === "patient" ? "Healing Journey" : "Clinical Oversight";

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary/30 relative">
      <AnimatedShapes />
      
      {/* TopAppBar — cleaned: removed notification icon & Dashboard nav link */}
      <header className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-2xl flex justify-between items-center px-6 lg:px-8 h-20 shadow-sm">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-headline italic font-bold text-primary cursor-pointer tracking-tight" onClick={() => router.push("/")}>OA Detection Portal</span>
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-full cta-gradient flex items-center justify-center text-on-primary font-bold shadow-md ml-2">
            {user.full_name.charAt(0)}
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="w-64 fixed left-0 top-0 pt-24 bg-surface-container-low flex-col space-y-2 h-screen hidden lg:flex z-40">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 cta-gradient rounded-xl flex items-center justify-center shadow-md text-on-primary">
               🩺
            </div>
            <div>
              <p className="font-headline text-lg text-on-surface leading-none font-extrabold tracking-tight">{roleTitle}</p>
              <p className="font-body text-[11px] tracking-widest uppercase text-on-surface-variant font-bold mt-1.5">{roleSubtitle}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1">
          {nav.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} passHref>
                <div className={`cursor-pointer ${isActive ? "bg-surface-container-high text-primary font-bold rounded-l-2xl ml-4 pl-6 py-3.5" : "text-on-surface-variant pl-10 py-3.5"} flex items-center gap-3 hover:text-primary transition-all mb-1`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                  <span className="font-body text-sm tracking-wide">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6">
          <button onClick={logout} className="w-full ghost-border bg-surface-container-lowest text-error py-3.5 px-4 rounded-xl font-bold shadow-sm hover:bg-error-container/20 hover:text-error transition-all flex items-center justify-center gap-2">
            <LogOut size={16} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-28 lg:pl-72 pr-6 lg:pr-8 pb-12 min-h-screen">
        {(title || router.pathname.length > 2) && (
          <header className="mb-10">
            <h1 className="font-headline font-bold text-3xl md:text-4xl text-on-surface mb-2 tracking-tight">
              {title || `Welcome, ${user.full_name.split(' ')[0]}`}
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base max-w-lg">Access your clinical dashboard overview.</p>
          </header>
        )}
        
        {/* Dynamic children injects into Layout */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          {children}
        </div>
        
      </main>
    </div>
  );
}
