"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { challenges } from "../data/challenges";
import { db } from "../lib/firebase";

type ProofStatus = "pending" | "approved" | "rejected";

type ProofData = {
  participantCode?: string;
  challengeId?: string;
  status?: ProofStatus;
};

type SavedParticipant = {
  code: string;
  name?: string;
  teamId: string;
  active?: boolean;
};

function frequencyLabel(frequency: "once" | "daily") {
  return frequency === "once" ? "Una volta" : "Ogni giorno";
}

function mediaLabel(media: "photo" | "video" | "both") {
  if (media === "photo") return "Foto";
  if (media === "video") return "Video";
  return "Foto o video";
}

function mediaIcon(media: "photo" | "video" | "both") {
  if (media === "photo") return "📷";
  if (media === "video") return "🎥";
  return "📷 / 🎥";
}

export default function ChallengesPage() {
  const [proofStatuses, setProofStatuses] = useState<
    Record<string, ProofStatus>
  >({});

  const [loadingProofs, setLoadingProofs] = useState(true);

  const orderedChallenges = [...challenges].sort(
    (firstChallenge, secondChallenge) =>
      firstChallenge.order - secondChallenge.order
  );

  useEffect(() => {
    async function loadParticipantProofs() {
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

      const proofsQuery = query(
  collection(db, "proofs"),
  where("participant.code", "==", participant.code)
);

        const proofsSnapshot = await getDocs(proofsQuery);

        const statuses: Record<string, ProofStatus> = {};

        proofsSnapshot.docs.forEach((proofDocument) => {
          const proof = proofDocument.data() as ProofData;

          if (!proof.challengeId || !proof.status) {
            return;
          }

      const challengeKey = String(proof.challengeId);
const currentStatus = statuses[challengeKey];
          /*
           * Se esiste una prova in attesa, la sfida viene bloccata.
           * Altrimenti una prova approvata ha priorità su una rifiutata.
           * Una prova rifiutata lascia nuovamente disponibile la sfida.
           */
          if (proof.status === "pending") {
       statuses[challengeKey] = "pending";
            return;
          }

          if (
            proof.status === "approved" &&
            currentStatus !== "pending"
          ) {
      statuses[challengeKey] = "approved";
            return;
          }

          if (!currentStatus) {
         statuses[challengeKey] = "rejected";
          }
        });

        setProofStatuses(statuses);
      } catch (error) {
        console.error(
          "Errore durante il caricamento delle prove:",
          error
        );
      } finally {
        setLoadingProofs(false);
      }
    }

    loadParticipantProofs();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="text-6xl">🗺️</div>

          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-emerald-300">
            FantaDolomiti2026
          </p>

          <h1 className="mt-2 text-4xl font-bold">Sfide</h1>

          <p className="mt-3 text-slate-300">
            Scegli una prova e prepara la foto o il video richiesto.
          </p>
        </header>

        {loadingProofs && (
          <p className="mb-5 rounded-xl bg-white/10 p-4 text-center text-slate-200">
            Caricamento stato delle prove...
          </p>
        )}

        <div className="space-y-4">
          {orderedChallenges.map((challenge) => {
            const proofStatus =
  proofStatuses[String(challenge.id)];

            const isPending = proofStatus === "pending";

            const isCompleted =
              challenge.frequency === "once" &&
              proofStatus === "approved";

            const isDisabled =
              loadingProofs || isPending || isCompleted;

            let buttonText = "Apri la prova";

            if (loadingProofs) {
              buttonText = "Caricamento...";
            } else if (isPending) {
              buttonText = "⏳ In attesa di approvazione";
            } else if (isCompleted) {
              buttonText = "✅ Completata";
            }

            let buttonClass =
              "mt-5 w-full rounded-xl px-5 py-3 font-bold text-white transition";

            if (loadingProofs) {
              buttonClass +=
                " cursor-not-allowed bg-slate-600 opacity-70";
            } else if (isPending) {
              buttonClass +=
                " cursor-not-allowed bg-amber-500/70";
            } else if (isCompleted) {
              buttonClass +=
                " cursor-not-allowed bg-emerald-600";
            } else {
              buttonClass +=
                " bg-emerald-500 hover:bg-emerald-400";
            }

            return (
              <article
                key={challenge.id}
                className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Prova {challenge.order}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {challenge.title}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-emerald-500/20 px-3 py-2 text-center">
                    <p className="text-xl font-bold text-emerald-300">
                      +{challenge.points}
                    </p>

                    <p className="text-xs uppercase text-emerald-100">
                      punti
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-slate-200">
                  {challenge.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs uppercase text-slate-400">
                      Frequenza
                    </p>

                    <p className="mt-1 font-semibold">
                      🔄 {frequencyLabel(challenge.frequency)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs uppercase text-slate-400">
                      Media consentiti
                    </p>

                    <p className="mt-1 font-semibold">
                      {mediaIcon(challenge.media)}{" "}
                      {mediaLabel(challenge.media)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) {
                      return;
                    }

                    window.location.href =
                      `/challenges/${challenge.id}`;
                  }}
                  className={buttonClass}
                >
                  {buttonText}
                </button>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="mt-8 w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
        >
          ← Torna alla pagina principale
        </button>
      </section>
    </main>
  );
}