import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, X, Camera, Heart, Edit3 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Memory {
  id: string;
  title: string;
  note: string;
  photo_b64: string | null;
  family_tag: string;
  created_at: string; // ISO string
}

type ViewMode = 'grid' | 'detail' | 'add' | 'edit';

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cogniva_memories';
const STORAGE_WARN_BYTES = 4 * 1024 * 1024; // 4 MB

const FAMILY_TAGS = ['Me', 'Spouse', 'Son', 'Daughter', 'Grandchild', 'Friend'];

const TAG_COLORS: Record<string, string> = {
  Me: '#6366f1',
  Spouse: '#ec4899',
  Son: '#3b82f6',
  Daughter: '#f97316',
  Grandchild: '#22c55e',
  Friend: '#a855f7',
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Memory[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveMemories(memories: Memory[]): void {
  const json = JSON.stringify(memories);
  localStorage.setItem(STORAGE_KEY, json);
}

function estimateStorageSize(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += (localStorage.getItem(key) ?? '').length * 2; // 2 bytes per char (UTF-16)
    }
  }
  return total;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MemoriesScreen() {
  const navigate = useNavigate();

  const [memories, setMemories] = useState<Memory[]>(loadMemories);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);

  // Form state (shared between add and edit)
  const [formTitle, setFormTitle] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [formTag, setFormTag] = useState('Me');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pending delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveMemories(memories);
    const size = estimateStorageSize();
    setStorageWarning(size > STORAGE_WARN_BYTES);
  }, [memories]);

  const selectedMemory = memories.find((m) => m.id === selectedId) ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openDetail = useCallback((id: string) => {
    setSelectedId(id);
    setViewMode('detail');
  }, []);

  const openAdd = useCallback(() => {
    setFormTitle('');
    setFormNote('');
    setFormPhoto(null);
    setFormTag('Me');
    setViewMode('add');
  }, []);

  const openEdit = useCallback((memory: Memory) => {
    setFormTitle(memory.title);
    setFormNote(memory.note);
    setFormPhoto(memory.photo_b64);
    setFormTag(memory.family_tag);
    setSelectedId(memory.id);
    setViewMode('edit');
  }, []);

  const handlePhotoChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') setFormPhoto(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSaveAdd = useCallback(() => {
    const trimmed = formTitle.trim();
    if (!trimmed) return;
    const newMemory: Memory = {
      id: uid(),
      title: trimmed,
      note: formNote.trim(),
      photo_b64: formPhoto,
      family_tag: formTag,
      created_at: new Date().toISOString(),
    };
    setMemories((prev) => [newMemory, ...prev]);
    setViewMode('grid');
  }, [formTitle, formNote, formPhoto, formTag]);

  const handleSaveEdit = useCallback(() => {
    if (!selectedId) return;
    setMemories((prev) =>
      prev.map((m) =>
        m.id === selectedId
          ? { ...m, title: formTitle.trim(), note: formNote.trim(), photo_b64: formPhoto, family_tag: formTag }
          : m
      )
    );
    setViewMode('detail');
  }, [selectedId, formTitle, formNote, formPhoto, formTag]);

  const handleDelete = useCallback(
    (id: string) => {
      if (pendingDeleteId === id) {
        // Confirmed
        if (pendingDeleteTimer.current) clearTimeout(pendingDeleteTimer.current);
        setPendingDeleteId(null);
        setMemories((prev) => prev.filter((m) => m.id !== id));
        setViewMode('grid');
        setSelectedId(null);
      } else {
        if (pendingDeleteTimer.current) clearTimeout(pendingDeleteTimer.current);
        setPendingDeleteId(id);
        pendingDeleteTimer.current = setTimeout(() => setPendingDeleteId(null), 3000);
      }
    },
    [pendingDeleteId]
  );

  const goBack = useCallback(() => {
    if (viewMode === 'grid') {
      navigate(-1);
    } else if (viewMode === 'detail') {
      setViewMode('grid');
    } else if (viewMode === 'add') {
      setViewMode('grid');
    } else if (viewMode === 'edit') {
      setViewMode('detail');
    }
  }, [viewMode, navigate]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'rgb(var(--color-surface-bg))',
        color: 'rgb(var(--color-text-primary))',
        paddingBottom: '5rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1.25rem 1rem 0.875rem',
          backgroundColor: 'rgb(var(--color-surface-card))',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <button onClick={goBack} aria-label="Go back" style={backBtnStyle}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700 }}>
            {viewMode === 'add'
              ? 'Add Memory 📸'
              : viewMode === 'edit'
              ? 'Edit Memory ✏️'
              : 'My Memories 💝'}
          </h1>
          {viewMode === 'grid' && (
            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-sm)',
                color: 'rgb(var(--color-text-secondary))',
              }}
            >
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} saved
            </p>
          )}
        </div>
      </div>

      {storageWarning && (
        <div
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#fef9c3',
            color: '#854d0e',
            fontSize: 'var(--text-sm)',
            textAlign: 'center',
          }}
        >
          ⚠️ Storage is getting large. Consider removing old photos.
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Grid View ─────────────────────────────────────────────────── */}
        {viewMode === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ padding: '1rem' }}
          >
            {memories.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '4rem',
                  color: 'rgb(var(--color-text-secondary))',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📸</div>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 0.5rem' }}>
                  No memories yet.
                </p>
                <p style={{ fontSize: 'var(--text-base)', margin: 0 }}>
                  Add your first one!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                }}
              >
                {memories.map((m) => (
                  <MemoryCard key={m.id} memory={m} onClick={() => openDetail(m.id)} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Detail View ───────────────────────────────────────────────── */}
        {viewMode === 'detail' && selectedMemory && (
          <motion.div
            key="detail"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ padding: '1rem' }}
          >
            {selectedMemory.photo_b64 ? (
              <img
                src={selectedMemory.photo_b64}
                alt={selectedMemory.title}
                style={{
                  width: '100%',
                  borderRadius: 16,
                  maxHeight: 300,
                  objectFit: 'cover',
                  marginBottom: '1rem',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 160,
                  borderRadius: 16,
                  backgroundColor: 'rgba(var(--color-primary), 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  marginBottom: '1rem',
                }}
              >
                📷
              </div>
            )}

            <TagBadge tag={selectedMemory.family_tag} />
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>
              {selectedMemory.title}
            </h2>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'rgb(var(--color-text-secondary))',
                margin: '0 0 0.875rem',
              }}
            >
              {formatDate(selectedMemory.created_at)}
            </p>

            {selectedMemory.note && (
              <p
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'rgb(var(--color-text-primary))',
                  lineHeight: 1.6,
                  backgroundColor: 'rgb(var(--color-surface-card))',
                  padding: '0.875rem',
                  borderRadius: 12,
                  margin: '0 0 1rem',
                }}
              >
                {selectedMemory.note}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => openEdit(selectedMemory)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  borderRadius: 12,
                  border: '1.5px solid rgb(var(--color-primary))',
                  backgroundColor: 'transparent',
                  color: 'rgb(var(--color-primary))',
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Edit3 size={18} /> Edit
              </button>
              <button
                onClick={() => handleDelete(selectedMemory.id)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  borderRadius: 12,
                  border: pendingDeleteId === selectedMemory.id ? '2px solid #ef4444' : '1.5px solid rgba(var(--color-text-secondary), 0.3)',
                  backgroundColor: pendingDeleteId === selectedMemory.id ? '#fee2e2' : 'transparent',
                  color: pendingDeleteId === selectedMemory.id ? '#ef4444' : 'rgb(var(--color-text-secondary))',
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={18} />
                {pendingDeleteId === selectedMemory.id ? 'Tap again' : 'Delete'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Add / Edit Form ───────────────────────────────────────────── */}
        {(viewMode === 'add' || viewMode === 'edit') && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}
          >
            {/* Photo picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                height: 180,
                borderRadius: 16,
                backgroundColor: 'rgb(var(--color-surface-card))',
                border: '2px dashed rgba(var(--color-primary), 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                marginBottom: '0.75rem',
              }}
            >
              {formPhoto ? (
                <img
                  src={formPhoto}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'rgb(var(--color-text-secondary))' }}>
                  <Camera size={32} style={{ marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Tap to add photo</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />

            {formPhoto && (
              <button
                onClick={() => setFormPhoto(null)}
                style={{
                  alignSelf: 'flex-end',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgb(var(--color-text-secondary))',
                  fontSize: 'var(--text-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginBottom: '0.25rem',
                }}
              >
                <X size={14} /> Remove photo
              </button>
            )}

            <label style={labelStyle}>Title *</label>
            <input
              autoFocus={viewMode === 'add'}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Picnic at Kaziranga 🌿"
              style={inputStyle}
            />

            <label style={labelStyle}>Write something to remember...</label>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Write something to remember..."
              rows={4}
              style={{ ...inputStyle, resize: 'none' }}
            />

            <label style={labelStyle}>Family Member</label>
            <select
              value={formTag}
              onChange={(e) => setFormTag(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              {FAMILY_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <button
              onClick={viewMode === 'add' ? handleSaveAdd : handleSaveEdit}
              disabled={!formTitle.trim()}
              style={{
                marginTop: '0.75rem',
                width: '100%',
                padding: '0.875rem',
                backgroundColor: formTitle.trim()
                  ? 'rgb(var(--color-primary))'
                  : 'rgba(var(--color-text-secondary), 0.3)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                cursor: formTitle.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Heart size={18} />
              {viewMode === 'add' ? 'Save Memory' : 'Save Changes'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — only on grid view */}
      {viewMode === 'grid' && (
        <button
          onClick={openAdd}
          aria-label="Add memory"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'rgb(var(--color-primary))',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 100,
          }}
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}

