// lib/companyMock.ts

export interface ScoreBreakdownItem {
  label: string;
  value: number; // 0–100
}

export interface KpiMetric {
  label: string;
  value: string;
  helper?: string;
}

export interface MonthlyActivityPoint {
  month: string;
  value: number; // nº de eventos validados o similar
}

export interface Certification {
  title: string;
  date: string;
  points: number;
  hasEvidence: boolean;
  evidenceDescription?: string;
}

export interface Review {
  user: string;
  rating: number;
  text: string;
  ticketVerified: boolean;
  response?: string;
  date: string;
}

export interface ActivityItem {
  type: "sale" | "esg" | "visit" | "reg";
  title: string;
  date: string;
  points: number;
}

export interface ClinicFlow {
  title: string;
  description: string;
}

export interface CompanyData {
  name: string;
  logo?: string;
  score: number;
  verified: boolean;
  sector: string;
  country: string;
  apis: string[];
  clinicFlows: ClinicFlow[];
  scoreBreakdown: ScoreBreakdownItem[];
  kpiMetrics: KpiMetric[];
  certifications: Certification[];
  activity: ActivityItem[];
  monthlyActivity: MonthlyActivityPoint[];
  reviews: Review[];
}

export const companyData: CompanyData = {
  name: "Velet Cosmetics",
  logo: "/logo-velet.png",
  score: 84.1,
  verified: true,
  sector: "Cosmética Profesional – Biotecnología – Vegana",
  country: "España",

  apis: [
    "API de Ventas B2B (pedidos profesionales en Velet)",
    "API de Clientes Activos y Recurrencia",
    "API de Impacto (visitas validadas con QR seguro)",
    "API de Formación Profesional para Centros",
    "API de Soporte y Resolución de Incidencias",
    "API de Documentación Regulatoria (AEMPS / CPNP / FDA / PETA) basada en evidencias"
  ],

  clinicFlows: [
    {
      title: "Compras profesionales a Velet",
      description:
        "Cada vez que la clínica compra productos profesionales, Ethiqia registra actividad real verificada. Sin datos sensibles, solo compras confirmadas."
    },
    {
      title: "Visitas de clientes Ethiqia",
      description:
        "Cuando un cliente valida su visita con un QR seguro, la clínica gana actividad real y el cliente suma puntos por acudir a un centro verificado."
    },
    {
      title: "Reputación estable, sin trucos",
      description:
        "Las compras y visitas mejoran estadísticas del centro, pero el Ethiqia Score se basa en verificación, formación, documentación y trayectoria."
    }
  ],

  scoreBreakdown: [
    { label: "Confianza B2B", value: 88 },
    { label: "Actividad comercial", value: 81 },
    { label: "Impacto social", value: 90 },
    { label: "Sostenibilidad", value: 79 },
    { label: "Regulación y cumplimiento", value: 87 }
  ],

  kpiMetrics: [
    {
      label: "Clínicas y centros activos",
      value: "63",
      helper: "Trabajando con Velet actualmente"
    },
    {
      label: "Pacientes beneficiados (piel sensible)",
      value: "120+",
      helper: "Programas en colaboración con clínicas"
    },
    {
      label: "Productos registrados en CPNP",
      value: "18",
      helper: "Catálogo profesional para EU"
    },
    {
      label: "Productos registrados en FDA",
      value: "6",
      helper: "Catálogo regulado en USA"
    }
  ],

  certifications: [
    {
      title: "Autorización de Laboratorio – AEMPS",
      date: "2024-03-10",
      points: 1.8,
      hasEvidence: true,
      evidenceDescription:
        "Resolución oficial de la AEMPS que acredita a Velet como laboratorio cosmético autorizado."
    },
    {
      title: "Productos registrados en CPNP",
      date: "2024-06-22",
      points: 1.2,
      hasEvidence: true,
      evidenceDescription:
        "Listado de productos Velet registrados en el portal europeo CPNP."
    },
    {
      title: "Registros en FDA Cosmetic Direct",
      date: "2024-09-03",
      points: 1.5,
      hasEvidence: true,
      evidenceDescription:
        "Registros de instalaciones y productos cosméticos enviados a FDA Cosmetics Direct."
    },
    {
      title: "Certificación Vegana – PETA",
      date: "2023-11-15",
      points: 1.3,
      hasEvidence: true,
      evidenceDescription:
        "Certificado PETA que acredita que Velet es 100% vegano y cruelty-free."
    }
  ],

  activity: [
    {
      type: "reg",
      title: "Actualización de registros FDA",
      date: "2025-01-05",
      points: 0.8
    },
    {
      type: "sale",
      title: "Venta profesional a Clínica VitalDerm",
      date: "2025-01-12",
      points: 0.4
    },
    {
      type: "esg",
      title: "Programa piel sensible – 120 pacientes",
      date: "2025-01-20",
      points: 1.8
    },
    {
      type: "visit",
      title: "Formación profesional en Centro Estética Avanzada Elena",
      date: "2025-01-25",
      points: 0.3
    }
  ],

  monthlyActivity: [
    { month: "Ene", value: 14 },
    { month: "Feb", value: 11 },
    { month: "Mar", value: 16 },
    { month: "Abr", value: 9 },
    { month: "May", value: 18 },
    { month: "Jun", value: 13 }
  ],

  reviews: [
    {
      user: "Clínica DermaPlus",
      rating: 5,
      text: "La línea para piel sensible y oncológica de Velet es excelente. Resultados muy seguros.",
      ticketVerified: true,
      response:
        "Gracias por vuestra confianza. Seguimos trabajando para mejorar cada día.",
      date: "2025-01-19"
    },
    {
      user: "Estética Avanzada Elena",
      rating: 4,
      text: "La calidad es impecable. El soporte podría responder más rápido.",
      ticketVerified: true,
      response:
        "Gracias Elena, estamos mejorando los tiempos de respuesta.",
      date: "2025-01-26"
    },
    {
      user: "María S.",
      rating: 5,
      text: "Productos espectaculares. Recomendadísimo.",
      ticketVerified: true,
      response:
        "¡Gracias por tu comentario, María!",
      date: "2025-01-03"
    }
  ]
};
