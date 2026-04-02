import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: string;
  content: string;
  timestamp: Date;
}

interface ChatExportProps {
  messages: Message[];
  title?: string;
}

export const ChatExport = ({ messages, title = "Conversation" }: ChatExportProps) => {
  const exportAsText = () => {
    const header = `# ${title}\nExported: ${new Date().toLocaleString()}\n${"=".repeat(40)}\n\n`;
    const body = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleTimeString()}\n${m.content}\n`)
      .join("\n---\n\n");
    const blob = new Blob([header + body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (messages.length === 0) return null;

  return (
    <Button variant="ghost" size="sm" onClick={exportAsText} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" title="Export chat">
      <Download className="h-4 w-4" />
    </Button>
  );
};
