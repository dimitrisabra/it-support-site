import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bot, Search, BookOpen, ChevronDown, ChevronUp, MessageSquare, ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface KBItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const categories = ["All", "Account", "Billing", "Technical", "General"];

const HelpCenter = () => {
  const [items, setItems] = useState<KBItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKB = async () => {
      const { data } = await supabase.from("knowledge_base").select("id, question, answer, category").order("created_at", { ascending: false }) as any;
      setItems(data || []);
      setLoading(false);
    };
    fetchKB();
  }, []);

  const filtered = items.filter(i => {
    const matchSearch = i.question.toLowerCase().includes(search.toLowerCase()) || i.answer.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || i.category === category;
    return matchSearch && matchCat;
  });

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
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground">Sign In</Button>
            </Link>
            <Link to="/chat">
              <Button size="sm" className="bg-primary text-primary-foreground gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Chat with AI
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Help Center</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Find answers to commonly asked questions. Can't find what you need? Start a chat with our AI.</p>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for answers..." className="pl-10 bg-secondary border-border h-11" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-2xl mx-auto space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="glass-hover border-border">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{item.category}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{item.question}</span>
                      </div>
                      {expandedId === item.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>
                    {expandedId === item.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-4 pb-4 border-t border-border pt-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.answer}</p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No articles found</p>
              <Link to="/chat">
                <Button className="mt-4 bg-primary text-primary-foreground gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Ask our AI instead
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;
