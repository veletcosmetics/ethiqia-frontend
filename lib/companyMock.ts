// lib/companyMock.ts

export interface ScoreBreakdownItem {
  label: string;
  value: number; // 0–100
  description?: string;
}

export interface KpiMetric {
  label: string;
  value: string;
  helper?: string;
  link?: string;
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

export interface CompanyApi {
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
  apis: CompanyApi[];
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

  // APIs con nombre + explicación corta
  apis: [
    {
      title: "API de Ventas B2B (pedidos profesionales en Velet)",
      description:
        "Envía a Ethiqia los pedidos profesionales confirmados (clínicas, centros estéticos, distribuidores) para demostrar actividad real y trayectoria comercial."
    },
    {
      title: "API de Clientes Activos y Recurrencia",
      description:
        "Permite calcular cuántos centros siguen activos y cuántos repiten pedidos, sin exponer datos sensibles. Refuerza la estabilidad y fidelidad B2B."
    },
    {
      title: "API de Impacto (visitas validadas con QR seguro)",
      description:
        "Registra visitas reales de clientes a centros verificados mediante QR antifraude. Sirve para mostrar actividad real sin necesidad de datos médicos."
    },
    {
      title: "API de Formación Profesional para Centros",
      description:
        "Registra formaciones impartidas por Velet en clínicas y centros estéticos, dando puntos por capacitación y actualización continua."
    },
    {
      title: "API de Soporte y Resolución de Incidencias",
      description:
        "Mide tiempos de respuesta y resolución de tickets B2B para premiar a Velet y a los centros que gestionan bien la postventa."
    },
    {
      title:
        "API de Documentación Regulatoria (AEMPS / CPNP / FDA / PETA) basada en evidencias",
      description:
        "No conecta con los reguladores directamente, pero registra y valida documentos oficiales subidos (autorizaciones, registros, certificados veganos, etc.)."
    }
  ],

  clinicFlows: [
    {
      title: "Compras profesionales a Velet",
      description:
        "Cada vez que una clínica compra productos profesionales de Velet, Ethiqia registra actividad real verificada. No se guardan datos médicos, solo pedidos confirmados."
    },
    {
      title: "Visitas de clientes Ethiqia",
      description:
        "Cuando un cliente valida su visita al centro mediante un QR seguro, la clínica gana actividad y el cliente suma puntos por acudir a un centro verificado."
    },
    {
      title: "Reputación estable, sin trucos",
      description:
        "Las compras y visitas mejoran estadísticas de actividad, pero el Ethiqia Score base se construye con verificación, formación, documentación y trayectoria, no inflando visitas."
    }
  ],

  scoreBreakdown: [
    { label: "Transparencia", value: 88, description: "Registros regulatorios CPNP y FDA activos y verificados" },
    { label: "Sostenibilidad", value: 79, description: "Formulacion 100% vegetal, sin testeo animal, packaging sostenible" },
    { label: "Impacto social", value: 90, description: "Cooperativa, cosmetica para piel sensible, colaboracion con UMH e IDIBE" },
    { label: "Actividad verificada", value: 81, description: "Ventas de PrestaShop integradas en tiempo real con Ethiqia" },
    { label: "Confianza B2B", value: 88, description: "Contratos activos, sede en parque cientifico UMH, acuerdo con AITEX" },
  ],

  kpiMetrics: [
    {
      label: "Registros CPNP",
      value: "18",
      helper: "Catalogo profesional para la UE"
    },
    {
      label: "Registros FDA",
      value: "6",
      helper: "Catalogo regulado en EE. UU."
    },
    {
      label: "Anos en el mercado",
      value: "7",
      helper: ""
    },
    {
      label: "Sede",
      value: "Elche · Alicante",
      helper: "Espana"
    },
    {
      label: "Web oficial",
      value: "veletcosmetics.com",
      helper: "",
      link: "https://veletcosmetics.com"
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
      response: "¡Gracias por tu comentario, María!",
      date: "2025-01-03"
    }
  ]
};