// ─── MemoryCard ───────────────────────────────────────────────────────────────

function MemoryCard({ memory, onClick }: { memory: Memory; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgb(var(--color-surface-card))',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          height: '100%',
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: '100%',
            height: 120,
            backgroundColor: 'rgba(var(--color-primary), 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {memory.photo_b64 ? (
            <img
              src={memory.photo_b64}
              alt={memory.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '2.5rem' }}>📷</span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '0.625rem' }}>
          <TagBadge tag={memory.family_tag} small />
          <p
            style={{
              margin: '0.3rem 0 0.2rem',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'rgb(var(--color-text-primary))',
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {memory.title}
          </p>
          {memory.note && (
            <p
              style={{
                margin: '0 0 0.2rem',
                fontSize: 'var(--text-sm)',
                color: 'rgb(var(--color-text-secondary))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {memory.note.slice(0, 100)}
            </p>
          )}
          <p
            style={{
              margin: 0,
              fontSize: '0.65rem',
              color: 'rgb(var(--color-text-secondary))',
            }}
          >
            {formatDate(memory.created_at)}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── TagBadge ─────────────────────────────────────────────────────────────────

function TagBadge({ tag, small = false }: { tag: string; small?: boolean }) {
  const color = TAG_COLORS[tag] ?? '#6366f1';
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: color + '22',
        color,
        borderRadius: 6,
        padding: small ? '1px 6px' : '3px 10px',
        fontSize: small ? '0.65rem' : 'var(--text-sm)',
        fontWeight: 700,
      }}
    >
      {tag}
    </span>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgb(var(--color-primary))',
  padding: '0.5rem',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 44,
  minHeight: 44,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'rgb(var(--color-text-secondary))',
  marginBottom: '0.3rem',
  marginTop: '0.625rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  borderRadius: 10,
  border: '1.5px solid rgba(var(--color-text-secondary), 0.25)',
  fontSize: 'var(--text-base)',
  backgroundColor: 'rgb(var(--color-surface-bg))',
  color: 'rgb(var(--color-text-primary))',
  outline: 'none',
  boxSizing: 'border-box',
};
