'use client';

import { useEffect, useState } from 'react';

type AnalysisResult = {
  authenticity: number;
  aiProbability: number;
  coherence: number;
  ethScore: number;
};

type DemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

type FeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

const STORAGE_KEY_DEMO = 'ethiqia_demo_post';
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

  // Cargar última demo guardada (para mostrar texto al final)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY_DEMO);
    if (raw) {
      try {
        const data = JSON.parse(raw) as DemoPost;
        if (data.imageUrl) {
          setLastSaved(data);
        }
      } catch {
        // ignorar
      }
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // NOTA: solo aceptamos formatos estándar (png, jpg, jpeg, webp, etc.)
    // HEIC puede dar problemas, mejor evitarlo.
    setIsAnalyzing(true);
    setFileName(file.name || 'Imagen subida');
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageSrc(result);

      // 1) Simular análisis IA
      const generated = generateAnalysis();
      setAnalysis(generated);
      setIsAnalyzing(false);

      // 2) Guardar como publicación demo (para la Bio)
      try {
        const demoPost: DemoPost = {
          imageUrl: result,
          score: generated.ethScore,
          name: file.name || 'Demo Ethiqia',
          createdAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY_DEMO, JSON.stringify(demoPost));
        setLastSaved(demoPost);
      } catch {
        // ignoramos errores de almacenamiento
      }

      // 3) Guardar también en el feed REAL de demo (sin posts falsos)
      try {
        const rawFeed = localStorage.getItem(STORAGE_KEY_FEED);
        const parsed: FeedPost[] = rawFeed ? JSON.parse(rawFeed) : [];

        const newPost: FeedPost = {
          id: `feed-${Date.now()}`,
          imageUrl: result,
          score: generated.ethScore,
          createdAt: Date.now(),
        };

        const updated = [newPost, ...parsed];
        localStorage.setItem(STORAGE_KEY_FEED, JSON.stringify(updated));
      } catch {
        // ignoramos errores
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
            Esta demo está pensada para enseñar a inversores y al Parque
            Científico cómo funcionaría Ethiqia: subes una imagen, la IA
            analiza su autenticidad, la probabilidad de que sea IA y genera un
            Ethiqia Score en tiempo real. La publicación se guarda en tu bio y
            en el feed real de demo (sin fotos falsas).
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
                Usa formatos estándar (JPG, PNG, WEBP). Formatos como HEIC
                pueden no mostrarse correctamente en el navegador.
              </p>
            </div>
          </div>

          <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-6 text-center text-xs text-neutral-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-300">
            <span className="text-3xl">📷</span>
            <span>
              Haz clic para elegir una imagen
              <span className="block text-[11px] text-neutral-500 mt-1">
                (solo se procesa en tu navegador, no se sube a ningún servidor
                externo)
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
                      Este score combina autenticidad, coherencia y la
                      probabilidad de que la imagen sea IA. En la versión real,
                      estos cálculos se harían con modelos de IA entrenados
                      específicamente.
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

        {/* Estado de integración con el resto de la demo */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Cómo se integra esta demo con el resto de Ethiqia
          </h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              La última imagen subida se guarda como{' '}
              <code className="bg-neutral-800 px-1 py-[1px] rounded">
                ethiqia_demo_post
              </code>{' '}
              y se muestra en tu bio.
            </li>
            <li>
              Cada subida también se añade a{' '}
              <code className="bg-neutral-800 px-1 py-[1px] rounded">
                ethiqia_feed_posts
              </code>{' '}
              y aparece en el feed general, sin fotos falsas precargadas.
            </li>
          </ul>

          {lastSaved && (
            <p className="text-[11px] text-neutral-500 mt-2">
              Última demo guardada:{' '}
              <span className="text-neutral-300">
                {lastSaved.name || 'Sin nombre'}
              </span>
              , Ethiqia Score:{' '}
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
