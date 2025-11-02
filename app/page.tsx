export default function Home() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Bienvenido a Ethiqia</h1>
      <p className="text-[#c8cfdb]">Red social básica supervisada por IA. Regístrate, inicia sesión y publica con imagen o vídeo. Tu reputación (Ethiqia Score) se mostrará en tu perfil.</p>
      <div className="card">
        <p className="text-sm text-[#c8cfdb]">API objetivo configurable en <code>NEXT_PUBLIC_API_BASE</code>.</p>
      </div>
    </div>
  );
}
