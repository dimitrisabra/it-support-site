import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { MessageSquare, Users, BookOpen, AlertCircle, TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const chatVolumeData = [
  { day: "Mon", chats: 45 }, { day: "Tue", chats: 62 }, { day: "Wed", chats: 78 },
  { day: "Thu", chats: 55 }, { day: "Fri", chats: 91 }, { day: "Sat", chats: 34 }, { day: "Sun", chats: 28 },
];

const categoryData = [
  { name: "Billing", count: 42 }, { name: "Technical", count: 38 },
  { name: "Account", count: 25 }, { name: "General", count: 18 }, { name: "Other", count: 12 },
];

const resolutionData = [
  { name: "AI Resolved", value: 72, color: "hsl(var(--success))" },
  { name: "Admin Resolved", value: 18, color: "hsl(var(--primary))" },
  { name: "Escalated", value: 7, color: "hsl(var(--warning))" },
  { name: "Unresolved", value: 3, color: "hsl(var(--destructive))" },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ conversations: 0, users: 0, kbItems: 0, escalations: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [convos, profiles, kb, esc] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }) as any,
        supabase.from("profiles").select("id", { count: "exact", head: true }) as any,
        supabase.from("knowledge_base").select("id", { count: "exact", head: true }) as any,
        supabase.from("escalations").select("id", { count: "exact", head: true }) as any,
      ]);
      setStats({
        conversations: convos.count || 0,
        users: profiles.count || 0,
        kbItems: kb.count || 0,
        escalations: esc.count || 0,
      });
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Chats", value: stats.conversations, icon: MessageSquare, change: "+12%", trend: "up", color: "text-primary" },
    { label: "Active Users", value: stats.users, icon: Users, change: "+8%", trend: "up", color: "text-success" },
    { label: "Knowledge Items", value: stats.kbItems, icon: BookOpen, change: "+5", trend: "up", color: "text-primary" },
    { label: "Escalations", value: stats.escalations, icon: AlertCircle, change: "-15%", trend: "down", color: "text-warning" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time overview of your AI support platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                    <span className={`text-xs font-medium flex items-center gap-1 ${s.trend === "up" ? "text-success" : "text-warning"}`}>
                      {s.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {s.change}
                    </span>
                  </div>
                  <div className="text-2xl font-heading font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card className="glass border-border lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Chat Volume (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chatVolumeData}>
                  <defs>
                    <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area type="monotone" dataKey="chats" stroke="hsl(var(--primary))" fill="url(#chatGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Resolution Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={resolutionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {resolutionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {resolutionData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground truncate">{d.name} ({d.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Chart */}
        <Card className="glass border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-foreground">Top Question Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
