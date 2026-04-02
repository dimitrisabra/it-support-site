import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Search, User, MessageSquare, Clock, Shield, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AppUser {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  role: string;
  conversation_count: number;
  suspended: boolean;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*") as any;
    if (!profiles) { setLoading(false); return; }

    const enriched = await Promise.all(
      profiles.map(async (p: any) => {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", p.user_id) as any;
        const { count } = await supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", p.user_id) as any;
        return {
          ...p,
          role: roles?.[0]?.role || "user",
          conversation_count: count || 0,
          suspended: p.suspended || false,
        };
      })
    );
    setUsers(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleSuspend = async (u: AppUser) => {
    const newVal = !u.suspended;
    await supabase.from("profiles").update({ suspended: newVal } as any).eq("user_id", u.user_id) as any;
    toast({ title: newVal ? "User Suspended" : "User Activated", description: `${u.full_name || "User"} has been ${newVal ? "suspended" : "activated"}.` });
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.user_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const timeAgo = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;
  const suspendedCount = users.filter((u) => u.suspended).length;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all platform users</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", value: totalUsers, color: "text-foreground" },
            { label: "Regular Users", value: userCount, color: "text-success" },
            { label: "Admins", value: adminCount, color: "text-primary" },
            { label: "Suspended", value: suspendedCount, color: "text-destructive" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass border-border">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-10 bg-secondary border-border" />
        </div>

        <div className="space-y-2">
          {filtered.map((user) => (
            <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className={`glass-hover border-border ${user.suspended ? "opacity-60" : ""}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${user.role === "admin" ? "bg-primary/10" : "bg-secondary"}`}>
                      {user.role === "admin" ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{user.full_name || "Unnamed"}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {user.role}
                        </span>
                        {user.suspended && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive">Suspended</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {user.conversation_count} chats</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Joined {timeAgo(user.created_at)}</span>
                    </div>
                    {user.role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSuspend(user)}
                        className={`text-xs gap-1 ${user.suspended ? "text-success hover:text-success" : "text-destructive hover:text-destructive"}`}
                      >
                        {user.suspended ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        {user.suspended ? "Activate" : "Suspend"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No users found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
