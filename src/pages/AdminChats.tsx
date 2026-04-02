import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Search, Eye, MessageSquare, Bot, User, Send, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { sendHumanSupportReply } from "@/lib/human-support";

interface Chat {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  message_count?: number;
  last_message?: string;
}

interface Msg {
  id: string;
  role: string;
  content: string;
  improved: boolean;
  created_at: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: "bg-success/10 text-success",
    resolved: "bg-primary/10 text-primary",
    escalated: "bg-warning/10 text-warning",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-secondary text-muted-foreground"}`}>{status}</span>;
};

const AdminChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewChat, setViewChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [adminReply, setAdminReply] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChats = async () => {
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .neq("status", "deleted")
      .order("updated_at", { ascending: false }) as any;
    if (!convos) { setLoading(false); return; }

    const enriched = await Promise.all(
      convos.map(async (c: any) => {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", c.user_id).single() as any;
        const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", c.id) as any;
        const { data: lastMsg } = await supabase.from("messages").select("content").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1) as any;
        return {
          ...c,
          user_name: profile?.full_name || "Unknown",
          message_count: count || 0,
          last_message: lastMsg?.[0]?.content || "No messages",
        };
      })
    );
    setChats(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-chats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchChats())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchChats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openChat = async (chat: Chat) => {
    setViewChat(chat);
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", chat.id).order("created_at", { ascending: true }) as any;
    setMessages(data || []);
  };

  useEffect(() => {
    if (!viewChat) return;

    const channel = supabase
      .channel(`admin-chat-${viewChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${viewChat.id}`,
        },
        () => openChat(viewChat),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewChat]);

  const sendAdminReply = async () => {
    if (!adminReply.trim() || !viewChat) return;

    const { data: activeEscalation } = await supabase
      .from("escalations")
      .select("id")
      .eq("conversation_id", viewChat.id)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as any;

    let replyError: any = null;

    if (activeEscalation) {
      const result = await sendHumanSupportReply({
        conversationId: viewChat.id,
        userId: viewChat.user_id,
        content: adminReply,
        escalationId: activeEscalation.id,
      });
      replyError = result.error;
    } else {
      const { error } = await supabase.from("messages").insert({
        conversation_id: viewChat.id,
        role: "admin",
        content: adminReply,
      } as any);
      replyError = error;

      if (!error) {
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() } as any).eq("id", viewChat.id) as any;
      }
    }

    if (replyError) {
      toast({ title: "Reply failed", description: replyError.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Reply sent",
      description: activeEscalation ? "The user was notified about your human-support reply." : "Your admin reply was added to the conversation.",
    });
    setAdminReply("");
    openChat(viewChat);
  };

  const filtered = chats.filter((c) => {
    const matchSearch = (c.user_name || "").toLowerCase().includes(search.toLowerCase()) || (c.last_message || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
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
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Chat Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">{chats.length} conversations — view and manage all user chats</p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user or message..." className="pl-10 bg-secondary border-border" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((chat) => (
            <Card key={chat.id} className="glass-hover border-border cursor-pointer" onClick={() => openChat(chat)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground">{chat.user_name}</span>
                      <StatusBadge status={chat.status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{chat.last_message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {chat.message_count}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(chat.updated_at)}</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations found.</p>
            </div>
          )}
        </div>

        <Dialog open={!!viewChat} onOpenChange={() => setViewChat(null)}>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> {viewChat?.user_name}
                {viewChat && <StatusBadge status={viewChat.status} />}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 space-y-3 overflow-y-auto py-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role !== "user" && (
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      {msg.role === "admin" ? (
                        <Shield className="h-3 w-3 text-warning" />
                      ) : (
                        <Bot className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    {msg.role !== "user" ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        {msg.role === "admin" && (
                          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                            <Shield className="h-3 w-3" /> Human Support
                          </div>
                        )}
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                    {msg.improved && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                        <Sparkles className="h-3 w-3" /> Improved by admin
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Textarea
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                placeholder="Send a human-support reply..."
                className="bg-secondary border-border min-h-[60px] text-sm"
              />
              <Button onClick={sendAdminReply} className="bg-primary text-primary-foreground self-end h-10 w-10 p-0 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminChats;
