export default function UnauthorizedPage() {
  return (
    <main className="main">
      <div className="card">
        <h1>Yetkisiz</h1>
        <p className="muted">
          Oturumun var ama yönetim rolün yok. Roller user_roles tablosunda tutulur; kendini
          yükseltemezsin.
        </p>
        <a href="/login">Girişe dön</a>
      </div>
    </main>
  );
}
