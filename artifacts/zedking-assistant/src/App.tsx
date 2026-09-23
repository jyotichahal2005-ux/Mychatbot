import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSendChat, type ChatMessage } from '@workspace/api-client-react';
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Clock3,
  GraduationCap,
  IndianRupee,
  Menu,
  MessageCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

const firstMessage: ChatMessage = {
  role: 'assistant',
  content:
    'Namaste! Main Zedking Assistant hoon 🙋‍♂️ Aap mujhse courses, fees, admission, ya location ke baare me kuch bhi pooch sakte ho.',
};

const quickPrompts = [
  {
    title: 'Find my course',
    subtitle: 'मेरे लिए सही कोर्स',
    prompt: 'Which computer course would be right for me?',
    icon: GraduationCap,
  },
  {
    title: 'See course fees',
    subtitle: 'फीस की जानकारी',
    prompt: 'Please share the course fees and payment options.',
    icon: IndianRupee,
  },
  {
    title: 'Admission help',
    subtitle: 'एडमिशन कैसे लें?',
    prompt: 'How can I apply and what documents should I bring?',
    icon: BookOpen,
  },
];

function InstituteMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`relative shrink-0 ${small ? 'h-9 w-9' : 'h-12 w-12'}`} aria-label="Zed-King logo placeholder">
      <div className="absolute inset-0 rotate-45 rounded-[13px] bg-[hsl(var(--accent))] shadow-[4px_4px_0_rgba(241,157,33,.2)]" />
      <div className="absolute inset-[4px] flex rotate-0 items-center justify-center rounded-[9px] bg-[hsl(var(--sidebar))]">
        <span className={`font-display font-bold tracking-[-.08em] text-[hsl(var(--accent))] ${small ? 'text-[11px]' : 'text-sm'}`}>ZK</span>
      </div>
    </div>
  );
}

function SidePanel({ onClose }: { onClose?: () => void }) {
  return (
    <aside className="flex h-full w-[294px] shrink-0 flex-col bg-[hsl(var(--sidebar))] px-6 py-6 text-[hsl(var(--sidebar-foreground))] shadow-[12px_0_38px_rgba(25,39,70,.1)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <InstituteMark />
          <div>
            <p className="font-display text-[17px] font-bold leading-none tracking-[-.04em]">ZED-KING</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[.19em] text-[hsl(var(--accent))]">Group of Institute</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close menu"
            data-testid="button-close-menu"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mt-12">
        <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-slate-400">Your digital front desk</p>
        <h2 className="mt-4 font-display text-[29px] font-semibold leading-[1.08] tracking-[-.055em]">
          A clearer next step<span className="text-[hsl(var(--accent))]">.</span>
        </h2>
        <p className="mt-4 max-w-[220px] text-[13px] leading-6 text-slate-300">
          Course guidance that feels like a conversation with our admissions team.
        </p>
      </div>

      <div className="mt-auto">
        <div className="mb-5 h-px bg-white/10" />
        <div className="space-y-4 text-[12px]">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" />
            <div>
              <p className="font-semibold text-slate-100">Kaithal campus</p>
              <p className="mt-0.5 leading-5 text-slate-400">Haryana, India</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock3 size={16} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" />
            <div>
              <p className="font-semibold text-slate-100">Admissions desk</p>
              <p className="mt-0.5 leading-5 text-slate-400">Monday–Saturday · 9 AM–6 PM</p>
            </div>
          </div>
        </div>
        <a
          href="https://maps.google.com/?q=Zed-King+Group+of+Institute+Kaithal"
          target="_blank"
          rel="noreferrer"
          data-testid="link-campus-directions"
          className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.06] px-3.5 py-3 text-[12px] font-semibold text-slate-200 transition-colors hover:border-[hsl(var(--accent))]/50 hover:bg-white/10"
        >
          Visit us in Kaithal
          <ArrowUpRight size={15} className="text-[hsl(var(--accent))]" />
        </a>
        <p className="mt-5 flex items-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck size={12} /> Official institute guidance
        </p>
      </div>
    </aside>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3" data-testid="status-typing">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[hsl(var(--primary))] text-[hsl(var(--accent))] shadow-sm">
        <MessageCircle size={15} />
      </div>
      <div className="rounded-[4px_17px_17px_17px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]"
              style={{ animationDelay: `${dot * 130}ms` }}
            />
          ))}
          <span className="ml-1 text-[11px] text-[hsl(var(--muted-foreground))]">Zed-King is typing</span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={`animate-enter-up flex items-end gap-3 ${isAssistant ? '' : 'justify-end'}`} style={{ animationDelay: `${Math.min(index * 60, 240)}ms` }}>
      {isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[hsl(var(--primary))] text-[hsl(var(--accent))] shadow-sm">
          <MessageCircle size={15} />
        </div>
      )}
      <div
        data-testid={`message-${message.role}-${index}`}
        className={
          isAssistant
            ? 'max-w-[min(580px,84%)] whitespace-pre-line rounded-[4px_19px_19px_19px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] px-4 py-3.5 text-[13px] leading-[1.7] text-[hsl(var(--foreground))] shadow-[var(--shadow-sm)]'
            : 'max-w-[min(500px,84%)] whitespace-pre-line rounded-[19px_4px_19px_19px] bg-[hsl(var(--primary))] px-4 py-3.5 text-[13px] leading-[1.7] text-[hsl(var(--primary-foreground))] shadow-[0_7px_18px_rgba(39,65,116,.18)]'
        }
      >
        {message.content}
      </div>
    </div>
  );
}

