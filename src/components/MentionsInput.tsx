import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type MentionUser = {
  id: string;
  display_name: string;
  email?: string;
  handle?: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  users: MentionUser[];
  onSelectUser?: (u: MentionUser) => void;
  insertFormat?: "text" | "chip";
  placeholder?: string;
  rows?: number;
  onEnter?: () => void;
};

type ActiveToken = {
  start: number;
  end: number;
  q: string;
};

function findActiveToken(value: string, caret: number): ActiveToken | null {
  const upto = value.slice(0, caret);
  const m = upto.match(/(?:^|[\s.,!?])@([a-zA-Z0-9._-]{0,50})$/);
  if (!m) return null;
  const q = m[1] ?? "";
  const atIndex = upto.lastIndexOf("@");
  const start = atIndex;
  const end = caret;
  return { start, end, q };
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <span className="font-semibold text-white">{match}</span>
      {after}
    </>
  );
}

const MentionsInput: React.FC<Props> = ({
  value,
  onChange,
  users,
  onSelectUser,
  insertFormat = "text",
  placeholder,
  rows = 1,
  onEnter,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rafRef = useRef<number | null>(null);
  const [caretPos, setCaretPos] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [panelVisible, setPanelVisible] = useState(false);

  const token = useMemo(() => findActiveToken(value, caretPos), [value, caretPos]);

  useEffect(() => {
    const q = token?.q ?? "";
    const t = setTimeout(() => setDebouncedQuery(q), 150);
    return () => clearTimeout(t);
  }, [token]);

  const filtered = useMemo(() => {
    if (!token) return [];
    const q = debouncedQuery.toLowerCase();
    const list = users.filter((u) => {
      const n = (u.display_name || "").toLowerCase();
      const e = (u.email || "").toLowerCase();
      const h = (u.handle || "").toLowerCase();
      return q.length === 0 || n.includes(q) || e.includes(q) || h.includes(q);
    });
    return list.slice(0, 50);
  }, [users, token, debouncedQuery]);

  useEffect(() => {
    const shouldOpen = !!token;
    setOpen(shouldOpen);
    setActiveIdx(0);
    setPanelVisible(shouldOpen);
  }, [token]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setPanelVisible(false);
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const scheduleCaretUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const pos = el.selectionStart ?? 0;
        setCaretPos((prev) => (prev !== pos ? pos : prev));
      });
    };

    el.addEventListener("keyup", scheduleCaretUpdate);
    el.addEventListener("click", scheduleCaretUpdate);
    el.addEventListener("input", scheduleCaretUpdate);
    el.addEventListener("blur", () => {
      setTimeout(() => closeDropdown(), 80);
    });

    return () => {
      el.removeEventListener("keyup", scheduleCaretUpdate);
      el.removeEventListener("click", scheduleCaretUpdate);
      el.removeEventListener("input", scheduleCaretUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [closeDropdown]);

  function insertUser(u: MentionUser) {
    if (!token || !inputRef.current) return;
    const el = inputRef.current;
    const currentCaret = el.selectionStart ?? 0;
    const currentToken = findActiveToken(value, currentCaret);
    const t = currentToken || token;

    const prefix = value.slice(0, t.start);
    const suffix = value.slice(t.end);
    const mentionText =
      insertFormat === "text" ? `@${u.handle ?? u.display_name}` : `@${u.display_name}`;
    const next = `${prefix}${mentionText} ${suffix}`;
    const newCaret = (prefix + mentionText + " ").length;
    onChange(next);
    onSelectUser?.(u);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCaret, newCaret);
    });
    closeDropdown();
  }

  const ariaActiveId = open ? `mentions-option-${activeIdx}` : undefined;

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (open) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[activeIdx]) insertUser(filtered[activeIdx]);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              closeDropdown();
              return;
            }
          } else if (e.key === "Enter" && !e.shiftKey && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder}
        aria-activedescendant={ariaActiveId}
        className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-700 placeholder:text-neutral-400 min-h-[56px]"
      />

      {panelVisible && (
        <div
          className="absolute left-0 z-50 mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900/95 shadow-xl backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
          role="listbox"
          style={{ top: "100%" }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="py-2 max-h-[280px] overflow-auto">
            {!token ? (
              <div className="px-3 py-2 text-sm text-neutral-400">No matches</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-400">No matches</div>
            ) : (
              filtered.map((u, i) => {
                const isActive = i === activeIdx;
                const itemId = `mentions-option-${i}`;
                const name = u.display_name || "";
                return (
                  <button
                    key={u.id}
                    id={itemId}
                    role="option"
                    aria-selected={isActive}
                    className={`w-full px-3 py-2 text-left cursor-pointer select-none rounded-lg ${
                      isActive ? "bg-neutral-800 text-white" : "text-neutral-200 hover:bg-neutral-800"
                    }`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => insertUser(u)}
                  >
                    <div className="text-sm font-medium">
                      {highlight(name, debouncedQuery)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionsInput;