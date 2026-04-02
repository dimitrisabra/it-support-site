import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Megaphone, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string | null;
  pinned: boolean | null;
  active: boolean | null;
  created_at: string;
}

const typeColors: Record<string, string> = {
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  maintenance: "bg-accent/10 text-accent",
};

const UserAnnouncements = () => {
  const [searchParams] = useSearchParams();
  const highlightedAnnouncementId = searchParams.get("announcement");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }) as any;

    setAnnouncements(data || []);
  };

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("user-announcements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => fetchAnnouncements())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sortedAnnouncements = useMemo(() => {
    if (!highlightedAnnouncementId) {
      return announcements;
    }

    return [...announcements].sort((left, right) => {
      if (left.id === highlightedAnnouncementId) return -1;
      if (right.id === highlightedAnnouncementId) return 1;
      return 0;
    });
  }, [announcements, highlightedAnnouncementId]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground mb-6 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <Card className="glass border-border mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-foreground flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-accent" /> Announcements
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              All active updates published by the admin team.
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {sortedAnnouncements.map((announcement, index) => {
            const isHighlighted = announcement.id === highlightedAnnouncementId;

            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className={`glass border-border ${isHighlighted ? "border-primary/40 ring-1 ring-primary/30" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {announcement.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                          <span className="text-sm font-semibold text-foreground">{announcement.title}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                              typeColors[announcement.type || "info"] || "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {announcement.type || "info"}
                          </span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{announcement.content}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(announcement.created_at)}
                          </span>
                          <span>{new Date(announcement.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {sortedAnnouncements.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No announcements yet</p>
              <p className="text-xs mt-1">New admin updates will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAnnouncements;
