import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../components/AuthContext";

export default function Home() {
  const { user, loading, isAuthenticated, connectionError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || connectionError) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Redirect to role-specific dashboard
    const dashboardMap: Record<string, string> = {
      doctor: "/doctor",
      patient: "/patient",
      admin: "/admin",
    };

    if (user?.role) {
      router.replace(dashboardMap[user.role] || "/login");
    }
  }, [loading, isAuthenticated, user, router, connectionError]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-on-surface p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] serenity-blur opacity-30 animate-pulse pointer-events-none" />
      
      <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-20 h-20 cta-gradient rounded-3xl mx-auto flex items-center justify-center shadow-2xl animate-bounce duration-[2000ms]">
           <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-headline font-black tracking-tight text-on-surface">
            {connectionError ? "System Synchronization Error" : "Secure Authentication"}
          </h1>
          <p className="text-on-surface-variant font-medium tracking-wide max-w-sm mx-auto">
            {connectionError ? connectionError : "Establishing encrypted connection to clinical workspace..."}
          </p>
        </div>

        {!connectionError && (
          <div className="flex items-center justify-center gap-1.5 pt-4">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping [animation-delay:200ms]" />
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping [animation-delay:400ms]" />
          </div>
        )}
      </div>
    </div>
  );
}
