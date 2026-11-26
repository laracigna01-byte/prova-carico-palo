import { LuminousSwitch } from "../dismat-ui/LuminousSwitch";
import "../dismat-ui/application.css";
import { useAuth } from "../security/AuthContext";

export function Header({ theme, setTheme }) {
  const { logout } = useAuth();

  return (
    <header className="app-header du-header">
        <LuminousSwitch dark={theme === "dark"} onToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />
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
      </div>

      <div className="header-actions">
        

        <button
          type="button"
          className="logout-btn"
          onClick={logout}
        >
          🔒 Esci
        </button>
      </div>
    </header>
  );
}