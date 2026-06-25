import { compressImages } from "../utils/images";

export function PhotoUploader({ photo, setPhoto, caption, setCaption }) {
  async function onFiles(event) {
    const items = await compressImages(event.target.files);
    if (items[0]) setPhoto(items[0]);
    event.target.value = "";
  }

  return (
    <div className="photos-block">
      <div className="photo-actions">
        <label className="photo-drop">
          <strong>Scatta una foto</strong>
          <span>Usa la fotocamera del dispositivo.</span>
          <input type="file" accept="image/*" capture="environment" onChange={onFiles} />
        </label>
        <label className="photo-drop">
          <strong>Scegli dalla galleria</strong>
          <span>Carica un’immagine esistente da iPhone o Android.</span>
          <input type="file" accept="image/*" onChange={onFiles} />
        </label>
      </div>

      {photo && (
        <figure className="single-photo">
          <img src={photo.dataUrl} alt={photo.name || "Foto prova"} />
          <figcaption>{photo.name || "Foto prova"}</figcaption>
          <button type="button" onClick={() => setPhoto(null)}>Rimuovi foto</button>
        </figure>
      )}
      <div className="field wide">
        <label>Didascalia foto</label>
        <input value={caption || ""} onChange={(e) => setCaption(e.target.value)} placeholder="Foto della prova di carico statica assiale su palo" />
      </div>
    </div>
  );
}
