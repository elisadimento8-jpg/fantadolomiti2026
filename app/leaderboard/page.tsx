"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../lib/firebase";

type Team = {
  id: string;
  teamName: string;
  points: number;
};

type SavedParticipant = {
  code?: string;
  teamId?: string;
};

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setErrorMessage("");

        const savedParticipant = localStorage.getItem(
          "fantadolomitiParticipant"
        );

        if (savedParticipant) {
          try {
            const participant = JSON.parse(
              savedParticipant
            ) as SavedParticipant;

            if (participant.teamId) {
              setCurrentTeamId(participant.teamId);
            }
          } catch (error) {
            console.error(
              "Dati partecipante non validi:",
              error
            );
          }
        }

        const teamsSnapshot = await getDocs(
          collection(db, "teams")
        );

        const orderedTeams: Team[] = teamsSnapshot.docs
          .map((teamDocument) => {
            const teamData = teamDocument.data();

            return {
              id: teamDocument.id,
              teamName:
                typeof teamData.teamName === "string"
                  ? teamData.teamName
                  : "Squadra senza nome",
              points:
                typeof teamData.points === "number"
                  ? teamData.points
                  : 0,
            };
          })
          .sort(
            (firstTeam, secondTeam) =>
              secondTeam.points - firstTeam.points
          );

        setTeams(orderedTeams);
      } catch (error) {
        console.error(
          "Errore durante il caricamento della classifica:",
          error
        );

        setErrorMessage(
          "Impossibile caricare la classifica. Riprova tra poco."
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
            Punteggio totale aggiornato delle squadre.
          </p>
        </header>

        {loading && (
          <p className="rounded-2xl bg-white/10 p-5 text-center text-slate-200">
            Caricamento classifica...
          </p>
        )}

        {!loading && errorMessage && (
          <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-center text-red-200">
            ❌ {errorMessage}
          </p>
        )}

        {!loading &&
          !errorMessage &&
          teams.length === 0 && (
            <p className="rounded-2xl bg-white/10 p-5 text-center text-slate-300">
              Non sono ancora presenti squadre in classifica.
            </p>
          )}

        {!loading &&
          !errorMessage &&
          teams.length > 0 && (
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
                      <p className="truncate text-xl font-bold">
                        {team.teamName}
                      </p>

                      {isCurrentTeam && (
                        <p className="mt-1 text-sm font-semibold text-emerald-300">
                          La tua squadra
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 rounded-xl bg-black/20 px-4 py-3 text-right">
                      <p className="text-2xl font-bold text-emerald-300">
                        {team.points}
                      </p>

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        punti
                      </p>
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