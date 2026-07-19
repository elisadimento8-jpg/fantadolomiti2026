"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../lib/firebase";

type Participant = {
  id: string;
  name: string;
  code: string;
};

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadParticipants() {
      try {
        setLoading(true);
        setErrorMessage("");

        const snapshot = await getDocs(
          collection(db, "participants")
        );

        const orderedParticipants: Participant[] = snapshot.docs
          .map((participantDocument) => {
            const participantData = participantDocument.data();

           return {
  id: participantDocument.id,
  name:
    typeof participantData.name === "string"
      ? participantData.name
      : "Partecipante senza nome",
  code: participantDocument.id,
};
          })
          .sort((firstParticipant, secondParticipant) =>
            firstParticipant.name.localeCompare(
              secondParticipant.name,
              "it",
              { sensitivity: "base" }
            )
          );

        setParticipants(orderedParticipants);
      } catch (error) {
        console.error(
          "Errore durante il caricamento dei partecipanti:",
          error
        );

        setErrorMessage(
          "Impossibile caricare l'elenco dei partecipanti."
        );
      } finally {
        setLoading(false);
      }
    }

    loadParticipants();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <header className="mb-6 text-center">
          <div className="text-5xl">👥</div>

          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-emerald-300">
            FantaDolomiti2026
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Partecipanti e codici
          </h1>
        </header>

        {loading && (
          <p className="rounded-2xl bg-white/10 p-5 text-center text-slate-200">
            Caricamento partecipanti...
          </p>
        )}

        {!loading && errorMessage && (
          <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-center text-red-200">
            ❌ {errorMessage}
          </p>
        )}

        {!loading &&
          !errorMessage &&
          participants.length === 0 && (
            <p className="rounded-2xl bg-white/10 p-5 text-center text-slate-300">
              Nessun partecipante trovato.
            </p>
          )}

        {!loading &&
          !errorMessage &&
          participants.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/20">
              <table className="w-full border-collapse">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-300">
                      Partecipante
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-slate-300">
                      Codice
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {participants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="border-t border-white/10"
                    >
                      <td className="px-4 py-4 font-medium">
                        {participant.name}
                      </td>

                      <td className="px-4 py-4 text-right font-mono text-lg font-bold text-emerald-300">
                        {participant.code}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </main>
  );
}