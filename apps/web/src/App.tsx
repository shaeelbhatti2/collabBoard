import { VERSION } from "@collabboard/shared";

export function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <h1>CollabBoard</h1>
        <span className="version">v{VERSION}</span>
      </header>
      <main className="stage">
        <p>Whiteboard canvas loads here.</p>
      </main>
    </div>
  );
}
