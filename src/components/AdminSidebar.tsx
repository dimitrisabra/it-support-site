import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bot, BookOpen, MessageSquare, Users, Settings, BarChart3, AlertCircle, LogOut, Activity, Reply, Bell, Megaphone, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { to: "/admin", icon: BarChart3, label: "Dashboard" },
  { to: "/admin/knowledge", icon: BookOpen, label: "Knowledge Base" },
  { to: "/admin/chats", icon: MessageSquare, label: "Chats" },
  { to: "/admin/escalations", icon: AlertCircle, label: "Escalations", badge: true },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/notifications", icon: Bell, label: "Notifications" },
  { to: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/admin/reports", icon: FileText, label: "Reports" },
  { to: "/admin/replies", icon: Reply, label: "Saved Replies" },
  { to: "/admin/activity", icon: Activity, label: "Activity Log" },
  { to: "/admin/settings", icon: Settings, label: "AI Settings" },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const [pendingEscalations, setPendingEscalations] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase
        .from("escalations")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending") as any;
      setPendingEscalations(count || 0);
    };
    fetchPending();

    const channel = supabase
      .channel("escalation-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "escalations" }, () => fetchPending())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-5 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-heading font-bold text-foreground text-sm">SupportAI</span>
            <span className="block text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {badge && pendingEscalations > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-warning/20 text-warning text-[10px] font-bold min-w-[20px] text-center">
                  {pendingEscalations}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {(profile?.full_name || user?.email || "A").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{profile?.full_name || "Admin"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
