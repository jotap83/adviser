import type { AppState, Client, Demand, Nucleus, Person } from "./types";

export const UNASSIGNED = "A distribuir";

/** One-time, additive migration. Never overwrite the user's later assignments. */
export function withOrganization(s: AppState): AppState {
  if (s.organizationDemo) return s;
  const nuclei: Nucleus[] = s.nuclei
    ? [...s.nuclei]
    : [1, 2, 3, 4].map((n) => ({ id: `n${n}`, name: `Núcleo ${n}` }));
  for (const c of s.clients) {
    if (
      c.nucleus &&
      c.nucleus !== UNASSIGNED &&
      !nuclei.some((n) => n.name === c.nucleus || n.id === c.nucleusId)
    ) {
      let id = `legacy-${nuclei.length + 1}`;
      while (nuclei.some((n) => n.id === id)) id += "x";
      nuclei.push({ id, name: c.nucleus });
    }
  }
  const memberships: Record<string, string[]> = {
    u1: ["n1", "n3"],
    u2: ["n2"],
    u3: ["n4"],
  };
  const users = s.users.map((u) => {
    const ids =
      u.nucleusIds ??
      (memberships[u.id] || []).filter((id) => nuclei.some((n) => n.id === id));
    return {
      ...u,
      nucleusIds: ids,
      primaryNucleusId: u.primaryNucleusId ?? ids[0] ?? "",
    };
  });
  const defaultOwners: Record<string, string> = {
    c1: "u1",
    c2: "u2",
    c3: "u1",
    c4: "u3",
  };
  return {
    ...s,
    organizationDemo: true,
    users,
    nuclei: nuclei.map((n) => ({
      ...n,
      coordinatorId:
        n.coordinatorId ??
        users.find((u) => u.active && u.nucleusIds.includes(n.id))?.id ??
        "",
    })),
    clients: s.clients.map((c) => ({
      ...c,
      nucleusId:
        c.nucleusId ?? nuclei.find((n) => n.name === c.nucleus)?.id ?? "",
      accountOwnerId:
        c.accountOwnerId ??
        (users.some((u) => u.id === defaultOwners[c.id] && u.active)
          ? defaultOwners[c.id]
          : ""),
    })),
    demoUserId: s.demoUserId ?? users.find((u) => u.active)?.id ?? "",
  };
}

export function clientNucleus(s: AppState, c?: Client) {
  return s.nuclei?.find((n) => n.id === c?.nucleusId);
}
export function nucleusLabel(s: AppState, c?: Client) {
  return clientNucleus(s, c)?.name || UNASSIGNED;
}
export function accountOwner(s: AppState, c?: Client) {
  return s.users.find((u) => u.id === c?.accountOwnerId);
}
export function suggestedOwner(s: AppState, clientId: string) {
  const person = accountOwner(
    s,
    s.clients.find((c) => c.id === clientId),
  );
  return person?.active ? person.name : "";
}
export function demoPerson(s: AppState) {
  return (
    s.users.find((u) => u.active && u.id === s.demoUserId) ||
    s.users.find((u) => u.active)
  );
}
export function demandNucleusId(s: AppState, d: Demand) {
  return (
    clientNucleus(
      s,
      s.clients.find((c) => c.id === d.clientId),
    )?.id || ""
  );
}
export function needsAssignment(s: AppState, d: Demand) {
  const client = s.clients.find((c) => c.id === d.clientId);
  return (
    !clientNucleus(s, client) ||
    !accountOwner(s, client)?.active ||
    !s.users.some((u) => u.active && u.name === d.owner)
  );
}
export function inScope(s: AppState, d: Demand, scope: string) {
  const person = demoPerson(s);
  if (scope === "mine") return !!person && d.owner === person.name;
  if (scope === "nucleus")
    return (
      !!person?.primaryNucleusId &&
      demandNucleusId(s, d) === person.primaryNucleusId
    );
  if (scope === "unassigned") return needsAssignment(s, d);
  return true;
}

export function savePerson(s: AppState, person: Person): AppState {
  const ids = [
    ...new Set(
      [person.primaryNucleusId, ...(person.nucleusIds || [])].filter(
        (id): id is string => !!id,
      ),
    ),
  ];
  const next = { ...person, nucleusIds: ids };
  const previous = s.users.find((u) => u.id === next.id);
  return {
    ...s,
    demands:
      previous && previous.name !== next.name
        ? s.demands.map((d) =>
            d.owner === previous.name ? { ...d, owner: next.name } : d,
          )
        : s.demands,
    users: s.users.some((u) => u.id === next.id)
      ? s.users.map((u) => (u.id === next.id ? next : u))
      : [...s.users, next],
    nuclei: s.nuclei?.map((n) =>
      n.coordinatorId === next.id && (!next.active || !ids.includes(n.id))
        ? { ...n, coordinatorId: "" }
        : n,
    ),
  };
}
export function saveNucleus(
  s: AppState,
  nucleus: Nucleus,
  memberIds: string[],
): AppState {
  const ids = new Set([
    ...memberIds,
    ...(nucleus.coordinatorId ? [nucleus.coordinatorId] : []),
  ]);
  return {
    ...s,
    nuclei: s.nuclei?.some((n) => n.id === nucleus.id)
      ? s.nuclei.map((n) => (n.id === nucleus.id ? nucleus : n))
      : [...(s.nuclei || []), nucleus],
    users: s.users.map((u) => {
      const memberships = (u.nucleusIds || []).filter(
        (id) => id !== nucleus.id,
      );
      if (ids.has(u.id)) memberships.push(nucleus.id);
      return {
        ...u,
        nucleusIds: memberships,
        primaryNucleusId: memberships.includes(u.primaryNucleusId || "")
          ? u.primaryNucleusId
          : memberships[0] || "",
      };
    }),
    clients: s.clients.map((c) =>
      c.nucleusId === nucleus.id ? { ...c, nucleus: nucleus.name } : c,
    ),
  };
}
