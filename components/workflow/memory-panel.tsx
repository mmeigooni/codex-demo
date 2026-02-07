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
  const currentVersionIndex = memoryVersions.findIndex((memory) => memory.id === currentMemory.id);
  const previousMemory = currentVersionIndex > 0 ? memoryVersions[currentVersionIndex - 1] : null;
  const previousSections = previousMemory ? parseMemorySections(previousMemory.content) : [];
  const previousSectionMap = new Map(previousSections.map((section) => [section.title, new Set(section.rules)]));

  const diffSummary = sections.reduce(
    (summary, section) => {
      const previousRules = previousSectionMap.get(section.title);
      if (!previousRules) {
        summary.newSections += 1;
        summary.newRules += section.rules.length;
        return summary;
      }

      const newRules = section.rules.filter((rule) => !previousRules.has(rule));
      summary.newRules += newRules.length;
      return summary;
    },
    { newSections: 0, newRules: 0 }
  );

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

      {previousMemory ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">
          Compared to v{previousMemory.version}: {diffSummary.newSections} new sections, {diffSummary.newRules} new rules.
        </p>
      ) : (
        <p className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">
          Baseline memory version. No previous diff available.
        </p>
      )}

      <div className="space-y-3">
        {sections.map((section) => {
          const previousRules = previousSectionMap.get(section.title);
          const isNewSection = !previousRules && Boolean(previousMemory);
          const newRules = previousRules
            ? section.rules.filter((rule) => !previousRules.has(rule))
            : previousMemory
              ? section.rules
              : [];

          return (
            <article
              key={section.title}
              className={`rounded-[var(--radius-input)] border p-3 ${
                isNewSection || newRules.length
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-muted)]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-[var(--text-strong)]">{section.title}</h4>
                <div className="flex items-center gap-1">
                  {isNewSection ? (
                    <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                      NEW SECTION
                    </span>
                  ) : null}
                  {!isNewSection && newRules.length ? (
                    <span className="rounded-full border border-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                      +{newRules.length} NEW
                    </span>
                  ) : null}
                  <span className="rounded-full bg-[var(--surface-primary)] px-2 py-0.5 text-xs text-[var(--text-dim)]">
                    {section.rules.length} rules
                  </span>
                </div>
              </div>
              <ul className="space-y-1 text-sm text-[var(--text-muted)]">
                {section.rules.map((rule) => {
                  const isNewRule = isNewSection || newRules.includes(rule);

                  return (
                    <li key={rule} className={isNewRule ? "font-medium text-[var(--text-strong)]" : undefined}>
                      • {rule}
                      {isNewRule ? (
                        <span className="ml-2 rounded-full border border-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                          NEW
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-[var(--text-dim)]">
        Approved by {currentMemory.approved_by} on {new Date(currentMemory.created_at).toLocaleString()}.
      </p>
    </section>
  );
}
