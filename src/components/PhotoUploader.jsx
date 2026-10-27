import { useState } from "react";
import { compressImages } from "../utils/images";

export function PhotoUploader({ photo, setPhoto, caption, setCaption }) {
  const photos = Array.isArray(photo) ? photo : photo?.dataUrl ? [photo] : [];
  const [error, setError] = useState("");

  async function onFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const available = Math.max(0, 10 - photos.length);
    if (!available) { setError("Massimo 10 fotografie."); return; }
    try {
      const items = await compressImages(files.slice(0, available));
      setPhoto((previous) => [...(Array.isArray(previous) ? previous : previous?.dataUrl ? [previous] : []), ...items].slice(0, 10));
      setError(files.length > available ? "Sono state aggiunte solo le fotografie consentite (massimo 10)." : "");
    } catch {
      setError("Impossibile leggere una delle immagini. Riprova con una foto JPG o PNG.");
    }
  }

  function removeAt(index) {
    setPhoto((previous) => (Array.isArray(previous) ? previous : previous?.dataUrl ? [previous] : []).filter((_, i) => i !== index));
  }

  async function replaceAt(index, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const [item] = await compressImages([file]);
      setPhoto((previous) => (Array.isArray(previous) ? previous : previous?.dataUrl ? [previous] : []).map((p, i) => i === index ? item : p));
      setError("");
    } catch {
      setError("Impossibile sostituire la fotografia.");
    }
  }

  return (
    <div className="photos-block">
      <p>Fotografie: {photos.length}/10. Puoi aggiungerle anche successivamente senza perdere quelle presenti.</p>
      <div className="photo-actions">
        <label className="photo-drop">
          <strong>Scatta una foto</strong>
          <span>Usa la fotocamera del dispositivo.</span>
          <input type="file" accept="image/*" capture="environment" onChange={onFiles} disabled={photos.length >= 10} />
        </label>
        <label className="photo-drop">
          <strong>Aggiungi dalla galleria</strong>
          <span>Seleziona una o più fotografie.</span>
          <input type="file" accept="image/*" multiple onChange={onFiles} disabled={photos.length >= 10} />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="photo-actions">
        {photos.map((item, index) => (
          <figure className="single-photo" key={item.id || index}>
            <img src={item.dataUrl} alt={item.name || `Foto ${index + 1}`} />
            <figcaption>Foto {index + 1}: {item.name || "Immagine"}</figcaption>
            <label className="photo-drop">
              Sostituisci
              <input type="file" accept="image/*" onChange={(event) => replaceAt(index, event)} />
            </label>
            <button type="button" onClick={() => removeAt(index)}>Rimuovi foto</button>
          </figure>
        ))}
      </div>
      <div className="field wide">
        <label>Didascalia fotografie</label>
        <input value={caption || ""} onChange={(e) => setCaption(e.target.value)} placeholder="Foto della prova di carico su palo" />
      </div>
    </div>
  );
}
