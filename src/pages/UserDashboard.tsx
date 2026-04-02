import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, MessageSquare, Bell, User, BarChart3, Clock, Shield, Megaphone, ArrowRight, Plus, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

interface RecentChat {
  id: string;
  title: string;
  status: string;
  updated_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string | null;
  pinned: boolean | null;
  active: boolean | null;
  created_at: string;
}

const UserDashboard = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ conversations: 0, messages: 0, escalations: 0, unreadNotifications: 0 });
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchDashboardData = async (userId: string) => {
    const [convosRes, escalRes, notifsRes, announcementsRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "deleted")
        .order("updated_at", { ascending: false })
        .limit(5) as any,
      supabase.from("escalations").select("id", { count: "exact", head: true }).eq("user_id", userId) as any,
      supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5) as any,
      supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3) as any,
    ]);

    const convos = convosRes.data || [];
    setRecentChats(convos);

    let msgCount = 0;
    if (convos.length) {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convos.map((conversation: any) => conversation.id)) as any;
      msgCount = count || 0;
    }

    const notifs = notifsRes.data || [];
    setNotifications(notifs);
    setAnnouncements(announcementsRes.data || []);

    setStats({
      conversations: convos.length,
      messages: msgCount,
      escalations: escalRes.count || 0,
      unreadNotifications: notifs.filter((notification: any) => !notification.read).length,
    });
  };

  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      void fetchDashboardData(user.id);
    };

    refresh();

    const channel = supabase
      .channel(`user-dashboard-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        refresh,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    resolved: "bg-primary/10 text-primary",
    escalated: "bg-warning/10 text-warning",
  };

  const announcementTypeColors: Record<string, string> = {
    info: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    maintenance: "bg-accent/10 text-accent",
  };

  const quickActions = [
    { icon: Plus, label: "New Chat", desc: "Start a new conversation with AI", to: "/chat", color: "bg-primary/10 text-primary" },
    { icon: User, label: "My Profile", desc: "View and edit your profile", to: "/profile", color: "bg-success/10 text-success" },
    { icon: Bell, label: "Notifications", desc: `${stats.unreadNotifications} unread`, to: "/user/notifications", color: "bg-warning/10 text-warning" },
    { icon: Megaphone, label: "Announcements", desc: `${announcements.length} active`, to: "/user/announcements", color: "bg-accent/10 text-accent" },
    { icon: Shield, label: "Settings", desc: "Preferences & security", to: "/user/settings", color: "bg-accent/10 text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">SupportAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="border-border text-xs gap-1">
                  <BarChart3 className="h-3 w-3" /> Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">Sign Out</Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name || "there"}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your support account</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Conversations", value: stats.conversations, icon: MessageSquare, color: "text-primary" },
            { label: "Messages", value: stats.messages, icon: Clock, color: "text-success" },
            { label: "Escalations", value: stats.escalations, icon: Shield, color: "text-warning" },
            { label: "Notifications", value: stats.unreadNotifications, icon: Bell, color: "text-accent" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass border-border">
                <CardContent className="p-4 text-center">
                  <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
                  <div className="text-xl font-heading font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {quickActions.map((a, i) => (
            <motion.div key={a.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
              <Link to={a.to}>
                <Card className="glass-hover border-border cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${a.color}`}>
                      <a.icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium text-foreground">{a.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.desc}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {announcements.length > 0 && (
          <Card className="glass border-border mb-8">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-accent" /> Active Announcements
              </CardTitle>
              <Link to="/user/announcements">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {announcement.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-sm font-semibold text-foreground">{announcement.title}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                        announcementTypeColors[announcement.type || "info"] || "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {announcement.type || "info"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo(announcement.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{announcement.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Chats */}
          <Card className="glass border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Recent Chats
              </CardTitle>
              <Link to="/chat">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentChats.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground">No conversations yet</p>
                  <Link to="/chat"><Button size="sm" className="mt-3 bg-primary text-primary-foreground text-xs gap-1"><Plus className="h-3 w-3" /> Start Chat</Button></Link>
                </div>
              ) : (
                recentChats.map(c => (
                  <Link key={c.id} to="/chat" className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">{c.title || "Untitled"}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(c.updated_at)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColors[c.status] || "bg-secondary text-muted-foreground"}`}>{c.status}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="glass border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-warning" /> Notifications
              </CardTitle>
              <Link to="/user/notifications">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground">No notifications</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-lg transition-colors ${!n.read ? "bg-primary/5" : "hover:bg-secondary/50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium block truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
