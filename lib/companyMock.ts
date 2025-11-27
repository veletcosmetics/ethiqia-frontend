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

export interface CompanyData {
  name: string;
  logo?: string;
  score: number;
  verified: boolean;
  sector: string;
  country: string;
  apis: string[];
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

  // 🔹 APIs alineadas con Velet (sin confundir evidencias con API externa)
  apis: [
    "API de Ventas B2B (pedidos profesionales y distribuidores)",
    "API de Clientes Activos y Recurrencia",
    "API de Impacto en Piel Sensible y Programas Oncológicos (sesiones registradas)",
    "API de Formación Profesional en Centros y Clínicas",
    "API de Soporte Técnico y Reclamaciones (tiempos de respuesta y resolución)",
    "API de Documentación Regulatoria (AEMPS / CPNP / FDA / PETA) basada en evidencias subidas"
  ],

  scoreBreakdown: [
    { label: "Confianza en clientes B2B", value: 88 },
    { label: "Trayectoria y actividad comercial", value: 81 },
    { label: "Impacto social (línea oncológica / piel sensible)", value: 90 },
    { label: "Sostenibilidad y envases", value: 79 },
    { label: "Cumplimiento regulatorio (AEMPS, CPNP, FDA, PETA)", value: 87 }
  ],

  kpiMetrics: [
    {
      label: "Clínicas y centros activos",
      value: "63",
      helper: "Clientes profesionales trabajando con Velet"
    },
    {
      label: "Pacientes beneficiados (piel sensible / onco)",
      value: "120+",
      helper: "Programas con clínicas y centros especializados"
    },
    {
      label: "Productos registrados CPNP",
      value: "18",
      helper: "Portafolio profesional en Europa"
    },
    {
      label: "Productos registrados FDA",
      value: "6",
      helper: "Acceso regulado a mercado USA"
    }
  ],

  certifications: [
    {
      title: "Laboratorio Cosmético Autorizado – AEMPS",
      date: "2024-03-10",
      points: 1.8,
      hasEvidence: true,
      evidenceDescription:
        "Resolución oficial de la AEMPS que acredita a Velet como laboratorio cosmético autorizado."
    },
    {
      title: "Productos Registrados en CPNP – Europa",
      date: "2024-06-22",
      points: 1.2,
      hasEvidence: true,
      evidenceDescription:
        "Listado de productos Velet incluidos en el CPNP con nº de referencia y responsable de seguridad."
    },
    {
      title: "Registros en FDA Cosmetics Direct – USA",
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
        "Certificado PETA que acredita que Velet no utiliza ingredientes de origen animal ni test en animales."
    }
  ],

  activity: [
    {
      type: "reg",
      title: "Actualización de registros en FDA Cosmetics Direct – USA",
      date: "2025-01-05",
      points: 0.8
    },
    {
      type: "sale",
      title: "Venta verificada a Clínica VitalDerm",
      date: "2025-01-12",
      points: 0.4
    },
    {
      type: "esg",
      title: "Programa piel sensible / oncológica – 120 pacientes beneficiados",
      date: "2025-01-20",
      points: 1.8
    },
    {
      type: "visit",
      title: "Formación profesional – Centro Estética Avanzada Elena",
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
      text: "La línea para piel sensible y oncológica de Velet es la mejor que hemos probado. Seguridad y resultados excepcionales.",
      ticketVerified: true,
      response:
        "Gracias por compartir vuestra experiencia. Seguimos mejorando día a día.",
      date: "2025-01-19"
    },
    {
      user: "Estética Avanzada Elena",
      rating: 4,
      text: "Productos de altísima calidad. El soporte podría responder un poco más rápido, pero muy recomendable.",
      ticketVerified: true,
      response:
        "Gracias Elena. Mejoramos nuestros tiempos de soporte. Agradecemos tu sinceridad.",
      date: "2025-01-26"
    },
    {
      user: "María S.",
      rating: 5,
      text: "Atención impecable y productos increíbles. Recomiendo especialmente la línea para piel sensible.",
      ticketVerified: true,
      response:
        "Gracias María por tu confianza. ¡Nos alegra que tu experiencia fuera excelente!",
      date: "2025-01-03"
    }
  ]
};
