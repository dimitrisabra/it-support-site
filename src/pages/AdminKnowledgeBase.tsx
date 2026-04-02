import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Plus, Search, Edit2, Trash2, Tag, Clock, BookOpen, FileText, Upload, Download } from "lucide-react";
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

interface KBItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  version: number;
  created_at: string;
  updated_at: string;
}

const categories = ["All", "Account", "Billing", "Technical", "General"];

const AdminKnowledgeBase = () => {
  const [items, setItems] = useState<KBItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<KBItem | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "General" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchItems = async () => {
    const { data } = await supabase.from("knowledge_base").select("*").order("updated_at", { ascending: false }) as any;
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter((i) => {
    const matchSearch = i.question.toLowerCase().includes(search.toLowerCase()) || i.answer.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || i.category === category;
    return matchSearch && matchCat;
  });

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    if (editItem) {
      await supabase.from("knowledge_base").update({
        question: form.question, answer: form.answer, category: form.category,
        version: editItem.version + 1, updated_at: new Date().toISOString(),
      } as any).eq("id", editItem.id) as any;
      toast({ title: "Updated", description: "Knowledge base item updated. AI will use the new answer." });
    } else {
      await supabase.from("knowledge_base").insert({
        question: form.question, answer: form.answer, category: form.category, created_by: user?.id,
      } as any) as any;
      toast({ title: "Added", description: "New knowledge base item created." });
    }
    setForm({ question: "", answer: "", category: "General" });
    setEditItem(null);
    setDialogOpen(false);
    fetchItems();
  };

  const handleEdit = (item: KBItem) => {
    setEditItem(item);
    setForm({ question: item.question, answer: item.answer, category: item.category });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("knowledge_base").delete().eq("id", id) as any;
    toast({ title: "Deleted", description: "Knowledge base item removed." });
    fetchItems();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knowledge_base_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${items.length} items exported as JSON.` });
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const header = lines[0].split(",");
    const qIdx = header.findIndex(h => h.trim().toLowerCase().includes("question"));
    const aIdx = header.findIndex(h => h.trim().toLowerCase().includes("answer"));
    const cIdx = header.findIndex(h => h.trim().toLowerCase().includes("category"));
    if (qIdx === -1 || aIdx === -1) {
      toast({ title: "Invalid CSV", description: "CSV must have 'question' and 'answer' columns.", variant: "destructive" });
      return;
    }
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const question = cols[qIdx]?.trim();
      const answer = cols[aIdx]?.trim();
      const cat = cIdx !== -1 ? cols[cIdx]?.trim() : "General";
      if (question && answer) {
        await supabase.from("knowledge_base").insert({ question, answer, category: cat || "General", created_by: user?.id } as any) as any;
        count++;
      }
    }
    toast({ title: "Imported", description: `${count} items imported from CSV.` });
    fetchItems();
    e.target.value = "";
  };

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
            <h1 className="font-heading text-2xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} items — changes improve AI responses instantly
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportJSON} className="gap-1.5 border-border">
              <Download className="h-3.5 w-3.5" /> Export JSON
            </Button>
            <label>
              <Button variant="outline" size="sm" className="gap-1.5 border-border cursor-pointer" asChild>
                <span><Upload className="h-3.5 w-3.5" /> Import CSV</span>
              </Button>
              <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
            </label>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditItem(null); setForm({ question: "", answer: "", category: "General" }); } }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading text-foreground">{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-foreground">Question</Label>
                    <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="What do users ask?" className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Answer</Label>
                    <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Provide a clear answer..." className="bg-secondary border-border min-h-[120px]" />
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
                  <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {editItem ? "Update" : "Add to Knowledge Base"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search knowledge base..." className="pl-10 bg-secondary border-border" />
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
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="glass-hover border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="font-heading font-semibold text-foreground text-sm">{item.question}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.answer}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary"><Tag className="h-3 w-3" /> {item.category}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(item.updated_at)}</span>
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> v{item.version}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
            <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No items found. Add your first FAQ to start improving AI responses.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminKnowledgeBase;
