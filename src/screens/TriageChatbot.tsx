import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, CheckCircle2, ShieldAlert, Info } from 'lucide-react';
import treeData from '../data/triageTree.json';
import {
  saveTriageSession,
  type TriageAnswer,
  type TriageUrgency,
} from '../utils/storage';

// ─── Decision-Tree Types ──────────────────────────────────────────────────────

interface TreeOption {
  label: string;
  nextNodeId: string;
}

interface QuestionNode {
  id: string;
  question: string;
  options: TreeOption[];
  isLeaf?: false;
}

interface OutcomeNode {
  id: string;
  isLeaf: true;
  urgency: TriageUrgency;
  flagAsha: boolean;
  title: string;
  recommendation: string;
  ashaNotice: string;
}

type TreeNode = QuestionNode | OutcomeNode;

const TREE = treeData.nodes as Record<string, TreeNode>;
const START_ID = treeData.startNodeId;

// ─── Urgency colour helpers ───────────────────────────────────────────────────

function urgencyMeta(urgency: TriageUrgency) {
  switch (urgency) {
    case 'critical': return {
      bg: 'bg-red-50 border-red-300',
      badge: 'bg-red-100 text-red-700',
      icon: <ShieldAlert className="w-6 h-6 text-red-600" aria-hidden="true" />,
      label: 'CRITICAL',
    };
    case 'high': return {
      bg: 'bg-amber-50 border-amber-300',
      badge: 'bg-amber-100 text-amber-700',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" aria-hidden="true" />,
      label: 'HIGH',
    };
    case 'moderate': return {
      bg: 'bg-blue-50 border-blue-300',
      badge: 'bg-blue-100 text-blue-700',
      icon: <Info className="w-6 h-6 text-blue-600" aria-hidden="true" />,
      label: 'MODERATE',
    };
    case 'low': return {
      bg: 'bg-green-50 border-green-300',
      badge: 'bg-green-100 text-green-700',
      icon: <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden="true" />,
      label: 'LOW',
    };
  }
}

// ─── Chat message types ───────────────────────────────────────────────────────

interface BotMessage {
  role: 'bot';
  text: string;
  nodeId: string;
}
interface UserMessage {
  role: 'user';
  text: string;
}
type ChatMessage = BotMessage | UserMessage;

// ─── TriageChatbot ────────────────────────────────────────────────────────────

