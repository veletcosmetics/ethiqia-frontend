{editOpen && (
  <div className="fixed inset-0 z-50 bg-black/70">
    <div className="absolute inset-0 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 flex flex-col max-h-[85vh]">
          {/* Header sticky */}
          <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 px-5 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Editar perfil</h3>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cerrar
              </button>
            </div>
          </div>

          {/* Content scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Nombre
                </label>
                <input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  @name (Ethiqia)
                </label>
                <input
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  placeholder="ej: david"
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="mt-1 text-[11px]">
                  {handleStatus === "checking" && (
                    <span className="text-neutral-400">Comprobando…</span>
                  )}
                  {handleStatus === "available" && (
                    <span className="text-emerald-300">Disponible</span>
                  )}
                  {handleStatus === "taken" && (
                    <span className="text-red-300">Ocupado</span>
                  )}
                  {handleStatus === "invalid" && (
                    <span className="text-yellow-300">
                      Inválido (3-20, a-z 0-9 _ .; empieza por letra/número)
                    </span>
                  )}
                  {handleStatus === "error" && (
                    <span className="text-red-300">Error comprobando</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Ubicación
                </label>
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Bio <span className="text-neutral-500">({editBio.length}/240)</span>
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 240))}
                  rows={3}
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Website
                </label>
                <input
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://tuweb.com"
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* SUBIDA DESDE PC */}
              <div className="sm:col-span-2 rounded-xl border border-neutral-800 bg-black p-4">
                <div className="text-xs text-neutral-400 mb-3">
                  Imágenes del perfil (subir desde tu equipo)
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">
                      Portada (cover)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickCover(e.target.files?.[0] ?? null)}
                      className="text-xs text-neutral-300"
                    />
                    <div className="mt-2 text-[11px] text-neutral-400 break-all">
                      {uploadingCover ? "Subiendo portada…" : (editCoverUrl ? `OK: ${editCoverUrl}` : "Sin portada")}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">
                      Avatar (foto de perfil)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                      className="text-xs text-neutral-300"
                    />
                    <div className="mt-2 text-[11px] text-neutral-400 break-all">
                      {uploadingAvatar ? "Subiendo avatar…" : (editAvatarUrl ? `OK: ${editAvatarUrl}` : "Sin avatar")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Instagram
                </label>
                <input
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  TikTok
                </label>
                <input
                  value={editTiktok}
                  onChange={(e) => setEditTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  LinkedIn
                </label>
                <input
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  YouTube
                </label>
                <input
                  value={editYoutube}
                  onChange={(e) => setEditYoutube(e.target.value)}
                  placeholder="https://youtube.com/@..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Footer sticky */}
          <div className="sticky bottom-0 border-t border-neutral-800 bg-neutral-950 px-5 py-4 rounded-b-2xl">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600"
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving || uploadingCover || uploadingAvatar}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-semibold text-black disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
