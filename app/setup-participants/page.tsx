"use client";

import { useState } from "react";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

type TeamSetup = {
  teamName: string;
  prefix: string;
  members: string[];
};

const teamsToCreate: TeamSetup[] = [
  {
    teamName: "Sogni nel cassetto",
    prefix: "SNC",
    members: [
      "Marika De Santis", "Fabio Giorgilli", "Davide Giorgilli", "Elisa Di Mento",
      "Padre Pasquale", "Viola Acciaro", "Stefania Della Corte", "Angelo Manzione",
      "Perla Manzione", "Valentina Iacona", "Wilmer", "Massimo Roggi",
      "Silvia Fiorentini", "Marco Alessandroni", "Agnese Turchi", "Arianna Morabito",
      "Tommaso Lastei", "Giuseppe Prestipino", "Gianni Acciaro", "Roberto Sassi",
      "Diego Sassi",
    ],
  },
  {
    teamName: "Sogni ad occhi aperti",
    prefix: "SOA",
    members: [
      "Luca Liberti", "Leonardo Sapienza", "Eleonora Tesconi", "Adele Liberti",
      "Valerio Liberti", "Amedeo Palmisano", "Cristina Avolio", "Roberto Iacona",
      "Emanuela Martino", "Tommaso Iacona", "Daniela Nuzzolese", "Michele Roberti",
      "Roberto Stefanori", "Laura Fagotti", "Andrea Stefanori", "Massimiliano Pasqualini",
      "Gianluca Pasqualiini", "Matteo Pasqualini", "Francesco Pasqualini", "Cristina Riu",
      "Mattia Tamburrano",
    ],
  },
  {
    teamName: "Sogni d'oro",
    prefix: "SDO",
    members: [
      "Tiziano Lucarelli", "Sara Irranca", "Flavio Lucarelli", "Beatrice Lucarelli",
      "Ludovica Sassi", "Piergluigi Sassi", "Adriano Avolio", "Jessica Giacometti",
      "Giammarco Sassi", "Matteo Appodia", "Nicolò Pepe", "Tiziana Tuccillo",
      "Emanuele Lalla", "Serena Santoro", "Riccardo Cantoni", "Lorenzo Vecchio",
      "Salvatore Iacona", "Alessandra Mascioli", "Padre Jakub", "Paolo Celi",
      "Valentina Celi",
    ],
  },
  {
    teamName: "Sogno o son desto",
    prefix: "SOSD",
    members: [
      "Maria Teresa Nuzzolese", "Antonio Aniceti", "Lorenzo Angeletti", "Francesca Pugliese",
      "Elena Angeletti", "Paolo Angeletti", "Fabrizio Stinellis", "Alessandra Palma",
      "Paolo Pieri", "Marisa Calvino", "Simone Marino", "Gabriele Marino",
      "Santo Tamburrano", "Marinella Placido", "Elmo Della Corte", "Valentina Frigerio",
      "Fabrizio Cinquegrana", "Anna Chiara Della Corte", "Daniele Pieri", "Riccardo Pieri",
    ],
  },
];

function normalizeName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("it")
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ");
}

export default function SetupParticipantsPage() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function createAllParticipants() {
    const confirmed = window.confirm(
      "Questa operazione creerà o sovrascriverà tutti gli 83 partecipanti e azzererà i punti delle 4 squadre. Continuare?"
    );

    if (!confirmed) return;

    try {
      setRunning(true);
      setMessage("Creazione partecipanti in corso...");

      const teamsSnapshot = await getDocs(collection(db, "teams"));
      const firestoreTeams = teamsSnapshot.docs.map((teamDoc) => ({
        id: teamDoc.id,
        ...(teamDoc.data() as { teamName?: string }),
      }));

      const missingTeams: string[] = [];
      const resolvedTeams = teamsToCreate.map((teamSetup) => {
        const firestoreTeam = firestoreTeams.find(
          (team) =>
            normalizeName(team.teamName ?? "") === normalizeName(teamSetup.teamName)
        );

        if (!firestoreTeam) missingTeams.push(teamSetup.teamName);
        return { ...teamSetup, firestoreTeam };
      });

      if (missingTeams.length > 0) {
        throw new Error(
          `Non trovo queste squadre in Firestore: ${missingTeams.join(", ")}. Controlla i nomi.`
        );
      }

      const batch = writeBatch(db);

      resolvedTeams.forEach(({ teamName, prefix, members, firestoreTeam }) => {
        if (!firestoreTeam) return;

        batch.update(doc(db, "teams", firestoreTeam.id), { points: 0 });

        members.forEach((memberName, index) => {
          const participantCode = `${prefix}-${String(index + 1).padStart(2, "0")}`;

          batch.set(doc(db, "participants", participantCode), {
            active: true,
            name: memberName,
            points: 0,
            teamId: firestoreTeam.id,
            teamName,
          });
        });
      });

      await batch.commit();
      setMessage("✅ Operazione completata: 83 partecipanti creati e punti delle squadre azzerati.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Errore durante la creazione dei partecipanti."
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-7">
        <h1 className="text-3xl font-bold">Creazione partecipanti</h1>
        <p className="mt-3 text-slate-300">Verranno creati 83 partecipanti divisi in 4 squadre.</p>

        <div className="mt-6 space-y-3">
          {teamsToCreate.map((team) => (
            <div key={team.prefix} className="rounded-xl bg-black/20 p-4">
              <p className="font-bold">{team.teamName}</p>
              <p className="text-sm text-slate-300">
                Codici {team.prefix}-01 → {team.prefix}-{String(team.members.length).padStart(2, "0")} · {team.members.length} partecipanti
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={createAllParticipants}
          disabled={running}
          className="mt-7 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Creazione in corso..." : "Crea tutti i partecipanti"}
        </button>

        {message && (
          <p className="mt-4 rounded-xl bg-black/20 p-4 text-center">{message}</p>
        )}
      </section>
    </main>
  );
}