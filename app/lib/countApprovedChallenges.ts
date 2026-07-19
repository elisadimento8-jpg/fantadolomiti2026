import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

type ProofData = {
  challengeId?: string;
  status?: string;
};

export async function countApprovedChallenges(
  participantCode: string
): Promise<number> {
  const proofsQuery = query(
    collection(db, "proofs"),
    where("participant.code", "==", participantCode)
  );

  const proofsSnapshot = await getDocs(proofsQuery);

  const approvedChallengeIds = new Set<string>();

  proofsSnapshot.docs.forEach((proofDocument) => {
    const proof = proofDocument.data() as ProofData;

    if (
      proof.status === "approved" &&
      typeof proof.challengeId === "string"
    ) {
      approvedChallengeIds.add(proof.challengeId);
    }
  });

  return approvedChallengeIds.size;
}