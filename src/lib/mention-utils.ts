export const MENTION_RE = /@\[(.+?)\]\(([\w-]{36})\)/g;

export type MentionMeta = {
  id: string;
  name: string;
  start: number;
  end: number;
};

export function parseStoredMentions(stored: string): { displayText: string; mentions: MentionMeta[] } {
  if (!stored) return { displayText: "", mentions: [] };
  
  const mentions: MentionMeta[] = [];
  let display = "";
  let last = 0;

  stored.replace(MENTION_RE, (m, name: string, id: string, offset: number) => {
    display += stored.slice(last, offset);
    const start = display.length;
    const visible = `@${name}`;
    display += visible;
    const end = display.length;

    mentions.push({ id, name, start, end });
    last = offset + m.length;
    return m;
  });

  display += stored.slice(last);
  return { displayText: display, mentions };
}

export function serializeMentions(displayText: string, mentions: MentionMeta[]): string {
  if (!mentions || mentions.length === 0) return displayText;

  const byStart = [...mentions].sort((a, b) => b.start - a.start);
  let output = displayText;

  for (const m of byStart) {
    const slice = output.slice(m.start, m.end);
    if (slice === `@${m.name}`) {
      const token = `@[${m.name}](${m.id})`;
      output = output.slice(0, m.start) + token + output.slice(m.end);
    }
  }
  return output;
}