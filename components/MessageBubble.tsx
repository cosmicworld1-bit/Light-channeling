import type { ChatMessage } from "@/lib/types";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
          isUser
            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
        }`}
      >
        {message.text}
        {/* Dedicated card components (org summary, WhatsApp link) replace this
            generic fallback once their tools are wired up in later phases. */}
        {message.uiCards?.map((card, index) => (
          <pre key={index} className="mt-2 rounded-lg bg-black/5 p-2 text-xs dark:bg-white/10">
            {JSON.stringify(card, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
}
