import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bot,
  Send,
  AlertTriangle,
  LogOut,
  User,
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Pin,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { streamChat } from "@/lib/chat-stream";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ChatSearchDialog } from "@/components/ChatSearchDialog";
import { ChatExport } from "@/components/ChatExport";
import { SatisfactionRating } from "@/components/SatisfactionRating";

interface Message {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  improved?: boolean;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at?: string;
  pinned?: boolean;
}

const quickSuggestions = [
  "How do I reset my password?",
  "Tell me about billing options",
  "How can I export my data?",
  "I need help with an integration",
];

const UserChat = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean | null>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const requestedConversationId = searchParams.get("conversation");
  const activeConversation = conversations.find((conversation) => conversation.id === activeConvoId) || null;
  const isEscalatedConversation = activeConversation?.status === "escalated";

  const syncConversationSearchParam = (conversationId: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (conversationId) nextParams.set("conversation", conversationId);
    else nextParams.delete("conversation");
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .neq("status", "deleted")
      .order("updated_at", { ascending: false }) as any;

    if (error) {
      toast({ title: "Couldn't load chats", description: error.message, variant: "destructive" });
      return;
    }

    const sorted = (data || []).sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
    setConversations(sorted);
  };

  const loadMessages = async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true }) as any;

    setMessages(
      (data || []).map((message: any) => ({
        id: message.id,
        role: message.role as "user" | "assistant" | "admin",
        content: message.content,
        improved: message.improved,
        timestamp: new Date(message.created_at),
      })),
    );

    if (user) {
      const msgIds = (data || []).map((message: any) => message.id);
      if (msgIds.length) {
        const { data: feedback } = await supabase
          .from("message_feedback")
          .select("message_id, rating")
          .in("message_id", msgIds) as any;
        const feedbackMap: Record<string, boolean> = {};
        (feedback || []).forEach((entry: any) => {
          feedbackMap[entry.message_id] = entry.rating;
        });
        setFeedbackGiven(feedbackMap);
      }
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setActiveConvoId(conversation.id);
    setShowRating(false);
    syncConversationSearchParam(conversation.id);
    await loadMessages(conversation.id);
  };

  const handleSearchSelect = async (convoId: string) => {
    setActiveConvoId(convoId);
    syncConversationSearchParam(convoId);
    await loadMessages(convoId);
  };

  const createNewConversation = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New Conversation" } as any)
      .select()
      .single() as any;

    if (data) {
      setActiveConvoId(data.id);
      syncConversationSearchParam(data.id);
      setMessages([]);
      setShowRating(false);
      await loadConversations();
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("conversations")
      .update({ status: "deleted", updated_at: new Date().toISOString() } as any)
      .eq("id", id) as any;

    if (error) {
      toast({
        title: "Couldn't delete chat",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
    if (activeConvoId === id) {
      setActiveConvoId(null);
      syncConversationSearchParam(null);
      setMessages([]);
      setShowRating(false);
      setFeedbackGiven({});
    }
    toast({ title: "Chat deleted", description: "The conversation was removed from your list." });
  };

  const togglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conversation = conversations.find((item) => item.id === id);
    await supabase.from("conversations").update({ pinned: !conversation?.pinned } as any).eq("id", id) as any;
    await loadConversations();
  };

  const handleFeedback = async (messageId: string, rating: boolean) => {
    if (!user) return;
    await supabase.from("message_feedback").insert({
      message_id: messageId,
      user_id: user.id,
      rating,
    } as any) as any;
    setFeedbackGiven((prev) => ({ ...prev, [messageId]: rating }));
    toast({
      title: rating ? "Thanks! 👍" : "Sorry to hear that 👎",
      description: "Your feedback helps improve our AI.",
    });
  };

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isStreaming) return;

    let convoId = activeConvoId;
    if (!convoId) {
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: user!.id, title: msgText.slice(0, 50) } as any)
        .select()
        .single() as any;
      if (!data) return;
      convoId = data.id;
      setActiveConvoId(data.id);
      syncConversationSearchParam(data.id);
      await loadConversations();
    }

    const currentConversation = conversations.find((conversation) => conversation.id === convoId);
    const humanSupportMode = currentConversation?.status === "escalated";

    const { data: userMsgData } = await supabase
      .from("messages")
      .insert({ conversation_id: convoId, role: "user", content: msgText } as any)
      .select()
      .single() as any;

    const userMsg: Message = {
      id: userMsgData?.id || crypto.randomUUID(),
      role: "user",
      content: msgText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (messages.length === 0) {
      await supabase.from("conversations").update({ title: msgText.slice(0, 50) } as any).eq("id", convoId) as any;
      loadConversations();
    }

    if (humanSupportMode) {
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() } as any)
        .eq("id", convoId) as any;
      await loadConversations();
      toast({
        title: "Message sent to human support",
        description: "Your message was delivered to the admin handling this escalation.",
      });
      return;
    }

    setIsStreaming(true);
    let assistantContent = "";
    const allMessages = [...messages, userMsg].map((message) => ({
      role: (message.role === "admin" ? "assistant" : message.role) as "user" | "assistant",
      content: message.content,
    }));

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === "streaming") {
          return prev.map((message, index) =>
            index === prev.length - 1 ? { ...message, content: assistantContent } : message,
          );
        }
        return [
          ...prev,
          { id: "streaming", role: "assistant", content: assistantContent, timestamp: new Date() },
        ];
      });
    };

    try {
      await streamChat({
        messages: allMessages,
        onDelta: upsertAssistant,
        onDone: async () => {
          const { data: aiMsgData } = await supabase
            .from("messages")
            .insert({ conversation_id: convoId, role: "assistant", content: assistantContent } as any)
            .select()
            .single() as any;

          setMessages((prev) =>
            prev.map((message) =>
              message.id === "streaming"
                ? { ...message, id: aiMsgData?.id || crypto.randomUUID() }
                : message,
            ),
          );

          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() } as any)
            .eq("id", convoId) as any;
          setIsStreaming(false);
        },
        onError: (error) => {
          toast({ title: "AI Error", description: error, variant: "destructive" });
          setIsStreaming(false);
        },
      });
    } catch {
      toast({
        title: "Connection Error",
        description: "Failed to reach AI service",
        variant: "destructive",
      });
      setIsStreaming(false);
    }
  };

  const handleEscalate = async () => {
    if (!activeConvoId || !user) return;

    const { data: existingEscalation } = await supabase
      .from("escalations")
      .select("id")
      .eq("conversation_id", activeConvoId)
      .in("status", ["pending", "in_progress"])
      .limit(1)
      .maybeSingle() as any;

    if (existingEscalation) {
      toast({
        title: "Already escalated",
        description: "A human admin is already assigned to this conversation.",
      });
      return;
    }

    await supabase.from("escalations").insert({
      conversation_id: activeConvoId,
      user_id: user.id,
      reason: "User requested human support",
    } as any);

    await supabase
      .from("conversations")
      .update({ status: "escalated", updated_at: new Date().toISOString() } as any)
      .eq("id", activeConvoId) as any;

    const { data: escalationMsg } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeConvoId,
        role: "admin",
        content:
          "Human support has been requested. You can keep replying here while a support admin reviews the conversation.",
      } as any)
      .select()
      .single() as any;

    if (escalationMsg) {
      setMessages((prev) => [
        ...prev,
        {
          id: escalationMsg.id,
          role: "admin",
          content: escalationMsg.content,
          improved: escalationMsg.improved,
          timestamp: new Date(escalationMsg.created_at),
        },
      ]);
    }

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeConvoId ? { ...conversation, status: "escalated" } : conversation,
      ),
    );
    toast({ title: "Escalated", description: "Human support can now chat with you in this conversation." });
    setShowRating(false);
    loadConversations();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  useEffect(() => {
    if (!requestedConversationId || !conversations.length) return;
    const requestedConversation = conversations.find(
      (conversation) => conversation.id === requestedConversationId,
    );
    if (requestedConversation && activeConvoId !== requestedConversation.id) {
      selectConversation(requestedConversation);
    }
  }, [requestedConversationId, conversations, activeConvoId]);

  useEffect(() => {
    if (!activeConvoId) return;

    const channel = supabase
      .channel(`user-chat-${activeConvoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvoId}`,
        },
        () => loadMessages(activeConvoId),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${activeConvoId}`,
        },
        () => loadConversations(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvoId, user]);

  return (
    <div className="min-h-screen bg-background flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-border bg-card flex flex-col shrink-0 overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <Button onClick={createNewConversation} className="w-full gap-2 bg-primary text-primary-foreground" size="sm">
                <Plus className="h-4 w-4" /> New Chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    activeConvoId === conversation.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {conversation.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{conversation.title}</span>
                  {conversation.status === "escalated" && (
                    <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                  )}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => togglePin(conversation.id, e)} className="text-muted-foreground hover:text-primary">
                      <Pin className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => deleteConversation(conversation.id, e)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
              )}
            </div>
            <div className="p-3 border-t border-border">
              <Link to="/profile" className="flex items-center gap-2 hover:bg-secondary rounded-lg px-2 py-1.5 transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{profile?.full_name || user?.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="glass border-b border-border/50 h-14 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground text-sm">SupportAI</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">Online</span>
          </div>
          <div className="flex items-center gap-1">
            <ChatSearchDialog onSelectConversation={handleSearchSelect} />
            <ChatExport messages={messages} title={activeConversation?.title} />
            <NotificationBell />
            <ThemeToggle />
            {activeConvoId && !isEscalatedConversation && (
              <Button variant="ghost" size="sm" onClick={handleEscalate} className="text-warning hover:text-warning hover:bg-warning/10 text-xs gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Escalate
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground text-xs gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
          {isEscalatedConversation && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-warning">
                <Shield className="h-4 w-4" />
                Human Support Mode
              </div>
              <p className="mt-1 text-muted-foreground">
                This conversation is escalated. New messages go to a support admin instead of the AI.
              </p>
            </div>
          )}

          {messages.length === 0 && !activeConvoId && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="font-heading text-xl font-bold text-foreground mb-2">How can I help you today?</h2>
                <p className="text-muted-foreground text-sm">Ask me anything about billing, technical issues, or account management.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-sm text-foreground text-left transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => {
              const isUserMessage = message.role === "user";
              const isAdminMessage = message.role === "admin";

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isUserMessage ? "justify-end" : "justify-start"}`}
                >
                  {!isUserMessage && (
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      {isAdminMessage ? (
                        <Shield className="h-4 w-4 text-warning" />
                      ) : (
                        <Bot className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  )}
                  <div className="max-w-[75%] group">
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUserMessage
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : isAdminMessage
                            ? "bg-warning/10 text-foreground rounded-bl-md border border-warning/20"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}
                    >
                      {!isUserMessage ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
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
                      {message.improved && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary">
                            {isAdminMessage ? "Sent by support admin" : "Improved by admin"}
                          </span>
                        </div>
                      )}
                    </div>
                    {message.role === "assistant" && message.id !== "streaming" && (
                      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleFeedback(message.id, true)}
                          disabled={feedbackGiven[message.id] !== undefined}
                          className={`p-1 rounded hover:bg-secondary ${
                            feedbackGiven[message.id] === true
                              ? "text-success"
                              : "text-muted-foreground hover:text-success"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, false)}
                          disabled={feedbackGiven[message.id] !== undefined}
                          className={`p-1 rounded hover:bg-secondary ${
                            feedbackGiven[message.id] === false
                              ? "text-destructive"
                              : "text-muted-foreground hover:text-destructive"
                          }`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isUserMessage && (
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {showRating && activeConvoId && (
            <SatisfactionRating conversationId={activeConvoId} onClose={() => setShowRating(false)} />
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-border p-4 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={isEscalatedConversation ? "Message human support..." : "Type your message..."}
              className="flex-1 bg-secondary border-border focus:border-primary h-11"
              disabled={isStreaming}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-11 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserChat;
