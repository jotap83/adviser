import { useStore, go } from "../store";
import { approvalStatus } from "../approval-model";
import { isTaskLate } from "../production-model";
import { money } from "../domain.mjs";
export function CrossAreaSummary() {
  const { state } = useStore(),
    projects = state.productionProjects || [],
    tasks = projects.flatMap((p) => p.tasks),
    entries = state.financeEntries || [];
  return (
    <section
      className="cross-area-summary"
      aria-label="Panorama de todas as áreas"
    >
      <div>
        <h2>Panorama da operação</h2>
        <p>
          Situação atual de toda a carteira. Os filtros abaixo detalham o
          atendimento.
        </p>
      </div>
      <div className="cross-area-metrics">
        <button onClick={() => go("/operacoes")}>
          <strong>{projects.length} eventos em operação</strong>
          <span>
            {tasks.filter(isTaskLate).length} tarefas atrasadas · abrir carteira
          </span>
        </button>
        <button onClick={() => go("/aprovacoes/todas")}>
          <strong>
            {
              (state.approvals || []).filter(
                (r) => approvalStatus(state, r) === "pending",
              ).length
            }{" "}
            aprovações pendentes
          </strong>
          <span>Todas as entregas e pagamentos · abrir central</span>
        </button>
        <button onClick={() => go("/financeiro")}>
          <strong>
            {money(
              entries
                .filter((e) => e.direction === "receive" && !e.settled)
                .reduce((n, e) => n + e.amount, 0),
            )}{" "}
            a receber
          </strong>
          <span>
            {money(
              entries
                .filter((e) => e.direction === "pay" && !e.settled)
                .reduce((n, e) => n + e.amount, 0),
            )}{" "}
            a pagar · abrir financeiro
          </span>
        </button>
      </div>
    </section>
  );
}
