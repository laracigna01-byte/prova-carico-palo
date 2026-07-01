import { useState } from "react";
import { TextInput, NumberInput, SectionHeader, TextArea } from "./Inputs";
import { PhotoUploader } from "./PhotoUploader";
import { T } from "../config/theme";
import { NORME } from "../config/testConfig";

export function InfoPanel({ data, setData, photo, setPhoto }) {
  const [open, setOpen] = useState(true);
  const upd = (key) => (value) => setData((prev) => ({ ...prev, [key]: value }));

  const updateExerciseLoad = (value) => {
    setData((prev) => ({
      ...prev,
      exerciseLoad: value,
      testLoad: value ? Number(value || 0) * 1.5 : prev.testLoad,
    }));
  };

  return (
    <div className="panel">
      <button className="panel-toggle" type="button" onClick={() => setOpen(!open)}>
        {open ? "Nascondi dati prova" : "Mostra dati prova"}
        <span>{data.reportId ? `Rapporto ${data.reportId}` : "UNI EN ISO 22477-1 - Prova di carico statica assiale su palo"}</span>
      </button>
      {open && (
        <div className="panel-body">
          <SectionHeader label="Dati generali" step="A" color={T.accentBlue} />
          <div className="norm-box"><b>Riferimenti normativi</b><span>{NORME.uni} - {NORME.dm}</span></div>
          <div className="grid small">
            <TextInput label="Data inizio" type="date" value={data.dataInizio} onChange={upd("dataInizio")} />
            <TextInput label="Ora inizio" type="time" value={data.oraInizio} onChange={upd("oraInizio")} />
            <TextInput label="Data fine" type="date" value={data.dataFine} onChange={upd("dataFine")} />
            <TextInput label="Ora fine" type="time" value={data.oraFine} onChange={upd("oraFine")} />
          </div>
          <div className="grid">
            <TextInput label="Committente" value={data.committente} onChange={upd("committente")} />
            <TextInput label="Cantiere" value={data.cantiere} onChange={upd("cantiere")} />
            <TextInput label="Localita" value={data.localita} onChange={upd("localita")} />
            <TextInput label="Direzione lavori" value={data.direzioneLavori} onChange={upd("direzioneLavori")} />
            <TextInput label="Impresa" value={data.impresa} onChange={upd("impresa")} />
            <TextInput label="Tecnico esecutore" value={data.tecnico} onChange={upd("tecnico")} />
          </div>

          <SectionHeader label="Dati palo" step="B" color={T.accentOrange} />
          <div className="grid small">
            <TextInput label="Identificativo palo" value={data.pileId} onChange={upd("pileId")} placeholder="P-01" />
            <NumberInput label="Diametro (mm)" value={data.diameter} onChange={upd("diameter")} placeholder="mm" />
            <NumberInput label="Lunghezza (m)" value={data.length} onChange={upd("length")} placeholder="m" />
            <NumberInput label="Carico di esercizio (kN)" value={data.exerciseLoad} onChange={updateExerciseLoad} placeholder="kN" />
            <NumberInput label="Carico massimo collaudo 150% (kN)" value={data.testLoad} onChange={upd("testLoad")} placeholder="kN" />
          </div>

          <SectionHeader label="Strumentazione" step="C" color={T.accent} />
          <div className="grid small">
            <TextInput label="Martinetto" value={data.jackId} onChange={upd("jackId")} placeholder="M-01" />
            <NumberInput label="Portata martinetto (t)" value={data.jackCapacityTon} onChange={upd("jackCapacityTon")} placeholder="30" />
            <TextInput label="Manometro / cella" value={data.manometerId} onChange={upd("manometerId")} placeholder="700" />
            <TextInput label="Comparatori" value={data.comparatorId} onChange={upd("comparatorId")} />
            <TextInput label="Presenti" value={data.presenti} onChange={upd("presenti")} />
          </div>
          <div className="norm-box">
            <b>Calcolo pressione</b>
            <span>La pressione viene calcolata con la proporzione: portata del martinetto : 700 bar = carico del gradino : x.</span>
          </div>
          <div className="note mini"><b>Letture:</b> per ogni gradino il tecnico deve inserire almeno 9 letture per ciascuno dei 3 comparatori.</div>

          <SectionHeader label="Note e foto" step="D" color={T.accentYellow} />
          <TextArea label="Note tecniche" value={data.note} onChange={upd("note")} placeholder="Annotazioni su condizioni di prova, attrezzatura, anomalie, dati del progettista..." />
          <PhotoUploader photo={photo} setPhoto={setPhoto} caption={data.photoCaption} setCaption={upd("photoCaption")} />
        </div>
      )}
    </div>
  );
}
