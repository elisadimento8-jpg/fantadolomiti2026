"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type Team = {
  id: string;
  name: string;
  points: number;
};

type ProofStatus = "pending" | "approved" | "rejected";

type Proof = {
  id: string;
  challengeId: string;
  status: ProofStatus;
  participant: {
    id?: string;
    code?: string;
    name?: string;
    teamId?: string;
    teamName?: string;
  };
  mediaUrls: string[];
  createdAt?: unknown;
};

function readText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function readMediaUrls(data: Record<string, unknown>) {
  const possibleValues = [
    data.mediaUrls,
    data.media,
    data.urls,
    data.files,
  ];

  for (const possibleValue of possibleValues) {
    if (!Array.isArray(possibleValue)) {
      continue;
    }

    const urls = possibleValue
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          typeof item === "object" &&
          item !== null &&
          "url" in item &&
          typeof item.url === "string"
        ) {
          return item.url;
        }

        return "";
      })
      .filter(Boolean);

    if (urls.length > 0) {
      return urls;
    }
  }

  const singleUrl =
    readText(data.mediaUrl) ||
    readText(data.url) ||
    readText(data.fileUrl);

  return singleUrl ? [singleUrl] : [];
}

function getChallengeById(challengeId: string) {
  return challenges.find((challenge) => {
    const challengeData = challenge as unknown as Record<string, unknown>;

    return (
      String(challengeData.id ?? "") === challengeId ||
      String(challengeData.slug ?? "") === challengeId
    );
  });
}

function getChallengeTitle(challengeId: string) {
  const challenge = getChallengeById(challengeId);

  if (!challenge) {
    return `Sfida ${challengeId}`;
  }

  const challengeData = challenge as unknown as Record<string, unknown>;

  return (
    readText(challengeData.title) ||
    readText(challengeData.name) ||
    readText(challengeData.description) ||
    `Sfida ${challengeId}`
  );
}

function getChallengePoints(challengeId: string) {
  const challenge = getChallengeById(challengeId);

  if (!challenge) {
    return 0;
  }

  const challengeData = challenge as unknown as Record<string, unknown>;

  return (
    readNumber(challengeData.points) ||
    readNumber(challengeData.score) ||
    readNumber(challengeData.value)
  );
}

