import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Megaphone, Pin, Plus, Trash2 } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AnnouncementType = "info" | "warning" | "success" | "maintenance";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  pinned: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const normalizeAnnouncement = (announcement: any): Announcement => ({
  ...announcement,
  type: (announcement.type || "info") as AnnouncementType,
  pinned: !!announcement.pinned,
  active: !!announcement.active,
});

const sortAnnouncements = (announcements: Announcement[]) =>
  [...announcements].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

const typeColors: Record<AnnouncementType, string> = {
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  maintenance: "bg-accent/10 text-accent",
};

const buildAnnouncementPreview = (content: string) =>
  content.length > 140 ? `${content.slice(0, 137)}...` : content;

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "info" as AnnouncementType,
  });

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }) as any;

    if (error) {
      toast({
        title: "Failed to load announcements",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setAnnouncements(
      sortAnnouncements((data || []).map((announcement: any) => normalizeAnnouncement(announcement))),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("admin-announcements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => fetchAnnouncements())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const notifyUsersAboutAnnouncement = async (announcement: Announcement) => {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id") as any;

    if (profilesError) {
      return profilesError;
    }

    if (!profiles?.length) {
      return null;
    }

    const preview = buildAnnouncementPreview(announcement.content);
    const rows = profiles.map((profile: { user_id: string }) => ({
      user_id: profile.user_id,
      title: `Announcement: ${announcement.title}`,
      message: preview,
      type: "announcement",
      link: `/user/announcements?announcement=${announcement.id}`,
      read: false,
    }));

    const { error } = await supabase.from("notifications").insert(rows as any) as any;
    return error;
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;

    setPublishing(true);

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        active: true,
        pinned: false,
        created_by: user?.id ?? null,
      } as any)
      .select()
      .single() as any;

    if (error) {
      setPublishing(false);
      toast({
        title: "Announcement failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const createdAnnouncement = normalizeAnnouncement(data);

    const notificationError = await notifyUsersAboutAnnouncement(createdAnnouncement);

    setAnnouncements((prev) =>
      sortAnnouncements([createdAnnouncement, ...prev.filter((announcement) => announcement.id !== createdAnnouncement.id)]),
    );
    setForm({ title: "", content: "", type: "info" });
    setDialogOpen(false);
    setPublishing(false);

    toast({
      title: "Announcement published",
      description: notificationError
        ? "The announcement is live, but user notifications could not be created."
        : "The announcement is now visible to users.",
      variant: notificationError ? "destructive" : "default",
    });
  };

  const togglePin = async (announcement: Announcement) => {
    const nextPinned = !announcement.pinned;
    const { error } = await supabase
      .from("announcements")
      .update({ pinned: nextPinned } as any)
      .eq("id", announcement.id) as any;

    if (error) {
      toast({
        title: "Pin update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAnnouncements((prev) =>
      sortAnnouncements(
        prev.map((item) =>
          item.id === announcement.id ? { ...item, pinned: nextPinned } : item,
        ),
      ),
    );
  };

  const toggleActive = async (announcement: Announcement) => {
    const nextActive = !announcement.active;
    const { error } = await supabase
      .from("announcements")
      .update({ active: nextActive } as any)
      .eq("id", announcement.id) as any;

    if (error) {
      toast({
        title: "Visibility update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAnnouncements((prev) =>
      prev.map((item) =>
        item.id === announcement.id ? { ...item, active: nextActive } : item,
      ),
    );
  };

  const deleteAnnouncement = async (announcement: Announcement) => {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id) as any;

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAnnouncements((prev) => prev.filter((item) => item.id !== announcement.id));
    toast({ title: "Announcement deleted" });
  };

  const activeCount = announcements.filter((announcement) => announcement.active).length;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Announcements</h1>
            <p className="text-sm text-muted-foreground mt-1">{activeCount} active announcements</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-foreground">Create Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Title</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Announcement title..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Content</Label>
                  <Textarea
                    value={form.content}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="Write your announcement..."
                    className="bg-secondary border-border min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value: AnnouncementType) => setForm((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={publishing || !form.title.trim() || !form.content.trim()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {publishing ? "Publishing..." : "Publish Announcement"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <motion.div
                key={announcement.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className={`glass-hover border-border ${!announcement.active ? "opacity-60" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {announcement.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                          <span className="text-sm font-semibold text-foreground">{announcement.title}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${typeColors[announcement.type]}`}
                          >
                            {announcement.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{announcement.content}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Megaphone className="h-3 w-3" /> Visible to signed-in users
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(announcement.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{announcement.active ? "Active" : "Hidden"}</span>
                          <Switch checked={announcement.active} onCheckedChange={() => toggleActive(announcement)} />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(announcement)}
                          className={`h-8 w-8 p-0 ${announcement.pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <Pin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnnouncement(announcement)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {!loading && announcements.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No announcements yet</p>
              </div>
            )}
          </div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminAnnouncements;
