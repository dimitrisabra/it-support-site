import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, CheckCircle, AlertTriangle, XCircle, Clock, Activity, Server, Database, Shield, Globe, Wifi, Zap, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Service {
  name: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  icon: typeof Server;
  uptime: string;
  latency: string;
  lastIncident: string;
}

const services: Service[] = [
  { name: "AI Chat Engine", status: "operational", icon: Bot, uptime: "99.97%", latency: "45ms", lastIncident: "None in 30 days" },
  { name: "Web Application", status: "operational", icon: Globe, uptime: "99.99%", latency: "120ms", lastIncident: "None in 30 days" },
  { name: "Database", status: "operational", icon: Database, uptime: "99.99%", latency: "8ms", lastIncident: "None in 90 days" },
  { name: "Authentication", status: "operational", icon: Shield, uptime: "99.98%", latency: "85ms", lastIncident: "None in 60 days" },
  { name: "API Gateway", status: "operational", icon: Zap, uptime: "99.95%", latency: "32ms", lastIncident: "2 days ago" },
  { name: "File Storage", status: "operational", icon: Server, uptime: "99.99%", latency: "150ms", lastIncident: "None in 30 days" },
  { name: "Notification Service", status: "operational", icon: Wifi, uptime: "99.92%", latency: "200ms", lastIncident: "5 days ago" },
  { name: "Search Index", status: "degraded", icon: Activity, uptime: "98.5%", latency: "350ms", lastIncident: "Active - investigating" },
];

const incidents = [
  {
    date: "March 31, 2026",
    title: "Search Index Degraded Performance",
    status: "investigating",
    updates: [
      { time: "14:30 UTC", message: "We are investigating increased latency on the search index service." },
      { time: "14:15 UTC", message: "Monitoring systems have detected elevated response times for search queries." },
    ],
  },
  {
    date: "March 29, 2026",
    title: "API Gateway Brief Interruption",
    status: "resolved",
    updates: [
      { time: "09:45 UTC", message: "Issue has been resolved. All API endpoints are responding normally." },
      { time: "09:20 UTC", message: "We identified the issue as a misconfigured load balancer rule. Applying fix." },
      { time: "09:05 UTC", message: "Some API requests are returning 502 errors. Investigating." },
    ],
  },
  {
    date: "March 26, 2026",
    title: "Notification Delivery Delays",
    status: "resolved",
    updates: [
      { time: "16:00 UTC", message: "All notifications are now delivering normally. Root cause: queue overflow during traffic spike." },
      { time: "15:30 UTC", message: "Implementing fix to scale notification workers." },
      { time: "15:00 UTC", message: "Users may experience delays in receiving notifications." },
    ],
  },
];

const statusConfig = {
  operational: { color: "text-success", bg: "bg-success/10", label: "Operational", icon: CheckCircle },
  degraded: { color: "text-warning", bg: "bg-warning/10", label: "Degraded", icon: AlertTriangle },
  outage: { color: "text-destructive", bg: "bg-destructive/10", label: "Outage", icon: XCircle },
  maintenance: { color: "text-primary", bg: "bg-primary/10", label: "Maintenance", icon: Clock },
};

const incidentStatusConfig: Record<string, { color: string; label: string }> = {
  investigating: { color: "text-warning", label: "Investigating" },
  identified: { color: "text-accent", label: "Identified" },
  monitoring: { color: "text-primary", label: "Monitoring" },
  resolved: { color: "text-success", label: "Resolved" },
};

const SystemStatus = () => {
  const allOperational = services.every(s => s.status === "operational");
  const overallStatus = allOperational ? "All Systems Operational" : "Some Systems Experiencing Issues";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">SupportAI</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Overall Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${allOperational ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
            {allOperational ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {overallStatus}
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">System Status</h1>
          <p className="text-muted-foreground">Real-time status of SupportAI services</p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
          {services.map((service, i) => {
            const config = statusConfig[service.status];
            const StatusIcon = config.icon;
            return (
              <motion.div key={service.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass-hover border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <service.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{service.name}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Uptime: {service.uptime}</span>
                      <span>Latency: {service.latency}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Incident History */}
        <h2 className="font-heading text-xl font-bold text-foreground mb-6">Recent Incidents</h2>
        <div className="space-y-6">
          {incidents.map((incident, i) => {
            const statusConf = incidentStatusConfig[incident.status] || { color: "text-muted-foreground", label: incident.status };
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                <Card className="glass border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs text-muted-foreground">{incident.date}</span>
                        <h3 className="text-sm font-semibold text-foreground">{incident.title}</h3>
                      </div>
                      <span className={`text-xs font-medium capitalize ${statusConf.color}`}>{statusConf.label}</span>
                    </div>
                    <div className="space-y-2 border-l-2 border-border pl-4">
                      {incident.updates.map((u, j) => (
                        <div key={j}>
                          <span className="text-xs text-muted-foreground">{u.time}</span>
                          <p className="text-sm text-foreground/80">{u.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Uptime History */}
        <div className="mt-12">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">90-Day Uptime</h2>
          <Card className="glass border-border">
            <CardContent className="p-5">
              <div className="flex gap-0.5">
                {Array.from({ length: 90 }, (_, i) => {
                  const isDown = i === 61 || i === 64 || i === 88;
                  const isDegraded = i === 87;
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded-sm ${isDown ? "bg-destructive/60" : isDegraded ? "bg-warning/60" : "bg-success/60"}`}
                      title={`Day ${90 - i}: ${isDown ? "Incident" : isDegraded ? "Degraded" : "Operational"}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SystemStatus;
