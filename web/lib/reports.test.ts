import { describe, expect, it } from "vitest";
import { buildWeeklyReport, weekBounds } from "@/lib/reports";
import type { DailyLog, FocusSession, Quest, SubjectTag } from "@/lib/types";

describe("weekly Wisp report", () => {
  it("uses a Monday-start local week", () => {
    expect(weekBounds(new Date("2026-06-24T12:00:00"))).toEqual({
      start: "2026-06-22",
      end: "2026-06-28",
    });
  });

  it("aggregates subjects, quests, flows, goals, and wins", () => {
    const subjects: SubjectTag[] = [{
      id: "bio",
      name: "Biology",
      color: "#8be0d6",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    }];
    const sessions: FocusSession[] = [{
      id: "s1",
      userId: "u1",
      intention: "cells",
      mode: "review",
      subjectId: "bio",
      plannedMinutes: 25,
      actualActiveMinutes: 20,
      startedAt: "2026-06-24T09:00:00.000Z",
      endedAt: "2026-06-24T09:20:00.000Z",
      completed: true,
      flowDetected: true,
    }];
    const dailyLogs: Record<string, DailyLog> = {
      "2026-06-24": {
        date: "2026-06-24",
        totalActiveMinutes: 20,
        sessionsCompleted: 1,
        goalHit: true,
        reflection: { mood: 4, win: "remembered mitosis", submittedAt: "2026-06-24T22:00:00.000Z" },
        rewardClaims: ["daily_goal", "reflection"],
        dailyEarnedSparks: 40,
      },
    };
    const quests: Quest[] = [{
      id: "q1",
      title: "quiz",
      status: "done",
      sortOrder: 1,
      createdAt: "2026-06-24T00:00:00.000Z",
      updatedAt: "2026-06-24T00:00:00.000Z",
      completedAt: "2026-06-24T10:00:00.000Z",
    }];

    const report = buildWeeklyReport({ dailyLogs, sessions, subjects, quests, now: new Date("2026-06-24T12:00:00") });
    expect(report.reviewMinutes).toBe(20);
    expect(report.subjectMinutes[0]).toMatchObject({ subject: subjects[0], minutes: 20 });
    expect(report.completedQuests).toBe(1);
    expect(report.flowCount).toBe(1);
    expect(report.goalDays).toBe(1);
    expect(report.wins).toEqual(["remembered mitosis"]);
  });
});
