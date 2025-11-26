'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  AnalysisResult,
  addDemoPost,
  pushNotification,
} from '../../../lib/demoStorage';
import NotificationsBar from '../../../components/demo/NotificationsBar';

function generateAnalysis(): AnalysisResult {
  const aiProbability = Math.round(Math.random() * 70) + 10;
  const authenticity =
    100 - aiProbability + Math.round((Math.random() - 0.5) * 10);
  const coherence = 70 + Math.round(Math.random() * 25);
  const ethScoreRaw =
    (authenticity + coherence + (100 - aiProbability)) / 3;

  const authSafe = Math.max(0, Math.min(100, authenticity));
  const cohSafe = Math.max(0, Math.min(100, coherence));
  const aiSafe = Math.max(0, Math.min(100, aiProbability));
  const ethSafe = Math.round(Math.max(0, Math.min(100, ethScoreRaw)));

  return {
    authenticity: authSafe,
    aiProbability: aiSafe,
    coherence: cohSafe,
    ethScore: ethSafe,
  };
}

export default function LiveDemoPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
    setIsProcessing(true);
    setAnalysis(null);

    try {
      const result = generateAnalysis();
      setAnalysis(result);

      const post = addDemoPost(localUrl, result);

      pushNotification(
        `Tu publicación generó ${post.score}/100 puntos en Ethiqia Score.`,
        'score',
      );
    } catch (err) {
      console.error(err);
      pushNotification(
        'La imagen se ha analizado, pero hubo un error al guardar la publicación.',
        'error',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <NotificationsBar />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-16 pt-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Ethiqia · Demo Live</h1>
          <p className="text-sm text-slate-400">
            Sube una imagen, la IA calcula un Ethiqia Score simulado y se guarda
            como publicación local en tu Bio y en el Feed (solo en este
            navegador).
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-[2fr,3fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Sube una imagen
            </h2>
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300">
              <span>Haz clic para seleccionar una imagen</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {isProcessing && (
              <p className="mt-3 text-xs text-emerald-300">
                Analizando imagen y generando Ethiqia Score…
              </p>
            )}
          </div>

          <div className="space-y-4">
            {imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60">
                <div className="relative h-64 w-full">
                  <Image
                    src={imageUrl}
                    alt="Previsualización"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="border-t border-slate-700 p-3 text-[11px] text-slate-400">
                  Esta imagen se ha guardado como una publicación demo en tu
                  perfil.
                </div>
              </div>
            )}

            {analysis && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Resultado del análisis (demo local)
                </h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-black/40 px-3 py-2">
                    <div className="text-slate-400">Ethiqia Score</div>
                    <div className="text-lg font-semibold text-emerald-300">
                      {analysis.ethScore}/100
                    </div>
                  </div>
                  <div className="rounded-xl bg-black/40 px-3 py-2">
                    <div className="text-slate-400">
                      Probabilidad de IA (estimada)
                    </div>
                    <div className="text-sm">{analysis.aiProbability}%</div>
                  </div>
                  <div className="rounded-xl bg-black/40 px-3 py-2">
                    <div className="text-slate-400">Autenticidad</div>
                    <div className="text-sm">{analysis.authenticity}%</div>
                  </div>
                  <div className="rounded-xl bg-black/40 px-3 py-2">
                    <div className="text-slate-400">Coherencia</div>
                    <div className="text-sm">{analysis.coherence}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