function QuickPrompt({ item, onSelect, disabled }: { item: (typeof quickPrompts)[number]; onSelect: (prompt: string) => void; disabled: boolean }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(item.prompt)}
      data-testid={`button-prompt-${item.title.toLowerCase().replaceAll(' ', '-')}`}
      className="group flex min-h-[82px] flex-1 items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[rgba(255,252,246,.72)] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--secondary))] hover:shadow-[var(--shadow-sm)] disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] transition-colors group-hover:bg-[hsl(var(--accent))]">
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-bold leading-4 text-[hsl(var(--foreground))]">{item.title}</span>
        <span className="mt-1 block truncate text-[10px] text-[hsl(var(--muted-foreground))]">{item.subtitle}</span>
      </span>
      <ChevronRight size={15} className="ml-auto shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([firstMessage]);
  const [draft, setDraft] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [requestError, setRequestError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendChat = useSendChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sendChat.isPending]);

  const submitMessage = (value: string) => {
    const content = value.trim();
    if (!content || sendChat.isPending) return;
    const userMessage: ChatMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setRequestError('');
    sendChat.mutate(
      { data: { messages: nextMessages } },
      {
        onSuccess: (response) => {
          setMessages((current) => [...current, { role: 'assistant', content: response.message }]);
        },
        onError: () => {
          setRequestError('We could not reach the admissions desk. Please try again.');
        },
      },
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitMessage(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage(draft);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setDraft('');
    setRequestError('');
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <main className="app-grain min-h-[100dvh] p-0 text-[hsl(var(--foreground))] md:p-5 lg:p-7">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1380px] overflow-hidden border-[hsl(var(--border))] bg-[rgba(255,252,246,.48)] md:min-h-[calc(100dvh-40px)] md:rounded-[27px] md:border md:shadow-[var(--shadow-md)] lg:min-h-[calc(100dvh-56px)]">
        <div className="fixed inset-0 z-30 bg-[hsl(var(--sidebar))]/60 backdrop-blur-[2px] md:hidden" hidden={!mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
        <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:relative md:z-0 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidePanel onClose={() => setMobileMenuOpen(false)} />
        </div>

        <section className="flex min-w-0 flex-1 flex-col bg-[rgba(255,252,246,.52)]">
          <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[hsl(var(--border))] bg-[rgba(255,252,246,.72)] px-5 backdrop-blur-md sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open menu"
                data-testid="button-open-menu"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl p-2 text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--secondary))] md:hidden"
              >
                <Menu size={20} />
              </button>
              <div className="relative">
                <InstituteMark small />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--card))] bg-[#46a875]" aria-label="Online" />
              </div>
              <div>
                <p className="font-display text-[14px] font-bold tracking-[-.025em]">Zed-King Assistant</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                  <span className="h-1 w-1 rounded-full bg-[#46a875]" /> Online · replies in English & Hindi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetChat}
              disabled={sendChat.isPending}
              data-testid="button-new-conversation"
              className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-[11px] font-bold text-[hsl(var(--muted-foreground))] transition-all hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--primary))] disabled:opacity-50 sm:px-3.5"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">New conversation</span>
              <span className="sm:hidden">New</span>
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-7 sm:px-10 sm:py-9 lg:px-[clamp(2.5rem,8vw,8rem)]">
              <div className="mx-auto w-full max-w-[720px]">
                <div className="mb-7 flex items-center gap-3" data-testid="text-welcome-eyebrow">
                  <span className="h-px w-7 bg-[hsl(var(--accent))]" />
                  <span className="font-mono-ui text-[10px] font-medium uppercase tracking-[.19em] text-[hsl(var(--muted-foreground))]">Admissions, made clearer</span>
                </div>

                {messages.length === 0 && !sendChat.isPending ? (
                  <div className="animate-enter-up rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[rgba(255,252,246,.6)] p-8 text-center" data-testid="empty-conversation">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Sparkles size={20} /></span>
                    <h1 className="mt-4 font-display text-xl font-bold tracking-[-.04em]">Let’s start fresh.</h1>
                    <p className="mx-auto mt-2 max-w-[310px] text-[12px] leading-5 text-[hsl(var(--muted-foreground))]">Ask about courses, fees, or your next step at Zed-King.</p>
                    <button type="button" onClick={() => setMessages([firstMessage])} data-testid="button-restore-welcome" className="mt-5 text-[11px] font-bold text-[hsl(var(--primary))] underline decoration-[hsl(var(--accent))] underline-offset-4">Start with a welcome</button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((message, index) => <ChatBubble key={`${message.role}-${index}`} message={message} index={index} />)}
                    {sendChat.isPending && <TypingIndicator />}
                    {requestError && (
                      <div className="animate-enter-up ml-11 flex max-w-[500px] items-center justify-between gap-3 rounded-xl border border-[#e8b9ad] bg-[#fff4ef] px-3.5 py-3 text-[11px] text-[#a74c3e]" role="alert" data-testid="status-chat-error">
                        <span>{requestError}</span>
                        <button type="button" onClick={() => submitMessage(messages[messages.length - 1]?.content ?? '')} data-testid="button-retry-chat" className="shrink-0 font-bold underline underline-offset-2">Retry</button>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}

                {messages.length <= 1 && !sendChat.isPending && (
                  <div className="mt-10">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles size={13} className="text-[hsl(var(--accent))]" />
                      <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Try asking</p>
                    </div>
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      {quickPrompts.map((item) => <QuickPrompt key={item.title} item={item} onSelect={submitMessage} disabled={sendChat.isPending} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-[hsl(var(--border))] bg-[rgba(255,252,246,.72)] px-5 pb-4 pt-4 backdrop-blur-md sm:px-10 sm:pb-6 lg:px-[clamp(2.5rem,8vw,8rem)]">
              <div className="mx-auto max-w-[720px]">
                <form onSubmit={handleSubmit} className="relative flex items-end rounded-2xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] p-1.5 shadow-[0_9px_25px_rgba(35,48,79,.07)] transition-colors focus-within:border-[hsl(var(--primary))] focus-within:ring-4 focus-within:ring-[hsl(var(--primary))]/10">
                  <label htmlFor="chat-message" className="sr-only">Message Zed-King Assistant</label>
                  <textarea
                    id="chat-message"
                    ref={inputRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    maxLength={4000}
                    disabled={sendChat.isPending}
                    placeholder="Ask about courses, fees, or admission..."
                    data-testid="input-chat-message"
                    className="max-h-32 min-h-[45px] flex-1 resize-none bg-transparent px-3.5 py-3 text-[13px] leading-5 text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] disabled:cursor-wait"
                  />
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!draft.trim() || sendChat.isPending}
                    data-testid="button-send-message"
                    className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_4px_10px_rgba(39,65,116,.2)] transition-all hover:-translate-y-0.5 hover:bg-[#1b376b] disabled:pointer-events-none disabled:opacity-35"
                  >
                    <ArrowUpRight size={18} strokeWidth={2.4} />
                  </button>
                </form>
                <p className="mt-2.5 flex items-center justify-center gap-1 text-center text-[10px] text-[hsl(var(--muted-foreground))]">
                  <ShieldCheck size={11} /> Guidance from Zed-King Group of Institute · Press Enter to send
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Router() {
  return (
    <ErrorBoundary resetKey={useLocation()[0]}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;