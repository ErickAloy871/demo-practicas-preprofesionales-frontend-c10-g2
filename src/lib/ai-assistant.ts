export interface AiAnalysisResult {
  score: number
  level: 'Bajo' | 'Aceptable' | 'Profesional'
  approvalProbability: number
  feedback: string
  competencies: string[]
  suggestions: string[]
}

const DOMAIN_PATTERNS: Array<{
  keywords: RegExp
  competency: string
  templates: string[]
}> = [
  {
    keywords: /\b(prueba|test|qa|bug|error|assert|cobertura|vitest|jest|depuraci)\w*/i,
    competency: 'Aseguramiento de Calidad y Testing',
    templates: [
      'Diseño y ejecución de suite de pruebas automatizadas, garantizando cobertura de código y verificación de criterios de aceptación.',
      'Detección sistemática y resolución de anomalías (debugging), verificando la consistencia de estados y mitigando regresiones.',
    ],
  },
  {
    keywords: /\b(frontend|ui|ux|interfaz|componente|css|estilo|vista|pantalla|react|tailwind|html)\w*/i,
    competency: 'Desarrollo Frontend y UX/UI',
    templates: [
      'Construcción y refinamiento de componentes reactivos con arquitectura modular, diseño responsivo y cumplimiento de accesibilidad.',
      'Implementación de flujos interactivos de usuario optimizando la jerarquía visual y la consistencia del sistema de diseño.',
    ],
  },
  {
    keywords: /\b(backend|api|endpoint|servicio|controlador|servidor|ruta|controller|service)\w*/i,
    competency: 'Arquitectura Backend y Servicios',
    templates: [
      'Implementación de endpoints RESTful con validación estricta de esquemas, desacoplamiento de capas y manejo robusto de excepciones.',
      'Optimización de lógica de negocio y arquitectura de servicios para comunicación asíncrona y procesamiento confiable.',
    ],
  },
  {
    keywords: /\b(base de datos|bd|db|sql|postgres|mysql|migraci|tabla|dexie|indexeddb|repositorio)\w*/i,
    competency: 'Gestión y Modelado de Datos',
    templates: [
      'Diseño y optimización de esquemas de datos relacionales, garantizando integridad referencial, índices eficientes y persistencia resiliente.',
      'Implementación de mecanismos de almacenamiento local y sincronización transaccional con control de versiones de datos.',
    ],
  },
  {
    keywords: /\b(documentaci|reuni|scrum|sprint|planifi|requerimiento|analisis|especificaci)\w*/i,
    competency: 'Gestión Ágil y Análisis de Requisitos',
    templates: [
      'Levantamiento y análisis técnico de requerimientos funcionales, documentación de especificaciones y alineación en ceremonias ágiles.',
      'Elaboración de diagramas de flujo y matrices de trazabilidad para la validación de entregables del sprint.',
    ],
  },
]

export function analyzeActivity(rawText: string): AiAnalysisResult {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return {
      score: 0,
      level: 'Bajo',
      approvalProbability: 10,
      feedback: 'Ingresa una descripción para evaluarla.',
      competencies: [],
      suggestions: [],
    }
  }

  const wordCount = trimmed.split(/\s+/).length
  const matchedDomains = DOMAIN_PATTERNS.filter((domain) => domain.keywords.test(trimmed))

  const competencies = Array.from(
    new Set(
      matchedDomains.length > 0
        ? matchedDomains.map((d) => d.competency)
        : ['Ingeniería de Software y Desarrollo Profesional'],
    ),
  )

  let baseScore = Math.min(wordCount * 8, 45)
  if (matchedDomains.length > 0) baseScore += 35
  if (/[A-ZÁÉÍÓÚ]/.test(trimmed)) baseScore += 5
  if (/[.;:]$/.test(trimmed)) baseScore += 5
  if (wordCount >= 12) baseScore += 10

  const score = Math.min(Math.max(baseScore, 20), 100)

  let level: 'Bajo' | 'Aceptable' | 'Profesional' = 'Bajo'
  let feedback = 'Descripción demasiado breve o informal. Se recomienda enriquecer con objetivos y terminología técnica.'
  let approvalProbability = Math.min(score, 60)

  if (score >= 80) {
    level = 'Profesional'
    feedback = 'Excelente redacción técnica. Cumple plenamente con los estándares académicos y de auditoría.'
    approvalProbability = 98
  } else if (score >= 55) {
    level = 'Aceptable'
    feedback = 'Comprensible pero puede formalizarse con verbos de acción y detalles del impacto del entregable.'
    approvalProbability = 82
  }

  const suggestions: string[] = []
  for (const domain of matchedDomains) {
    suggestions.push(...domain.templates)
  }

  if (suggestions.length === 0) {
    const cleaned = trimmed.charAt(0).toLowerCase() + trimmed.slice(1).replace(/[.]+$/, '')
    suggestions.push(
      `Desarrollo sistemático y validación técnica orientada a: ${cleaned}, garantizando la calidad y los estándares del proyecto.`,
      `Ejecución de tareas operativas de ingeniería y verificación de requerimientos en: ${cleaned}.`,
    )
  }

  return {
    score,
    level,
    approvalProbability,
    feedback,
    competencies,
    suggestions: suggestions.slice(0, 2),
  }
}
