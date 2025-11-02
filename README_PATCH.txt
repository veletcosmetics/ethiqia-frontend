# Patch: 4 mejoras para Ethiqia Frontend
Incluye:
1) robots.txt (no indexar)
2) Mostrar usuario + Ethiqia Score en cabecera
3) Página de perfil
4) Moderación IA previa a publicar
5) Modo preview con contraseña (middleware + var NEXT_PUBLIC_PREVIEW_PASSWORD)

## Variables en Render (Frontend)
- NEXT_PUBLIC_API_BASE = https://ethiqia-backend.onrender.com
- NEXT_PUBLIC_PREVIEW_PASSWORD = la_clave_que_quieras (opcional)

## Pasos para aplicar
1. Descomprime este ZIP dentro de tu repo local `ethiqia-frontend`, sobrescribiendo archivos.
2. git add .
3. git commit -m "feat: UI score + profile + moderation + preview guard"
4. git push
5. En Render: Clear build cache & Redeploy
