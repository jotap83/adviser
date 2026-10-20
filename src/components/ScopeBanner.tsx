import { Badge } from "./UI";
export function ScopeBanner({ path }: { path: string }) {
  const section = path.split("/")[1];
  const planning = ["fluxo", "escopo", "roadmap"].includes(section);
  const phase = section === "operacoes" ? 2 : section === "financeiro" ? 3 : 1;
  const messages = ["emails", "mensagens"].includes(section);
  return (
    <div className="scope-banner">
      <Badge tone={planning ? "gray" : phase > 1 ? "amber" : "blue"}>
        {planning
          ? "Mapa das entregas"
          : phase === 1
            ? "MVP · etapa 1"
            : `Etapa ${phase} · fora do MVP`}
      </Badge>
      <span>
        {planning
          ? "MVP de atendimento, Operações e financeiro em entregas separadas."
          : messages
            ? "Cadastro direto, Gmail e WhatsApp fazem parte do MVP. Mensagens e IA são simuladas; nenhuma conta está conectada."
            : phase === 1
              ? "Atendimento até a proposta aprovada e o repasse. Funcionalidades demonstradas com dados locais."
              : phase === 2
                ? "Prévia de produção e execução. Tarefas e comentários ficam somente neste navegador."
                : "Prévia de financeiro próprio. Nenhuma transação bancária ou integração real."}
      </span>
      {!planning && <a href="#/escopo">Ver escopo</a>}
    </div>
  );
}