export default function AdminPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProofId, setLoadingProofId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState("");

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [proofsSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(collection(db, "proofs")),
        getDocs(collection(db, "teams")),
      ]);

      const loadedProofs: Proof[] = proofsSnapshot.docs.map(
        (proofDocument) => {
          const data = proofDocument.data() as Record<string, unknown>;

          const participantData =
            typeof data.participant === "object" &&
            data.participant !== null
              ? (data.participant as Record<string, unknown>)
              : {};

          const rawStatus = readText(data.status, "pending");

          const status: ProofStatus =
            rawStatus === "approved" || rawStatus === "rejected"
              ? rawStatus
              : "pending";

          return {
            id: proofDocument.id,
            challengeId:
              readText(data.challengeId) ||
              readText(data.challenge) ||
              readText(data.proofId),
            status,
            participant: {
              id: readText(participantData.id),
              code:
                readText(participantData.code) ||
                readText(data.participantCode),
              name:
                readText(participantData.name) ||
                readText(data.participantName, "Partecipante"),
              teamId:
                readText(participantData.teamId) ||
                readText(data.teamId),
              teamName:
                readText(participantData.teamName) ||
                readText(data.teamName),
            },
            mediaUrls: readMediaUrls(data),
            createdAt: data.createdAt,
          };
        }
      );

      const loadedTeams: Team[] = teamsSnapshot.docs.map(
        (teamDocument) => {
          const data = teamDocument.data() as Record<string, unknown>;

          return {
            id: teamDocument.id,
            name:
              readText(data.name) ||
              readText(data.teamName) ||
              teamDocument.id,
            points: readNumber(data.points),
          };
        }
      );

      setProofs(loadedProofs);
      setTeams(loadedTeams);
    } catch (error) {
      console.error(
        "Errore durante il caricamento della pagina admin:",
        error
      );

      setErrorMessage(
        "Impossibile caricare classifica e prove."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const sortedTeams = useMemo(
    () =>
      [...teams].sort(
        (firstTeam, secondTeam) =>
          secondTeam.points - firstTeam.points
      ),
    [teams]
  );

  const sortedProofs = useMemo(() => {
    const statusOrder: Record<ProofStatus, number> = {
      pending: 0,
      approved: 1,
      rejected: 2,
    };

    return [...proofs].sort(
      (firstProof, secondProof) =>
        statusOrder[firstProof.status] -
        statusOrder[secondProof.status]
    );
  }, [proofs]);

  async function approveProof(proof: Proof) {
    if (proof.status === "approved") {
      return;
    }

    try {
      setLoadingProofId(proof.id);
      setErrorMessage("");

      const points = getChallengePoints(proof.challengeId);
      const proofReference = doc(db, "proofs", proof.id);

      const participantDocumentId =
        proof.participant.code || proof.participant.id || "";

      const teamDocumentId = proof.participant.teamId || "";

      await runTransaction(db, async (transaction) => {
        const proofSnapshot = await transaction.get(proofReference);

        if (!proofSnapshot.exists()) {
          throw new Error("La prova non esiste più.");
        }

        const currentStatus = readText(
          proofSnapshot.data().status,
          "pending"
        );

        if (currentStatus === "approved") {
          return;
        }

        transaction.update(proofReference, {
          status: "approved",
          reviewedAt: new Date(),
        });

        if (points > 0 && participantDocumentId) {
          const participantReference = doc(
            db,
            "participants",
            participantDocumentId
          );

          transaction.update(participantReference, {
            points: increment(points),
          });
        }

        if (points > 0 && teamDocumentId) {
          const teamReference = doc(db, "teams", teamDocumentId);

          transaction.update(teamReference, {
            points: increment(points),
          });
        }
      });

      await loadAdminData();
    } catch (error) {
      console.error("Errore durante l'approvazione:", error);

      setErrorMessage(
        "Non è stato possibile approvare la prova."
      );
    } finally {
      setLoadingProofId(null);
    }
  }

  async function rejectProof(proof: Proof) {
    if (proof.status === "approved") {
      setErrorMessage(
        "Una prova già approvata non può essere rifiutata da questa pagina."
      );
      return;
    }

    try {
      setLoadingProofId(proof.id);
      setErrorMessage("");

      await updateDoc(doc(db, "proofs", proof.id), {
        status: "rejected",
        reviewedAt: new Date(),
      });

      await loadAdminData();
    } catch (error) {
      console.error("Errore durante il rifiuto:", error);

      setErrorMessage(
        "Non è stato possibile rifiutare la prova."
      );
    } finally {
      setLoadingProofId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 text-center">
          <div className="text-5xl">🏔️</div>

          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-emerald-300">
            FantaDolomiti2026
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Pannello amministratore
          </h1>
        </header>

        {loading && (
          <p className="rounded-2xl bg-white/10 p-6 text-center">
            Caricamento dati...
          </p>
        )}

        {!loading && errorMessage && (
          <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-center text-red-200">
            ❌ {errorMessage}
          </p>
        )}

        {!loading && (
          <>
            <section className="mb-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">
                  🏆 Classifica con punteggi
                </h2>

                <a
                  href="/admin/participants"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950"
                >
                  Partecipanti e codici
                </a>
              </div>

              {sortedTeams.length === 0 ? (
                <p className="rounded-2xl bg-white/10 p-5 text-center text-slate-300">
                  Nessuna squadra trovata.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedTeams.map((team, index) => (
                    <article
                      key={team.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-5"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-emerald-300">
                          {index + 1}
                        </span>

                        <span className="font-semibold">
                          {team.name}
                        </span>
                      </div>

                      <span className="text-xl font-bold text-emerald-300">
                        {team.points} punti
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">
                  📸 Prove inviate
                </h2>

                <button
                  type="button"
                  onClick={loadAdminData}
                  className="rounded-xl bg-white/10 px-4 py-2 font-semibold hover:bg-white/20"
                >
                  Aggiorna
                </button>
              </div>

              {sortedProofs.length === 0 ? (
                <p className="rounded-2xl bg-white/10 p-5 text-center text-slate-300">
                  Non è stata ancora inviata nessuna prova.
                </p>
              ) : (
                <div className="space-y-5">
                  {sortedProofs.map((proof) => (
                    <article
                      key={proof.id}
                      className="rounded-2xl border border-white/10 bg-white/10 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold">
                            {getChallengeTitle(proof.challengeId)}
                          </h3>

                          <p className="mt-1 text-slate-300">
                            {proof.participant.name ||
                              "Partecipante"}
                          </p>

                          {proof.participant.teamName && (
                            <p className="text-sm text-slate-400">
                              Squadra:{" "}
                              {proof.participant.teamName}
                            </p>
                          )}
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            proof.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : proof.status === "rejected"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {proof.status === "approved"
                            ? "Approvata"
                            : proof.status === "rejected"
                              ? "Rifiutata"
                              : "In attesa"}
                        </span>
                      </div>

                      {proof.mediaUrls.length > 0 && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {proof.mediaUrls.map(
                            (mediaUrl, mediaIndex) => {
                              const lowerUrl =
                                mediaUrl.toLowerCase();

                              const isVideo =
                                lowerUrl.includes(
                                  "/video/upload/"
                                ) ||
                                /\.(mp4|mov|webm|m4v)(\?|$)/i.test(
                                  lowerUrl
                                );

                              return isVideo ? (
                                <video
                                  key={`${proof.id}-${mediaIndex}`}
                                  src={mediaUrl}
                                  controls
                                  className="max-h-80 w-full rounded-xl bg-black object-contain"
                                />
                              ) : (
                                <a
                                  key={`${proof.id}-${mediaIndex}`}
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={mediaUrl}
                                    alt="Prova inviata"
                                    className="max-h-80 w-full rounded-xl bg-black object-contain"
                                  />
                                </a>
                              );
                            }
                          )}
                        </div>
                      )}

                      {proof.status === "pending" && (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={
                              loadingProofId === proof.id
                            }
                            onClick={() => approveProof(proof)}
                            className="rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
                          >
                            {loadingProofId === proof.id
                              ? "Attendi..."
                              : "✅ Approva"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              loadingProofId === proof.id
                            }
                            onClick={() => rejectProof(proof)}
                            className="rounded-xl bg-red-500 px-4 py-3 font-bold text-white disabled:opacity-50"
                          >
                            {loadingProofId === proof.id
                              ? "Attendi..."
                              : "❌ Rifiuta"}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}