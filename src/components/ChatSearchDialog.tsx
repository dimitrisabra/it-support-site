import { useState } from "react";
import { Search, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  id: string;
  content: string;
  role: string;
  conversation_id: string;
  created_at: string;
}

interface ChatSearchDialogProps {
  onSelectConversation: (convoId: string) => void;
}

export const ChatSearchDialog = ({ onSelectConversation }: ChatSearchDialogProps) => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !user) return;
    setSearching(true);
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id)
      .neq("status", "deleted") as any;
    if (!convos?.length) { setSearching(false); setResults([]); return; }
    const convoIds = convos.map((c: any) => c.id);
    const { data } = await supabase
      .from("messages")
      .select("id, content, role, conversation_id, created_at")
      .in("conversation_id", convoIds)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20) as any;
    setResults(data || []);
    setSearching(false);
  };

  const highlight = (text: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, 100);
    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + query.length + 30);
    return (
      <>
        {start > 0 && "..."}
        {text.slice(start, idx)}
        <span className="bg-primary/30 text-primary font-medium">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length, end)}
        {end < text.length && "..."}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Search Messages</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search your conversations..."
            className="bg-secondary border-border"
          />
          <Button onClick={handleSearch} disabled={searching} className="bg-primary text-primary-foreground shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1 mt-2">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelectConversation(r.conversation_id); setOpen(false); }}
              className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground capitalize">{r.role}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-foreground">{highlight(r.content)}</p>
            </button>
          ))}
          {results.length === 0 && query && !searching && (
            <p className="text-xs text-muted-foreground text-center py-6">No results found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
