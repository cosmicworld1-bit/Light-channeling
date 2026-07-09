import type { ChatMessage, UiCard } from "@/lib/types";
import OrgSummaryCard from "./OrgSummaryCard";
import OrgMatchesCard from "./OrgMatchesCard";

function renderCard(card: UiCard, index: number) {
  switch (card.type) {
    case "org_summary":
      return <OrgSummaryCard key={index} card={card} />;
    case "org_matches":
      return <OrgMatchesCard key={index} card={card} />;
    default:
      return (
        <pre key={index} className="mt-2 rounded-lg bg-black/5 p-2 text-xs dark:bg-white/10">
          {JSON.stringify(card, null, 2)}
        </pre>
      );
  }
}

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
        {message.uiCards?.map((card, index) => renderCard(card, index))}
      </div>
    </div>
  );
}