export function TriageChatbot() {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Chat transcript displayed to the user
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // The current tree node being presented
  const [currentNodeId, setCurrentNodeId] = useState<string>(START_ID);

  // Accumulated Q&A trail for localStorage
  const [answers, setAnswers] = useState<TriageAnswer[]>([]);

  // Whether we've reached a leaf outcome
  const [outcome, setOutcome] = useState<OutcomeNode | null>(null);

  // Whether the session has been saved (prevents double-saves on re-render)
  const [saved, setSaved] = useState(false);

  // ── Push initial bot question on mount ──────────────────────────────────────
  useEffect(() => {
    const node = TREE[START_ID] as QuestionNode;
    setMessages([{ role: 'bot', text: node.question, nodeId: START_ID }]);
  }, []);

  // ── Auto-scroll to bottom whenever messages change ──────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, outcome]);

  // ── Handle user selecting an option ─────────────────────────────────────────
  const handleAnswer = useCallback(
    (option: TreeOption, fromNodeId: string, question: string) => {
      const userMsg: UserMessage = { role: 'user', text: option.label };
      const updatedAnswers: TriageAnswer[] = [
        ...answers,
        { nodeId: fromNodeId, question, answer: option.label },
      ];
      setAnswers(updatedAnswers);

      const nextNode = TREE[option.nextNodeId];

      if (!nextNode) return;

      if (nextNode.isLeaf) {
        const leaf = nextNode as OutcomeNode;
        setMessages(prev => [...prev, userMsg]);
        setOutcome(leaf);

        // Persist to localStorage (offline-first sync queue)
        if (!saved) {
          saveTriageSession({
            timestamp: new Date().toISOString(),
            outcomeId: leaf.id,
            outcomeTitle: leaf.title,
            urgency: leaf.urgency,
            flagAsha: leaf.flagAsha,
            recommendation: leaf.recommendation,
            ashaNotice: leaf.ashaNotice,
            transcript: updatedAnswers,
          });
          setSaved(true);
        }
      } else {
        const qNode = nextNode as QuestionNode;
        setMessages(prev => [
          ...prev,
          userMsg,
          { role: 'bot', text: qNode.question, nodeId: qNode.id },
        ]);
        setCurrentNodeId(qNode.id);
      }
    },
    [answers, saved]
  );

  // ── Restart the chatbot ──────────────────────────────────────────────────────
  const handleRestart = () => {
    const node = TREE[START_ID] as QuestionNode;
    setMessages([{ role: 'bot', text: node.question, nodeId: START_ID }]);
    setCurrentNodeId(START_ID);
    setAnswers([]);
    setOutcome(null);
    setSaved(false);
  };

  // Derive current question node for rendering options
  const currentNode = !outcome ? (TREE[currentNodeId] as QuestionNode) : null;

  return (
    <div
      className="h-[100dvh] w-full flex flex-col"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
      >
        <button
          onClick={() => navigate('/caregiver')}
          aria-label="Go back to Caregiver Dashboard"
          className="flex items-center justify-center rounded-2xl active:scale-95 active:opacity-75 transition-all border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{
            width: 56, height: 56,
            color: 'rgb(var(--color-text-secondary))',
            background: 'rgba(var(--color-primary),0.07)',
          }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1
            className="font-extrabold text-[rgb(var(--color-text-primary))]"
            style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-xl)' }}
          >
            Cognitive Triage
          </h1>
          <p
            className="text-[rgb(var(--color-text-secondary))]"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            Offline · No internet needed
          </p>
        </div>

        {/* Restart button */}
        <button
          onClick={handleRestart}
          aria-label="Restart triage assessment"
          className="flex items-center justify-center rounded-2xl active:scale-95 active:opacity-75 transition-all border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{
            width: 56, height: 56,
            color: 'rgb(var(--color-text-secondary))',
            background: 'rgba(var(--color-primary),0.07)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
          }}
        >
          New
        </button>
      </header>

      {/* ── Chat scroll area ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        aria-live="polite"
        aria-label="Triage conversation"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white'
                    : 'text-[rgb(var(--color-text-primary))]'
                }`}
                style={{
                  background: msg.role === 'user'
                    ? 'rgb(var(--color-primary))'
                    : 'rgb(var(--color-surface-card))',
                  boxShadow: 'var(--shadow-card)',
                  fontSize: 'var(--text-base)',
                  borderRadius: msg.role === 'user'
                    ? '1.25rem 1.25rem 0.25rem 1.25rem'
                    : '1.25rem 1.25rem 1.25rem 0.25rem',
                }}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Outcome card (shown when leaf reached) ── */}
        <AnimatePresence>
          {outcome && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: 0.12 }}
            >
              <OutcomeCard outcome={outcome} />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Option buttons (shown while still in the question tree) ── */}
      <AnimatePresence>
        {currentNode && !outcome && (
          <motion.footer
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex-shrink-0 px-4 pb-6 pt-2 space-y-3"
            style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
          >
            {currentNode.options.map(option => (
              <button
                key={option.label}
                onClick={() =>
                  handleAnswer(option, currentNode.id, currentNode.question)
                }
                className="w-full font-bold rounded-3xl transition-transform active:scale-95 border-2 border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
                style={{
                  height: 64,
                  fontSize: 'var(--text-lg)',
                  background:
                    option.label === 'Yes'
                      ? 'rgb(var(--color-primary))'
                      : 'transparent',
                  color:
                    option.label === 'Yes'
                      ? '#fff'
                      : 'rgb(var(--color-text-secondary))',
                  border:
                    option.label === 'Yes'
                      ? 'none'
                      : '2px solid rgba(var(--color-text-primary),0.18)',
                }}
              >
                {option.label}
              </button>
            ))}
          </motion.footer>
        )}
      </AnimatePresence>

      {/* ── Post-outcome action buttons ── */}
      <AnimatePresence>
        {outcome && (
          <motion.footer
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-shrink-0 px-4 pb-6 pt-3 flex flex-col gap-3"
            style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
          >
            <button
              onClick={handleRestart}
              className="w-full font-bold rounded-3xl text-white flex items-center justify-center transition-transform active:scale-95 border-2 border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
              style={{
                height: 60,
                fontSize: 'var(--text-base)',
                background: 'rgb(var(--color-primary))',
                boxShadow: 'var(--shadow-float)',
              }}
            >
              Run Another Assessment
            </button>
            <button
              onClick={() => navigate('/caregiver')}
              className="w-full font-bold rounded-3xl flex items-center justify-center transition-transform active:scale-95 border-2 border-[rgba(var(--color-text-primary),0.15)] dark:bg-slate-800 dark:text-white dark:border-blue-400"
              style={{
                height: 56,
                fontSize: 'var(--text-base)',
                background: 'transparent',
                color: 'rgb(var(--color-text-secondary))',
              }}
            >
              Back to Dashboard
            </button>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── OutcomeCard ──────────────────────────────────────────────────────────────

function OutcomeCard({ outcome }: { outcome: OutcomeNode }) {
  const meta = urgencyMeta(outcome.urgency);

  return (
    <div
      className={`rounded-3xl border-2 p-5 space-y-3 ${meta.bg}`}
      role="region"
      aria-label={`Triage outcome: ${outcome.title}`}
    >
      {/* Title row */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{meta.icon}</div>
        <div className="flex-1 min-w-0">
          <span
            className={`inline-block text-xs font-extrabold uppercase tracking-wide rounded-full px-2.5 py-0.5 mb-1 ${meta.badge}`}
          >
            {meta.label} RISK
          </span>
          <h2
            className="font-extrabold text-[rgb(var(--color-text-primary))] leading-snug"
            style={{ fontSize: 'var(--text-lg)', fontFamily: 'Nunito, Inter, sans-serif' }}
          >
            {outcome.title}
          </h2>
        </div>
      </div>

      {/* Recommendation */}
      <p
        className="text-[rgb(var(--color-text-primary))] leading-relaxed"
        style={{ fontSize: 'var(--text-base)' }}
      >
        {outcome.recommendation}
      </p>

      {/* ASHA Notice */}
      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: outcome.flagAsha
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(16,185,129,0.08)',
          border: `1.5px solid ${outcome.flagAsha ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
        }}
      >
        <p
          className="font-semibold"
          style={{
            fontSize: 'var(--text-sm)',
            color: outcome.flagAsha ? 'rgb(185,28,28)' : 'rgb(4,120,87)',
          }}
        >
          {outcome.flagAsha ? '🚨 ' : '✅ '}{outcome.ashaNotice}
        </p>
      </div>

      {/* Saved indicator */}
      <p
        className="text-center font-medium text-[rgb(var(--color-text-secondary))]"
        style={{ fontSize: 'var(--text-xs)' }}
      >
        ✓ Assessment saved offline — will sync when connected
      </p>
    </div>
  );
}
