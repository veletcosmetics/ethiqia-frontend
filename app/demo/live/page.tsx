'use client';

import { useEffect, useState } from 'react';

type AnalysisResult = {
  authenticity: number;
  aiProbability: number;
  coherence: number;
  ethScore: number;
};

type DemoPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

const STORAGE_KEY_LAST = 'ethiqia_demo_post';
const STORAGE_KEY_FEED = 'ethiqia_feed_posts';

function generateAnalysis(): AnalysisResult {
  const aiProbability = Math.round(Math.random() * 70) + 10; // 10–80 %
  const authenticity =
    100 - aiProbability + Math.round((Math.random() - 0.5) * 10);
  const coherence = 70 + Math.round(Math.random() * 25);

  const authSafe = Math.max(0, Math.min(100, authenticity));
  const cohSafe = Math.max(0, Math.min(100, coherence));
  const aiSafe = Math.max(0, Math.min(100, aiProbability));

  const ethScore = Math.round(
    0.5 * authSafe + 0.3 * cohSafe + 0.2 * (100 - aiSafe)
  );

  return {
    authenticity: authSafe,
    aiProbability: aiSafe,
    coherence: cohSafe,
    ethScore,
  };
}

export default function LiveDemoPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastSaved, setLastSaved] = useState<DemoPost | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar última demo guardada
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_LAST);
      if (!raw) return;
      const data = JSON.parse(raw) as DemoPost;
      if (data.imageUrl) {
        setLastSaved(data);
      }
    } catch {
      // ignoramos errores
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Evitar HEIC y formatos raros
    const lowerName = file.name.toLowerCase();
    if (
      !file.type.startsWith('image/') ||
      lowerName.endsWith('.heic') ||
      file.type === 'image/heic'
    ) {
      alert('Usa una imagen JPG/PNG/WebP (no HEIC).');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysis(null);
    setFileName(file.name || 'Imagen subida');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageSrc(result);

      // 1) Simular análisis IA
      const generated = generateAnalysis();
      setAnalysis(generated);
      setIsAnalyzing(false);

      // 2) Construir objeto de publicación
      const post: DemoPost = {
        id: `p-${Date.now()}`,
        imageUrl: result,
        score: generated.ethScore,
        createdAt: Date.now(),
      };

      try {
        // 3) Guardar última demo
        localStorage.setItem(STORAGE_KEY_LAST, JSON.stringify(post));
        setLastSaved(post);
      } catch (e) {
        console.error('Error guardando última demo:', e);
      }

      try {
        // 4) Guardar en el feed local que leen /feed y /profile
        const rawFeed = localStorage.getItem(STORAGE_KEY_FEED);
        const parsed: DemoPost[] = rawFeed ? JSON.parse(rawFeed) : [];
        const updated = [post, ...parsed];
        localStorage.setItem(STORAGE_KEY_FEED, JSON.stringify(updated));
      } catch (e) {
        console.error('Error guardando en feed local:', e);
        setErrorMsg(
          'La imagen se ha analizado, pero hubo un error al guardar el histórico local.'
        );
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Demo en tiempo real
          </p>
          <h1 className="text-2xl font-semibold">
            Sube una foto y deja que Ethiqia la analice
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Esta demo funciona 100% en tu navegador: subes una imagen, la IA
            simula el análisis, genera un Ethiqia Score y la publicación se
            guarda en tu perfil y en el feed local. No depende del backend, así
            que es estable para enseñar a inversores y al Parque Científico.
          </p>
        </header>

        {/* Subida de imagen */}
        <section className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                1. Sube una imagen de demo
              </h2>
              <p className="text-xs text-neutral-400">
                Usa una foto real (jpg, png, webp…). La imagen no sale del
                navegador: se guarda como demo local y se muestra en tu bio y en
                el feed.
              </p>
            </div>
          </div>

          <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-6 text-center text-xs text-neutral-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-300">
            <span className="text-3xl">📷</span>
            <span>
              Haz clic para elegir una imagen
              <span className="block text-[11px] text-neutral-500 mt-1">
                (evita HEIC; mejor jpg / png / webp)
              </span>
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {fileName && (
            <p className="text-[11px] text-neutral-500">
              Imagen seleccionada:{' '}
              <span className="text-neutral-300">{fileName}</span>
            </p>
          )}

          {errorMsg && (
            <p className="text-[11px] text-amber-400 mt-1">{errorMsg}</p>
          )}
        </section>

        {/* Vista previa + análisis */}
        {(imageSrc || analysis || isAnalyzing) && (
          <section className="grid gap-4 md:grid-cols-2">
            {/* Imagen */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                2. Vista previa
              </h2>
              <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Vista previa"
                    className="w-full max-h-[360px] object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
                    Aún no has subido ninguna imagen.
                  </div>
                )}
              </div>
            </div>

            {/* Resultados IA */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                3. Análisis IA (simulado para demo)
              </h2>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-sm space-y-3">
                {isAnalyzing && (
                  <p className="text-xs text-neutral-400">
                    Analizando la imagen con la IA de Ethiqia…
                  </p>
                )}

                {!isAnalyzing && analysis && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">
                        Autenticidad estimada
                      </span>
                      <span className="font-semibold text-neutral-100">
                        {analysis.authenticity}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${analysis.authenticity}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-neutral-300">
                        Probabilidad de que sea IA
                      </span>
                      <span className="font-semibold text-neutral-100">
                        {analysis.aiProbability}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${analysis.aiProbability}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-neutral-300">
                        Coherencia del contenido
                      </span>
                      <span className="font-semibold text-neutral-100">
                        {analysis.coherence}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${analysis.coherence}%` }}
                      />
                    </div>

                    <hr className="border-neutral-800 my-3" />

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Ethiqia Score</span>
                      <span className="text-xl font-semibold text-emerald-400">
                        {analysis.ethScore}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      En producción este score vendría de modelos entrenados.
                      Aquí es una simulación para enseñar el flujo completo y
                      rellenar tu feed local.
                    </p>
                  </>
                )}

                {!isAnalyzing && !analysis && (
                  <p className="text-xs text-neutral-400">
                    Sube una imagen para ver cómo Ethiqia la analizaría.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Explicación técnica */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Qué está pasando por detrás en esta demo
          </h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              La imagen se analiza en tu navegador y se guarda como publicación
              demo en <code>localStorage</code>.
            </li>
            <li>
              También se añade a un feed local en la clave{' '}
              <code>ethiqia_feed_posts</code>, que leen las páginas{' '}
              <code>/feed</code> y <code>/profile</code>.
            </li>
            <li>
              No dependemos del backend ni de Supabase para esta demo, así que
              siempre funcionará aunque el servidor esté caído.
            </li>
          </ul>

          {lastSaved && (
            <p className="text-[11px] text-neutral-500 mt-2">
              Última demo local guardada:{' '}
              <span className="text-neutral-300">{lastSaved.id}</span>, Score:{' '}
              <span className="text-emerald-300">
                {lastSaved.score}/100
              </span>
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
