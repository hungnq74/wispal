"use client";

import { useMemo, useState } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { Button, Chip, FieldLabel, Pill } from "@/features/design/kit";

const SUBJECT_COLORS = ["#8be0d6", "#ffd27d", "#f3a9cb", "#8fb8f0", "#ff9e6d"];

function SubjectPill({ id }: { id?: string | null }) {
  const subject = useWispalStore((s) => s.subjects.find((x) => x.id === id));
  if (!subject) return <span style={{ color: "var(--ink-mut)" }}>no subject</span>;
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: "var(--ink-dim)" }}>
      <i style={{ width: 9, height: 9, borderRadius: "50%", background: subject.color }} />
      {subject.name}
    </span>
  );
}

export function QuestBoard() {
  const allSubjects = useWispalStore((s) => s.subjects);
  const quests = useWispalStore((s) => s.quests);
  const createSubject = useWispalStore((s) => s.createSubject);
  const createQuest = useWispalStore((s) => s.createQuest);
  const updateQuest = useWispalStore((s) => s.updateQuest);
  const setNextQuest = useWispalStore((s) => s.setNextQuest);
  const completeQuest = useWispalStore((s) => s.completeQuest);
  const archiveQuest = useWispalStore((s) => s.archiveQuest);
  const subjects = useMemo(() => allSubjects.filter((x) => !x.archivedAt), [allSubjects]);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(subjects[0]?.id ?? null);
  const [subjectName, setSubjectName] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);

  const visible = useMemo(
    () =>
      quests
        .filter((q) => q.status !== "archived")
        .sort((a, b) => {
          const weight = { next: 0, open: 1, done: 2 } as const;
          return weight[a.status as keyof typeof weight] - weight[b.status as keyof typeof weight] || a.sortOrder - b.sortOrder;
        }),
    [quests],
  );

  const submitQuest = () => {
    if (!title.trim()) return;
    createQuest({ title, subjectId });
    setTitle("");
  };

  const submitSubject = () => {
    if (!subjectName.trim()) return;
    const subject = createSubject({ name: subjectName, color });
    setSubjectId(subject.id);
    setSubjectName("");
  };

  return (
    <div>
      <h2 className="mb-1" style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>
        Today&apos;s quests
      </h2>
      <p className="mb-5" style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
        Pick one next move. Wispal will attach your focus block to it.
      </p>

      <div className="ds-card mb-4" style={{ padding: 16 }}>
        <FieldLabel>Add subject</FieldLabel>
        <div className="flex gap-2">
          <input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSubject()}
            placeholder="e.g. Biology"
            className="ds-input"
          />
          <Button variant="secondary" onClick={submitSubject}>
            Add
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUBJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Use color ${c}`}
              onClick={() => setColor(c)}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: c,
                border: color === c ? "3px solid var(--ink)" : "2px solid var(--border)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="ds-card mb-5" style={{ padding: 16 }}>
        <FieldLabel>Add quest</FieldLabel>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitQuest()}
          placeholder="e.g. finish chapter 4 exercises"
          className="ds-input"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill active={!subjectId} onClick={() => setSubjectId(null)}>
            no subject
          </Pill>
          {subjects.map((s) => (
            <Pill key={s.id} active={subjectId === s.id} onClick={() => setSubjectId(s.id)}>
              {s.name}
            </Pill>
          ))}
          <span className="ml-auto">
            <Button icon="play" onClick={submitQuest}>
              Add quest
            </Button>
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="ds-card text-center" style={{ font: "500 14px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
          Add one tiny quest. The smaller it is, the easier it is to begin.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((q) => (
            <li key={q.id} className="ds-card" style={{ padding: 14 }}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {q.status === "next" && <Chip tone="wisp">next</Chip>}
                    {q.status === "done" && <Chip tone="glow">done</Chip>}
                    <SubjectPill id={q.subjectId} />
                  </div>
                  <input
                    value={q.title}
                    onChange={(e) => updateQuest(q.id, { title: e.target.value })}
                    disabled={q.status === "done"}
                    className="ds-input mt-2"
                    style={{ opacity: q.status === "done" ? 0.65 : 1 }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {q.status !== "done" && (
                    <>
                      <Button variant={q.status === "next" ? "secondary" : "ghost"} onClick={() => setNextQuest(q.id)}>
                        Next
                      </Button>
                      <Button variant="secondary" onClick={() => completeQuest(q.id)}>
                        Done
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" onClick={() => archiveQuest(q.id)}>
                    Hide
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
