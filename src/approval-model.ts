import type { AppState, ApprovalRequest } from "./types";
import { uid } from "./data";
export type ApprovalTarget = Pick<
  ApprovalRequest,
  "kind" | "targetId" | "versionId"
>;
export function approvalFingerprint(s: AppState, target: ApprovalTarget) {
  if (target.kind === "proposal") {
    const d = s.demands.find((d) => d.id === target.targetId),
      v = d?.versions.find((v) => v.id === target.versionId);
    return v ? JSON.stringify(v) : "";
  }
  const e = s.financeEntries?.find((e) => e.id === target.targetId);
  return e
    ? JSON.stringify([e.projectId, e.description, e.direction, e.amount, e.due])
    : "";
}
export const approvalStatus = (s: AppState, r: ApprovalRequest) =>
  approvalFingerprint(s, r) !== r.fingerprint
    ? "outdated"
    : r.reviewers.some((x) => x.decision === "changes")
      ? "changes"
      : r.reviewers.every((x) => x.decision === "approved")
        ? "approved"
        : "pending";
export const latestApproval = (s: AppState, t: ApprovalTarget) =>
  s.approvals?.find(
    (r) =>
      r.kind === t.kind &&
      r.targetId === t.targetId &&
      r.versionId === t.versionId,
  );
export const isApproved = (s: AppState, t: ApprovalTarget) => {
  const r = latestApproval(s, t);
  return !!r && approvalStatus(s, r) === "approved";
};
export function requestApproval(
  s: AppState,
  t: ApprovalTarget,
  requestedBy: string,
  reviewerIds: string[],
  now = new Date().toISOString(),
): AppState {
  const fingerprint = approvalFingerprint(s, t),
    latest = latestApproval(s, t);
  const reviewers = [...new Set(reviewerIds)].filter(
    (id) => id !== requestedBy && s.users.some((u) => u.id === id && u.active),
  );
  if (
    !fingerprint ||
    !reviewers.length ||
    !s.users.some((u) => u.id === requestedBy && u.active) ||
    (latest && ["pending", "approved"].includes(approvalStatus(s, latest)))
  )
    return s;
  const d = s.demands.find((d) => d.id === t.targetId),
    v = d?.versions.find((v) => v.id === t.versionId),
    e = s.financeEntries?.find((e) => e.id === t.targetId);
  if (t.kind === "payment" && (!e || e.direction !== "pay" || e.settled))
    return s;
  const record: ApprovalRequest = {
    ...t,
    id: uid(),
    fingerprint,
    title:
      t.kind === "proposal"
        ? `${d?.title} · proposta v${v?.number}`
        : e!.description,
    requestedBy,
    createdAt: now,
    reviewers: reviewers.map((userId) => ({
      userId,
      decision: "pending",
      comment: "",
    })),
  };
  return { ...s, approvals: [record, ...(s.approvals || [])] };
}
export function decideApproval(
  s: AppState,
  id: string,
  userId: string,
  decision: "approved" | "changes",
  comment: string,
  now = new Date().toISOString(),
): AppState {
  const r = s.approvals?.find((r) => r.id === id);
  if (
    !r ||
    approvalStatus(s, r) !== "pending" ||
    !s.users.some((u) => u.id === userId && u.active) ||
    !r.reviewers.some((x) => x.userId === userId && x.decision === "pending") ||
    (decision === "changes" && !comment.trim())
  )
    return s;
  return {
    ...s,
    approvals: s.approvals?.map((a) =>
      a.id === id
        ? {
            ...a,
            reviewers: a.reviewers.map((x) =>
              x.userId === userId
                ? { ...x, decision, comment: comment.trim(), at: now }
                : x,
            ),
          }
        : a,
    ),
  };
}
export function approvalNotifications(s: AppState, userId: string) {
  return (s.approvals || []).flatMap((r) => {
    const status = approvalStatus(s, r),
      mine = r.reviewers.find((x) => x.userId === userId);
    if (status === "pending" && mine?.decision === "pending")
      return [
        {
          id: `${r.id}:request:${userId}`,
          request: r,
          text: `Sua aprovação é necessária: ${r.title}`,
          pending: true,
        },
      ];
    if (
      r.requestedBy === userId &&
      (status === "approved" || status === "changes")
    )
      return [
        {
          id: `${r.id}:${status}`,
          request: r,
          text: `${status === "approved" ? "Aprovação concluída" : "Ajustes solicitados"}: ${r.title}`,
          pending: false,
        },
      ];
    return [];
  });
}
export function approvalRoute(s: AppState, r: ApprovalRequest) {
  return r.kind === "proposal"
    ? `/demandas/${r.targetId}/approval/${r.versionId || ""}`
    : `/financeiro/${s.financeEntries?.find((e) => e.id === r.targetId)?.projectId || ""}`;
}

export const approvalNoticeRoute = (r: ApprovalRequest) =>
  `/aprovacoes/solicitacao/${r.id}`;
