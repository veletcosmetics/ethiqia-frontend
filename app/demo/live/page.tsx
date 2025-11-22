'use client';

import { useState, ChangeEvent } from 'react';

export default function LiveDemoPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name || 'Imagen subida');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (!result) return;
      // Vista previa inmediata
      setImageSrc(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Demo mínima
          </p>
          <h1 className="text-2xl font-semibold">
            Test: subir imagen y ver vista previa
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Esta página es solo una prueba muy simple para comprobar que la subida
            de imagen y la vista previa funcionan correctamente en Ethiqia.
          </p>
        </header>

        {/* Subida de imagen */}
        <section className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <h2 className="text-sm font-semibold text-neutral-100">
            1. Sube una imagen
          </h2>

          <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-6 text-center text-xs text-neutral-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-300">
            <span className="text-3xl">📷</span>
            <span>
              Haz clic para elegir una imagen
              <span className="block text-[11px] text-neutral-500 mt-1">
                (solo se usa para esta vista previa)
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

        {/* Vista previa */}
        <section className="space-y-2">
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
        </section>
      </section>
    </main>
  );
}
