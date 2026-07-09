import PasscodeGate from "@/components/PasscodeGate";
import ChatThread from "@/components/ChatThread";

export default function Home() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <PasscodeGate>
        <ChatThread />
      </PasscodeGate>
    </main>
  );
}
