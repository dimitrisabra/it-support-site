import { supabase } from "@/integrations/supabase/client";

function buildNotificationMessage(content: string | undefined, resolved: boolean) {
  const trimmed = (content ?? "").trim();

  if (!trimmed) {
    return resolved
      ? "A support admin resolved your escalated chat."
      : "A support admin replied to your escalated chat.";
  }

  const preview = trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;

  return resolved
    ? `A support admin resolved your escalated chat: ${preview}`
    : `A support admin replied to your escalated chat: ${preview}`;
}

export async function sendHumanSupportReply({
  conversationId,
  userId,
  content,
  escalationId,
  resolve = false,
}: {
  conversationId: string;
  userId: string;
  content?: string;
  escalationId?: string;
  resolve?: boolean;
}) {
  const trimmed = (content ?? "").trim();

  if (!trimmed && !resolve) {
    return { data: null, error: { message: "Reply cannot be empty." } };
  }

  const now = new Date().toISOString();
  let message = null;

  if (trimmed) {
    const { data: insertedMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "admin",
        content: trimmed,
      } as any)
      .select()
      .single() as any;

    if (messageError) {
      return { data: null, error: messageError };
    }

    message = insertedMessage;
  }

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({
      status: resolve ? "resolved" : "escalated",
      updated_at: now,
    } as any)
    .eq("id", conversationId) as any;

  if (conversationError) {
    return { data: null, error: conversationError };
  }

  if (escalationId) {
    const { error: escalationError } = await supabase
      .from("escalations")
      .update({
        status: resolve ? "resolved" : "in_progress",
        updated_at: now,
      } as any)
      .eq("id", escalationId) as any;

    if (escalationError) {
      return { data: null, error: escalationError };
    }
  }

  const { error: notificationError } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title: resolve ? "Support case resolved" : "Human support replied",
      message: buildNotificationMessage(trimmed, resolve),
      type: resolve ? "success" : "info",
      link: `/chat?conversation=${conversationId}`,
    } as any) as any;

  if (notificationError) {
    return { data: null, error: notificationError };
  }

  return { data: message, error: null };
}
