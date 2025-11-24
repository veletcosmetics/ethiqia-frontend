'use client';

import { useEffect, useState } from 'react';
import { addDemoFeedPost, type DemoFeedPost } from '@/lib/feed';

type AnalysisResult = {
  authenticity: number;
  aiProbability: number;
  coherence: number;
  ethScore: number;
};

type LastDemo = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt: number;
};

const LAST_DEMO_KEY = 'ethiqia_demo_last_post';

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
  const [lastDemo, setLastDemo] = useState<LastDemo | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(LAST_DEMO_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LastDemo;
        if (parsed.imageUrl) setLastDemo(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Sube solo archivos de imagen (jpg, png, webp...)');
      return;
    }

    setIsAnalyzing(true);
    setFileName(file.name || 'Imagen subida');
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageSrc(result);

      const generated = generateAnalysis();
      setAnalysis(generated);
      setIsAnalyzing(false);

      const createdAt = Date.now();

      // Guardar último análisis demo
      const last: LastDemo = {
        imageUrl: result,
        score: generated.ethScore,
        name: file.name || 'Demo Ethiqia',
        createdAt,
      };
      try {
        window.localStorage.setItem(LAST_DEMO_KEY, JSON.stringify(last));
        setLastDemo(last);
      } catch {
        // ignore
      }

      // Guardar en feed demo (USAMOS lib/feed.ts)
      const newPost: DemoFeedPost = {
        id: `p-${createdAt}`,
        imageUrl: result,
        score: generated.ethScore,
        createdAt,
      };
      try {
        addDemoFeedPost(newPost);
      } catch {
        // ignore
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
            En esta demo todo ocurre en tu navegador: subes una imagen, se
            simula un análisis con Ethiqia Score y la publicación se guarda en
            tu feed y en tu perfil.
          </p>
        </header>

        {/* Subida de imagen */}
        <section className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <h2 className="text-sm font-semibold text-neutral-100">
            1. Sube una imagen de demo
          </h2>
          <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-6 text-center text-xs text-neutral-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-300">
            <span className="text-3xl">📷</span>
            <span>
              Haz clic para elegir una imagen
              <span className="block text-[11px] text-neutral-500 mt-1">
                (solo se procesa en tu navegador; no se sube a servidores)
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

        {/* Info */}
        {lastDemo && (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-1">
            <p>
              Última imagen subida:{" "}
              <span className="text-neutral-100">
                {lastDemo.name || 'Sin nombre'}
              </span>
            </p>
            <p>
              Ethiqia Score:{" "}
              <span className="text-emerald-300">{lastDemo.score}/100</span>
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
