import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Route,
  X,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  LocateFixed,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "./UI";
import { useStore, go } from "../store";
import {
  tours,
  readTourProgress,
  type Tour,
  type TourProgress,
} from "../tours";
import { buildTourScenario } from "../tour-scenario";

const PROGRESS_KEY = "adviser-presentation-tours-v1";
type Active = {
  id: string;
  index: number;
  paused: boolean;
  completed: boolean;
};
const C = createContext<{
  open: boolean;
  toggle: () => void;
  active: Active | null;
} | null>(null);
export function TourMenuButton() {
  const c = useContext(C);
  if (!c) return null;
  return (
    <Button
      icon={Route}
      className="btn tour-menu-trigger"
      aria-expanded={c.open}
      aria-controls="presentation-tour-menu"
      onClick={c.toggle}
    >
      Tours
      <ChevronDown size={13} />
    </Button>
  );
}

export function Tours({ children }: { children: ReactNode }) {
  const {
    loadPresentation,
    endPresentation,
    clearToast,
    presentationRevision,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const [progress, setProgress] = useState<Record<string, TourProgress>>(() => {
    try {
      return readTourProgress(localStorage.getItem(PROGRESS_KEY));
    } catch {
      return {};
    }
  });
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [path, setPath] = useState(location.hash.slice(1) || "/");
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [found, setFound] = useState(false);
  const [refocus, setRefocus] = useState(0);
  const [guideHeight, setGuideHeight] = useState(220);
  const origin = useRef("/");
  const menu = useRef<HTMLDivElement>(null);
  const guide = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const target = useRef<HTMLElement | null>(null);
  const tour = tours.find((t) => t.id === active?.id);
  const step = tour?.steps[active?.index || 0];
  const inPlace = Boolean(step && path === step.path);
  const guided = Boolean(
    active && !active.paused && !active.completed && !open,
  );

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      setStorageAvailable(false);
    }
  }, [progress]);
  useEffect(() => {
    const change = () => setPath(location.hash.slice(1) || "/");
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    // A reload ends the temporary scene. Keep the saved records visible and
    // offer the remembered stopping point instead of a missing example route.
    if (/tour-horizonte|tour-primeiro-contato/.test(location.hash)) {
      go("/");
      setOpen(true);
    }
  }, []);

  function show(t: Tour, index: number) {
    if (!active) origin.current = location.hash.slice(1) || "/";
    clearToast();
    loadPresentation(buildTourScenario(t.steps[index].phase));
    setActive({ id: t.id, index, paused: false, completed: false });
    setProgress((p) => ({ ...p, [t.id]: { index, completed: false } }));
    setOpen(false);
    setRect(null);
    setFound(false);
    go(t.steps[index].path);
    setRefocus((n) => n + 1);
  }
  function end() {
    endPresentation();
    clearToast();
    setActive(null);
    setOpen(false);
    setRect(null);
    go(origin.current);
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(".tour-menu-trigger")?.focus(),
    );
  }
  function next() {
    if (!active || !tour) return;
    if (active.index + 1 < tour.steps.length) show(tour, active.index + 1);
    else {
      setActive({ ...active, completed: true });
      setProgress((p) => ({
        ...p,
        [tour.id]: { index: active.index, completed: true },
      }));
      setRect(null);
    }
  }
  function locate() {
    if (step && path !== step.path) go(step.path);
    setRefocus((n) => n + 1);
  }
  function closeMenu() {
    setOpen(false);
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(".tour-menu-trigger")?.focus(),
    );
  }
  useEffect(() => {
    if (open)
      menu.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    const outside = (event: MouseEvent) => {
      const el = event.target as HTMLElement;
      if (
        open &&
        !menu.current?.contains(el) &&
        !el.closest(".tour-menu-trigger")
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (open) {
        setOpen(false);
        document
          .querySelector<HTMLButtonElement>(".tour-menu-trigger")
          ?.focus();
      } else if (active && !active.completed)
        setActive((a) => (a ? { ...a, paused: true } : a));
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, active]);

  useLayoutEffect(() => {
    if (!active || active.paused) return;
    const el = guide.current;
    if (!el) return;
    const measure = () =>
      setGuideHeight(Math.ceil(el.getBoundingClientRect().height));
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [active?.id, active?.paused, active?.completed, open]);
  useEffect(() => {
    document.body.classList.toggle(
      "presentation-guided",
      Boolean(active && !active.paused),
    );
    document.body.style.setProperty("--tour-space", `${guideHeight + 32}px`);
    return () => {
      document.body.classList.remove("presentation-guided");
      document.body.style.removeProperty("--tour-space");
    };
  }, [active?.paused, Boolean(active), guideHeight]);

  useLayoutEffect(() => {
    setRect(null);
    target.current = null;
    if (!guided || !step || !inPlace) return;
    let frame = 0;
    const measure = () => {
      const el = target.current;
      if (!el?.isConnected) return;
      const r = el.getBoundingClientRect();
      const top = Math.max(78, r.top - 6),
        left = Math.max(6, r.left - 6);
      const bottom = Math.min(
        window.innerHeight - guideHeight - 28,
        r.bottom + 6,
      );
      setRect(
        bottom > top + 8
          ? {
              top,
              left,
              width: Math.min(window.innerWidth - left - 6, r.width + 12),
              height: bottom - top,
            }
          : null,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    let sized: ResizeObserver | undefined;
    const find = () => {
      const el = document.querySelector<HTMLElement>(step.target);
      if (!el || !el.getBoundingClientRect().width) {
        setFound(false);
        setRect(null);
        target.current = null;
        return;
      }
      if (target.current === el) return;
      target.current = el;
      setFound(true);
      sized?.disconnect();
      sized = new ResizeObserver(schedule);
      sized.observe(el);
      const top = el.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
      schedule();
    };
    const mutation = new MutationObserver(find);
    mutation.observe(document.getElementById("root")!, {
      childList: true,
      subtree: true,
    });
    let initial = requestAnimationFrame(() => {
      initial = requestAnimationFrame(find);
    });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(initial);
      cancelAnimationFrame(frame);
      sized?.disconnect();
      mutation.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [
    guided,
    step?.id,
    active?.id,
    path,
    refocus,
    presentationRevision,
    guideHeight,
  ]);
  useEffect(() => {
    if (!active || open) return;
    if (active.paused)
      document
        .querySelector<HTMLButtonElement>(".tour-paused .btn")
        ?.focus({ preventScroll: true });
    else title.current?.focus({ preventScroll: true });
  }, [active?.id, active?.index, active?.paused, active?.completed, open]);

  return (
    <C.Provider value={{ open, toggle: () => setOpen((v) => !v), active }}>
      {children}
      {open && (
        <section
          className="tour-menu"
          id="presentation-tour-menu"
          aria-label="Escolher tour de apresentação"
          ref={menu}
        >
          <div className="tour-menu-heading">
            <div>
              <h2>Qual história vamos apresentar?</h2>
              <p>Escolha um roteiro e avance no seu ritmo.</p>
            </div>
            <button
              className="icon-btn"
              aria-label="Fechar menu de tours"
              onClick={closeMenu}
            >
              <X size={20} />
            </button>
          </div>
          <p className="tour-demo-note">
            Os tours usam exemplos fictícios separados. Ao encerrar, você volta
            aos seus registros. Avançar prepara a próxima cena; as ações nas
            telas continuam disponíveis para experimentar.
          </p>
          {active && (
            <div className="tour-current">
              <strong>Em apresentação: {tour?.title}</strong>
              <div className="actions">
                <Button
                  icon={Play}
                  onClick={() => {
                    setOpen(false);
                    setActive({ ...active, paused: false });
                  }}
                >
                  Voltar ao tour
                </Button>
                <Button variant="ghost" onClick={end}>
                  Encerrar apresentação
                </Button>
              </div>
            </div>
          )}
          <div className="tour-catalog">
            {tours.map((t) => {
              const p = progress[t.id],
                resume = Boolean(p && !p.completed && p.index > 0);
              return (
                <div className="tour-catalog-row" key={t.id}>
                  <button
                    className="tour-pick"
                    onClick={() => show(t, resume ? p.index : 0)}
                    aria-label={`${resume ? "Retomar" : "Iniciar"} tour: ${t.title}`}
                  >
                    <span>
                      <strong>{t.title}</strong>
                      <span>{t.description}</span>
                      <small>
                        {t.steps.length} paradas
                        {resume
                          ? ` · retomar na ${p.index + 1}`
                          : p?.completed
                            ? " · roteiro percorrido"
                            : ""}
                      </small>
                    </span>
                    {p?.completed ? (
                      <Check size={18} />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                  {resume && (
                    <button
                      className="icon-btn"
                      title="Começar do início"
                      aria-label={`Começar do início: ${t.title}`}
                      onClick={() => show(t, 0)}
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {!storageAvailable && (
            <p className="tour-warning">
              O progresso fica disponível só enquanto esta página estiver
              aberta.
            </p>
          )}
        </section>
      )}
      {guided && rect && (
        <div className="tour-spotlight" aria-hidden="true" style={rect} />
      )}
      {active &&
        tour &&
        step &&
        (active.paused ? (
          <aside className="tour-paused" aria-label="Tour pausado">
            <span>
              <strong>Tour pausado</strong> · {active.index + 1}/
              {tour.steps.length}
            </span>
            <Button
              icon={Play}
              onClick={() => {
                setActive({ ...active, paused: false });
                locate();
              }}
            >
              Retomar tour
            </Button>
            <button
              className="icon-btn"
              aria-label="Encerrar apresentação"
              onClick={end}
            >
              <X size={18} />
            </button>
          </aside>
        ) : (
          <aside
            className="tour-guide"
            aria-label="Guia da apresentação"
            ref={guide}
          >
            {active.completed ? (
              <>
                <div className="tour-completion">
                  <Check size={24} />
                  <div>
                    <h2 ref={title} tabIndex={-1}>
                      Roteiro percorrido
                    </h2>
                    <p>
                      {tour.title}. Você pode escolher outro tour ou voltar aos
                      seus registros.
                    </p>
                  </div>
                </div>
                <div className="actions">
                  <Button
                    icon={Route}
                    variant="primary"
                    onClick={() => setOpen(true)}
                  >
                    Escolher outro tour
                  </Button>
                  <Button onClick={end}>Encerrar apresentação</Button>
                </div>
              </>
            ) : (
              <>
                <div className="tour-guide-heading">
                  <div className="tour-position">
                    <Route size={17} />
                    <span>{tour.title}</span>
                    <strong>
                      {active.index + 1} de {tour.steps.length}
                    </strong>
                  </div>
                  <div className="tour-guide-tools">
                    <button
                      className="text-button"
                      onClick={() => setActive({ ...active, paused: true })}
                    >
                      <Pause size={14} /> Pausar
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Escolher outro tour"
                      title="Escolher outro tour"
                      onClick={() => setOpen(true)}
                    >
                      <Route size={17} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Encerrar apresentação"
                      title="Encerrar apresentação"
                      onClick={end}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="tour-guide-body">
                  <div className="tour-instruction">
                    <h2 ref={title} tabIndex={-1}>
                      {step.title}
                    </h2>
                    <p>{step.body}</p>
                    <details className="tour-speaking-note">
                      <summary>O que destacar aos sócios</summary>
                      <p>{step.say}</p>
                    </details>
                  </div>
                  <div className="tour-guide-navigation">
                    <label className="tour-jump">
                      Ir para uma etapa
                      <select
                        aria-label="Ir para uma etapa do tour"
                        value={active.index}
                        onChange={(e) => show(tour, Number(e.target.value))}
                      >
                        {[...new Set(tour.steps.map((s) => s.chapter))].map(
                          (chapter) => (
                            <optgroup label={chapter} key={chapter}>
                              {tour.steps.map(
                                (s, i) =>
                                  s.chapter === chapter && (
                                    <option key={s.id} value={i}>
                                      {i + 1}. {s.title}
                                    </option>
                                  ),
                              )}
                            </optgroup>
                          ),
                        )}
                      </select>
                    </label>
                    <div className="tour-navigation-actions">
                      <Button
                        icon={ArrowLeft}
                        disabled={!active.index}
                        onClick={() => show(tour, active.index - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="primary"
                        icon={
                          active.index === tour.steps.length - 1
                            ? Check
                            : ArrowRight
                        }
                        onClick={next}
                      >
                        {active.index === tour.steps.length - 1
                          ? "Concluir tour"
                          : "Próximo"}
                      </Button>
                    </div>
                    <div className="tour-locate">
                      <button className="text-button" onClick={locate}>
                        <LocateFixed size={14} />
                        {inPlace
                          ? "Mostrar na tela"
                          : "Voltar ao ponto do tour"}
                      </button>
                      <button
                        className="text-button"
                        title="Preparar novamente o exemplo desta etapa"
                        aria-label="Recarregar exemplo desta etapa"
                        onClick={() => show(tour, active.index)}
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                {(!inPlace || !found) && (
                  <p className="tour-context-note">
                    {!inPlace
                      ? "Você está explorando outra tela. Volte ao ponto do tour quando quiser continuar."
                      : "Se o trecho estiver fechado, abra-o na tela ou recarregue o exemplo desta etapa."}
                  </p>
                )}
                <p className="tour-scene-note">
                  Cena de apresentação · ao avançar, o próximo exemplo é
                  preparado. Seus registros ficam preservados.
                </p>
              </>
            )}
          </aside>
        ))}
    </C.Provider>
  );
}
