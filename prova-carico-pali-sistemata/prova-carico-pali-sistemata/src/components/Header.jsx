export function Header({ theme, setTheme }) {
  return (
    <header className="app-header">
      <div className="brand">
        <img src="/logo-dismat.jpg" alt="Laboratorio DISMAT" />
        <div>
          <p>LABORATORIO DISMAT</p>
          <small>Sperimentazione sulle Strutture e sui Materiali da Costruzione</small>
        </div>
      </div>

      <div className="header-title">
        <b>Prova di carico statica assiale su palo</b>
        <span>Acquisizione letture · prova su minuta · PDF responsive con foto e grafico</span>

        <button
          type="button"
          className="theme-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀️ Passa al chiaro" : "🌙 Passa allo scuro"}
        </button>
      </div>
    </header>
  );
}