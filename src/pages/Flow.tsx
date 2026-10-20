import {
  ArrowDown,
  Phone,
  ClipboardList,
  Sparkles,
  Mail,
  FileCheck,
  Palette,
  Check,
  Download,
} from "lucide-react";
import { Title, Button, Badge } from "../components/UI";
const flow = [
  {
    n: 1,
    title: "Cliente entra em contato",
    desc: "Gmail, WhatsApp ou ligação com a Adviser.",
    owner: "Cliente → Atendimento",
    icon: Phone,
  },
  {
    n: 2,
    title: "Mensagens chegam e o atendimento confirma o vínculo",
    desc: "Gmail e WhatsApp integrados recebem mensagens e anexos. A IA sugere a demanda quando o código ou a conversa não bastam; a equipe confirma os casos ambíguos. Entrada manual disponível.",
    owner: "Atendimento",
    icon: ClipboardList,
  },
  {
    n: 3,
    title: "IA sugere o briefing e as perguntas",
    desc: "A equipe revisa os campos e completa manualmente o que faltar.",
    owner: "Atendimento + IA",
    icon: Sparkles,
  },
  {
    n: 4,
    title: "Cliente e atendimento alinham o entendimento",
    desc: "A IA prepara a resposta e a equipe revisa antes de enviar pelo Gmail ou WhatsApp. O cliente responde no seu canal habitual.",
    owner: "Atendimento ↔ Cliente",
    icon: Mail,
    branch:
      "Se faltarem informações, repete-se o alinhamento. Só avança com o briefing validado.",
  },
  {
    n: 5,
    title: "Atendimento solicita cotações",
    desc: "Seleciona serviços e fornecedores. Prepara e-mails individuais com links de preenchimento.",
    owner: "Atendimento → Fornecedores",
    icon: Mail,
  },
  {
    n: 6,
    title: "Fornecedores preenchem suas propostas",
    desc: "Formulário por categoria, com opções, itens, preços, condições e anexos. O atendimento pode pedir ajustes e confirmar a composição escolhida.",
    owner: "Fornecedores → Atendimento",
    icon: ClipboardList,
  },
  {
    n: 7,
    title: "Atendimento compara e monta a proposta",
    desc: "Seleciona cotações, ajusta valores e condições. Salva uma versão e prepara PDF ou Excel.",
    owner: "Atendimento",
    icon: FileCheck,
    creative: true,
  },
  {
    n: 8,
    title: "Cliente recebe e decide",
    desc: "A proposta segue pelo canal habitual. O atendimento registra a resposta e a evidência.",
    owner: "Atendimento ↔ Cliente",
    icon: Check,
    branch:
      "Pediu ajustes? Retorna à etapa 7 e gera uma nova versão. Recusou? Encerra a demanda sem repasse. Aprovou? Segue abaixo.",
  },
  {
    n: 9,
    title: "Atendimento prepara o repasse para Operações",
    desc: "Reúne briefing, versão aprovada, aceite, fornecedores selecionados, condições e pendências.",
    owner: "Atendimento → Operações",
    icon: FileCheck,
  },
];
export function Flow() {
  return (
    <>
      <Title
        title="Do primeiro contato ao fechamento"
        sub="Atendimento → Operações → fechamento financeiro. Leia de cima para baixo; o financeiro acompanha os pagamentos durante o projeto."
        actions={
          <Button
            icon={Download}
            onClick={() =>
              window.open(
                (window as Window & { adviserDiagramUrl?: string })
                  .adviserDiagramUrl || "/fluxo.svg",
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            Abrir diagrama
          </Button>
        }
      />
      <div className="flow-legend">
        <Badge tone="blue">Atendimento · MVP</Badge>
        <Badge tone="amber">Criação · apoio à proposta</Badge>
        <Badge tone="blue">Operações · etapa 2</Badge>
        <Badge tone="green">Financeiro · etapa 3</Badge>
      </div>
      <div className="flow-diagram">
        <div className="flow-terminal start">INÍCIO</div>
        {flow.map((s) => (
          <div className="flow-unit" key={s.n}>
            <ArrowDown className="flow-arrow" size={22} />
            <div className="flow-node">
              <span className="flow-number">{s.n}</span>
              <div>
                <span className="flow-owner">{s.owner}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {s.branch && <div className="flow-branch">{s.branch}</div>}
                {s.creative && (
                  <div className="flow-creative">
                    <Palette size={18} />
                    <div>
                      <strong>Criação contribui aqui</strong>
                      <p>
                        Conceito e apresentação podem ser desenvolvidos durante
                        o briefing e antes da proposta. No MVP, referências,
                        apresentações e registro de feedback. A gestão completa
                        da criação fica na etapa 2.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <ArrowDown className="flow-arrow" size={22} />
        <div className="flow-terminal end">
          FIM DO MVP · aceite e repasse organizados
        </div>
        <div className="flow-future">
          <ArrowDown className="flow-arrow" size={22} />
          <h2>Evolução após o MVP</h2>
          <div className="future-flow-row">
            <span className="flow-number">10</span>
            <div>
              <Badge tone="blue">Operações · etapa 2</Badge>
              <h3>Proposta aceita vira projeto: produzir e executar</h3>
              <p>
                Receber o escopo aprovado, confirmar contratações, coordenar
                fornecedores e cronograma, produzir e executar o evento. A
                criação apoia os desdobramentos necessários.
              </p>
              <div className="flow-branch">
                Operações: nome da área e responsabilidades a confirmar com a
                Adviser.
              </div>
            </div>
          </div>
          <ArrowDown className="flow-arrow" size={22} />
          <div className="future-flow-row">
            <span className="flow-number">11</span>
            <div>
              <Badge tone="green">Financeiro · etapa 3</Badge>
              <h3>Controlar e fechar o financeiro</h3>
              <p>
                Recebimentos e pagamentos ocorrem ao longo do projeto. Depois do
                evento: conciliação, previsto × realizado e fechamento, com
                financeiro próprio e eventual migração do Conta Azul a validar.
              </p>
            </div>
          </div>
          <ArrowDown className="flow-arrow" size={22} />
          <div className="flow-terminal final">
            FIM DO PROCESSO COMPLETO · evento e financeiro encerrados
          </div>
        </div>
      </div>
    </>
  );
}
