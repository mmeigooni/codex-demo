import type { MemoryVersion } from "@/lib/types";

interface MemoryPanelProps {
  memoryVersions: MemoryVersion[];
  currentMemory: MemoryVersion | null;
  currentMemoryId: string | null;
  onChangeMemory: (memoryId: string) => void;
}

interface MemorySection {
  title: string;
  rules: string[];
}

function parseMemorySections(content: string): MemorySection[] {
  const lines = content.split(/\r?\n/);
  const sections: MemorySection[] = [];
  let currentSection: MemorySection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("### ")) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        title: line.replace(/^###\s+/, ""),
        rules: []
      };
      continue;
    }

    if (!currentSection) {
      continue;
    }

    if (line.startsWith("- ")) {
      currentSection.rules.push(line.replace(/^-\s+/, ""));
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

export function MemoryPanel({
  memoryVersions,
  currentMemory,
  currentMemoryId,
  onChangeMemory
}: MemoryPanelProps) {
  if (!currentMemory) {
    return (
      <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
        No memory available.
      </section>
    );
  }

  const sections = parseMemorySections(currentMemory.content);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">Team memory</p>
          <p className="text-xs text-[var(--text-muted)]">Grouped by section for quick scanning.</p>
        </div>

        <label className="text-xs text-[var(--text-dim)]">
          Version
          <select
            value={currentMemoryId ?? ""}
            onChange={(event) => onChangeMemory(event.target.value)}
            className="ml-2 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2 py-1 text-xs text-[var(--text-strong)]"
          >
            {memoryVersions.map((memory) => (
              <option key={memory.id} value={memory.id}>
                v{memory.version}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[var(--text-strong)]">{section.title}</h4>
              <span className="rounded-full bg-[var(--surface-primary)] px-2 py-0.5 text-xs text-[var(--text-dim)]">
                {section.rules.length} rules
              </span>
            </div>
            <ul className="space-y-1 text-sm text-[var(--text-muted)]">
              {section.rules.map((rule) => (
                <li key={rule}>• {rule}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="text-xs text-[var(--text-dim)]">
        Approved by {currentMemory.approved_by} on {new Date(currentMemory.created_at).toLocaleString()}.
      </p>
    </section>
  );
}
