export interface ClinicFlow {
  title: string;
  description: string;
}

export interface CompanyData {
  // ...
  apis: string[];
  clinicFlows: ClinicFlow[]; // 👈 añade esta línea
  // ...
}

export const companyData: CompanyData = {
  // ...
  apis: [
    "API de Ventas B2B (pedidos profesionales y distribuidores)",
    "API de Clientes Activos y Recurrencia",
    "API de Impacto en Piel Sensible y Programas Oncológicos (sesiones registradas)",
    "API de Formación Profesional en Centros y Clínicas",
    "API de Soporte Técnico y Reclamaciones (tiempos de respuesta y resolución)",
    "API de Documentación Regulatoria (AEMPS / CPNP / FDA / PETA) basada en evidencias subidas"
  ],

  clinicFlows: [
    {
      title: "Compras profesionales a Velet",
      description:
        "Cada vez que la clínica hace un pedido profesional a Velet, Ethiqia registra actividad real y mejora la reputación del centro como clínica que trabaja con productos certificados."
    },
    {
      title: "Visitas de clientes Ethiqia",
      description:
        "Cuando un cliente valida su visita a la clínica (por QR u otro método sencillo), Ethiqia suma actividad al centro y algunos puntos al usuario por acudir a un centro verificado."
    },
    {
      title: "Reputación estable, sin truco",
      description:
        "Las compras y visitas mejoran las estadísticas del centro, pero el Ethiqia Score base se construye con datos serios: verificación, formación, documentación y trayectoria."
    }
  ],
  // ...
};
