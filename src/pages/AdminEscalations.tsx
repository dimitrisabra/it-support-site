import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import AdminSidebar from "@/components/AdminSidebar";
import {
  AlertCircle,
  Send,
  User,
  Bot,
  Clock,
  CheckCircle,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendHumanSupportReply } from "@/lib/human-support";

interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  created_at: string;
}

interface Escalation {
  id: string;
  conversation_id: string;
  user_id: string;
  reason: string | null;
  status: string;
  created_at: string;
  user_name?: string;
  messages?: ConversationMessage[];
  conversation_status?: string | null;
}

const AdminEscalations = () => {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeAction, setActiveAction] = useState<Record<string, "reply" | "resolve" | null>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEscalations = async () => {
    const { data } = await supabase
      .from("escalations")
      .select("*")
      .order("created_at", { ascending: false }) as any;

    if (!data) {
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      data.map(async (escalation: any) => {
        const { data: conversation } = await supabase
          .from("conversations")
          .select("status")
          .eq("id", escalation.conversation_id)
          .maybeSingle() as any;

        if (!conversation || conversation.status === "deleted") {
          return null;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", escalation.user_id)
          .single() as any;

        const { data: messages } = await supabase
          .from("messages")
          .select("id, role, content, created_at")
          .eq("conversation_id", escalation.conversation_id)
          .order("created_at", { ascending: true }) as any;

        return {
          ...escalation,
          user_name: profile?.full_name || "Unknown User",
          messages: (messages || []) as ConversationMessage[],
          conversation_status: conversation.status,
        };
      }),
    );

    setEscalations(enriched.filter(Boolean) as Escalation[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEscalations();
    const channel = supabase
      .channel("esc-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "escalations" }, () => fetchEscalations())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchEscalations())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleReply = async (escalation: Escalation, resolve = false) => {
    const text = replyText[escalation.id];
    if (!resolve && !text?.trim()) return;

    setActiveAction((prev) => ({
      ...prev,
      [escalation.id]: resolve ? "resolve" : "reply",
    }));

    try {
      const { error } = await sendHumanSupportReply({
        conversationId: escalation.conversation_id,
        userId: escalation.user_id,
        content: text,
        escalationId: escalation.id,
        resolve,
      });

      if (error) {
        toast({ title: "Reply failed", description: error.message, variant: "destructive" });
        return;
      }

      setReplyText((prev) => ({ ...prev, [escalation.id]: "" }));
      setEscalations((prev) =>
        prev.map((item) => {
          if (item.id !== escalation.id) return item;

          const nextMessages = text?.trim()
            ? [
                ...(item.messages || []),
                {
                  id: `local-${Date.now()}`,
                  role: "admin" as const,
                  content: text.trim(),
                  created_at: new Date().toISOString(),
                },
              ]
            : item.messages;

          return {
            ...item,
            status: resolve ? "resolved" : "in_progress",
            messages: nextMessages,
          };
        }),
      );
      toast({
        title: resolve ? "Resolved" : "Reply sent",
        description: resolve
          ? "The user was notified that the case is resolved."
          : "The user was notified about your reply.",
      });
      await fetchEscalations();
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unexpected error while updating the escalation.";
      toast({ title: "Reply failed", description, variant: "destructive" });
    } finally {
      setActiveAction((prev) => ({ ...prev, [escalation.id]: null }));
    }
  };

  const unresolvedCount = escalations.filter((escalation) => escalation.status !== "resolved").length;

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-foreground">Escalations</h1>
              {unresolvedCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-semibold animate-pulse">
                  {unresolvedCount} open
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Live human-support conversations for escalated users
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEscalations} className="gap-2 border-border">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {escalations.map((escalation) => (
            <Card
              key={escalation.id}
              className={`border-border ${escalation.status === "resolved" ? "opacity-70" : "glass"}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">{escalation.user_name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {timeAgo(escalation.created_at)}
                      </div>
                    </div>
                  </div>
                  {escalation.status === "resolved" ? (
                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                      <CheckCircle className="h-3.5 w-3.5" /> Resolved
                    </span>
                  ) : escalation.status === "in_progress" ? (
                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                      <RefreshCw className="h-3.5 w-3.5" /> In progress
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-warning font-medium">
                      <AlertCircle className="h-3.5 w-3.5" /> Pending
                    </span>
                  )}
                </div>

                {escalation.reason && (
                  <p className="text-xs text-muted-foreground mb-4 italic">Reason: {escalation.reason}</p>
                )}

                <div className="rounded-2xl border border-border bg-secondary/20 p-3 mb-4">
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(escalation.messages || []).map((message) => {
                      const isUserMessage = message.role === "user";
                      const isAdminMessage = message.role === "admin";

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${isUserMessage ? "justify-end" : "justify-start"}`}
                        >
                          {!isUserMessage && (
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                              {isAdminMessage ? (
                                <Shield className="h-3.5 w-3.5 text-warning" />
                              ) : (
                                <Bot className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                              isUserMessage
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : isAdminMessage
                                  ? "bg-warning/10 text-foreground border border-warning/20 rounded-bl-md"
                                  : "bg-secondary text-secondary-foreground rounded-bl-md"
                            }`}
                          >
                            {!isUserMessage ? (
                              <div className="prose prose-sm prose-invert max-w-none">
                                {isAdminMessage && (
                                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                                    <Shield className="h-3 w-3" />
                                    Human Support
                                  </div>
                                )}
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              message.content
                            )}
                          </div>
                          {isUserMessage && (
                            <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {!escalation.messages?.length && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No messages yet for this escalation.
                      </p>
                    )}
                  </div>
                </div>

                {escalation.status !== "resolved" && (
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={replyText[escalation.id] || ""}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [escalation.id]: e.target.value }))}
                      placeholder="Type your reply to the user..."
                      className="bg-secondary border-border min-h-[72px] text-sm"
                      disabled={!!activeAction[escalation.id]}
                    />
                    <Button
                      type="button"
                      onClick={() => handleReply(escalation)}
                      disabled={!!activeAction[escalation.id] || !(replyText[escalation.id] || "").trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 self-end h-10 w-10 p-0"
                      title="Send reply"
                    >
                      {activeAction[escalation.id] === "reply" ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleReply(escalation, true)}
                      disabled={!!activeAction[escalation.id]}
                      variant="outline"
                      className="border-border shrink-0"
                    >
                      {activeAction[escalation.id] === "resolve" ? "Resolving..." : "Resolve"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {!loading && escalations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No escalations. Everything is running smoothly!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminEscalations;
