import { FormEvent, useState } from "react";
import { Loader2, MessageCircle, Radio, Send, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ChatMessage = { role: "user" | "assistant"; content: string };

const welcome: ChatMessage = {
  role: "assistant",
  content: "Signal received. I am Braz Monkey's visitor agent—awake all week, slightly suspicious of Tuesdays. Ask me about the transmissions, archive, Blackbook, or the strange planet underneath it all.",
};

const prompts = ["What is Braz Monkey?", "When do new signals land?", "Tell me about the Blackbook"];

export function BrazMonkeyChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: ({ content }) => setMessages((current) => [...current, { role: "assistant", content }]),
    onError: () => setMessages((current) => [...current, { role: "assistant", content: "The signal bent around a moon. Try that question again in a second." }]),
  });

  const send = (value: string) => {
    const content = value.trim().slice(0, 500);
    if (!content || chatMutation.isPending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    chatMutation.mutate({ messages: next });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  return (
    <aside className={`bm-agent ${open ? "is-open" : ""}`} aria-label="Braz Monkey visitor agent">
      {open && (
        <div className="bm-agent-window">
          <div className="bm-agent-head">
            <div><span className="bm-agent-kicker"><Radio size={12} /> VISITOR AGENT / 24·7</span><strong>BRAZ IS LISTENING</strong></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close visitor agent"><X size={17} /></button>
          </div>
          <div className="bm-agent-messages" aria-live="polite">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`bm-agent-message ${message.role}`}><span>{message.role === "assistant" ? "BM" : "YOU"}</span><p>{message.content}</p></div>)}
            {chatMutation.isPending && <div className="bm-agent-message assistant"><span>BM</span><p className="bm-agent-thinking"><Loader2 size={13} /> decoding static...</p></div>}
          </div>
          {messages.length === 1 && <div className="bm-agent-prompts">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => send(prompt)}>{prompt} <span>↗</span></button>)}</div>}
          <form className="bm-agent-form" onSubmit={submit}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="ASK THE SIGNAL..." aria-label="Ask Braz Monkey a question" maxLength={500} /><button type="submit" disabled={!input.trim() || chatMutation.isPending} aria-label="Send question">{chatMutation.isPending ? <Loader2 size={16} /> : <Send size={16} />}</button></form>
          <p className="bm-agent-foot">AI-GENERATED REPLIES / KEEP YOUR OWN COMPASS</p>
        </div>
      )}
      <button type="button" className="bm-agent-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="bm-agent-pulse"><MessageCircle size={18} /></span><span>{open ? "CLOSE SIGNAL" : "ASK BRAZ"}</span><i>{open ? "×" : "↗"}</i>
      </button>
    </aside>
  );
}
