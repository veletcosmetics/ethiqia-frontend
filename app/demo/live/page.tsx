'use client';

import { useEffect, useState } from 'react';
import { addNotification } from '../../../lib/notifications';

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

const PROFILE_STORAGE_KEY = 'ethiqia_demo_post';
const FEED_STORAGE_KEY = 'ethiqia_feed_posts';

function generateAnalysis(): AnalysisResult {
  // Valores simulados para la demo
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

  // Cargar última demo guardada (si existe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
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

    // Solo aceptamos formatos de imagen típicos; HEIC puede dar problemas
    if (!file.type.startsWith('image/')) {
      alert('Por ahora solo aceptamos imágenes estándar (jpg, png, webp…).');
      return;
    }

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

      // 2) Guardar como publicación demo principal (para la bio)
      try {
        const demoPost: DemoPost = {
          imageUrl: result,
          score: generated.ethScore,
          name: file.name || 'Demo Ethiqia',
          createdAt: Date.now(),
        };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(demoPost));
        setLastSaved(demoPost);
      } catch {
        // ignoramos errores de almacenamiento
      }

      // 3) Guardar también en el feed local
      try {
        const rawFeed = localStorage.getItem(FEED_STORAGE_KEY);
        const parsed: DemoPost[] = rawFeed ? JSON.parse(rawFeed) : [];

        const newPost: DemoPost = {
          imageUrl: result,
          score: generated.ethScore,
          name: file.name || 'Demo Ethiqia',
          createdAt: Date.now(),
        };

        const updated = [newPost, ...parsed];
        localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignoramos errores
      }

      // 4) Notificación de score (sistema de notificaciones de la demo)
      try {
        addNotification(
          'post-scored',
          `Tu publicación generó ${generated.ethScore} puntos de Ethiqia Score.`
        );
      } catch {
        // ignoramos errores de notificaciones
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
            Esta demo está pensada para enseñar a inversores y amigos cómo
            funcionaría Ethiqia: subes una imagen, la IA analiza su
            autenticidad, la probabilidad de que sea IA y genera un Ethiqia
            Score en tiempo real. La publicación se guarda en tu bio y en el
            feed de esta demo (solo en este navegador).
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
                Puede ser una foto real, un render, un mockup… La IA simula el
                análisis y asigna un Ethiqia Score. Las fotos HEIC pueden fallar;
                usa JPG/PNG/WebP para la demo.
              </p>
            </div>
          </div>

          <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-6 text-center text-xs text-neutral-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-300">
            <span className="text-3xl">📷</span>
            <span>
              Haz clic para elegir una imagen
              <span className="block text-[11px] text-neutral-500 mt-1">
                (solo se procesa en tu navegador)
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
              Cada vez que subes una imagen aquí, se guarda como{' '}
              <code className="bg-neutral-800 px-1 py-[1px] rounded">
                {PROFILE_STORAGE_KEY}
              </code>{' '}
              en <span className="font-mono">localStorage</span> para tu bio.
            </li>
            <li>
              También se añade al feed en{' '}
              <code className="bg-neutral-800 px-1 py-[1px] rounded">
                {FEED_STORAGE_KEY}
              </code>{' '}
              para mostrarse en <code>/feed</code>.
            </li>
            <li>
              Se genera una notificación del tipo{' '}
              <code className="bg-neutral-800 px-1 py-[1px] rounded">
                post-scored
              </code>{' '}
              que podrás ver en la sección de notificaciones.
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
