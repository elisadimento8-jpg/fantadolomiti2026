"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../../lib/firebase";
import { challenges } from "../../data/challenges";

type SelectedMedia = {
  file: File;
  previewUrl: string;
  type: "photo" | "video";
};

type ProofStatus = "not-sent" | "pending" | "approved" | "rejected";

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

export default function ChallengePage() {
  const params = useParams();

  const challengeId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const challenge = challenges.find(
    (currentChallenge) => currentChallenge.id === challengeId
  );

  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [checkingProofs, setCheckingProofs] = useState(true);
  const [submissionBlocked, setSubmissionBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [proofStatus, setProofStatus] = useState<ProofStatus>("not-sent");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const selectedMediaRef = useRef<SelectedMedia[]>([]);

  useEffect(() => {
    selectedMediaRef.current = selectedMedia;
  }, [selectedMedia]);

  useEffect(() => {
    async function checkExistingProofs() {
      if (!challenge) {
        setCheckingProofs(false);
        return;
      }

      setCheckingProofs(true);
      setSubmissionBlocked(false);
      setBlockReason("");
      setProofStatus("not-sent");

      const participantString = localStorage.getItem(
        "fantadolomitiParticipant"
      );

      if (!participantString) {
        setCheckingProofs(false);
        return;
      }

      try {
        const participant = JSON.parse(participantString);
        const participantCode = participant?.code;

        if (!participantCode) {
          setCheckingProofs(false);
          return;
        }

        const participantProofsQuery = query(
          collection(db, "proofs"),
          where("participant.code", "==", participantCode)
        );

        const snapshot = await getDocs(participantProofsQuery);

        const challengeProofs = snapshot.docs
          .map((proofDoc) => proofDoc.data())
          .filter(
            (proof: any) =>
              String(proof.challengeId) === String(challenge.id)
          );

        const sortedProofs = [...challengeProofs].sort(
          (firstProof: any, secondProof: any) => {
            const firstTime = firstProof.createdAt?.toMillis?.() ?? 0;
            const secondTime = secondProof.createdAt?.toMillis?.() ?? 0;
            return secondTime - firstTime;
          }
        );

        const latestProof = sortedProofs[0];

        if (
          latestProof?.status === "pending" ||
          latestProof?.status === "approved" ||
          latestProof?.status === "rejected"
        ) {
          setProofStatus(latestProof.status);
        }

        if (challenge.frequency === "once") {
          const alreadySent = challengeProofs.some(
            (proof: any) =>
              proof.status === "approved" || proof.status === "pending"
          );

          if (alreadySent) {
            setSubmissionBlocked(true);
            setBlockReason(
              "Questa prova può essere inviata una sola volta."
            );
          }
        }

        if (challenge.frequency === "daily") {
          const today = new Date();

          const alreadySentToday = challengeProofs.some((proof: any) => {
            if (
              !proof.createdAt?.toDate ||
              (proof.status !== "approved" && proof.status !== "pending")
            ) {
              return false;
            }

            const proofDate = proof.createdAt.toDate();

            return (
              proofDate.getFullYear() === today.getFullYear() &&
              proofDate.getMonth() === today.getMonth() &&
              proofDate.getDate() === today.getDate()
            );
          });

          if (alreadySentToday) {
            setSubmissionBlocked(true);
            setBlockReason(
              "Hai già inviato questa prova oggi. Potrai riprovarla domani."
            );
          }
        }
      } catch (error) {
        console.error("Errore durante il controllo delle prove:", error);
      } finally {
        setCheckingProofs(false);
      }
    }

    checkExistingProofs();
  }, [challenge]);

  useEffect(() => {
    return () => {
      selectedMediaRef.current.forEach((media) => {
        URL.revokeObjectURL(media.previewUrl);
      });
    };
  }, []);

  if (!challenge) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-7 text-center">
          <div className="text-6xl">❌</div>
          <h1 className="mt-4 text-3xl font-bold">Prova non trovata</h1>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/challenges";
            }}
            className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold transition hover:bg-emerald-400"
          >
            ← Torna alle sfide
          </button>
        </section>
      </main>
    );
  }

  function addSelectedFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

   const allowedFiles = files.filter((file) => {
  if (challenge?.media === "photo") {
    return file.type.startsWith("image/");
  }

  if (challenge?.media === "video") {
    return file.type.startsWith("video/");
  }

  return (
    file.type.startsWith("image/") ||
    file.type.startsWith("video/")
  );
});

    if (allowedFiles.length !== files.length) {
      setUploadMessage("Alcuni file non sono compatibili con questa prova.");
    } else {
      setUploadMessage("");
    }

    const newMedia: SelectedMedia[] = allowedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "photo",
    }));

    setSelectedMedia((currentMedia) => [...currentMedia, ...newMedia]);
    event.target.value = "";
  }

  function removeSelectedFile(indexToRemove: number) {
    setSelectedMedia((currentMedia) => {
      const mediaToRemove = currentMedia[indexToRemove];
      if (mediaToRemove) URL.revokeObjectURL(mediaToRemove.previewUrl);
      return currentMedia.filter((_, index) => index !== indexToRemove);
    });
  }

  function galleryAcceptValue() {
    if (challenge.media === "photo") return "image/*";
    if (challenge.media === "video") return "video/*";
    return "image/*,video/*";
  }

  async function handleSendProof() {
    if (submissionBlocked) {
      setUploadMessage(`❌ ${blockReason}`);
      return;
    }

    if (selectedMedia.length === 0) {
      setUploadMessage("Seleziona almeno una foto o un video.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("Caricamento in corso...");

      const participantString = localStorage.getItem(
        "fantadolomitiParticipant"
      );
      const teamString = localStorage.getItem("fantadolomitiTeam");

      if (!participantString || !teamString) {
        throw new Error(
          "Dati del partecipante o della squadra mancanti. Effettua nuovamente l'accesso."
        );
      }

      const participant = JSON.parse(participantString);
      const team = JSON.parse(teamString);

      await Promise.all(
        selectedMedia.map(async (media) => {
          const formData = new FormData();
          formData.append("file", media.file);
          formData.append("challengeId", challenge.id);
          formData.append("participant", participantString);
          formData.append("team", teamString);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error ?? "Caricamento non riuscito.");
          }

          await addDoc(collection(db, "proofs"), {
            challengeId: challenge.id,
            challengeTitle: challenge.title,
            participant,
            team,
            mediaUrl: result.url,
            mediaType: result.resourceType,
            status: "pending",
            createdAt: serverTimestamp(),
          });
        })
      );

      setUploadMessage(
        "✅ Prova caricata correttamente. Ora è in attesa di approvazione."
      );
      setProofStatus("pending");
      setSubmissionBlocked(true);
      setBlockReason(
        challenge.frequency === "once"
          ? "Questa prova può essere inviata una sola volta."
          : "Hai già inviato questa prova oggi. Potrai riprovarla domani."
      );

      selectedMedia.forEach((media) => {
        URL.revokeObjectURL(media.previewUrl);
      });
      setSelectedMedia([]);
    } catch (error) {
      console.error(error);
      setUploadMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Caricamento non riuscito."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="text-6xl">🏔️</div>
          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-emerald-300">
            FantaDolomiti2026
          </p>
          <h1 className="mt-2 text-4xl font-bold">{challenge.title}</h1>
        </header>

        <article className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Prova {challenge.order}
              </p>
              <h2 className="mt-1 text-2xl font-bold">{challenge.title}</h2>
            </div>

            <div className="rounded-xl bg-emerald-500/20 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-300">
                +{challenge.points}
              </p>
              <p className="text-xs uppercase text-emerald-100">punti</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-black/20 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Descrizione
            </p>
            <p className="mt-2 text-lg text-slate-100">
              {challenge.description}
            </p>

            <p className="mb-2 mt-5 text-xs uppercase tracking-wide text-slate-400">
              Stato della prova
            </p>

            <div
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm ${
                proofStatus === "pending"
                  ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-300"
                  : proofStatus === "approved"
                  ? "border-green-400/30 bg-green-500/10 text-green-300"
                  : proofStatus === "rejected"
                  ? "border-red-400/30 bg-red-500/10 text-red-300"
                  : "border-white/20 bg-white/10 text-white"
              }`}
            >
              {proofStatus === "pending"
                ? "🟡 In attesa"
                : proofStatus === "approved"
                ? "🟢 Approvata"
                : proofStatus === "rejected"
                ? "🔴 Rifiutata"
                : "⚪ Non inviata"}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs uppercase text-slate-400">Frequenza</p>
              <p className="mt-2 font-semibold">
                🔄 {frequencyLabel(challenge.frequency)}
              </p>
            </div>

            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs uppercase text-slate-400">
                Media consentiti
              </p>
              <p className="mt-2 font-semibold">
                {mediaIcon(challenge.media)} {mediaLabel(challenge.media)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/20 bg-black/10 p-5">
            <h3 className="text-center text-lg font-bold">📤 Invia prova</h3>
            <p className="mt-2 text-center text-sm text-slate-300">
              Scatta una foto oppure scegli un file dalla galleria.
            </p>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={addSelectedFiles}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              multiple
              onChange={addSelectedFiles}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept={galleryAcceptValue()}
              multiple
              onChange={addSelectedFiles}
              className="hidden"
            />

            <div className="mt-5 space-y-3">
              {challenge.media !== "video" && (
                <button
                  type="button"
                  disabled={checkingProofs || submissionBlocked}
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full rounded-xl bg-sky-500 px-5 py-3 font-bold transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  📷 Scatta foto
                </button>
              )}

              {challenge.media !== "photo" && (
                <button
                  type="button"
                  disabled={checkingProofs || submissionBlocked}
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full rounded-xl bg-violet-500 px-5 py-3 font-bold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  🎥 Registra video
                </button>
              )}

              <button
                type="button"
                disabled={checkingProofs || submissionBlocked}
                onClick={() => galleryInputRef.current?.click()}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                🖼️ Scegli dalla galleria
              </button>
            </div>

            {selectedMedia.length === 0 ? (
              <p className="mt-5 rounded-xl bg-black/20 p-3 text-center text-sm text-slate-400">
                📁 Nessun file selezionato
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                <p className="text-center font-semibold">
                  {selectedMedia.length} file selezionati
                </p>

                {selectedMedia.map((media, index) => (
                  <div
                    key={`${media.file.name}-${index}`}
                    className="rounded-2xl bg-black/20 p-3"
                  >
                    {media.type === "photo" ? (
                      <img
                        src={media.previewUrl}
                        alt={`Anteprima ${index + 1}`}
                        className="max-h-72 w-full rounded-xl object-contain"
                      />
                    ) : (
                      <video
                        src={media.previewUrl}
                        controls
                        className="max-h-72 w-full rounded-xl"
                      />
                    )}

                    <p className="mt-3 break-all text-sm text-slate-300">
                      {media.file.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="mt-3 w-full rounded-xl bg-red-500/20 px-4 py-2 font-semibold text-red-100 transition hover:bg-red-500/30"
                    >
                      🗑️ Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submissionBlocked && (
            <p className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-3 text-center text-sm text-yellow-200">
              🔒 {blockReason}
            </p>
          )}

          <button
            type="button"
            onClick={handleSendProof}
            disabled={
              selectedMedia.length === 0 ||
              uploading ||
              checkingProofs ||
              submissionBlocked
            }
            className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkingProofs
              ? "Controllo in corso..."
              : submissionBlocked
              ? "🔒 Prova non disponibile"
              : uploading
              ? "Caricamento in corso..."
              : "📤 Invia prova"}
          </button>

          {uploadMessage && (
            <p className="mt-3 rounded-xl bg-black/20 p-3 text-center text-sm">
              {uploadMessage}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              window.location.href = "/challenges";
            }}
            className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
          >
            ← Torna alle sfide
          </button>
        </article>
      </section>
    </main>
  );
}