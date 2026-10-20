import { useState } from "react";
import { Plus, Search, Pencil, Save, Trash2, ArrowRight } from "lucide-react";
import { useStore } from "../store";
import { uid } from "../data";
import type { Client, Supplier, Template } from "../types";
import { Title, Button, Label, Badge, Empty, Note } from "../components/UI";
export function Directory({ kind }: { kind: "clients" | "suppliers" }) {
  const { state, setState, notify } = useStore();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | Supplier | null>(null);
  const isSupplier = kind === "suppliers";
  const rows = (isSupplier ? state.suppliers : state.clients).filter((x) =>
    `${x.name} ${x.contact} ${x.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const base = {
      id: editing!.id,
      name: String(f.get("name")).trim(),
      contact: String(f.get("contact")).trim(),
      email: String(f.get("email")).trim(),
    };
    if (isSupplier) {
      const item = {
        ...base,
        category: String(f.get("category")),
        city: String(f.get("city")),
      };
      setState((s) => ({
        ...s,
        suppliers: s.suppliers.some((x) => x.id === item.id)
          ? s.suppliers.map((x) => (x.id === item.id ? item : x))
          : [...s.suppliers, item],
      }));
    } else {
      const item = { ...base, nucleus: String(f.get("nucleus")) };
      setState((s) => ({
        ...s,
        clients: s.clients.some((x) => x.id === item.id)
          ? s.clients.map((x) => (x.id === item.id ? item : x))
          : [...s.clients, item],
      }));
    }
    setEditing(null);
    notify("Cadastro salvo nesta demonstração.");
  }
  function newRow() {
    setEditing(
      isSupplier
        ? {
            id: uid(),
            name: "",
            contact: "",
            email: "",
            category: state.templates[0]?.id || "",
            city: "",
          }
        : { id: uid(), name: "", contact: "", email: "", nucleus: "Núcleo 1" },
    );
  }
  return (
    <>
      <Title
        title={isSupplier ? "Fornecedores" : "Clientes"}
        sub={
          isSupplier
            ? "Uma base organizada, pronta para cada nova cotação."
            : "Contatos e carteiras acessíveis para toda a equipe de atendimento."
        }
        actions={
          <Button variant="primary" icon={Plus} onClick={newRow}>
            {isSupplier ? "Novo fornecedor" : "Novo cliente"}
          </Button>
        }
      />
      {editing && (
        <form className="panel" onSubmit={save} key={editing.id}>
          <div className="section-heading">
            <h2>{editing.name ? "Editar cadastro" : "Novo cadastro"}</h2>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
          <div className="form-grid three">
            <Label label="Empresa *">
              <input
                name="name"
                required
                defaultValue={editing.name}
                autoFocus
              />
            </Label>
            <Label label="Pessoa de contato *">
              <input name="contact" required defaultValue={editing.contact} />
            </Label>
            <Label label="E-mail *">
              <input
                name="email"
                type="email"
                required
                defaultValue={editing.email}
                placeholder="contato@empresa.example.com"
              />
            </Label>
            {isSupplier ? (
              <>
                <Label label="Categoria *">
                  <select
                    name="category"
                    defaultValue={(editing as Supplier).category}
                  >
                    {state.templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label label="Cidade">
                  <input
                    name="city"
                    defaultValue={(editing as Supplier).city}
                  />
                </Label>
              </>
            ) : (
              <Label label="Núcleo responsável">
                <select
                  name="nucleus"
                  defaultValue={(editing as Client).nucleus}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <option key={i}>Núcleo {i}</option>
                  ))}
                </select>
              </Label>
            )}
          </div>
          <Button type="submit" variant="primary" icon={Save}>
            Salvar cadastro
          </Button>
        </form>
      )}
      <section className="panel flush">
        <div className="table-toolbar">
          <div className="search">
            <Search size={17} />
            <input
              aria-label="Buscar cadastros"
              placeholder={
                isSupplier
                  ? "Buscar fornecedor ou contato"
                  : "Buscar cliente ou contato"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge>{rows.length} registros fictícios</Badge>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{isSupplier ? "Fornecedor" : "Cliente"}</th>
                <th>{isSupplier ? "Categoria" : "Carteira"}</th>
                <th>Contato</th>
                <th>E-mail</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id}>
                  <td>
                    <strong>{x.name}</strong>
                    {isSupplier && (
                      <small className="cell-sub">{(x as Supplier).city}</small>
                    )}
                  </td>
                  <td>
                    {isSupplier
                      ? state.templates.find(
                          (t) => t.id === (x as Supplier).category,
                        )?.name
                      : (x as Client).nucleus}
                  </td>
                  <td>{x.contact}</td>
                  <td className="email-cell">{x.email}</td>
                  <td>
                    <Button
                      icon={Pencil}
                      variant="ghost"
                      onClick={() => setEditing(x)}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="Nenhum cadastro encontrado"
            text="Tente outro termo ou adicione um cadastro."
          />
        )}
      </section>
      <Note>
        {isSupplier
          ? "A categoria define o formulário de cotação. Os tipos e campos definitivos serão validados com a Adviser."
          : "No MVP, os núcleos organizam as carteiras. Todos os usuários de atendimento podem consultar custos e editar propostas."}
      </Note>
    </>
  );
}
export function Templates() {
  const { state, setState, notify } = useStore();
  const [active, setActive] = useState(state.templates[0]?.id || "");
  const selected = state.templates.find((t) => t.id === active);
  function save(t: Template) {
    setState((s) => ({
      ...s,
      templates: s.templates.map((x) =>
        x.id === t.id ? { ...t, version: x.version + 1 } : x,
      ),
    }));
    notify(
      "Modelo atualizado. Solicitações já criadas mantêm a versão anterior.",
    );
  }
  return (
    <>
      <Title
        title="Modelos de cotação"
        sub="Cada tipo de fornecedor responde exatamente o que o atendimento precisa."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              const id = uid();
              setState((s) => ({
                ...s,
                templates: [
                  ...s.templates,
                  { id, name: "Nova categoria", version: 1, fields: [] },
                ],
              }));
              setActive(id);
            }}
          >
            Nova categoria
          </Button>
        }
      />
      <Note>
        Itens, quantidades, preços e condições estão presentes em todos os
        modelos. Os campos abaixo são específicos de cada categoria.
      </Note>
      <div className="templates-layout">
        <nav className="template-nav" aria-label="Categorias de fornecedor">
          {state.templates.map((t) => (
            <button
              className={active === t.id ? "active" : ""}
              key={t.id}
              onClick={() => setActive(t.id)}
            >
              <span>
                {t.name}
                <small>
                  {t.fields.length} campos · v{t.version}
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
        </nav>
        {selected && (
          <TemplateEditor
            key={selected.id + "-" + selected.version}
            template={selected}
            onSave={save}
          />
        )}
      </div>
    </>
  );
}
function TemplateEditor({
  template,
  onSave,
}: {
  template: Template;
  onSave: (t: Template) => void;
}) {
  const [t, setT] = useState(structuredClone(template));
  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(t);
      }}
    >
      <div className="section-heading">
        <h2>Estrutura do formulário</h2>
        <Badge>Versão {template.version}</Badge>
      </div>
      <Label label="Nome da categoria *">
        <input
          value={t.name}
          required
          onChange={(e) => setT({ ...t, name: e.target.value })}
        />
      </Label>
      <div className="template-fields">
        {t.fields.map((f, i) => (
          <div className="template-field" key={f.id}>
            <span className="field-number">{i + 1}</span>
            <Label label="Nome do campo">
              <input
                required
                value={f.label}
                onChange={(e) =>
                  setT({
                    ...t,
                    fields: t.fields.map((x) =>
                      x.id === f.id ? { ...x, label: e.target.value } : x,
                    ),
                  })
                }
              />
            </Label>
            <Label label="Tipo">
              <select
                value={f.type}
                onChange={(e) =>
                  setT({
                    ...t,
                    fields: t.fields.map((x) =>
                      x.id === f.id
                        ? { ...x, type: e.target.value as typeof f.type }
                        : x,
                    ),
                  })
                }
              >
                <option value="text">Texto curto</option>
                <option value="textarea">Texto longo</option>
                <option value="number">Número</option>
                <option value="date">Data</option>
              </select>
            </Label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={f.required}
                onChange={(e) =>
                  setT({
                    ...t,
                    fields: t.fields.map((x) =>
                      x.id === f.id ? { ...x, required: e.target.checked } : x,
                    ),
                  })
                }
              />
              Obrigatório
            </label>
            <button
              type="button"
              className="icon-btn danger-text"
              aria-label={`Remover campo ${i + 1}`}
              onClick={() =>
                setT({ ...t, fields: t.fields.filter((x) => x.id !== f.id) })
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
      <Button
        icon={Plus}
        variant="ghost"
        onClick={() =>
          setT({
            ...t,
            fields: [
              ...t.fields,
              { id: uid(), label: "", type: "text", required: false },
            ],
          })
        }
      >
        Adicionar campo
      </Button>
      <div className="template-fixed">
        <strong>Em todos os formulários</strong>
        <p>
          Itens e descrições · Quantidade · Preço unitário · Total · Condições
          comerciais · Anexo opcional
        </p>
      </div>
      <Button type="submit" variant="primary" icon={Save}>
        Salvar nova versão do modelo
      </Button>
    </form>
  );
}
