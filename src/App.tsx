import "./event-lifecycle.css";
import "./service-workspace.css";
import { AtendimentoHome } from "./pages/AtendimentoHome";
import {
  EventOverview,
  EventContracts,
  EventProduction,
  EventPost,
  EventFinanceStart,
} from "./pages/EventLifecycle";
import { EventRequests } from "./pages/EventRequests";
import { EventDocuments } from "./pages/EventDocuments";
import { CreativePresentations } from "./components/CreativePresentations";
import { eventProject } from "./event-lifecycle";
import { Approvals } from "./pages/Approvals";
import { approvalNotifications } from "./approval-model";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Layers,
  Building2,
  UsersRound,
  SlidersHorizontal,
  GitBranch,
  Settings2,
  ArrowUpRight,
  ChevronRight,
  Menu,
  X,
  Check,
  ArrowLeft,
  Clock3,
  Bell,
  ChartNoAxesCombined,
  PanelLeftClose,
  PanelLeftOpen,
  Copy,
  Columns3,
  Wallet,
  Mail,
  WandSparkles,
} from "lucide-react";
import { useStore, go, copy } from "./store";
import { stages } from "./data";
import type { Stage, Demand } from "./types";
import { Badge, Button, Empty } from "./components/UI";
import { BrandLogo } from "./components/BrandLogo";
import { TourMenuButton } from "./components/Tours";
import { Home } from "./pages/Home";
import { Briefing } from "./pages/Briefing";
import { Quotes, Compare, SupplierPortal } from "./pages/Quotes";
import { Proposal, Approval, Handoff } from "./pages/Proposal";
import { Directory, Templates } from "./pages/Directory";
import { Settings } from "./pages/Settings";
import { Flow } from "./pages/Flow";
import { ScopeOverview } from "./pages/Scope";
import { Operations } from "./pages/Operations";
import { Finance } from "./pages/Finance";
import { ScopeBanner } from "./components/ScopeBanner";
import { Management, Alerts } from "./pages/Management";
import { collectAlerts } from "./operations";
import { Inbox } from "./pages/Inbox";
import {
  IntelligenceEntry,
  IntelligenceWorkspace,
} from "./components/Intelligence";
import {
  accountOwner,
  demoPerson,
  nucleusLabel,
  UNASSIGNED,
} from "./organization";
const nav = [
  { path: "/", label: "Atendimento", icon: LayoutDashboard },
  { path: "/mensagens", label: "Mensagens", icon: Mail },
  { path: "/eventos", label: "Eventos", icon: Layers },
  { path: "/solicitacoes", label: "Solicitações", icon: Mail },
  { path: "/fornecedores", label: "Fornecedores", icon: Building2 },
  { path: "/clientes", label: "Clientes", icon: UsersRound },
  { path: "/modelos", label: "Modelos de cotação", icon: SlidersHorizontal },
];
export default function App() {
  const { state, toast, clearToast, presentation, presentationRevision } =
    useStore();
  const currentPerson = demoPerson(state);
  const initials =
    currentPerson?.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") || "—";
  const [path, setPath] = useState(location.hash.slice(1) || "/");
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("adviser-sidebar") === "collapsed";
    } catch {
      return false;
    }
  });
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    try {
      localStorage.setItem(
        "adviser-sidebar",
        collapsed ? "expanded" : "collapsed",
      );
    } catch {
      /* Layout still works without storage. */
    }
  };
  useEffect(() => {
    if (!mobile) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const sidebar = document.getElementById("sidebar");
    sidebar?.querySelector<HTMLElement>("a,button")?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
      if (e.key === "Tab") {
        const targets = [
          ...(sidebar?.querySelectorAll<HTMLElement>("a,button") || []),
        ].filter((el) => el.getBoundingClientRect().width > 0);
        const first = targets[0],
          last = targets.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
      previousFocus?.focus();
    };
  }, [mobile]);
  useEffect(() => {
    const change = () => {
      setPath(location.hash.slice(1) || "/");
      setMobile(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(clearToast, 7000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const parts = path.split("/").filter(Boolean);
  const unread =
    collectAlerts(state).filter((a) => a.kind === "response" && !a.read)
      .length +
    approvalNotifications(state, currentPerson?.id || "").filter(
      (n) => !state.readApprovalNotifications?.includes(n.id),
    ).length;
  const d = state.demands.find((x) => x.id === parts[1]);
  const q = d?.quotes.find((x) => x.id === parts[2]);
  let page: React.ReactNode;
  if (parts[0] === "fornecedor" && d && q)
    return (
      <>
        <SupplierPortal key={`${presentationRevision}-${q.id}`} d={d} q={q} />
        <Toast toast={toast} close={clearToast} />
      </>
    );
  if (["demandas", "eventos"].includes(parts[0]) && parts[1])
    page = d ? (
      <Workspace d={d} versionId={parts[3]} tab={parts[2] || "overview"} />
    ) : (
      <Empty
        title="Evento não encontrado"
        text="O endereço pode pertencer a outro navegador. Volte à lista de eventos."
        action={<Button onClick={() => go("/eventos")}>Ver eventos</Button>}
      />
    );
  else if (["demandas", "eventos"].includes(parts[0])) page = <Home all />;
  else if (["nova-demanda", "novo-evento"].includes(parts[0]))
    page = <Home key="new-demand" newDemand />;
  else if (parts[0] === "solicitacoes") page = <EventRequests />;
  else if (parts[0] === "emails" || parts[0] === "mensagens")
    page = <Inbox key={parts[1] || "inbox"} emailId={parts[1]} />;
  else if (parts[0] === "aprovacoes")
    page = (
      <Approvals
        key={path}
        initialView={parts[1] === "todas" ? "all" : "mine"}
        requestId={parts[1] === "solicitacao" ? parts[2] : undefined}
      />
    );
  else if (parts[0] === "gestao") page = <Management />;
  else if (parts[0] === "alertas") page = <Alerts />;
  else if (parts[0] === "fornecedores")
    page = <Directory key="suppliers" kind="suppliers" />;
  else if (parts[0] === "clientes")
    page = (
      <Directory
        key={path}
        kind="clients"
        clientId={parts[1] === "carteira" ? undefined : parts[1]}
        initialNucleus={parts[1] === "carteira" ? parts[2] || "all" : "all"}
      />
    );
  else if (parts[0] === "modelos") page = <Templates />;
  else if (parts[0] === "configuracoes")
    page = <Settings key={parts[1]} initialTab={parts[1]} />;
  else if (parts[0] === "fluxo") page = <Flow />;
  else if (parts[0] === "escopo" && parts[1] === "ia")
    page = (
      <IntelligenceWorkspace
        key={path}
        opportunity={parts[2]}
        contextId={parts[3]}
      />
    );
  else if (parts[0] === "roadmap" || parts[0] === "escopo")
    page = <ScopeOverview />;
  else if (parts[0] === "operacoes") page = <Operations projectId={parts[1]} />;
  else if (parts[0] === "financeiro") page = <Finance projectId={parts[1]} />;
  else if (parts.length)
    page = (
      <Empty
        title="Página não encontrada"
        text="Escolha uma opção no menu para continuar."
        action={<Button onClick={() => go("/")}>Visão geral</Button>}
      />
    );
  else page = <AtendimentoHome />;
  const navButton = (item: (typeof nav)[number]) => {
    const Icon = item.icon;
    const active =
      item.path === "/" ? path === "/" : path.startsWith(item.path);
    return (
      <a
        href={`#${item.path}`}
        key={item.path}
        aria-current={active ? "page" : undefined}
        aria-label={`${item.label}${item.path === "/operacoes" ? ", etapa 2" : item.path === "/financeiro" ? ", etapa 3" : ""}`}
        title={
          collapsed
            ? `${item.label}${item.path === "/operacoes" ? " · etapa 2" : item.path === "/financeiro" ? " · etapa 3" : ""}`
            : undefined
        }
        className={active ? "active" : ""}
      >
        <Icon size={19} />
        <span>{item.label}</span>
        {item.path === "/eventos" && <small>{state.demands.length}</small>}
        {["/operacoes", "/financeiro"].includes(item.path) && (
          <small>{item.path === "/operacoes" ? "2" : "3"}</small>
        )}
      </a>
    );
  };
  return (
    <div className={`app-shell ${collapsed ? "nav-collapsed" : ""}`}>
      {mobile && (
        <button
          className="nav-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        />
      )}
      <aside id="sidebar" className={`sidebar ${mobile ? "open" : ""}`}>
        <button
          className="icon-btn sidebar-close"
          aria-label="Fechar navegação"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <a className="brand" href="#/" aria-label="Adviser, visão geral">
          <BrandLogo />
        </a>
        <nav aria-label="Navegação principal">
          <span className="nav-label">ATENDIMENTO · MVP</span>
          {nav.slice(0, 4).map(navButton)}
          <span className="nav-label">ACOMPANHAMENTO</span>
          {navButton({ path: "/aprovacoes", label: "Aprovações", icon: Check })}
          {navButton({
            path: "/alertas",
            label: "Central de alertas",
            icon: Bell,
          })}
          {navButton({
            path: "/gestao",
            label: "Painel Gerencial",
            icon: ChartNoAxesCombined,
          })}
          <details
            className="nav-disclosure"
            open={
              nav.slice(4).some((item) => path.startsWith(item.path)) ||
              undefined
            }
          >
            <summary title={collapsed ? "Cadastros" : undefined}>
              <Building2 size={19} />
              <span>Cadastros</span>
            </summary>
            {nav.slice(4).map(navButton)}
          </details>
          <span className="nav-label">EVOLUÇÃO · FORA DO MVP</span>
          {[
            { path: "/operacoes", label: "Operações", icon: Columns3 },
            { path: "/financeiro", label: "Financeiro", icon: Wallet },
          ].map(navButton)}
          <details
            className="nav-disclosure"
            open={
              ["fluxo", "escopo", "roadmap"].includes(parts[0]) || undefined
            }
          >
            <summary title={collapsed ? "Sobre o protótipo" : undefined}>
              <GitBranch size={19} />
              <span>Sobre o protótipo</span>
            </summary>
            {[
              { path: "/fluxo", label: "Fluxo do sistema", icon: GitBranch },
              { path: "/escopo", label: "Escopo e etapas", icon: ArrowUpRight },
            ].map(navButton)}
          </details>
          <div className="nav-bottom">
            {navButton({
              path: "/configuracoes",
              label: "Equipe e IA",
              icon: Settings2,
            })}
          </div>
        </nav>
        <div className="sidebar-person">
          <span className="avatar">{initials}</span>
          <div>
            {currentPerson?.name || "Equipe Adviser"}
            <small>Atendimento · demonstração</small>
          </div>
        </div>
      </aside>
      <div className="app-body" inert={mobile}>
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-btn mobile-menu"
              aria-label={mobile ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobile}
              aria-controls="sidebar"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X size={21} /> : <Menu size={21} />}
            </button>
            <button
              className="icon-btn desktop-menu"
              aria-label={
                collapsed ? "Expandir barra lateral" : "Recolher barra lateral"
              }
              aria-expanded={!collapsed}
              aria-controls="sidebar"
              onClick={toggleSidebar}
            >
              {collapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>
            <label className="area-switch">
              Área
              <select
                aria-label="Área de trabalho"
                value={
                  ["operacoes", "financeiro", "gestao", "aprovacoes"].includes(
                    parts[0],
                  )
                    ? `/${parts[0]}`
                    : "/"
                }
                onChange={(e) => go(e.target.value)}
              >
                <option value="/">Atendimento</option>
                <option value="/operacoes">Operações</option>
                <option value="/financeiro">Financeiro</option>
                <option value="/gestao">Visão gerencial</option>
                <option value="/aprovacoes">Aprovações</option>
              </select>
            </label>
            <a
              className="mobile-brand"
              href="#/"
              aria-label="Adviser, visão geral"
            >
              <BrandLogo />
            </a>
            <ChevronRight size={14} />
            <strong>
              {parts[0] === "eventos" && parts[1]
                ? "Evento"
                : parts[0] === "gestao"
                  ? "Painel Gerencial"
                  : parts[0] === "aprovacoes"
                    ? "Aprovações"
                    : parts[0] === "alertas"
                      ? "Alertas"
                      : parts[0] === "configuracoes"
                        ? "Configurações"
                        : ["roadmap", "escopo"].includes(parts[0])
                          ? "Escopo e etapas"
                          : parts[0] === "operacoes"
                            ? "Operações"
                            : parts[0] === "financeiro"
                              ? "Financeiro"
                              : ["emails", "mensagens"].includes(parts[0])
                                ? "Central de atendimento"
                                : parts[0] === "fluxo"
                                  ? "Processo"
                                  : parts[0] === "clientes"
                                    ? "Clientes"
                                    : "Atendimento"}
            </strong>
          </div>
          <div className="topbar-right">
            <TourMenuButton />
            <div className="intelligence-topbar">
              <Button
                icon={WandSparkles}
                aria-label="Explorar IA"
                onClick={() => go("/escopo/ia")}
              >
                <span className="intelligence-topbar-label">Explorar IA</span>
              </Button>
            </div>
            <button
              className="notification-bell"
              aria-label={`Abrir central de alertas, ${unread} avisos não lidos`}
              onClick={() => go("/alertas")}
            >
              <Bell size={19} />
              {unread > 0 && <span>{unread}</span>}
            </button>
            <span className="demo-label">
              <span /> Protótipo navegável
            </span>
            <span className="avatar small" title={currentPerson?.name}>
              {initials}
            </span>
          </div>
        </header>
        <div className="demo-ribbon">
          <span>
            {presentation
              ? "Cenário de apresentação"
              : "Ambiente de demonstração"}
          </span>
          <span>
            {presentation
              ? "Exemplo temporário do tour · seus registros estão preservados"
              : "Dados fictícios · IA e envios simulados · alterações locais neste navegador"}
          </span>
        </div>
        <main
          className="main-content"
          id="main-content"
          key={`${presentationRevision}-${d?.id || parts[0] || "home"}`}
        >
          <ScopeBanner path={path} />
          {page}
        </main>
        <footer className="app-footer">
          Adviser · Gestão de eventos{" "}
          <span>Protótipo para validação do fluxo</span>
        </footer>
      </div>
      <Toast toast={toast} close={clearToast} />
    </div>
  );
}
function Toast({ toast, close }: { toast: string; close: () => void }) {
  return toast ? (
    <div className="toast" role="status">
      <Check size={19} />
      <span>{toast}</span>
      <button className="icon-btn" aria-label="Fechar aviso" onClick={close}>
        <X size={17} />
      </button>
    </div>
  ) : null;
}
function Workspace({
  d,
  tab,
  versionId,
}: {
  d: Demand;
  tab: string;
  versionId?: string;
}) {
  const { state, notify, updateDemand } = useStore();
  const [history, setHistory] = useState(false);
  const client = state.clients.find((c) => c.id === d.clientId);
  const index = stages.findIndex((s) => s.id === d.stage);
  return (
    <>
      <div className="demand-breadcrumb">
        <button onClick={() => go("/eventos")}>
          <ArrowLeft size={15} /> Eventos
        </button>
        <ChevronRight size={13} />
        <span>{client?.name}</span>
      </div>
      <div className="event-heading">
        <div>
          <h1>{d.title}</h1>
          <div className="event-meta">
            <button
              className="demand-reference"
              title="Copiar referência do atendimento"
              onClick={async () =>
                notify(
                  (await copy(d.reference || ""))
                    ? "Referência copiada."
                    : "Selecione a referência e copie manualmente.",
                )
              }
            >
              <Copy size={13} />
              {d.reference}
            </button>
            <span>{client?.name}</span>
            <span>
              {d.date
                ? d.date.split("-").reverse().join("/")
                : "Data a definir"}
            </span>
            <span>
              {d.guests ? `${d.guests} pessoas` : "Público a definir"}
            </span>
            <span>{nucleusLabel(state, client)}</span>
          </div>
        </div>
        <div className="event-owner">
          <div>
            <label className="event-owner-label" htmlFor="demand-owner">
              Responsável pelo evento
            </label>
            <select
              id="demand-owner"
              value={d.owner}
              onChange={(e) =>
                updateDemand(
                  d.id,
                  { owner: e.target.value },
                  `Responsável pelo evento: ${e.target.value || UNASSIGNED}.`,
                )
              }
            >
              <option value="">A distribuir</option>
              {[
                ...new Set([
                  d.owner,
                  ...state.users.filter((u) => u.active).map((u) => u.name),
                ]),
              ]
                .filter(Boolean)
                .map((name) => (
                  <option key={name}>{name}</option>
                ))}
            </select>
            <button
              className="portfolio-link"
              onClick={() => go(`/clientes/${d.clientId}`)}
            >
              Conta: {accountOwner(state, client)?.name || UNASSIGNED} · editar
              carteira
            </button>
          </div>
          <Button
            icon={Clock3}
            variant="ghost"
            onClick={() => setHistory(!history)}
          >
            Histórico
          </Button>
        </div>
      </div>
      {history && (
        <section className="panel history-panel">
          <div className="section-heading">
            <h2>Histórico deste evento</h2>
            <Button onClick={() => setHistory(false)}>Fechar</Button>
          </div>
          {d.history.map((h, i) => (
            <div className="history-row" key={i}>
              <time>{h.at}</time>
              <span>{h.text}</span>
            </div>
          ))}
        </section>
      )}
      <nav className="event-groupnav" aria-label="Áreas deste evento">
        {[
          ["overview", "Panorama", ["overview"]],
          ["briefing", "Entrada e briefing", ["briefing", "requests"]],
          [
            "proposal",
            "Elaboração da proposta",
            ["quotes", "compare", "creative", "proposal", "approval"],
          ],
        ].map(([id, label, tabs]) => (
          <button
            key={id as string}
            aria-current={(tabs as string[]).includes(tab) ? "page" : undefined}
            onClick={() => go(`/eventos/${d.id}/${id}`)}
          >
            {label as string}
          </button>
        ))}
        <label className="event-more-nav">
          Mais áreas do evento
          <select
            aria-label="Mais áreas do evento"
            value={
              [
                "contracts",
                "handoff",
                "production",
                "post",
                "finance",
                "documents",
              ].includes(tab)
                ? tab === "handoff"
                  ? "contracts"
                  : tab
                : ""
            }
            onChange={(e) => {
              if (e.target.value) go(`/eventos/${d.id}/${e.target.value}`);
            }}
          >
            <option value="">Selecionar área</option>
            <option value="contracts">Contratos</option>
            <option value="production">Produção</option>
            <option value="post">Pós-evento</option>
            <option value="finance">Financeiro</option>
            <option value="documents">Documentos</option>
          </select>
        </label>
      </nav>
      {["quotes", "compare", "creative", "proposal", "approval"].includes(
        tab,
      ) && (
        <nav className="event-subnav" aria-label="Elaboração e negociação">
          {[
            ["quotes", "Cotações"],
            ["compare", "Comparativo"],
            ["creative", "Apresentação criativa"],
            ["proposal", "Orçamento / proposta"],
            ["approval", "Revisão, envio e negociação"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => go(`/eventos/${d.id}/${id}`)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {["briefing", "requests"].includes(tab) && (
        <nav className="event-subnav" aria-label="Entrada do evento">
          {[
            ["requests", "Solicitações e alterações"],
            ["briefing", "Briefing e fontes"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => go(`/eventos/${d.id}/${id}`)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      <div className="workspace-content">
        <details className="service-disclosure event-ai-tools">
          <summary>Outras ferramentas de IA para este evento</summary>
          <IntelligenceEntry
            contextId={d.id}
            ids={
              tab === "briefing"
                ? ["summary", "changes", "memory"]
                : tab === "quotes" || tab === "compare"
                  ? ["quotes"]
                  : tab === "proposal"
                    ? ["review", "changes"]
                    : tab === "approval"
                      ? ["changes", "summary"]
                      : ["summary"]
            }
          />
        </details>
        {tab === "overview" ? (
          <EventOverview d={d} />
        ) : tab === "requests" ? (
          <EventRequests d={d} />
        ) : tab === "creative" ? (
          <CreativePresentations
            key={`${d.id}-${versionId || ""}`}
            d={d}
            initialVersionId={versionId}
          />
        ) : tab === "contracts" ? (
          <EventContracts d={d} />
        ) : tab === "production" ? (
          <EventProduction d={d} />
        ) : tab === "post" ? (
          <EventPost d={d} />
        ) : tab === "documents" ? (
          <EventDocuments
            key={`${d.id}-${versionId || ""}`}
            d={d}
            documentId={versionId}
          />
        ) : tab === "finance" ? (
          eventProject(state, d.id) ? (
            <Finance key={d.id} projectId={eventProject(state, d.id)!.id} />
          ) : (
            <EventFinanceStart d={d} />
          )
        ) : tab === "briefing" ? (
          <Briefing key={d.id} d={d} />
        ) : tab === "quotes" ? (
          <Quotes d={d} />
        ) : tab === "compare" ? (
          <Compare d={d} />
        ) : tab === "proposal" ? (
          <Proposal d={d} />
        ) : tab === "approval" ? (
          <Approval
            key={versionId || d.id}
            d={d}
            initialVersionId={versionId}
          />
        ) : (
          <Handoff d={d} />
        )}
      </div>
    </>
  );
}
