import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Bot, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const AdminSettings = () => {
  const [tone, setTone] = useState("friendly");
  const [maxLength, setMaxLength] = useState([300]);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI support assistant for SupportAI. Be concise, accurate, and friendly. Always try to resolve the user's issue. If you cannot help, suggest escalating to a human agent."
  );
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [showImproved, setShowImproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from("ai_settings").select("*").limit(1).single() as any;
      if (data) {
        setSystemPrompt(data.system_prompt);
        setTone(data.tone);
        setMaxLength([data.max_length]);
        setAutoEscalate(data.auto_escalate);
        setShowImproved(data.show_improved);
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const settings = {
      system_prompt: systemPrompt,
      tone,
      max_length: maxLength[0],
      auto_escalate: autoEscalate,
      show_improved: showImproved,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    };

    // Upsert: check if exists
    const { data: existing } = await supabase.from("ai_settings").select("id").limit(1).single() as any;
    if (existing) {
      await supabase.from("ai_settings").update(settings as any).eq("id", existing.id) as any;
    } else {
      await supabase.from("ai_settings").insert(settings as any) as any;
    }

    toast({ title: "Settings saved", description: "AI behavior has been updated. Changes affect all new conversations." });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">AI Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure how the AI responds to users</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="font-heading text-base text-foreground flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> System Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="bg-secondary border-border min-h-[120px] text-sm font-mono"
                placeholder="Define the AI's personality and behavior..."
              />
              <p className="text-xs text-muted-foreground mt-2">This prompt defines how the AI behaves in all conversations.</p>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="font-heading text-base text-foreground">Tone & Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Response Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="formal">Formal & Professional</SelectItem>
                    <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                    <SelectItem value="concise">Concise & Direct</SelectItem>
                    <SelectItem value="empathetic">Empathetic & Caring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground text-sm">Max Response Length</Label>
                  <span className="text-xs text-muted-foreground">{maxLength[0]} words</span>
                </div>
                <Slider value={maxLength} onValueChange={setMaxLength} min={50} max={500} step={25} className="w-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="font-heading text-base text-foreground">Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground text-sm">Auto-escalate on failure</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Mark chats as unresolved when AI confidence is low</p>
                </div>
                <Switch checked={autoEscalate} onCheckedChange={setAutoEscalate} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground text-sm">Show "Improved by admin" badge</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Display when an admin has improved a response</p>
                </div>
                <Switch checked={showImproved} onCheckedChange={setShowImproved} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
