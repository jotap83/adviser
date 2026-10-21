import type {
  AppState,
  Demand,
  ManagementEvent,
  Quote,
  Version,
} from "./types";
import { totals } from "./domain.mjs";
import { activeDemand, collectAlerts, isoDay } from "./operations";

const DAY = 86_400_000;
export const managementDefaults = { cycleDays: 10, marginPercent: 30 };
export const lossReasons = [
  "Preço",
  "Prazo",
  "Escopo",
  "Concorrência",
  "Evento adiado",
  "Sem retorno",
  "Outro",
];
export const revisionReasons = [
  "Mudança do cliente",
  "Informação incompleta",
  "Ajuste de fornecedor",
  "Correção interna",
  "Outro",
];
export type Period = "30" | "90" | "all";
export const instant = (value?: string): number | undefined => {
  if (!value || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return undefined;
  const n = Date.parse(value);
  return Number.isFinite(n) ? n : undefined;
};
export const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
export const ratio = (part: number, total: number) =>
  total ? (part * 100) / total : undefined;
export const elapsed = (start?: number, end?: number) =>
  start !== undefined && end !== undefined && end >= start
    ? (end - start) / DAY
    : undefined;
export function firstContact(d: Demand) {
  const candidates = [
    instant(d.management?.firstContactAt),
    ...(d.conversation || [])
      .filter((m) => m.direction === "in")
      .map((m) => instant(m.at)),
  ].filter((x): x is number => x !== undefined);
  return candidates.length ? Math.min(...candidates) : undefined;
}
export function orderedEvents(d: Demand, kind: ManagementEvent["kind"]) {
  return (d.management?.events || [])
    .filter((e) => e.kind === kind && instant(e.at) !== undefined)
    .sort((a, b) => instant(a.at)! - instant(b.at)!);
}
export const firstSent = (d: Demand) => orderedEvents(d, "proposal_sent")[0];
export const decisionEvent = (d: Demand) =>
  d.decision === "accepted" || d.decision === "declined"
    ? orderedEvents(d, d.decision).at(-1)
    : undefined;
export function proposalVersion(d: Demand): Version | undefined {
  return d.versions.find(
    (v) =>
      v.id === (d.decision === "accepted" ? d.acceptedVersion : d.sentVersion),
  );
}
export function forecast(d: Demand) {
  const version = proposalVersion(d);
  const costs = d.management?.forecast;
  if (
    !version ||
    !costs ||
    costs.versionId !== version.id ||
    !Number.isFinite(costs.internalCost) ||
    !Number.isFinite(costs.otherCost) ||
    costs.internalCost < 0 ||
    costs.otherCost < 0
  )
    return undefined;
  const remuneration = totals(version.lines, version.fee, version.tax).fee;
  const contribution = remuneration - costs.internalCost - costs.otherCost;
  return {
    version,
    remuneration,
    contribution,
    internalCost: costs.internalCost,
    otherCost: costs.otherCost,
    margin: ratio(contribution, remuneration),
  };
}
export function inPeriod(
  at: number | undefined,
  period: Period,
  now: number,
  offset = 0,
) {
  if (at === undefined || at > now) return false;
  if (period === "all") return offset === 0;
  const length = Number(period) * DAY;
  return at > now - length * (offset + 1) && at <= now - length * offset;
}
export function cycleRows(
  rows: Demand[],
  period: Period,
  now: number,
  offset = 0,
) {
  return rows.flatMap((d) => {
    const contact = firstContact(d),
      sent = instant(firstSent(d)?.at),
      accepted = instant(decisionEvent(d)?.at);
    if (d.decision !== "accepted" || !inPeriod(accepted, period, now, offset))
      return [];
    const days = elapsed(contact, accepted);
    if (days === undefined) return [];
    const before = elapsed(contact, sent),
      after = elapsed(sent, accepted);
    return [
      {
        d,
        contact: contact!,
        accepted: accepted!,
        sent,
        days,
        preparation:
          before !== undefined && after !== undefined ? before : undefined,
        negotiation:
          before !== undefined && after !== undefined ? after : undefined,
      },
    ];
  });
}
export function managementAnalytics(
  rows: Demand[],
  period: Period,
  now = Date.now(),
) {
  const cycles = cycleRows(rows, period, now);
  const previous = cycleRows(rows, period, now, 1);
  const average = mean(cycles.map((r) => r.days)),
    previousAverage = mean(previous.map((r) => r.days));
  const decided = rows.filter((d) =>
    inPeriod(instant(decisionEvent(d)?.at), period, now),
  );
  const accepted = decided.filter((d) => d.decision === "accepted");
  const refused = decided.filter((d) => d.decision === "declined");
  const forecasts = accepted.flatMap((d) => {
    const f = forecast(d);
    return f ? [{ d, ...f }] : [];
  });
  const fee = forecasts.reduce((s, r) => s + r.remuneration, 0);
  const result = forecasts.reduce((s, r) => s + r.contribution, 0);
  const replies = rows.flatMap((d) => {
    const start = firstContact(d);
    if (!inPeriod(start, period, now)) return [];
    const end = (d.conversation || [])
      .filter((m) => m.direction === "out" && !m.template)
      .map((m) => instant(m.at))
      .filter((x): x is number => x !== undefined && x >= start! && x <= now)
      .sort((a, b) => a - b)[0];
    const days = elapsed(start, end);
    return days === undefined ? [] : [{ d, hours: days * 24 }];
  });
  const commitments = rows.flatMap((d) => {
    const sent = firstSent(d);
    if (!sent || !inPeriod(instant(sent.at), period, now) || !sent.dueAt)
      return [];
    const sentDay = isoDay(new Date(sent.at));
    return [{ d, sent, onTime: sentDay <= sent.dueAt }];
  });
  const revisions = rows.flatMap((d) =>
    orderedEvents(d, "revision")
      .filter((e) => inPeriod(instant(e.at), period, now))
      .map((e) => ({ d, ...e })),
  );
  const split = cycles.filter(
    (r) => r.preparation !== undefined && r.negotiation !== undefined,
  );
  return {
    cycles,
    average,
    previousAverage,
    previousCount: previous.length,
    improvement:
      average !== undefined && previousAverage && period !== "all"
        ? ((previousAverage - average) * 100) / previousAverage
        : undefined,
    preparation: mean(split.map((r) => r.preparation!)),
    negotiation: mean(split.map((r) => r.negotiation!)),
    splitCount: split.length,
    decided,
    accepted,
    refused,
    conversion: ratio(accepted.length, decided.length),
    forecasts,
    fee,
    result,
    margin: ratio(result, fee),
    replies,
    replyHours: mean(replies.map((r) => r.hours)),
    commitments,
    punctuality: ratio(
      commitments.filter((r) => r.onTime).length,
      commitments.length,
    ),
    revisions,
    missingDecision: rows.filter(
      (d) =>
        ["accepted", "declined"].includes(d.decision) &&
        instant(decisionEvent(d)?.at) === undefined,
    ).length,
    missingCycle: accepted.length - cycles.length,
  };
}
export function riskRows(state: AppState, rows: Demand[], now = new Date()) {
  const targets = state.managementTargets || managementDefaults;
  const alerts = collectAlerts(state, now).filter((a) => a.kind !== "response");
  return rows
    .filter(activeDemand)
    .flatMap((d) => {
      const signals = alerts.filter((a) => a.demandId === d.id);
      const f = forecast(d),
        age = elapsed(firstContact(d), now.getTime());
      const lowMargin =
        d.decision !== "accepted" &&
        f?.margin !== undefined &&
        f.margin < targets.marginPercent;
      const longCycle =
        d.decision !== "accepted" &&
        age !== undefined &&
        age > targets.cycleDays;
      if (!signals.length && !lowMargin && !longCycle) return [];
      const top = signals.find((a) => a.severity === "high") || signals[0];
      return [
        {
          d,
          signals,
          lowMargin,
          longCycle,
          age,
          forecast: f,
          title: lowMargin
            ? "Revisar margem antes de negociar"
            : top?.title || "Retomar negociação acima da meta",
          detail: lowMargin
            ? `Contribuição prevista de ${Math.round(f!.margin!)}%; meta de ${targets.marginPercent}% sobre a remuneração da agência.`
            : top?.detail ||
              `${Math.floor(age!)} dias desde o primeiro contato; meta de ${targets.cycleDays} dias até o aceite.`,
          action: lowMargin
            ? "Revisar proposta"
            : top?.action || "Acompanhar cliente",
          path: lowMargin
            ? `/demandas/${d.id}/proposal`
            : top?.path || `/demandas/${d.id}/approval`,
          urgent: lowMargin || signals.some((a) => a.severity === "high"),
          value:
            d.decision !== "accepted" ? proposalVersion(d)?.total : undefined,
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(b.urgent) - Number(a.urgent) || (b.age || 0) - (a.age || 0),
    );
}
export function supplierAnalytics(
  state: AppState,
  rows: Demand[],
  period: Period,
  now = Date.now(),
) {
  return state.suppliers.flatMap((supplier) => {
    const all = rows.flatMap((d) =>
      d.quotes
        .filter((q) => q.supplierId === supplier.id)
        .map((q) => ({ d, q })),
    );
    const received = all.flatMap(({ d, q }) => {
      const sent = instant(q.sentAt),
        receivedAt = instant(q.firstReceivedAt);
      const days = elapsed(sent, receivedAt);
      if (!inPeriod(receivedAt, period, now) || days === undefined) return [];
      return [
        {
          d,
          q,
          hours: days * 24,
          onTime: q.deadline
            ? isoDay(new Date(receivedAt!)) <= q.deadline
            : undefined,
        },
      ];
    });
    const pending = all.filter(
      ({ d, q }) =>
        activeDemand(d) &&
        d.decision !== "accepted" &&
        q.status === "requested",
    );
    if (!received.length && !pending.length) return [];
    const complete = received.filter(
      (r) => r.q.firstResponseComplete !== undefined,
    );
    const deadlines = received.filter((r) => r.onTime !== undefined);
    return [
      {
        supplier,
        received,
        pending,
        hours: mean(received.map((r) => r.hours)),
        complete: ratio(
          complete.filter((r) => r.q.firstResponseComplete).length,
          complete.length,
        ),
        completeCount: complete.length,
        onTime: ratio(
          deadlines.filter((r) => r.onTime).length,
          deadlines.length,
        ),
        deadlineCount: deadlines.length,
        overdue: pending.filter(
          (r) => r.q.deadline && r.q.deadline < isoDay(new Date(now)),
        ).length,
      },
    ];
  });
}
function quoteComplete(q: Quote) {
  const lines = q.options?.length ? q.options.flatMap((o) => o.lines) : q.lines;
  return (
    q.template.fields
      .filter((f) => f.required)
      .every((f) => String(q.fields[f.id] || "").trim()) &&
    lines.length > 0 &&
    lines.every((l) => l.qty > 0 && l.unit >= 0 && Number.isFinite(l.unit))
  );
}
/** Capture immutable milestones when normal UI actions change state. Never invent dates for legacy data. */
export function trackManagementChange(
  previous: Demand | undefined,
  next: Demand,
  now: string,
): Demand {
  if (!previous || previous === next) return next;
  const management = {
    ...next.management,
    events: [...(next.management?.events || [])],
  };
  const record = (kind: ManagementEvent["kind"], reason?: string) => {
    const alreadyRecorded = management.events.some(
      (e) =>
        e.kind === kind &&
        !(previous.management?.events || []).some(
          (old) =>
            old.kind === e.kind &&
            old.at === e.at &&
            old.versionId === e.versionId,
        ),
    );
    if (!alreadyRecorded)
      management.events.push({
        kind,
        at: now,
        versionId: next.sentVersion,
        ...(kind === "proposal_sent"
          ? { dueAt: management.proposalDueAt }
          : {}),
        ...(reason ? { reason } : {}),
      });
  };
  if (
    next.sentVersion &&
    (next.sentVersion !== previous.sentVersion ||
      (previous.decision === "changes" && next.decision === "pending"))
  )
    record("proposal_sent");
  if (next.decision !== previous.decision) {
    if (next.decision === "accepted" || next.decision === "declined")
      record(
        next.decision,
        next.decision === "declined" ? management.lossReason : undefined,
      );
    if (next.decision === "changes")
      record("revision", management.revisionReason);
  }
  const quotes = next.quotes.map((q) => {
    const old = previous.quotes.find((p) => p.id === q.id);
    if (
      q.status === "received" &&
      old?.status !== "received" &&
      !old?.firstReceivedAt
    )
      return {
        ...q,
        firstReceivedAt: q.receivedAt || now,
        firstResponseComplete: quoteComplete(q),
      };
    if (old?.firstReceivedAt)
      return {
        ...q,
        firstReceivedAt: old.firstReceivedAt,
        firstResponseComplete: old.firstResponseComplete,
      };
    return q;
  });
  return { ...next, management, quotes };
}

/** Correct the current recorded outcome; a pending outcome only prepares the next reason. */
export function withManagementReason(
  d: Demand,
  field: "lossReason" | "revisionReason",
  reason: string,
): Demand {
  const kind = field === "lossReason" ? "declined" : "revision";
  const isCurrentOutcome =
    field === "lossReason"
      ? d.decision === "declined"
      : d.decision === "changes";
  const current = isCurrentOutcome ? orderedEvents(d, kind).at(-1) : undefined;
  return {
    ...d,
    management: {
      ...d.management,
      [field]: reason,
      events: (d.management?.events || []).map((event) =>
        event === current ? { ...event, reason } : event,
      ),
    },
  };
}
