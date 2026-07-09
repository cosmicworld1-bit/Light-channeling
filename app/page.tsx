import PasscodeGate from "@/components/PasscodeGate";
import ChatThread from "@/components/ChatThread";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <PasscodeGate>
        <ChatThread />
      </PasscodeGate>
    </main>
  );
}
