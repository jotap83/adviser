import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { useStore, go } from "../store";
import { uid } from "../data";
import { saveNucleus, savePerson, UNASSIGNED } from "../organization";
import type { Nucleus, Person } from "../types";
import { Badge, Button, Empty, Label, Note } from "./UI";

export function TeamManagement({
  initialTab = "team",
}: {
  initialTab?: string;
}) {
  const { state, setState, notify } = useStore();
  const [tab, setTab] = useState(initialTab === "nucleos" ? "nuclei" : "team");
  const [person, setPerson] = useState<Person | null>(null);
  const [nucleus, setNucleus] = useState<Nucleus | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const nuclei = state.nuclei || [];
  const editing = !!person || !!nucleus;
  function close() {
    setPerson(null);
    setNucleus(null);
    setError("");
  }
  function editNucleus(n: Nucleus) {
    close();
    setNucleus({ ...n });
    setMembers(
      state.users.filter((u) => u.nucleusIds?.includes(n.id)).map((u) => u.id),
    );
  }
  return (
    <section className="panel organization-panel">
      <div className="section-heading">
        <div>
          <h2>
            Equipe e carteiras <Badge tone="blue">MVP</Badge>
          </h2>
          <p>Organize os núcleos, seus integrantes e a coordenação.</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            close();
            if (tab === "team")
              setPerson({
                id: uid(),
                name: "",
                email: "",
                role: "Atendimento",
                active: true,
                nucleusIds: [],
                primaryNucleusId: "",
              });
            else editNucleus({ id: uid(), name: "", coordinatorId: "" });
          }}
        >
          {tab === "team" ? "Adicionar pessoa" : "Novo núcleo"}
        </Button>
      </div>
      <div
        className="organization-tabs"
        role="tablist"
        aria-label="Organização do atendimento"
      >
        {[
          { id: "team", label: "Pessoas" },
          { id: "nuclei", label: "Núcleos" },
        ].map((t) => (
          <button
            key={t.id}
            id={`org-tab-${t.id}`}
            role="tab"
            tabIndex={tab === t.id ? 0 : -1}
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
                return;
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? "team"
                  : e.key === "End"
                    ? "nuclei"
                    : tab === "team"
                      ? "nuclei"
                      : "team";
              close();
              setTab(next);
              document.getElementById(`org-tab-${next}`)?.focus();
            }}
            aria-selected={tab === t.id}
            aria-controls="organization-content"
            onClick={() => {
              close();
              setTab(t.id);
            }}
          >
            {t.label}{" "}
            <span className="count">
              {t.id === "team" ? state.users.length : nuclei.length}
            </span>
          </button>
        ))}
      </div>
      <div
        id="organization-content"
        role="tabpanel"
        aria-labelledby={`org-tab-${tab}`}
      >
        {person && (
          <form
            className="organization-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!person.name.trim() || !person.email.trim()) {
                setError("Informe nome e e-mail.");
                return;
              }
              if (
                state.users.some(
                  (u) =>
                    u.id !== person.id &&
                    (u.email.toLowerCase() ===
                      person.email.trim().toLowerCase() ||
                      u.name.toLowerCase() ===
                        person.name.trim().toLowerCase()),
                )
              ) {
                setError(
                  "Já existe uma pessoa com esse nome ou e-mail. Use um nome de exibição que a diferencie.",
                );
                return;
              }
              setState((s) =>
                savePerson(s, {
                  ...person,
                  name: person.name.trim(),
                  email: person.email.trim(),
                }),
              );
              close();
              notify(
                "Pessoa e vínculos com os núcleos salvos. Nenhum convite foi enviado.",
              );
            }}
          >
            <h3>
              {state.users.some((u) => u.id === person.id)
                ? "Editar pessoa"
                : "Nova pessoa"}
            </h3>
            <div className="form-grid three">
              <Label label="Nome da pessoa">
                <input
                  required
                  value={person.name}
                  onChange={(e) =>
                    setPerson({ ...person, name: e.target.value })
                  }
                  autoFocus
                />
              </Label>
              <Label label="E-mail fictício">
                <input
                  type="email"
                  required
                  value={person.email}
                  onChange={(e) =>
                    setPerson({ ...person, email: e.target.value })
                  }
                />
              </Label>
              <Label label="Perfil">
                <select
                  value={person.role}
                  onChange={(e) =>
                    setPerson({ ...person, role: e.target.value })
                  }
                >
                  {[
                    "Atendimento",
                    "Administrador",
                    "Operações (etapa 2)",
                    "Financeiro (futuro)",
                    "Criação (futuro)",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Label>
              <Label
                label="Núcleo principal"
                hint="Define o filtro Meu núcleo no atendimento."
              >
                <select
                  value={person.primaryNucleusId || ""}
                  onChange={(e) =>
                    setPerson({
                      ...person,
                      primaryNucleusId: e.target.value,
                      nucleusIds: [
                        ...new Set(
                          [...(person.nucleusIds || []), e.target.value].filter(
                            Boolean,
                          ),
                        ),
                      ],
                    })
                  }
                >
                  <option value="">Sem núcleo principal</option>
                  {nuclei.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </Label>
            </div>
            <fieldset className="organization-members">
              <legend>Núcleos em que participa</legend>
              {nuclei.map((n) => (
                <label className="check-label" key={n.id}>
                  <input
                    type="checkbox"
                    checked={
                      person.primaryNucleusId === n.id ||
                      !!person.nucleusIds?.includes(n.id)
                    }
                    disabled={person.primaryNucleusId === n.id}
                    onChange={(e) =>
                      setPerson({
                        ...person,
                        nucleusIds: e.target.checked
                          ? [...(person.nucleusIds || []), n.id]
                          : person.nucleusIds?.filter((id) => id !== n.id),
                      })
                    }
                  />
                  {n.name}
                  {person.primaryNucleusId === n.id ? " · principal" : ""}
                </label>
              ))}
              {!nuclei.length && (
                <p className="muted">Cadastre um núcleo na aba Núcleos.</p>
              )}
            </fieldset>
            <label className="check-label">
              <input
                type="checkbox"
                checked={person.active}
                onChange={(e) =>
                  setPerson({ ...person, active: e.target.checked })
                }
              />
              Pessoa ativa na demonstração
            </label>
            <p className="field-hint">
              Alterar os vínculos não redistribui clientes nem demandas
              existentes. Ao retirar um coordenador do núcleo, a coordenação
              fica a definir.
            </p>
            {error && (
              <p className="organization-error" role="alert">
                {error}
              </p>
            )}
            <div className="actions">
              <Button type="submit" variant="primary">
                Salvar pessoa
              </Button>
              <Button onClick={close}>Cancelar</Button>
            </div>
          </form>
        )}
        {nucleus && (
          <form
            className="organization-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!nucleus.name.trim()) {
                setError("Informe o nome do núcleo.");
                return;
              }
              if (
                nuclei.some(
                  (n) =>
                    n.id !== nucleus.id &&
                    n.name.toLowerCase() === nucleus.name.trim().toLowerCase(),
                )
              ) {
                setError("Já existe um núcleo com esse nome.");
                return;
              }
              setState((s) =>
                saveNucleus(
                  s,
                  { ...nucleus, name: nucleus.name.trim() },
                  members,
                ),
              );
              close();
              notify(
                "Núcleo salvo. As carteiras e os responsáveis pelas demandas foram preservados.",
              );
            }}
          >
            <h3>
              {nuclei.some((n) => n.id === nucleus.id)
                ? "Editar núcleo"
                : "Novo núcleo"}
            </h3>
            <div className="form-grid">
              <Label label="Nome do núcleo">
                <input
                  required
                  autoFocus
                  value={nucleus.name}
                  onChange={(e) =>
                    setNucleus({ ...nucleus, name: e.target.value })
                  }
                  placeholder="Ex.: Núcleo 5"
                />
              </Label>
              <Label
                label="Coordenação"
                hint="A pessoa escolhida também participa do núcleo."
              >
                <select
                  value={nucleus.coordinatorId || ""}
                  onChange={(e) => {
                    setNucleus({ ...nucleus, coordinatorId: e.target.value });
                    if (e.target.value)
                      setMembers([...new Set([...members, e.target.value])]);
                  }}
                >
                  <option value="">A definir</option>
                  {state.users
                    .filter((u) => u.active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </Label>
            </div>
            <fieldset className="organization-members">
              <legend>Integrantes do núcleo</legend>
              {state.users
                .filter((u) => u.active || members.includes(u.id))
                .map((u) => (
                  <label className="check-label" key={u.id}>
                    <input
                      type="checkbox"
                      checked={
                        members.includes(u.id) || nucleus.coordinatorId === u.id
                      }
                      disabled={nucleus.coordinatorId === u.id}
                      onChange={(e) =>
                        setMembers(
                          e.target.checked
                            ? [...members, u.id]
                            : members.filter((id) => id !== u.id),
                        )
                      }
                    />
                    {u.name}
                    {!u.active ? " · inativo" : ""}
                  </label>
                ))}
            </fieldset>
            <p className="field-hint">
              Quem já tem núcleo principal passa a participar deste como apoio.
              O núcleo principal pode ser alterado no cadastro da pessoa.
            </p>
            {error && (
              <p className="organization-error" role="alert">
                {error}
              </p>
            )}
            <div className="actions">
              <Button type="submit" variant="primary">
                Salvar núcleo
              </Button>
              <Button onClick={close}>Cancelar</Button>
            </div>
          </form>
        )}
        {!editing &&
          (tab === "team" ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Pessoa</th>
                    <th>Núcleos</th>
                    <th>Carteira</th>
                    <th>Situação</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {state.users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong>
                        <small className="cell-sub">{u.email}</small>
                        <small className="cell-sub">{u.role}</small>
                      </td>
                      <td>
                        {nuclei.find((n) => n.id === u.primaryNucleusId)
                          ?.name || "Sem núcleo principal"}
                        <small className="cell-sub">
                          {nuclei
                            .filter(
                              (n) =>
                                n.id !== u.primaryNucleusId &&
                                u.nucleusIds?.includes(n.id),
                            )
                            .map((n) => n.name)
                            .join(", ") || "Sem outros núcleos"}
                        </small>
                      </td>
                      <td>
                        {
                          state.clients.filter((c) => c.accountOwnerId === u.id)
                            .length
                        }{" "}
                        clientes
                      </td>
                      <td>
                        <Badge tone={u.active ? "green" : "amber"}>
                          {u.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          icon={Pencil}
                          aria-label={`Editar ${u.name}`}
                          onClick={() => {
                            close();
                            setPerson({ ...u });
                          }}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Núcleo</th>
                    <th>Coordenação</th>
                    <th>Integrantes ativos</th>
                    <th>Carteira</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {nuclei.map((n) => {
                    const people = state.users.filter(
                      (u) => u.active && u.nucleusIds?.includes(n.id),
                    );
                    return (
                      <tr key={n.id}>
                        <td>
                          <strong>{n.name}</strong>
                        </td>
                        <td>
                          {state.users.find((u) => u.id === n.coordinatorId)
                            ?.name || "A definir"}
                        </td>
                        <td>
                          {people.length}
                          <small className="cell-sub organization-names">
                            {people.map((u) => u.name).join(", ") ||
                              "Adicione integrantes"}
                          </small>
                        </td>
                        <td>
                          {
                            state.clients.filter((c) => c.nucleusId === n.id)
                              .length
                          }{" "}
                          clientes
                        </td>
                        <td>
                          <div className="actions">
                            <Button
                              variant="ghost"
                              icon={Pencil}
                              aria-label={`Editar ${n.name}`}
                              onClick={() => editNucleus(n)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => go(`/clientes/carteira/${n.id}`)}
                            >
                              Ver carteira
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!nuclei.length && (
                <Empty
                  title="Nenhum núcleo cadastrado"
                  text="Crie um núcleo e associe as pessoas da equipe."
                />
              )}
            </div>
          ))}
      </div>
      {!editing && (
        <div className="organization-footer">
          <span>
            {
              state.clients.filter(
                (c) =>
                  !c.nucleusId ||
                  !c.accountOwnerId ||
                  !state.users.find((u) => u.id === c.accountOwnerId)?.active,
              ).length
            }{" "}
            clientes com distribuição pendente
          </span>
          <Button
            variant="ghost"
            onClick={() => go("/clientes/carteira/unassigned")}
          >
            {UNASSIGNED}
          </Button>
        </div>
      )}
      <Note>
        Os núcleos organizam as carteiras. Toda a equipe de atendimento continua
        com acesso aos clientes, custos e propostas. Pessoas e vínculos desta
        prévia são demonstrativos.
      </Note>
    </section>
  );
}
