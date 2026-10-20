import { Copy } from "lucide-react";
import type { Demand } from "../types";
import { copy, useStore } from "../store";
import { mailSubject } from "../mail-reference";
import { Button, Label } from "./UI";

export function MailSubject({ d, purpose }: { d: Demand; purpose: string }) {
  const { notify } = useStore();
  const subject = mailSubject(d, purpose);
  return (
    <div className="mail-subject">
      <Label label="Assunto com referência do atendimento">
        <input readOnly value={subject} />
      </Label>
      <Button
        icon={Copy}
        onClick={async () =>
          notify(
            (await copy(subject))
              ? "Assunto copiado com a referência do atendimento."
              : "Selecione o assunto e copie manualmente.",
          )
        }
      >
        Copiar assunto
      </Button>
    </div>
  );
}
