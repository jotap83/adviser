import {
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import {
  ArrowRight,
  Check,
  Info,
  LoaderCircle,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { Line } from "../types";
import { money, lineTotal } from "../domain.mjs";
import { uid } from "../data";
export function Button({
  children,
  icon: Icon,
  variant = "secondary",
  busy = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn ${variant}`}
      {...props}
      disabled={busy || props.disabled}
    >
      {busy ? (
        <LoaderCircle size={16} className="spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
}
export const Badge = ({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: string;
}) => <span className={`badge ${tone}`}>{children}</span>;
export function Title({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}
export const Note = ({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: string;
}) => (
  <div className={`note ${tone}`}>
    <Info size={17} />
    <div>{children}</div>
  </div>
);
export const Empty = ({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) => (
  <div className="empty">
    <h3>{title}</h3>
    <p>{text}</p>
    {action}
  </div>
);
export const Label = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) => {
  const id = useId();
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        "aria-labelledby": `${id}-label`,
        ...(hint ? { "aria-describedby": `${id}-hint` } : {}),
      })
    : children;
  return (
    <label className="field">
      <span id={`${id}-label`}>{label}</span>
      {control}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  );
};
export const SaveMark = () => (
  <span className="save-mark">
    <Check size={13} /> Salvo neste navegador
  </span>
);
export const Next = ({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <Button
    variant="primary"
    onClick={onClick}
    disabled={disabled}
    icon={ArrowRight}
  >
    {label}
  </Button>
);
export function LinesEditor({
  lines,
  onChange,
  category = "Serviços",
  allowDirect = true,
}: {
  lines: Line[];
  onChange: (l: Line[]) => void;
  category?: string;
  allowDirect?: boolean;
}) {
  const change = (id: string, patch: Partial<Line>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="lines-editor">
      <div className="table-scroll">
        <table className="edit-table">
          <thead>
            <tr>
              <th>Item e descrição</th>
              <th>Qtd.</th>
              <th>Unitário (R$)</th>
              <th>Total</th>
              {allowDirect && <th>Pagamento</th>}
              <th>
                <span className="sr-only">Remover</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id}>
                <td>
                  <input
                    aria-label={`Descrição do item ${i + 1}`}
                    value={l.description}
                    placeholder="Descreva o serviço"
                    onChange={(e) =>
                      change(l.id, { description: e.target.value })
                    }
                  />
                  <input
                    className="category-input"
                    aria-label={`Grupo do item ${i + 1}`}
                    value={l.category}
                    onChange={(e) => change(l.id, { category: e.target.value })}
                  />
                </td>
                <td data-label="Quantidade">
                  <input
                    aria-label={`Quantidade do item ${i + 1}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={l.qty}
                    onChange={(e) =>
                      change(l.id, { qty: Math.max(0, Number(e.target.value)) })
                    }
                  />
                </td>
                <td data-label="Unitário (R$)">
                  <input
                    aria-label={`Valor unitário do item ${i + 1}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.unit}
                    onChange={(e) =>
                      change(l.id, {
                        unit: Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                </td>
                <td className="numeric" data-label="Total">
                  {money(lineTotal(l))}
                </td>
                {allowDirect && (
                  <td data-label="Pagamento">
                    <select
                      aria-label={`Pagamento do item ${i + 1}`}
                      value={l.direct ? "direct" : "agency"}
                      onChange={(e) =>
                        change(l.id, { direct: e.target.value === "direct" })
                      }
                    >
                      <option value="agency">Via Adviser</option>
                      <option value="direct">Cliente direto</option>
                    </select>
                  </td>
                )}
                <td>
                  <button
                    type="button"
                    className="icon-btn danger-text"
                    aria-label={`Remover item ${i + 1}`}
                    onClick={() => onChange(lines.filter((x) => x.id !== l.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lines.length === 0 && (
        <p className="muted empty-inline">Nenhum item adicionado.</p>
      )}
      <Button
        icon={Plus}
        variant="ghost"
        onClick={() =>
          onChange([
            ...lines,
            {
              id: uid(),
              category,
              description: "",
              qty: 1,
              unit: 0,
              direct: false,
            },
          ])
        }
      >
        Adicionar item
      </Button>
    </div>
  );
}
