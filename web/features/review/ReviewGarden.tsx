"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/features/session/SessionProvider";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { dueCards } from "@/lib/review";
import { Button, Chip, FieldLabel, Pill, ProgressBar } from "@/features/design/kit";

export function ReviewGarden() {
  const { start } = useSession();
  const allDecks = useWispalStore((s) => s.reviewDecks);
  const allCards = useWispalStore((s) => s.reviewCards);
  const allSubjects = useWispalStore((s) => s.subjects);
  const createDeck = useWispalStore((s) => s.createReviewDeck);
  const createCard = useWispalStore((s) => s.createReviewCard);
  const recordReview = useWispalStore((s) => s.recordReview);
  const decks = useMemo(() => allDecks.filter((d) => !d.archivedAt), [allDecks]);
  const cards = useMemo(() => allCards.filter((c) => !c.archivedAt), [allCards]);
  const subjects = useMemo(() => allSubjects.filter((x) => !x.archivedAt), [allSubjects]);
  const [deckName, setDeckName] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(subjects[0]?.id ?? null);
  const [deckId, setDeckId] = useState<string | null>(decks[0]?.id ?? null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const selectedDeck = deckId ? decks.find((d) => d.id === deckId) : decks[0];
  const due = useMemo(() => dueCards(cards).slice(0, 8), [cards]);

  const addDeck = () => {
    if (!deckName.trim()) return;
    const deck = createDeck({ name: deckName, subjectId });
    setDeckId(deck.id);
    setDeckName("");
  };

  const addCard = () => {
    if (!selectedDeck || !front.trim() || !back.trim()) return;
    createCard({ deckId: selectedDeck.id, front, back });
    setFront("");
    setBack("");
  };

  return (
    <div>
      <h2 className="mb-1" style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Active recall garden</h2>
      <p className="mb-5" style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
        Cards bloom when you remember them. Missing one just brings it back sooner.
      </p>

      <div className="ds-card mb-5" style={{ padding: 16 }}>
        <FieldLabel>New deck</FieldLabel>
        <div className="flex gap-2">
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDeck()}
            placeholder="e.g. Bio chapter 4"
            className="ds-input"
          />
          <Button variant="secondary" onClick={addDeck}>Add</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill active={!subjectId} onClick={() => setSubjectId(null)}>no subject</Pill>
          {subjects.map((s) => (
            <Pill key={s.id} active={subjectId === s.id} onClick={() => setSubjectId(s.id)}>{s.name}</Pill>
          ))}
        </div>
      </div>

      {decks.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {decks.map((d) => (
            <Pill key={d.id} active={selectedDeck?.id === d.id} onClick={() => setDeckId(d.id)}>
              {d.name}
            </Pill>
          ))}
        </div>
      )}

      {selectedDeck && (
        <div className="ds-card mb-5" style={{ padding: 16 }}>
          <FieldLabel>Add card to {selectedDeck.name}</FieldLabel>
          <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Front" className="ds-input" />
          <textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Back" className="ds-input mt-2 min-h-24" />
          <div className="mt-3 flex justify-between gap-2">
            <Button
              variant="secondary"
              onClick={() => start(`review ${selectedDeck.name}`, 10, { mode: "review", subjectId: selectedDeck.subjectId ?? undefined })}
            >
              Start 10 min review
            </Button>
            <Button onClick={addCard}>Add card</Button>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 style={{ font: "600 18px var(--font-head)", color: "var(--ink)" }}>Due now</h3>
        <Chip tone="outline">{due.length} cards</Chip>
      </div>

      {due.length === 0 ? (
        <div className="ds-card text-center" style={{ font: "500 14px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
          No cards due. That counts as calm.
        </div>
      ) : (
        <ul className="space-y-3">
          {due.map((card) => (
            <li key={card.id} className="ds-card" style={{ padding: 16 }}>
              <div style={{ font: "600 15px var(--font-body)", color: "var(--ink)" }}>{card.front}</div>
              <div className="mt-1" style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)" }}>{card.back}</div>
              <div className="mt-3">
                <ProgressBar value={card.bloom * 100} color="var(--bloom)" />
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => recordReview(card.id, false)}>Again</Button>
                <Button className="flex-1" onClick={() => recordReview(card.id, true)}>Remembered</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
