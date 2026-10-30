import type { ProductionProject, ProductionTask } from "./types";
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
export const projectMatchesSearch = (p: ProductionProject, query: string) =>
  normalize(
    [
      p.title,
      p.client,
      ...p.tasks.flatMap((t) => [t.title, t.description, t.supplier]),
    ].join(" "),
  ).includes(normalize(query));
export const taskMatchesSearch = (
  p: ProductionProject,
  t: ProductionTask,
  query: string,
) =>
  normalize(
    [p.title, p.client, t.title, t.description, t.supplier].join(" "),
  ).includes(normalize(query));
