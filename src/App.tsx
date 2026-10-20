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
} from "lucide-react";
import { useStore, go, copy } from "./store";
import { stages } from "./data";
import type { Stage, Demand } from "./types";
import { Badge, Button, Empty } from "./components/UI";
import { BrandLogo } from "./components/BrandLogo";
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
const nav = [
  { path: "/", label: "Visão geral", icon: LayoutDashboard },
  { path: "/demandas", label: "Demandas", icon: Layers },
  { path: "/fornecedores", label: "Fornecedores", icon: Building2 },
  { path: "/clientes", label: "Clientes", icon: UsersRound },
  { path: "/modelos", label: "Modelos de cotação", icon: SlidersHorizontal },
];
export default function App() {
  const { state, toast, clearToast } = useStore();
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
  const unread = collectAlerts(state).filter(
    (a) => a.kind === "response" && !a.read,
  ).length;
  const d = state.demands.find((x) => x.id === parts[1]);
  const q = d?.quotes.find((x) => x.id === parts[2]);
  let page: React.ReactNode;
  if (parts[0] === "fornecedor" && d && q)
    return (
      <>
        <SupplierPortal key={q.id} d={d} q={q} />
        <Toast toast={toast} close={clearToast} />
      </>
    );
  if (parts[0] === "demandas" && parts[1])
    page = d ? (
      <Workspace
        d={d}
        tab={
          (stages.some((s) => s.id === parts[2])
            ? parts[2]
            : "briefing") as Stage
        }
      />
    ) : (
      <Empty
        title="Demanda não encontrada"
        text="O endereço pode pertencer a outro navegador. Volte à lista de demandas."
        action={<Button onClick={() => go("/demandas")}>Ver demandas</Button>}
      />
    );
  else if (parts[0] === "demandas") page = <Home all />;
  else if (parts[0] === "nova-demanda")
    page = <Home key="new-demand" newDemand />;
  else if (parts[0] === "emails" || parts[0] === "mensagens")
    page = <Inbox key={parts[1] || "inbox"} emailId={parts[1]} />;
  else if (parts[0] === "gestao") page = <Management />;
  else if (parts[0] === "alertas") page = <Alerts />;
  else if (parts[0] === "fornecedores")
    page = <Directory key="suppliers" kind="suppliers" />;
  else if (parts[0] === "clientes")
    page = <Directory key="clients" kind="clients" />;
  else if (parts[0] === "modelos") page = <Templates />;
  else if (parts[0] === "configuracoes") page = <Settings />;
  else if (parts[0] === "fluxo") page = <Flow />;
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
  else page = <Home />;
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
        {item.path === "/demandas" && <small>{state.demands.length}</small>}
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
          <span className="nav-label">GESTÃO · MVP</span>
          {navButton({
            path: "/gestao",
            label: "Painel Gerencial",
            icon: ChartNoAxesCombined,
          })}
          {navButton({
            path: "/alertas",
            label: "Central de alertas",
            icon: Bell,
          })}
          <span className="nav-label">ATENDIMENTO · MVP</span>
          {nav.map(navButton)}
          {navButton({
            path: "/mensagens",
            label: "Central de atendimento",
            icon: Mail,
          })}
          <span className="nav-label">EVOLUÇÃO · FORA DO MVP</span>
          {[
            { path: "/operacoes", label: "Operações", icon: Columns3 },
            { path: "/financeiro", label: "Financeiro", icon: Wallet },
          ].map(navButton)}
          <span className="nav-label">PLANEJAMENTO</span>
          {[
            { path: "/fluxo", label: "Fluxo do sistema", icon: GitBranch },
            { path: "/escopo", label: "Escopo e etapas", icon: ArrowUpRight },
          ].map(navButton)}
          <div className="nav-bottom">
            {navButton({
              path: "/configuracoes",
              label: "Equipe e IA",
              icon: Settings2,
            })}
          </div>
        </nav>
        <div className="sidebar-person">
          <span className="avatar">MC</span>
          <div>
            Marina Costa<small>Atendimento · demonstração</small>
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
            <span className="workspace-label">Workspace</span>
            <a
              className="mobile-brand"
              href="#/"
              aria-label="Adviser, visão geral"
            >
              <BrandLogo />
            </a>
            <ChevronRight size={14} />
            <strong>
              {parts[0] === "demandas" && parts[1]
                ? "Demanda"
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
                            : "Atendimento"}
            </strong>
          </div>
          <div className="topbar-right">
            <button
              className="notification-bell"
              aria-label={`Abrir central de alertas, ${unread} novos retornos`}
              onClick={() => go("/alertas")}
            >
              <Bell size={19} />
              {unread > 0 && <span>{unread}</span>}
            </button>
            <span className="demo-label">
              <span /> Protótipo navegável
            </span>
            <span className="avatar small">MC</span>
          </div>
        </header>
        <div className="demo-ribbon">
          <span>Ambiente de demonstração</span>
          <span>
            Dados fictícios · IA e envios simulados · alterações locais neste
            navegador
          </span>
        </div>
        <main
          className="main-content"
          id="main-content"
          key={d?.id || parts[0] || "home"}
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
function Workspace({ d, tab }: { d: Demand; tab: Stage }) {
  const { state, notify } = useStore();
  const [history, setHistory] = useState(false);
  const client = state.clients.find((c) => c.id === d.clientId);
  const index = stages.findIndex((s) => s.id === d.stage);
  return (
    <>
      <div className="demand-breadcrumb">
        <button onClick={() => go("/demandas")}>
          <ArrowLeft size={15} /> Demandas
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
            <span>{client?.nucleus}</span>
          </div>
        </div>
        <div className="event-owner">
          <span className="avatar">
            {d.owner
              .split(" ")
              .map((s) => s[0])
              .join("")}
          </span>
          <div>
            <small>Responsável</small>
            <strong>{d.owner}</strong>
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
            <h2>Histórico desta demanda</h2>
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
      <nav className="workflow-tabs" aria-label="Etapas da demanda">
        {stages.map((s, i) => (
          <button
            key={s.id}
            className={`${tab === s.id ? "active" : ""} ${i < index ? "complete" : ""}`}
            aria-current={tab === s.id ? "step" : undefined}
            onClick={() => go(`/demandas/${d.id}/${s.id}`)}
          >
            <span className="step-number">
              {i < index ? <Check size={14} /> : i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </nav>
      <div className="workspace-content">
        {tab === "briefing" ? (
          <Briefing key={d.id} d={d} />
        ) : tab === "quotes" ? (
          <Quotes d={d} />
        ) : tab === "compare" ? (
          <Compare d={d} />
        ) : tab === "proposal" ? (
          <Proposal d={d} />
        ) : tab === "approval" ? (
          <Approval d={d} />
        ) : (
          <Handoff d={d} />
        )}
      </div>
    </>
  );
}
