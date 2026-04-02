import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Save, ArrowLeft, MessageSquare, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { motion } from "framer-motion";

const UserProfile = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ conversations: 0, messages: 0, escalations: 0 });

  useEffect(() => {
    if (profile) setFullName(profile.full_name || "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { count: convos } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "deleted") as any;
      const { data: convoIds } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .neq("status", "deleted") as any;
      let msgCount = 0;
      if (convoIds?.length) {
        const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).in("conversation_id", convoIds.map((c: any) => c.id)) as any;
        msgCount = count || 0;
      }
      const { count: escs } = await supabase.from("escalations").select("id", { count: "exact", head: true }).eq("user_id", user.id) as any;
      setStats({ conversations: convos || 0, messages: msgCount, escalations: escs || 0 });
    };
    fetchStats();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, updated_at: new Date().toISOString() } as any).eq("user_id", user.id) as any;
    toast({ title: "Profile updated", description: "Your changes have been saved." });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground mb-6 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{profile?.full_name || "Your Profile"}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {user?.email}
              {isAdmin && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">Admin</span>}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: MessageSquare, label: "Conversations", value: stats.conversations, color: "text-primary" },
            { icon: Clock, label: "Messages Sent", value: stats.messages, color: "text-success" },
            { icon: Shield, label: "Escalations", value: stats.escalations, color: "text-warning" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
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

        {/* Edit Profile */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-foreground">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={user?.email || ""} disabled className="pl-10 bg-secondary border-border opacity-60" />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Account created:</strong>{" "}
            {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
