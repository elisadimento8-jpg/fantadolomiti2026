"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

type Team = {
  id: string;
  teamName: string;
  points: number;
};

type SavedParticipant = {
  code: string;
  teamId: string;
};

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const savedParticipant = localStorage.getItem(
          "fantadolomitiParticipant"
        );

        if (!savedParticipant) {
          window.location.href = "/";
          return;
        }

        const participant = JSON.parse(
          savedParticipant
        ) as SavedParticipant;

        setCurrentTeamId(participant.teamId);

        const teamsSnapshot = await getDocs(
          collection(db, "teams")
        );

        const orderedTeams = teamsSnapshot.docs
          .map((teamDocument) => ({
            id: teamDocument.id,
            ...(teamDocument.data() as Omit<Team, "id">),
          }))
          .sort(
            (firstTeam, secondTeam) =>
              (secondTeam.points ?? 0) -
              (firstTeam.points ?? 0)
          );

        setTeams(orderedTeams);
      } catch (error) {
        console.error(
          "Errore durante il caricamento della classifica:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  function positionIcon(position: number) {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";

    return `${position}°`;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="text-6xl">🏆</div>

          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-emerald-300">
            FantaDolomiti2026
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Classifica
          </h1>

          <p className="mt-3 text-slate-300">
            Posizione aggiornata delle squadre.
          </p>
        </header>

        {loading && (
          <p className="rounded-2xl bg-white/10 p-5 text-center text-slate-200">
            Caricamento classifica...
          </p>
        )}

        {!loading && (
          <div className="space-y-4">
            {teams.map((team, index) => {
              const position = index + 1;
              const isCurrentTeam =
                team.id === currentTeamId;

              return (
                <article
                  key={team.id}
                  className={`flex items-center gap-4 rounded-2xl border p-5 ${
                    isCurrentTeam
                      ? "border-emerald-300 bg-emerald-500/20"
                      : "border-white/20 bg-white/10"
                  }`}
                >
                  <div className="w-14 shrink-0 text-center text-3xl font-bold">
                    {positionIcon(position)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold">
                      {team.teamName}
                    </p>

                    {isCurrentTeam && (
                      <p className="mt-1 text-sm font-semibold text-emerald-300">
                        La tua squadra
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="mt-8 w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
        >
          ← Torna alla Home
        </button>
      </section>
    </main>
  );
}