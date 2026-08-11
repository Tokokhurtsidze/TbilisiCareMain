"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TASK_TYPES } from "@/types";

export function WeeklyChallengeForm({ currentWeek }: { currentWeek: string }) {
  const router = useRouter();
  const [week, setWeek] = useState(currentWeek);
  const [taskTypeId, setTaskTypeId] = useState(TASK_TYPES[0].id);
  const [targetCount, setTargetCount] = useState("5");
  const [bonusPoints, setBonusPoints] = useState("20");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/weekly-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week,
          taskTypeId,
          targetCount: Number(targetCount),
          bonusPoints: Number(bonusPoints),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Failed to publish");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 mb-6">
      <p className="text-white font-semibold text-sm">Set weekly challenge</p>
      <p className="text-gray-500 text-xs">
        One challenge per ISO week (e.g. {currentWeek} is the current week). Saving an existing week overwrites it.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-gray-400 space-y-1">
          Week (ISO)
          <input
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            placeholder="2026-W03"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500"
          />
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          Task type
          <select
            value={taskTypeId}
            onChange={(e) => setTaskTypeId(e.target.value as typeof taskTypeId)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            {TASK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          Target count
          <input
            type="number"
            min={1}
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          Bonus CarePoints
          <input
            type="number"
            min={0}
            value={bonusPoints}
            onChange={(e) => setBonusPoints(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          />
        </label>
      </div>

      {err && <p className="text-red-400 text-xs">{err}</p>}

      <button
        onClick={submit}
        disabled={busy || !/^\d{4}-W\d{2}$/.test(week)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {busy ? "Saving..." : "Save challenge"}
      </button>
    </div>
  );
}
