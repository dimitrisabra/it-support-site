import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { FileText, TrendingUp, TrendingDown, Download, Calendar, BarChart3, PieChart as PieChartIcon, Activity, Users, MessageSquare, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const hourlyData = [
  { hour: "00", chats: 5 }, { hour: "02", chats: 3 }, { hour: "04", chats: 2 }, { hour: "06", chats: 8 },
  { hour: "08", chats: 25 }, { hour: "10", chats: 42 }, { hour: "12", chats: 38 }, { hour: "14", chats: 45 },
  { hour: "16", chats: 52 }, { hour: "18", chats: 35 }, { hour: "20", chats: 18 }, { hour: "22", chats: 10 },
];

const weeklyTrend = [
  { week: "W1", users: 120, chats: 340, resolved: 310 },
  { week: "W2", users: 145, chats: 412, resolved: 389 },
  { week: "W3", users: 178, chats: 498, resolved: 465 },
  { week: "W4", users: 203, chats: 567, resolved: 541 },
];

const satisfactionData = [
  { rating: "⭐", count: 8 }, { rating: "⭐⭐", count: 12 },
  { rating: "⭐⭐⭐", count: 28 }, { rating: "⭐⭐⭐⭐", count: 65 }, { rating: "⭐⭐⭐⭐⭐", count: 89 },
];

const responseTimeData = [
  { day: "Mon", ai: 1.2, human: 45 }, { day: "Tue", ai: 1.1, human: 38 },
  { day: "Wed", ai: 1.3, human: 42 }, { day: "Thu", ai: 0.9, human: 55 },
  { day: "Fri", ai: 1.1, human: 35 }, { day: "Sat", ai: 1.0, human: 62 },
  { day: "Sun", ai: 1.2, human: 58 },
];

const topQuestions = [
  { question: "How do I reset my password?", count: 156, trend: "+12%" },
  { question: "What are the billing options?", count: 134, trend: "+8%" },
  { question: "How to export my data?", count: 98, trend: "+23%" },
  { question: "Integration setup help", count: 87, trend: "-5%" },
  { question: "Account deletion request", count: 67, trend: "+3%" },
  { question: "API rate limits explained", count: 54, trend: "+15%" },
  { question: "Two-factor authentication", count: 48, trend: "+31%" },
  { question: "Custom domain setup", count: 41, trend: "-2%" },
];

const channelData = [
  { name: "Web Chat", value: 65, color: "hsl(var(--primary))" },
  { name: "Mobile", value: 22, color: "hsl(var(--success))" },
  { name: "API", value: 8, color: "hsl(var(--warning))" },
  { name: "Email", value: 5, color: "hsl(var(--accent))" },
];

const AdminReports = () => {
  const [period, setPeriod] = useState("7d");
  const [stats, setStats] = useState({ totalChats: 0, avgResponseTime: 0, satisfactionAvg: 0, resolutionRate: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: chatCount } = await supabase.from("conversations").select("id", { count: "exact", head: true }) as any;
      setStats({
        totalChats: chatCount || 0,
        avgResponseTime: 1.2,
        satisfactionAvg: 4.3,
        resolutionRate: 94.2,
      });
    };
    fetchStats();
  }, []);

  const exportReport = () => {
    const report = `SupportAI Analytics Report\nGenerated: ${new Date().toLocaleString()}\n\nTotal Chats: ${stats.totalChats}\nAvg Response Time: ${stats.avgResponseTime}s\nSatisfaction: ${stats.satisfactionAvg}/5\nResolution Rate: ${stats.resolutionRate}%\n\nTop Questions:\n${topQuestions.map((q, i) => `${i+1}. ${q.question} (${q.count} asks, ${q.trend})`).join("\n")}`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportStats = [
    { label: "Total Conversations", value: stats.totalChats.toLocaleString(), icon: MessageSquare, change: "+18%", trend: "up", color: "text-primary" },
    { label: "Avg AI Response", value: `${stats.avgResponseTime}s`, icon: Clock, change: "-0.3s", trend: "down", color: "text-success" },
    { label: "Satisfaction Score", value: `${stats.satisfactionAvg}/5`, icon: Target, change: "+0.2", trend: "up", color: "text-warning" },
    { label: "Resolution Rate", value: `${stats.resolutionRate}%`, icon: Activity, change: "+2.1%", trend: "up", color: "text-success" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Analytics & Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive platform analytics and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32 bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportReport} className="gap-1.5 border-border">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {reportStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                    <span className={`text-xs font-medium flex items-center gap-1 ${s.trend === "up" ? "text-success" : "text-primary"}`}>
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

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <Card className="glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Hourly Chat Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="chats" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" /> Weekly Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                  <Line type="monotone" dataKey="chats" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
                  <Line type="monotone" dataKey="resolved" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: "hsl(var(--warning))" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card className="glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg text-foreground">Channel Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {channelData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name} ({d.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg text-foreground">Satisfaction Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={satisfactionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="rating" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="count" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg text-foreground">Response Time (avg)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={responseTimeData}>
                  <defs>
                    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Area type="monotone" dataKey="ai" stroke="hsl(var(--primary))" fill="url(#aiGrad)" strokeWidth={2} name="AI (seconds)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Questions Table */}
        <Card className="glass border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-foreground">Most Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topQuestions.map((q, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <span className="text-sm text-foreground">{q.question}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground">{q.count}</span>
                    <span className={`text-xs font-medium ${q.trend.startsWith("+") ? "text-success" : "text-destructive"}`}>{q.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminReports;
