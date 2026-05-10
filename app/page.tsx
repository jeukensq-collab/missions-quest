"use client";

import { useEffect, useMemo, useState } from "react";
import { tasks } from "./tasks";
import { supabase } from "./supabase";

export default function Home() {
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(65);

  const [currentPlayer, setCurrentPlayer] = useState("Quentin");

  const [completedTasks, setCompletedTasks] = useState<{
    [key: number]: number;
  }>({});

  const [lastCompleted, setLastCompleted] = useState<{
    [key: number]: Date;
  }>({});

  const [history, setHistory] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("tasks");

  const [newBadge, setNewBadge] = useState<string | null>(null);

  useEffect(() => {
  async function loadUser() {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("name", currentPlayer)
      .single();

    if (data) {
      setScore(data.score);
      setXp(data.score);
    }

    const { data: historyData } = await supabase
      .from("history")
      .select("*")
      .eq("player", currentPlayer)
      .order("created_at", { ascending: false });

    if (historyData) {
      setHistory(historyData);

      const completedMap: {
        [key: number]: number;
      } = {};

      const lastMap: {
        [key: number]: Date;
      } = {};

      historyData.forEach((item) => {
        const task = tasks.find(
          (t) => t.title === item.task
        );

        if (!task) return;

        completedMap[task.id] =
          (completedMap[task.id] || 0) + 1;

        const completedDate = new Date(
          item.created_at
        );

        if (
          !lastMap[task.id] ||
          completedDate > lastMap[task.id]
        ) {
          lastMap[task.id] = completedDate;
        }
      });

      setCompletedTasks(completedMap);
      setLastCompleted(lastMap);
    }

    const { data: badgesData } = await supabase
      .from("badges")
      .select("*")
      .eq("player", currentPlayer);

    if (badgesData) {
      setBadges(badgesData);
    }
  }

  loadUser();
}, [currentPlayer]);

  const level = Math.floor(xp / 100) + 1;
  const xpProgress = xp % 100;

  async function completeTask(taskId: number, points: number) {
    setScore((prev) => prev + points);
    setXp((prev) => prev + points);

    const newCount = (completedTasks[taskId] || 0) + 1;

    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: newCount,
    }));

    let badge = null;

    if (newCount === 3) badge = "🥉 Bronze";
    if (newCount === 8) badge = "🥈 Argent";
    if (newCount === 18) badge = "🥇 Ultime";

    if (badge) {
      setNewBadge(badge);

      setTimeout(() => {
        setNewBadge(null);
      }, 3000);

      await supabase.from("badges").insert([
        {
          player: currentPlayer,
          task: tasks.find((t) => t.id === taskId)?.title,
          badge: badge,
        },
      ]);
    }

    const { data: badgesData } = await supabase
      .from("badges")
      .select("*")
      .eq("player", currentPlayer);

    if (badgesData) {
      setBadges(badgesData);
    }

    setLastCompleted((prev) => ({
      ...prev,
      [taskId]: new Date(),
    }));

    await supabase.from("history").insert([
      {
        player: currentPlayer,
        task: tasks.find((t) => t.id === taskId)?.title,
        points: points,
      },
    ]);

    const currentUser = score + points;

    await supabase
      .from("users")
      .update({
        score: currentUser,
      })
      .eq("name", currentPlayer);

    const { data: historyData } = await supabase
      .from("history")
      .select("*")
      .eq("player", currentPlayer)
      .order("created_at", { ascending: false });

    if (historyData) {
      setHistory(historyData);
    }
  }

  const reminders = useMemo(() => {
    const now = new Date();

    return tasks.filter((task) => {
      const lastDate = lastCompleted[task.id];

      if (!lastDate) return true;

      const difference =
        (now.getTime() - lastDate.getTime()) /
        (1000 * 60 * 60 * 24);

      return difference >= task.reminderDays;
    });
  }, [lastCompleted]);

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff00ff22,transparent_40%),radial-gradient(circle_at_bottom,#00ffff22,transparent_40%)]" />

      <div className="relative z-10 max-w-md mx-auto px-4 pb-32 pt-6">

        {newBadge && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">

            <div className="bg-gradient-to-r from-yellow-300 to-pink-500 text-black px-8 py-5 rounded-[30px] shadow-[0_0_40px_#ffff00] border-4 border-white">

              <p className="text-center text-xl font-black">
                🎉 NOUVEAU BADGE
              </p>

              <p className="text-center text-3xl font-black mt-2">
                {newBadge}
              </p>

            </div>

          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-6xl font-black tracking-widest text-cyan-300 drop-shadow-[0_0_25px_#00ffff]">
            MISSIONS
          </h1>

          <h2 className="text-5xl font-black text-pink-500 drop-shadow-[0_0_25px_#ff00ff]">
            QUEST
          </h2>

          <p className="mt-3 text-cyan-200 tracking-[0.3em] text-sm">
            EDITION ALLONVILLE
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-8">

          <button
            onClick={() => setCurrentPlayer("Quentin")}
            className={`px-5 py-3 rounded-2xl font-black border-2 transition-all duration-300 ${
              currentPlayer === "Quentin"
                ? "bg-green-500 border-green-300 shadow-[0_0_25px_#22c55e]"
                : "bg-black/50 border-white/20"
            }`}
          >
            🟢 Quentin
          </button>

          <button
            onClick={() => setCurrentPlayer("Alice")}
            className={`px-5 py-3 rounded-2xl font-black border-2 transition-all duration-300 ${
              currentPlayer === "Alice"
                ? "bg-pink-500 border-pink-300 shadow-[0_0_25px_#ff00ff]"
                : "bg-black/50 border-white/20"
            }`}
          >
            🌸 Alice
          </button>

        </div>

        <div className="bg-black/50 border border-cyan-400 rounded-[30px] p-6 mb-8 shadow-[0_0_40px_#00ffff33] backdrop-blur-xl">

          <div className="flex justify-between items-center mb-4">

            <div>
              <p className="text-cyan-300 text-sm tracking-widest">
                PLAYER LEVEL
              </p>

              <h2 className="text-5xl font-black text-white">
                {level}
              </h2>
            </div>

            <div className="text-right">
              <p className="text-yellow-300 text-5xl font-black drop-shadow-[0_0_15px_#ffff00]">
                {score}
              </p>

              <p className="text-pink-300 text-sm tracking-widest">
                SCORE
              </p>
            </div>

          </div>

          <div className="w-full h-6 bg-black rounded-full overflow-hidden border border-cyan-500">

            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-300 shadow-[0_0_20px_#00ffff] transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />

          </div>

          <p className="mt-3 text-center text-cyan-200 font-bold">
            {xpProgress}/100 XP
          </p>

        </div>

        <div className="flex justify-center gap-3 mb-8">

          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-5 py-3 rounded-2xl font-black border-2 transition-all ${
              activeTab === "tasks"
                ? "bg-cyan-400 text-black border-cyan-200 shadow-[0_0_25px_#00ffff]"
                : "bg-black/50 border-white/20"
            }`}
          >
            🕹️ MISSIONS
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-3 rounded-2xl font-black border-2 transition-all ${
              activeTab === "history"
                ? "bg-pink-500 border-pink-300 shadow-[0_0_25px_#ff00ff]"
                : "bg-black/50 border-white/20"
            }`}
          >
            📜 HISTORIQUE
          </button>

          <button
            onClick={() => setActiveTab("badges")}
            className={`px-5 py-3 rounded-2xl font-black border-2 transition-all ${
              activeTab === "badges"
                ? "bg-yellow-400 text-black border-yellow-200 shadow-[0_0_25px_#ffff00]"
                : "bg-black/50 border-white/20"
            }`}
          >
            🏆 GALERIE
          </button>

        </div>

        {activeTab === "tasks" && (
          <>
            <div className="mb-8 bg-red-500/10 border border-red-400 rounded-[28px] p-5 shadow-[0_0_25px_#ff000055]">

              <h2 className="text-2xl font-black text-red-300 mb-4">
                ⚠️ MISSIONS
              </h2>

              <div className="space-y-3">

                {reminders.map((task) => (
                  <div
                    key={task.id}
                    className="bg-black/40 border border-red-400/30 rounded-2xl p-4"
                  >

                    <div className="flex justify-between items-center">

                      <div>
                        <p className="font-black">
                          {task.emoji} {task.title}
                        </p>

                        <p className="text-red-200 text-sm">
                          Tous les {task.reminderDays} jours
                        </p>
                      </div>

                      <div className="text-yellow-300 font-black">
                        +{task.points}
                      </div>

                    </div>

                  </div>
                ))}

              </div>

            </div>

            <div className="space-y-5">

              {tasks.map((task) => {
                const taskCount = completedTasks[task.id] || 0;

                const taskBadges = badges.filter(
                  (b) =>
                    b.player === currentPlayer &&
                    b.task === task.title
                );

                let playerBadge = null;

                if (
                  taskBadges.some((b) =>
                    b.badge.includes("Ultime")
                  )
                ) {
                  playerBadge = "🥇 Ultime";
                } else if (
                  taskBadges.some((b) =>
                    b.badge.includes("Argent")
                  )
                ) {
                  playerBadge = "🥈 Argent";
                } else if (
                  taskBadges.some((b) =>
                    b.badge.includes("Bronze")
                  )
                ) {
                  playerBadge = "🥉 Bronze";
                }

                return (
                  <div
                    key={task.id}
                    className="bg-black/50 border border-cyan-400 rounded-[30px] p-5 backdrop-blur-xl shadow-[0_0_35px_#00ffff22] hover:scale-[1.03] hover:shadow-[0_0_50px_#00ffff88] transition-all duration-300"
                  >

                    <div className="flex justify-between items-start gap-4">

                      <div className="flex-1">

                        <p className="text-cyan-300 text-sm tracking-widest">
                          {task.emoji} {task.category}
                        </p>

                        <h3 className="text-3xl font-black mt-2 text-white">
                          {task.title}
                        </h3>

                        <div className="flex gap-4 mt-4 text-sm font-bold">

                          <span className="text-yellow-300">
                            ✨ +{task.points} XP
                          </span>

                      
                        </div>

                        {playerBadge && (
                          <div className="mt-4 inline-block px-4 py-2 rounded-2xl bg-yellow-400 text-black font-black shadow-[0_0_20px_#ffff00]">
                            {playerBadge}
                          </div>
                        )}

                      </div>

                      <button
                        onClick={() =>
                          completeTask(task.id, task.points)
                        }
                        className="bg-gradient-to-b from-cyan-300 to-cyan-500 text-black font-black px-5 py-4 rounded-2xl shadow-[0_0_30px_#00ffff] hover:scale-110 hover:shadow-[0_0_45px_#00ffff] active:scale-95 transition-all duration-300"
                      >
                        PLAY
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">

            {history.map((item, index) => (
              <div
                key={index}
                className="bg-black/50 border border-pink-400 rounded-[28px] p-5 shadow-[0_0_30px_#ff00ff22]"
              >

                <div className="flex justify-between items-center">

                  <div>
                    <p className="font-black text-pink-300">
                      {item.player}
                    </p>

                    <p className="text-white mt-1">
                      {item.task}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-yellow-300 font-black text-2xl">
                      +{item.points}
                    </p>

                    <p className="text-xs text-cyan-300">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

        {activeTab === "badges" && (
          <div className="space-y-4">

            {badges.length === 0 && (
              <div className="bg-black/50 border border-yellow-400 rounded-[28px] p-6 text-center">
                <p className="text-yellow-300 font-black">
                  Aucun badge débloqué
                </p>
              </div>
            )}

            {badges.map((badge, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-yellow-400/20 to-pink-500/20 border border-yellow-300 rounded-[30px] p-5 shadow-[0_0_30px_#ffff0055]"
              >

                <p className="text-3xl font-black text-yellow-300">
                  {badge.badge}
                </p>

                <p className="mt-2 text-white">
                  {badge.task}
                </p>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}