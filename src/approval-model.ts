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
  if (target.kind === "briefing") {
    const d = s.demands.find((d) => d.id === target.targetId);
    return d
      ? JSON.stringify({
          title: d.title,
          clientId: d.clientId,
          date: d.date,
          guests: d.guests,
          budget: d.budget,
          location: d.location,
          objective: d.objective,
          questions: d.questions,
          scope: d.scope,
          details: Object.fromEntries(
            Object.entries(d.briefingDetails || {}).filter(
              ([key]) => !key.startsWith("post"),
            ),
          ),
        })
      : "";
  }
  if (target.kind === "creative") {
    const p = s.demands
      .find((d) => d.id === target.targetId)
      ?.presentations?.find((p) => p.id === target.versionId);
    return p
      ? JSON.stringify({
          title: p.title,
          number: p.number,
          concept: p.concept,
          changes: p.changes,
          source: p.source,
          url: p.url,
          fileName: p.fileName,
          at: p.at,
        })
      : "";
  }
  if (target.kind !== "payment") {
    const doc = s.eventDocuments?.find(
      (d) =>
        d.eventId === target.targetId &&
        d.id === target.versionId &&
        d.kind === target.kind,
    );
    return doc
      ? JSON.stringify({
          title: doc.title,
          content: doc.content,
          url: doc.url,
          revision: doc.revision,
          kind: doc.kind,
          eventId: doc.eventId,
          createdAt: doc.createdAt,
          proposalVersionId: doc.proposalVersionId,
          contractVersion:
            doc.kind === "contract"
              ? s.demands.find((d) => d.id === doc.eventId)?.acceptedVersion
              : undefined,
          operationalPlan:
            doc.kind === "schedule"
              ? s.productionProjects
                  ?.find(
                    (p) => (p.eventId || p.source?.demandId) === doc.eventId,
                  )
                  ?.tasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    supplier: t.supplier,
                    due: t.due,
                    owner: t.owner,
                    phase: t.phase,
                    priority: t.priority,
                    checklist: t.checklist.map(({ id, text }) => ({
                      id,
                      text,
                    })),
                  }))
              : undefined,
          accounts:
            doc.kind === "accountability"
              ? s.financeEntries
                  ?.filter(
                    (e) =>
                      e.projectId ===
                      s.productionProjects?.find(
                        (p) =>
                          (p.eventId || p.source?.demandId) === doc.eventId,
                      )?.id,
                  )
                  .map((e) => ({
                    id: e.id,
                    description: e.description,
                    direction: e.direction,
                    amount: e.amount,
                    due: e.due,
                    settled: e.settled,
                    documentRef: e.documentRef,
                  }))
              : undefined,
        })
      : "";
  }
  const e = s.financeEntries?.find((e) => e.id === target.targetId);
  return e
    ? JSON.stringify([
        e.projectId,
        e.description,
        e.direction,
        e.amount,
        e.due,
        e.category || "event",
        e.documentRef || "",
      ])
    : "";
}
export const approvalStatus = (s: AppState, r: ApprovalRequest) =>
  approvalFingerprint(s, r) !== r.fingerprint
    ? "outdated"
    : r.reviewers.some((x) => x.decision === "changes")
      ? "changes"
      : r.reviewers.length > 0 &&
          r.reviewers.every((x) => x.decision === "approved")
        ? "approved"
        : "pending";

export function pendingEventApprovals(s: AppState, eventId: string) {
  const projects = new Set(
    (s.productionProjects || [])
      .filter((p) => (p.eventId || p.source?.demandId) === eventId)
      .map((p) => p.id),
  );
  const entries = new Set(
    (s.financeEntries || [])
      .filter((e) => projects.has(e.projectId))
      .map((e) => e.id),
  );
  return (s.approvals || []).filter(
    (r) =>
      (r.kind === "payment"
        ? entries.has(r.targetId)
        : r.targetId === eventId) && approvalStatus(s, r) === "pending",
  );
}
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
        : t.kind === "payment"
          ? e!.description
          : `${d?.title || "Evento"} · ${JSON.parse(fingerprint).title || t.kind}`,
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
  if (r.kind === "proposal")
    return `/demandas/${r.targetId}/approval/${r.versionId || ""}`;
  if (r.kind === "payment")
    return `/financeiro/${s.financeEntries?.find((e) => e.id === r.targetId)?.projectId || ""}`;
  if (r.kind === "briefing") return `/eventos/${r.targetId}/briefing`;
  if (r.kind === "creative")
    return `/eventos/${r.targetId}/creative/${r.versionId || ""}`;
  return `/eventos/${r.targetId}/documents/${r.versionId || ""}`;
}

export const approvalNoticeRoute = (r: ApprovalRequest) =>
  `/aprovacoes/solicitacao/${r.id}`;
