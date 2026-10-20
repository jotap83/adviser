import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Badge, Button, Empty, Label, Note, Title } from "../components/UI";
import { go, useStore } from "../store";
import { money } from "../domain.mjs";
export function Finance({ projectId }: { projectId?: string }) {
  const { state, setState, notify } = useStore();
  const [kind, setKind] = useState("");
  const projects = state.productionProjects || [];
  const project = projects.find((p) => p.id === projectId) || projects[0];
  const entries = (state.financeEntries || []).filter(
    (entry) => entry.projectId === project?.id,
  );
  const sum = (direction: string, settled: boolean) =>
    entries
      .filter((e) => e.direction === direction && e.settled === settled)
      .reduce((total, entry) => total + entry.amount, 0);
  return (
    <>
      <Title
        title="Financeiro próprio"
        sub="Prévia da terceira etapa: contas a pagar e receber, caixa por evento e fechamento dentro da plataforma."
      />
      <Note>
        Hoje a Adviser usa o Conta Azul. A plataforma poderá assumir funções
        financeiras após validarmos o uso atual, a migração e as necessidades
        fiscais e bancárias. A substituição completa ainda não está definida.
      </Note>
      <div className="production-project-picker">
        <Label label="Projeto / evento">
          <select
            value={project?.id || ""}
            onChange={(e) => go(`/financeiro/${e.target.value}`)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Label>
        <Button
          icon={ArrowRight}
          onClick={() => go(`/operacoes/${project?.id || ""}`)}
        >
          Abrir operações
        </Button>
      </div>
      <dl className="finance-summary">
        <div>
          <dt>A receber</dt>
          <dd>{money(sum("receive", false))}</dd>
        </div>
        <div>
          <dt>A pagar</dt>
          <dd>{money(sum("pay", false))}</dd>
        </div>
        <div>
          <dt>Saldo realizado do exemplo</dt>
          <dd>{money(sum("receive", true) - sum("pay", true))}</dd>
        </div>
      </dl>
      <section className="panel finance-entries">
        <div className="section-heading">
          <div>
            <h2>Lançamentos do evento</h2>
            <p>
              Valores fictícios. As baixas apenas alteram esta demonstração.
            </p>
          </div>
          <Label label="Tipo de lançamento">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">Pagar e receber</option>
              <option value="pay">A pagar</option>
              <option value="receive">A receber</option>
            </select>
          </Label>
        </div>
        {entries.filter((e) => !kind || e.direction === kind).length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {entries
                  .filter((e) => !kind || e.direction === kind)
                  .map((entry) => (
                    <tr key={entry.id}>
                      <td className="finance-entry-description">{entry.description}</td>
                      <td data-label="Tipo">{entry.direction === "pay" ? "Pagar" : "Receber"}</td>
                      <td data-label="Vencimento">{entry.due.split("-").reverse().join("/")}</td>
                      <td data-label="Valor">{money(entry.amount)}</td>
                      <td data-label="Estado">
                        <Badge tone={entry.settled ? "green" : "amber"}>
                          {entry.settled ? "Baixado · demo" : "Previsto"}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          onClick={() => {
                            setState((s) => ({
                              ...s,
                              financeEntries: (s.financeEntries || []).map(
                                (e) =>
                                  e.id === entry.id
                                    ? { ...e, settled: !e.settled }
                                    : e,
                              ),
                            }));
                            notify(
                              entry.settled
                                ? "Baixa desfeita na demonstração."
                                : "Baixa simulada. Nenhum dinheiro foi movimentado.",
                            );
                          }}
                        >
                          {entry.settled ? "Desfazer baixa" : "Simular baixa"}
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Sem lançamentos neste recorte"
            text="Criar um projeto não cria obrigações financeiras automaticamente. A definição das parcelas pertence à etapa 3."
          />
        )}
      </section>
      <section className="scope-finance-next">
        <h2>Escopo a detalhar para a etapa 3</h2>
        <ul>
          <li>Parcelas, aprovação de pagamentos e comprovantes.</li>
          <li>Pagamentos diretos do cliente a fornecedores e adiantamentos.</li>
          <li>
            Conciliação, fluxo de caixa e previsto × realizado por evento.
          </li>
          <li>
            Fechamento e estudo de resultado, com regras comerciais confirmadas.
          </li>
          <li>
            Integração ou migração do Conta Azul, conforme as funções que
            precisarem continuar.
          </li>
        </ul>
        <p>
          Saldo de caixa não é lucro. O financeiro acompanha o projeto antes,
          durante e depois da execução.
        </p>
      </section>
    </>
  );
}
