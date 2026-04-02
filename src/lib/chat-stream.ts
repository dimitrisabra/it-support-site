type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = import.meta.env.VITE_CHAT_API_URL || "/api/chat";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getChatUrls() {
  if (typeof window === "undefined") {
    return [CHAT_URL];
  }

  const urls = [CHAT_URL];
  const { hostname } = window.location;

  if (!import.meta.env.VITE_CHAT_API_URL && isLocalHost(hostname)) {
    const fallbackHost = hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
    urls.push(`http://${fallbackHost}:3001/api/chat`);
  }

  return [...new Set(urls)];
}

function shouldTryNextEndpoint(status: number, url: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const isRelativeUrl = url.startsWith("/");
  const isLocalPage = isLocalHost(window.location.hostname);

  return isLocalPage && isRelativeUrl && (status === 404 || status === 405);
}

export async function streamChat({
  messages,
  knowledgeContext,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  knowledgeContext?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (error: string) => void;
}) {
  const urls = getChatUrls();
  let lastError = "Request failed";

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, knowledgeContext }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        lastError = err.error || `Request failed (${resp.status})`;
        if (shouldTryNextEndpoint(resp.status, url)) {
          continue;
        }
        onError?.(lastError);
        return;
      }

      if (!resp.body) {
        lastError = "No response body";
        if (shouldTryNextEndpoint(405, url)) {
          continue;
        }
        onError?.(lastError);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {
            /* ignore */
          }
        }
      }

      onDone();
      return;
    } catch {
      if (url !== urls[urls.length - 1]) {
        continue;
      }
    }
  }

  onError?.(lastError);
}
