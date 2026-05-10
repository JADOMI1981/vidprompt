"use client";

import { useState, type FormEvent } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to VidPrompt. Ask a question about prompts, video creation, or AI workflows.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = draft.trim();
    if (!prompt) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: prompt },
    ];
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to reach the agent endpoint.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.response ?? "No response received." },
      ]);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unknown error while contacting the agent."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-10">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.32em] text-slate-400">
          Agent Chat
        </p>
        <h2 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
          Talk to the AI agent
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Send a prompt and get a response from Anthropic. This is a simple chat interface built on your new route.
        </p>
      </div>

      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-3xl border px-4 py-4 shadow-sm ${
              message.role === "assistant"
                ? "border-slate-800 bg-slate-950/80"
                : "border-slate-700 bg-slate-900/80 self-end"
            }`}
          >
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
              <span>{message.role === "assistant" ? "AI" : "You"}</span>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
              {message.content}
            </p>
          </div>
        ))}
      </div>

      <form className="space-y-4" onSubmit={submitMessage}>
        <label className="grid gap-3 text-sm text-slate-300">
          <span>Send a prompt</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder="Describe the video prompt or ask the agent for help..."
            className="min-h-[120px] resize-none rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send prompt"}
          </button>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </form>
    </section>
  );
}
