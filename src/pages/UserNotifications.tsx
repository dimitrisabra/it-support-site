import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const UserNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any;
    setNotifications(data || []);
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true } as any).eq("id", id) as any;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.read) {
      await markRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    for (const n of notifications.filter(n => !n.read)) {
      await supabase.from("notifications").update({ read: true } as any).eq("id", n.id) as any;
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeColors: Record<string, string> = {
    info: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    alert: "bg-destructive/10 text-destructive",
    announcement: "bg-accent/10 text-accent",
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground mb-6 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="border-border text-xs">
              Mark all read
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={`glass-hover border-border cursor-pointer ${!n.read ? "border-primary/20" : ""}`} onClick={() => openNotification(n)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[n.type] || "bg-secondary text-muted-foreground"}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</span>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">{timeAgo(n.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">You'll be notified about important updates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserNotifications;
