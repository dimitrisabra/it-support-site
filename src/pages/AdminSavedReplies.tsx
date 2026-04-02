import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Plus, Search, Edit2, Trash2, MessageSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface SavedReply {
  id: string;
  title: string;
  content: string;
  category: string;
  usage_count: number;
  created_at: string;
}

const categories = ["All", "Greeting", "Billing", "Technical", "Escalation", "General"];

const AdminSavedReplies = () => {
  const [replies, setReplies] = useState<SavedReply[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SavedReply | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "General" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchReplies = async () => {
    const { data } = await supabase.from("saved_replies").select("*").order("usage_count", { ascending: false }) as any;
    setReplies(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReplies(); }, []);

  const filtered = replies.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || r.category === category;
    return matchSearch && matchCat;
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editItem) {
      await supabase.from("saved_replies").update({
        title: form.title, content: form.content, category: form.category, updated_at: new Date().toISOString(),
      } as any).eq("id", editItem.id) as any;
      toast({ title: "Updated", description: "Saved reply updated." });
    } else {
      await supabase.from("saved_replies").insert({
        title: form.title, content: form.content, category: form.category, created_by: user?.id,
      } as any) as any;
      toast({ title: "Created", description: "New saved reply added." });
    }
    setForm({ title: "", content: "", category: "General" });
    setEditItem(null);
    setDialogOpen(false);
    fetchReplies();
  };

  const handleEdit = (item: SavedReply) => {
    setEditItem(item);
    setForm({ title: item.title, content: item.content, category: item.category });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("saved_replies").delete().eq("id", id) as any;
    toast({ title: "Deleted" });
    fetchReplies();
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied!", description: "Reply copied to clipboard." });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Saved Replies</h1>
            <p className="text-sm text-muted-foreground mt-1">{replies.length} canned responses for quick use</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditItem(null); setForm({ title: "", content: "", category: "General" }); } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><Plus className="h-4 w-4" /> Add Reply</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader><DialogTitle className="font-heading text-foreground">{editItem ? "Edit Reply" : "New Saved Reply"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Greeting" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Content</Label>
                  <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Reply content..." className="bg-secondary border-border min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground">{editItem ? "Update" : "Save Reply"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search replies..." className="pl-10 bg-secondary border-border" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="glass-hover border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="font-heading font-semibold text-foreground text-sm">{item.title}</h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">{item.category}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
                        <span className="text-xs text-muted-foreground mt-2 block">Used {item.usage_count} times</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.content)} className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"><Copy className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No saved replies yet. Create your first template!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSavedReplies;
