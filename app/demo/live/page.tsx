'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
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

const STORAGE_KEY = 'ethiqia_demo_post';
const FEED_KEY = 'ethiqia_feed_posts';

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

  // Al cargar, intentamos recuperar la última demo guardada
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as DemoPost;
      if (data.imageUrl) {
        setLastSaved(data);
        setImageSrc(data.imageUrl);
        // Solo para mostrar algo en las barras
        setAnalysis({
          authenticity: data.score,
          aiProbability: Math.max(5, 100 - data.score),
          coherence: 80,
          ethScore: data.score,
        });
      }
    } catch {
      // ignorar errores
    }
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // IMPORTANTE: evita HEIC para la demo
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'heic' || ext === 'heif') {
      alert('Este formato (HEIC/HEIF) no es compatible en la demo. Usa PNG o JPG.');
      return;
    }

    setIsAnalyzing(true);
    setFileName(file.name || 'Imagen subida');
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (!result) {
        setIsAnalyzing(false);
        return;
      }

      // 1) Vista previa inmediata
      setImageSrc(result);

      // 2) Análisis simulado
      const generated = generateAnalysis();
      setAnalysis(generated);
      setIsAnalyzing(false);

      // 3) Guardar como publicación demo en localStorage (para la BIO)
      try {
        const demoPost: DemoPost = {
          imageUrl: result,
          score: generated.ethScore,
          name: file.name || 'Demo Ethiqia',
          createdAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPost));
        setLastSaved(demoPost);
      } catch {
        // ignoramos errores de almacenamiento
      }

      // 4) Guardar también en el FEED local (solo real, sin falsos)
      try {
        const rawFeed = localStorage.getItem(FEED_KEY);
        const parsed: DemoPost[] = rawFeed ? JSON.parse(rawFeed) : [];

        const newPost = {
          id: `p-${Date.now()}`,
          imageUrl: result,
          score: generated.ethScore,
          createdAt: Date.now(),
        };

        const updated = [newPost, ...parsed];
        localStorage.setItem(FEED_KEY, JSON.stringify(updated));
      } catch {
        // ignoramos errores
      }

      // 5) Notificación de score
      try {
        addNotification(
          'post-scored',
          `Tu publicación generó ${generated.ethScore} puntos de Ethiqia Score.`
        );
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
            Sube una foto y deja que Ethiqia la analice (demo local)
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            La imagen se analiza en tu navegador, se guarda en tu bio y aparece
            en el feed demo como si fuera una red social real.
          </p>
        </header>

        {/* Subida de imagen */}
        <section className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <h2 className="text-sm font-semibold text-neutral-100">
            1. Sube una imagen (PNG o JPG)
          </h2>

          <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-6 text-center text-xs text-neutral-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-300">
            <span className="text-3xl">📷</span>
            <span>
              Haz clic para elegir una imagen
              <span className="block text-[11px] text-neutral-500 mt-1">
                (no se sube a ningún servidor, solo se guarda en tu navegador
                para la demo)
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
                3. Análisis IA (simulado)
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
                      Este score combina autenticidad, coherencia y probabilidad
                      de IA. En producción se conectaría con modelos de IA
                      reales y con tu Ethiqia Score global.
                    </p>
                  </>
                )}

                {!isAnalyzing && !analysis && (
                  <p className="text-xs text-neutral-400">
                    Sube una imagen para ver cómo Ethiqia la analizaría en esta
                    demo.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Estado de integración */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Cómo se conecta esta demo con tu bio y el feed
          </h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              Se guarda la última imagen y score en{' '}
              <code className="bg-neutral-800 px-1 py-[1px] rounded">
                {STORAGE_KEY}
              </code>{' '}
              para que tu bio la muestre como publicación destacada.
            </li>
            <li>
              Se añade la publicación al feed demo en{' '}
              <code className="bg-neutral-800 px-1 py-[1px] rounded">
                {FEED_KEY}
              </code>{' '}
              para que aparezca en <code>/feed</code>.
            </li>
            <li>
              Se genera una notificación de tipo{' '}
              <code className="bg-neutral-800 px-1 py-[1px] rounded">
                post-scored
              </code>{' '}
              para enseñar el sistema de avisos.
            </li>
          </ul>

          {lastSaved && (
            <p className="text-[11px] text-neutral-500 mt-2">
              Última demo guardada:{' '}
              <span className="text-neutral-300">
                {lastSaved.name || 'Sin nombre'}
              </span>{' '}
              · Ethiqia Score:{' '}
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
