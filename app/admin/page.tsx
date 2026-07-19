"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  increment,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import { challenges } from "../data/challenges";

export default function AdminPage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProofs() {
      const snapshot = await getDocs(collection(db, "proofs"));

      const data = snapshot.docs.map((proofDoc) => ({
        id: proofDoc.id,
        ...proofDoc.data(),
      }));

      setProofs(data);
    }

    loadProofs();
  }, []);

  async function approveProof(proof: any) {
    if (proof.status === "approved") {
      alert("Questa prova è già stata approvata.");
      return;
    }

    const challenge = challenges.find(
      (item) => String(item.id) === String(proof.challengeId)
    );

    if (!challenge) {
      alert("Sfida non trovata nell'elenco.");
      return;
    }

    const participantCode = proof.participant?.code;
    const teamId = proof.team?.id;

    if (!participantCode) {
      alert("Codice partecipante mancante.");
      return;
    }

    if (!teamId) {
      alert("ID squadra mancante.");
      return;
    }

    try {
      setLoadingId(proof.id);

      const proofRef = doc(db, "proofs", proof.id);
      const participantRef = doc(db, "participants", participantCode);
      const teamRef = doc(db, "teams", teamId);

      await runTransaction(db, async (transaction) => {
        const currentProofSnapshot = await transaction.get(proofRef);

        if (!currentProofSnapshot.exists()) {
          throw new Error("La prova non esiste.");
        }

        const currentProof = currentProofSnapshot.data();

        if (currentProof.status === "approved") {
          throw new Error("Questa prova è già stata approvata.");
        }

        transaction.update(proofRef, {
          status: "approved",
          awardedPoints: challenge.points,
        });

        transaction.update(participantRef, {
          points: increment(challenge.points),
        });

        transaction.update(teamRef, {
          points: increment(challenge.points),
        });
      });

      setProofs((oldProofs) =>
        oldProofs.map((item) =>
          item.id === proof.id
            ? {
                ...item,
                status: "approved",
                awardedPoints: challenge.points,
              }
            : item
        )
      );

      alert(`Prova approvata: +${challenge.points} punti`);
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Errore durante l'approvazione.";

      alert(message);
    } finally {
      setLoadingId(null);
    }
  }

  async function rejectProof(proof: any) {
    if (proof.status === "approved") {
      alert(
        "Una prova già approvata non può essere rifiutata, perché i punti sono già stati assegnati."
      );
      return;
    }

    try {
      setLoadingId(proof.id);

      await updateDoc(doc(db, "proofs", proof.id), {
        status: "rejected",
      });

      setProofs((oldProofs) =>
        oldProofs.map((item) =>
          item.id === proof.id
            ? {
                ...item,
                status: "rejected",
              }
            : item
        )
      );

      alert("Prova rifiutata.");
    } catch (error) {
      console.error(error);
      alert("Errore durante il rifiuto.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 p-8 text-white">
      <h1 className="mb-6 text-3xl font-bold">Pannello Admin</h1>

      {proofs.length === 0 ? (
        <p>Nessuna prova trovata.</p>
      ) : (
        <div className="space-y-4">
          {proofs.map((proof: any) => {
            const challenge = challenges.find(
              (item) => String(item.id) === String(proof.challengeId)
            );

            const isLoading = loadingId === proof.id;
            const isApproved = proof.status === "approved";

            return (
              <div
                key={proof.id}
                className="rounded-xl border border-white/20 p-4"
              >
                <h2 className="text-xl font-bold">
                  {proof.challengeTitle}
                </h2>

                <p>👤 {proof.participant?.name}</p>

                <p>👥 {proof.team?.teamName}</p>

                <p>
                  Punti:{" "}
                  {proof.awardedPoints ?? challenge?.points ?? "Non trovati"}
                </p>

                <p>Stato: {proof.status}</p>

                <a
                  href={proof.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline"
                >
                  Apri foto/video
                </a>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => approveProof(proof)}
                    disabled={isLoading || isApproved}
                    className="rounded bg-green-600 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Attendi..." : "✅ Approva"}
                  </button>

                  <button
                    onClick={() => rejectProof(proof)}
                    disabled={isLoading || isApproved}
                    className="rounded bg-red-600 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ❌ Rifiuta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}