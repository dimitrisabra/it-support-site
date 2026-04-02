import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Activity, MessageSquare, User, Bot, AlertCircle, BookOpen, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ActivityItem {
  id: string;
  type: "conversation" | "escalation" | "knowledge" | "message";
  description: string;
  time: string;
  icon: typeof Activity;
  color: string;
}

const AdminActivityLog = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const items: ActivityItem[] = [];

      // Recent conversations
      const { data: convos } = await supabase.from("conversations").select("*").order("created_at", { ascending: false }).limit(10) as any;
      for (const c of convos || []) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", c.user_id).single() as any;
        items.push({
          id: `conv-${c.id}`,
          type: "conversation",
          description: `${profile?.full_name || "User"} started: "${c.title}"`,
          time: c.created_at,
          icon: MessageSquare,
          color: "text-primary",
        });
      }

      // Recent escalations
      const { data: escs } = await supabase.from("escalations").select("*").order("created_at", { ascending: false }).limit(5) as any;
      for (const e of escs || []) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", e.user_id).single() as any;
        items.push({
          id: `esc-${e.id}`,
          type: "escalation",
          description: `${profile?.full_name || "User"} escalated a conversation${e.status === "resolved" ? " (resolved)" : ""}`,
          time: e.created_at,
          icon: AlertCircle,
          color: e.status === "resolved" ? "text-success" : "text-warning",
        });
      }

      // Recent KB additions
      const { data: kbs } = await supabase.from("knowledge_base").select("*").order("created_at", { ascending: false }).limit(5) as any;
      for (const k of kbs || []) {
        items.push({
          id: `kb-${k.id}`,
          type: "knowledge",
          description: `KB item added: "${k.question.slice(0, 60)}${k.question.length > 60 ? "..." : ""}" (v${k.version})`,
          time: k.created_at,
          icon: BookOpen,
          color: "text-primary",
        });
      }

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(items.slice(0, 30));
      setLoading(false);
    };

    fetchActivity();
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Track all platform activity in real-time</p>
        </div>

        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading activity...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No activity yet. Start by creating conversations or adding knowledge base items.</div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {activities.map((a) => (
                    <div key={a.id} className="flex gap-4 relative">
                      <div className={`h-8 w-8 rounded-full bg-card border-2 border-border flex items-center justify-center shrink-0 z-10 ${a.color}`}>
                        <a.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm text-foreground">{a.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(a.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminActivityLog;
