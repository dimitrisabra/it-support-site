import { beforeEach, describe, expect, it, vi } from "vitest";

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    from: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock,
}));

import { sendHumanSupportReply } from "./human-support";

describe("sendHumanSupportReply", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
  });

  it("allows resolving an escalation without reply text", async () => {
    const messageInsert = vi.fn();
    const conversationEq = vi.fn().mockResolvedValue({ error: null });
    const conversationUpdate = vi.fn().mockReturnValue({ eq: conversationEq });
    const escalationEq = vi.fn().mockResolvedValue({ error: null });
    const escalationUpdate = vi.fn().mockReturnValue({ eq: escalationEq });
    const notificationInsert = vi.fn().mockResolvedValue({ error: null });

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "messages") {
        return {
          insert: messageInsert,
        };
      }

      if (table === "conversations") {
        return {
          update: conversationUpdate,
        };
      }

      if (table === "escalations") {
        return {
          update: escalationUpdate,
        };
      }

      if (table === "notifications") {
        return {
          insert: notificationInsert,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const result = await sendHumanSupportReply({
      conversationId: "conversation-1",
      userId: "user-1",
      content: undefined,
      escalationId: "escalation-1",
      resolve: true,
    });

    expect(result).toEqual({ data: null, error: null });
    expect(messageInsert).not.toHaveBeenCalled();
    expect(conversationUpdate).toHaveBeenCalledWith({
      status: "resolved",
      updated_at: expect.any(String),
    });
    expect(conversationEq).toHaveBeenCalledWith("id", "conversation-1");
    expect(escalationUpdate).toHaveBeenCalledWith({
      status: "resolved",
      updated_at: expect.any(String),
    });
    expect(escalationEq).toHaveBeenCalledWith("id", "escalation-1");
    expect(notificationInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      title: "Support case resolved",
      message: "A support admin resolved your escalated chat.",
      type: "success",
      link: "/chat?conversation=conversation-1",
    });
  });

  it("rejects an empty non-resolve reply", async () => {
    const result = await sendHumanSupportReply({
      conversationId: "conversation-1",
      userId: "user-1",
      content: undefined,
    });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "Reply cannot be empty." });
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});
