import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Clock, CheckCircle, AlertCircle, MessageSquare, Send, Tag, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  responses: { role: string; content: string; created_at: string }[];
}

const initialTickets: Ticket[] = [
  {
    id: "TK-001", subject: "Cannot access billing portal", description: "When I click on 'Billing' in my account settings, I get a 404 error. This started happening after the last update.",
    category: "Billing", priority: "high", status: "in_progress", created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date(Date.now() - 1800000).toISOString(),
    responses: [
      { role: "agent", content: "Thank you for reporting this. We've identified the issue and our engineering team is working on a fix. Expected resolution: within 2 hours.", created_at: new Date(Date.now() - 1800000).toISOString() },
    ],
  },
  {
    id: "TK-002", subject: "Feature request: Dark mode for mobile app", description: "It would be great to have dark mode support on the mobile version of the platform. The web version already has it and it works perfectly.",
    category: "Feature Request", priority: "low", status: "open", created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString(),
    responses: [],
  },
  {
    id: "TK-003", subject: "Two-factor authentication not working", description: "I'm unable to complete 2FA setup. The QR code generates but the authentication app says the code is invalid.",
    category: "Technical", priority: "urgent", status: "resolved", created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date(Date.now() - 172800000).toISOString(),
    responses: [
      { role: "agent", content: "We found that your system clock was out of sync which causes TOTP codes to fail. Please ensure your device time is set to 'automatic'.", created_at: new Date(Date.now() - 200000000).toISOString() },
      { role: "user", content: "That fixed it! Thank you so much.", created_at: new Date(Date.now() - 172800000).toISOString() },
    ],
  },
];

const UserTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ subject: "", description: "", category: "General", priority: "medium" as Ticket["priority"] });
  const [replyText, setReplyText] = useState("");

  const handleCreate = () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    const newTicket: Ticket = {
      id: `TK-${String(tickets.length + 1).padStart(3, "0")}`,
      subject: form.subject, description: form.description, category: form.category,
      priority: form.priority, status: "open",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), responses: [],
    };
    setTickets(prev => [newTicket, ...prev]);
    setForm({ subject: "", description: "", category: "General", priority: "medium" });
    setDialogOpen(false);
    toast({ title: "Ticket created", description: `${newTicket.id} has been submitted` });
  };

  const handleReply = (ticketId: string) => {
    if (!replyText.trim()) return;
    setTickets(prev => prev.map(t => t.id === ticketId ? {
      ...t,
      responses: [...t.responses, { role: "user", content: replyText, created_at: new Date().toISOString() }],
      updated_at: new Date().toISOString(),
    } : t));
    setReplyText("");
    toast({ title: "Reply sent" });
  };

  const statusColors: Record<string, string> = {
    open: "bg-primary/10 text-primary",
    in_progress: "bg-warning/10 text-warning",
    waiting: "bg-accent/10 text-accent",
    resolved: "bg-success/10 text-success",
    closed: "bg-muted text-muted-foreground",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-warning/10 text-warning",
    urgent: "bg-destructive/10 text-destructive",
  };

  const statusIcons: Record<string, typeof Clock> = {
    open: AlertCircle,
    in_progress: Clock,
    waiting: Clock,
    resolved: CheckCircle,
    closed: CheckCircle,
  };

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground mb-6 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-sm text-muted-foreground mt-1">{tickets.filter(t => t.status !== "closed" && t.status !== "resolved").length} open tickets</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-foreground">Submit a Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Subject</Label>
                  <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief summary of the issue..." className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe your issue in detail..." className="bg-secondary border-border min-h-[120px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-foreground">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Billing">Billing</SelectItem>
                        <SelectItem value="Account">Account</SelectItem>
                        <SelectItem value="Feature Request">Feature Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Priority</Label>
                    <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Submit Ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-10 bg-secondary border-border" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map(ticket => {
              const StatusIcon = statusIcons[ticket.status] || Clock;
              const isExpanded = expandedTicket === ticket.id;
              return (
                <motion.div key={ticket.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card className="glass-hover border-border">
                    <CardContent className="p-0">
                      <div className="p-4 cursor-pointer" onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${statusColors[ticket.status]}`}>{ticket.status.replace("_", " ")}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                            </div>
                            <h3 className="text-sm font-medium text-foreground">{ticket.subject}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> {ticket.category}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(ticket.updated_at)}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {ticket.responses.length}</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border">
                          <div className="p-4">
                            <p className="text-sm text-muted-foreground mb-4">{ticket.description}</p>
                            {ticket.responses.length > 0 && (
                              <div className="space-y-3 mb-4">
                                {ticket.responses.map((r, i) => (
                                  <div key={i} className={`p-3 rounded-lg text-sm ${r.role === "agent" ? "bg-secondary" : "bg-primary/5 border border-primary/10"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium text-foreground capitalize">{r.role === "agent" ? "Support Agent" : "You"}</span>
                                      <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                                    </div>
                                    <p className="text-muted-foreground">{r.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {ticket.status !== "closed" && ticket.status !== "resolved" && (
                              <div className="flex gap-2">
                                <Input
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="bg-secondary border-border"
                                  onKeyDown={e => e.key === "Enter" && handleReply(ticket.id)}
                                />
                                <Button onClick={() => handleReply(ticket.id)} className="bg-primary text-primary-foreground shrink-0 h-10 w-10 p-0">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserTickets;
