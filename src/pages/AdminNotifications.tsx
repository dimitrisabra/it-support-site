import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Bell, Send, Users, User, Search, Plus, Megaphone, CheckCircle, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface UserItem {
  user_id: string;
  full_name: string | null;
}

interface SentNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  user_id: string;
  read: boolean;
  user_name?: string;
}

const AdminNotifications = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [target, setTarget] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name") as any;
    setUsers(data || []);
  };

  const fetchSentNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100) as any;
    
    if (data) {
      const enriched = await Promise.all(
        data.map(async (n: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", n.user_id)
            .single() as any;
          return { ...n, user_name: profile?.full_name || "Unknown" };
        })
      );
      setSentNotifications(enriched);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSentNotifications();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);

    const targetUsers = target === "all" ? users : users.filter(u => u.user_id === selectedUserId);

    for (const u of targetUsers) {
      await supabase.from("notifications").insert({
        user_id: u.user_id,
        title,
        message,
        type,
        link: link || null,
        read: false,
      } as any);
    }

    toast({
      title: "Notifications Sent!",
      description: `Sent to ${targetUsers.length} user${targetUsers.length > 1 ? "s" : ""}`,
    });

    setTitle("");
    setMessage("");
    setLink("");
    setType("info");
    setTarget("all");
    setDialogOpen(false);
    setSending(false);
    fetchSentNotifications();
  };

  const filtered = sentNotifications.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                       n.message.toLowerCase().includes(search.toLowerCase()) ||
                       (n.user_name || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || n.type === filterType;
    return matchSearch && matchType;
  });

  const typeColors: Record<string, string> = {
    info: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    alert: "bg-destructive/10 text-destructive",
    announcement: "bg-accent/10 text-accent",
  };

  const typeIcons: Record<string, typeof Bell> = {
    info: Bell,
    warning: Clock,
    success: CheckCircle,
    alert: Bell,
    announcement: Megaphone,
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const stats = {
    total: sentNotifications.length,
    unread: sentNotifications.filter(n => !n.read).length,
    today: sentNotifications.filter(n => {
      const d = new Date(n.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Notifications Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Send and manage notifications to your users</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" /> Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-foreground flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Compose Notification
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Recipients</Label>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">All Users ({users.length})</SelectItem>
                      <SelectItem value="single">Specific User</SelectItem>
                    </SelectContent>
                  </Select>
                  {target === "single" && (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a user..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-48">
                        {users.map(u => (
                          <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || "Unnamed User"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="info">ℹ️ Info</SelectItem>
                      <SelectItem value="success">✅ Success</SelectItem>
                      <SelectItem value="warning">⚠️ Warning</SelectItem>
                      <SelectItem value="alert">🚨 Alert</SelectItem>
                      <SelectItem value="announcement">📢 Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title..." className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Message</Label>
                  <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message..." className="bg-secondary border-border min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Link (optional)</Label>
                  <Input value={link} onChange={e => setLink(e.target.value)} placeholder="/chat or https://..." className="bg-secondary border-border" />
                </div>
                <Button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Notification"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Sent", value: stats.total, icon: Bell, color: "text-primary" },
            { label: "Unread", value: stats.unread, icon: Clock, color: "text-warning" },
            { label: "Sent Today", value: stats.today, icon: CheckCircle, color: "text-success" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-heading font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications..." className="pl-10 bg-secondary border-border" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification History */}
        <div className="space-y-3">
          {filtered.map((n, i) => {
            const TypeIcon = typeIcons[n.type] || Bell;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="glass-hover border-border">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${typeColors[n.type] || "bg-secondary text-muted-foreground"}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">{n.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${typeColors[n.type]}`}>{n.type}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> {n.user_name}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notifications sent yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;
