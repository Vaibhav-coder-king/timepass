import { motion, AnimatePresence } from 'framer-motion';
import type { MiraState } from '../../types/types';

interface MiraTranscriptBubbleProps {
  text: string | null;
  speaker: 'user' | 'mira';
  state?: MiraState;
}

/**
 * Speech bubble showing either the user's recognized speech or MIRA's reply.
 * User bubbles appear on the right; MIRA replies appear on the left.
 */
export function MiraTranscriptBubble({ text, speaker, state }: MiraTranscriptBubbleProps) {
  const isUser = speaker === 'user';
  const isThinking = !isUser && state === 'processing';
  const hasContent = Boolean(text && text.trim().length > 0) || isThinking;

  return (
    <AnimatePresence>
      {hasContent && (
        <motion.div
          key={`${speaker}-${text || 'thinking'}`}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          {/* MIRA avatar indicator */}
          {!isUser && (
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full mr-2 mt-1 flex items-center justify-center text-xs font-bold text-white shadow-sm"
              style={{
                background:
                  'radial-gradient(circle, rgb(167,139,250), rgb(91,53,234))',
              }}
              aria-hidden="true"
            >
              M
            </div>
          )}

          <div
            className="max-w-[85%] px-5 py-4 rounded-3xl"
            style={{
              background: isUser
                ? 'rgb(var(--color-primary))'
                : 'rgb(var(--color-surface-card))',
              color: isUser
                ? 'white'
                : 'rgb(var(--color-text-primary))',
              borderRadius: isUser
                ? '24px 24px 8px 24px'
                : '24px 24px 24px 8px',
              boxShadow: 'var(--shadow-card)',
              fontSize: 'var(--text-lg)',
              lineHeight: '1.5',
            }}
          >
            {/* Thinking dots when processing */}
            {isThinking && (!text || text.trim().length === 0) ? (
              <div className="flex items-center gap-2 py-1.5 px-1" aria-label="MIRA is thinking">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))] mr-1">MIRA is thinking</span>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--color-primary))]"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{text}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
