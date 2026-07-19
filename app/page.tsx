"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import { countApprovedChallenges } from "./lib/countApprovedChallenges";

type Participant = {
  name: string;
  teamId: string;
  teamName?: string;
  active: boolean;
};

type Team = {
  teamName: string;
  points: number;
  position: number;
};

export default function Home() {
  const [accessCode, setAccessCode] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [teamPosition, setTeamPosition] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
useEffect(() => {
  async function restoreLogin() {
    const savedParticipant = localStorage.getItem(
      "fantadolomitiParticipant"
    );

    if (!savedParticipant) {
      return;
    }

    try {
      const participantData = JSON.parse(savedParticipant) as Participant & {
        code: string;
      };

      const teamReference = doc(
        db,
        "teams",
        participantData.teamId
      );

      const teamSnapshot = await getDoc(teamReference);

      if (!teamSnapshot.exists()) {
        localStorage.removeItem("fantadolomitiParticipant");
        localStorage.removeItem("fantadolomitiTeam");
        return;
      }

      const teamData = teamSnapshot.data() as Team;

const approvedCount = await countApprovedChallenges(
  participantData.code
);

const teamsSnapshot = await getDocs(
  collection(db, "teams")
);

const orderedTeams = teamsSnapshot.docs
  .map((teamDocument) => ({
    id: teamDocument.id,
    ...(teamDocument.data() as Team),
  }))
  .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

const currentTeamIndex = orderedTeams.findIndex(
  (currentTeam) => currentTeam.id === participantData.teamId
);

setParticipant(participantData);
setTeam(teamData);
setCompletedChallenges(approvedCount);
setTeamPosition(
  currentTeamIndex >= 0 ? currentTeamIndex + 1 : 0
);

localStorage.setItem(
  "fantadolomitiTeam",
  JSON.stringify({
    id: participantData.teamId,
    ...teamData,
  })
);
    } catch (error) {
      console.error("Errore nel ripristino del login:", error);

      localStorage.removeItem("fantadolomitiParticipant");
      localStorage.removeItem("fantadolomitiTeam");
    }
  }

  restoreLogin();
}, []);
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = accessCode.trim().toUpperCase();

    if (!normalizedCode) {
      setStatus("Inserisci il tuo codice personale.");
      return;
    }

    try {
      setLoading(true);
      setStatus("");
      setParticipant(null);
      setTeam(null);

      const participantReference = doc(
        db,
        "participants",
        normalizedCode
      );

      const participantSnapshot = await getDoc(participantReference);

      if (!participantSnapshot.exists()) {
        setStatus("❌ Codice personale non riconosciuto.");
        return;
      }

      const participantData =
        participantSnapshot.data() as Participant;

      if (!participantData.active) {
        setStatus("❌ Questo codice non è attivo.");
        return;
      }

      const teamReference = doc(
        db,
        "teams",
        participantData.teamId
      );

      const teamSnapshot = await getDoc(teamReference);

      if (!teamSnapshot.exists()) {
        setStatus("❌ La squadra associata non è stata trovata.");
        return;
      }

      const teamData = teamSnapshot.data() as Team;
const approvedCount = await countApprovedChallenges(
  normalizedCode
);

setCompletedChallenges(approvedCount);
     setParticipant(participantData);
setTeam(teamData);

localStorage.setItem(
  "fantadolomitiParticipant",
  JSON.stringify({
    code: normalizedCode,
    ...participantData,
  })
);

localStorage.setItem(
  "fantadolomitiTeam",
  JSON.stringify({
    id: participantData.teamId,
    ...teamData,
  })
);

setStatus("✅ Accesso effettuato correttamente.");
    } catch (error) {
      console.error(error);
      setStatus("❌ Errore durante l’accesso. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
  localStorage.removeItem("fantadolomitiParticipant");
  localStorage.removeItem("fantadolomitiTeam");

  setParticipant(null);
  setTeam(null);
  setAccessCode("");
  setStatus("");
}

  if (participant && team) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-10 text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900 via-slate-800 to-emerald-950" />

        <div className="absolute bottom-0 left-0 h-[55%] w-full bg-[linear-gradient(145deg,transparent_0%,transparent_35%,rgba(15,23,42,0.95)_35%,rgba(15,23,42,1)_100%)]" />

        <div className="absolute bottom-0 right-0 h-[45%] w-[80%] bg-[linear-gradient(215deg,transparent_0%,transparent_38%,rgba(6,78,59,0.8)_38%,rgba(6,78,59,1)_100%)]" />

        <section className="relative z-10 mx-auto w-full max-w-md">
          <header className="mb-6 text-center">
            <div className="text-6xl">🏔️</div>

            <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-emerald-300">
              FantaDolomiti2026
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Ciao, {participant.name}!
            </h1>
          </header>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="rounded-2xl bg-black/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                La tua squadra
              </p>

              <p className="mt-2 text-xl font-bold">
                🏔️ {team.teamName}
              </p>
            </div>

 <div className="mt-4 grid grid-cols-2 gap-4">
  <div className="rounded-2xl bg-sky-500/20 p-5 text-center">
    <p className="text-xs font-semibold uppercase tracking-wider text-sky-200">
      Posizione squadra
    </p>

    <p className="mt-2 text-4xl font-bold">
   {teamPosition > 0 ? `${teamPosition}°` : "-"}
    </p>
  </div>

  <div className="rounded-2xl bg-emerald-500/20 p-5 text-center">
    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
      Sfide
    </p>

    <p className="mt-2 text-4xl font-bold">
   {completedChallenges} / 41
    </p>
  </div>
</div>
   <button
  type="button"
  onClick={() => {
    window.location.href = "/challenges";
  }}
  className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-400"
>
  🗺️ Vai alle sfide
</button>

            <button
  type="button"
  onClick={() => {
    window.location.href = "/leaderboard";
  }}
  className="mt-3 w-full rounded-xl bg-sky-500 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-sky-400"
>
  📊 Visualizza classifica
</button>

            <p className="mt-4 rounded-xl bg-emerald-500/20 p-3 text-center text-sm text-emerald-100">
              {status}
            </p>

            <button
              type="button"
              onClick={logout}
              className="mt-5 w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
            >
              Esci
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-10 text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900 via-slate-800 to-emerald-950" />

      <div className="absolute bottom-0 left-0 h-[55%] w-full bg-[linear-gradient(145deg,transparent_0%,transparent_35%,rgba(15,23,42,0.95)_35%,rgba(15,23,42,1)_100%)]" />

      <div className="absolute bottom-0 right-0 h-[45%] w-[80%] bg-[linear-gradient(215deg,transparent_0%,transparent_38%,rgba(6,78,59,0.8)_38%,rgba(6,78,59,1)_100%)]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mb-3 text-6xl">🏔️</div>

          <h1 className="text-3xl font-bold tracking-tight">
            FantaDolomiti2026
          </h1>

          <p className="mt-2 text-sm text-slate-200">
            20–24 luglio 2026
          </p>
        </div>

        <div className="my-7 h-px bg-white/20" />

        <form onSubmit={handleLogin}>
          <label
            htmlFor="accessCode"
            className="mb-2 block text-sm font-semibold"
          >
            Inserisci il tuo codice personale
          </label>

          <input
            id="accessCode"
            type="text"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="Esempio: SOA-01"
            autoComplete="off"
            className="w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-center text-lg font-semibold uppercase tracking-wider text-slate-900 outline-none placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        {status && (
          <p className="mt-4 rounded-xl bg-black/20 p-3 text-center text-sm">
            {status}
          </p>
        )}

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-300">
          Usa il codice personale ricevuto dall’organizzatore.
        </p>
      </section>
    </main>
  );
}