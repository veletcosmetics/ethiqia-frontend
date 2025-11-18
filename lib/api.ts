// lib/api.ts

export function getBase() {
  // URL base de la API de Ethiqia
  // En producción puedes definir NEXT_PUBLIC_API_BASE en Render
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
}
