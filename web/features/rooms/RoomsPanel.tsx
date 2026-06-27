"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { useSession } from "@/features/session/SessionProvider";
import { Button, Chip, FieldLabel, Pill } from "@/features/design/kit";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { newId } from "@/lib/store/defaults";
import { AccountPanel } from "@/features/shell/AccountPanel";

function inviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function RoomsPanel() {
  const { start, takeBreak } = useSession();
  const profile = useWispalStore((s) => s.profile);
  const companion = useWispalStore((s) => s.companion);
  const triggerPetAction = useWispalStore((s) => s.triggerPetAction);
  const allRooms = useWispalStore((s) => s.studyRooms);
  const saveRoom = useWispalStore((s) => s.saveStudyRoom);
  const allSubjects = useWispalStore((s) => s.subjects);
  const rooms = useMemo(() => allRooms.filter((r) => !r.archivedAt), [allRooms]);
  const subjects = useMemo(() => allSubjects.filter((x) => !x.archivedAt), [allSubjects]);
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("Quiet room");
  const [subjectId, setSubjectId] = useState<string | null>(subjects[0]?.id ?? null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(rooms[0]?.id ?? null);
  const [members, setMembers] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "focus" | "break">("idle");
  const [chat, setChat] = useState("");
  const [events, setEvents] = useState<Array<{ id: string; text: string; kind: "chat" | "reaction" | "timer" }>>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const configured = isSupabaseConfigured();
  const activeRoom = useMemo(() => rooms.find((r) => r.id === activeRoomId) ?? rooms[0], [rooms, activeRoomId]);

  useEffect(() => {
    if (!configured) return;
    const client = getSupabaseBrowser();
    void client.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [configured]);

  useEffect(() => {
    if (!configured || !user || !activeRoom) return;
    const client = getSupabaseBrowser();
    const channel: RealtimeChannel = client.channel(`wispal-room:${activeRoom.id}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Record<string, string>>();
        setMembers(Object.values(state).flat().map((m) => m.displayName ?? "friend"));
      })
      .on("broadcast", { event: "room_event" }, ({ payload }) => {
        if (payload?.phase) setPhase(payload.phase);
        if (payload?.text) {
          setEvents((prev) => [
            ...prev.slice(-12),
            { id: newId(), text: String(payload.text), kind: payload.kind ?? "chat" },
          ]);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            displayName: profile.displayName,
            companion: companion.packId,
            mood: companion.mood,
            phase: "idle",
          });
        }
    });
    return () => {
      channelRef.current = null;
      void channel.unsubscribe();
    };
  }, [activeRoom, companion.mood, companion.packId, configured, profile.displayName, user]);

  const broadcast = (payload: Record<string, unknown>) => {
    void channelRef.current?.send({ type: "broadcast", event: "room_event", payload });
  };

  const createRoom = () => {
    const now = new Date().toISOString();
    const room = {
      id: newId(),
      name: name.trim() || "Quiet room",
      hostUserId: user?.id ?? profile.id,
      inviteCode: inviteCode(),
      visibility: "invite" as const,
      subjectId,
      plannedMinutes: 25,
      breakMinutes: 5,
      cohortLabel: null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    saveRoom(room);
    setActiveRoomId(room.id);
  };

  if (!configured || !user) {
    return (
      <div>
        <h2 className="mb-1" style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Quiet study rooms</h2>
        <p className="mb-5" style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
          Rooms use Supabase auth and Realtime so guests keep studying locally until cloud is ready.
        </p>
        <div className="ds-card" style={{ padding: 16 }}>
          <Chip tone="wisp">preview</Chip>
          <p className="mt-3" style={{ font: "500 14px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
            Invite-only rooms will show other learners as small wisps, sync a host timer, and keep chat for breaks.
          </p>
        </div>
        <AccountPanel />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1" style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Quiet study rooms</h2>
      <p className="mb-5" style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
        Invite-only co-presence. No video, no public comparison.
      </p>

      <div className="ds-card mb-5" style={{ padding: 16 }}>
        <FieldLabel>Create room</FieldLabel>
        <input value={name} onChange={(e) => setName(e.target.value)} className="ds-input" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill active={!subjectId} onClick={() => setSubjectId(null)}>no subject</Pill>
          {subjects.map((s) => (
            <Pill key={s.id} active={subjectId === s.id} onClick={() => setSubjectId(s.id)}>{s.name}</Pill>
          ))}
          <span className="ml-auto">
            <Button onClick={createRoom}>Create</Button>
          </span>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {rooms.map((r) => (
          <Pill key={r.id} active={activeRoom?.id === r.id} onClick={() => setActiveRoomId(r.id)}>
            {r.name}
          </Pill>
        ))}
      </div>

      {activeRoom ? (
        <div className="ds-card" style={{ padding: 16 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 style={{ font: "600 18px var(--font-head)", color: "var(--ink)" }}>{activeRoom.name}</h3>
              <div className="mt-1" style={{ font: "600 12px var(--font-mono)", color: "var(--ink-mut)" }}>
                invite: {activeRoom.inviteCode}
              </div>
            </div>
            <Chip tone="outline">{members.length || 1} here</Chip>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(members.length ? members : [profile.displayName]).map((m) => (
              <Chip key={m} tone="wisp">{m}</Chip>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              className="flex-1"
              icon="play"
              onClick={() => {
                setPhase("focus");
                broadcast({ phase: "focus", kind: "timer", text: `${profile.displayName} started focus` });
                triggerPetAction("room_enter", { source: "system" });
                start(`room: ${activeRoom.name}`, activeRoom.plannedMinutes, { mode: "room", roomId: activeRoom.id, subjectId: activeRoom.subjectId ?? undefined });
              }}
            >
              Start room timer
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPhase("break");
                broadcast({ phase: "break", kind: "timer", text: `${profile.displayName} started break` });
                takeBreak();
              }}
            >
              Break
            </Button>
          </div>

          <div className="mt-4 rounded-xl border-2 p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-2 flex items-center justify-between">
              <span style={{ font: "600 13px var(--font-body)", color: "var(--ink)" }}>
                {phase === "focus" ? "Focus quiet" : phase === "break" ? "Break chat" : "Room log"}
              </span>
              <div className="flex gap-1">
                {["nice", "same", "rest"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="ds-chip ds-chip--outline"
                    onClick={() => broadcast({ kind: "reaction", text: `${profile.displayName}: ${r}` })}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ul className="mb-3 max-h-36 space-y-1 overflow-y-auto" style={{ font: "500 12px/1.45 var(--font-body)", color: "var(--ink-dim)" }}>
              {events.length === 0 ? <li>Quiet room events will appear here.</li> : events.map((e) => <li key={e.id}>{e.text}</li>)}
            </ul>
            <div className="flex gap-2">
              <input
                value={chat}
                disabled={phase === "focus"}
                onChange={(e) => setChat(e.target.value)}
                placeholder={phase === "focus" ? "chat opens on break" : "send a break note"}
                className="ds-input"
                style={{ padding: "9px 12px" }}
              />
              <Button
                variant="secondary"
                disabled={phase === "focus" || !chat.trim()}
                onClick={() => {
                  broadcast({ kind: "chat", text: `${profile.displayName}: ${chat.trim()}` });
                  setChat("");
                }}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="ds-card text-center" style={{ font: "500 14px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
          Create your first invite room.
        </div>
      )}
    </div>
  );
}
