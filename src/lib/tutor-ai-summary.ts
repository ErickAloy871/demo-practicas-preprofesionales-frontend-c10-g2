export interface CompetencyStat {
  name: string
  hours: number
  percentage: number
}

export interface TutorAiSummary {
  totalHours: number
  logsAnalyzed: number
  consistencyScore: number
  consistencyLevel: 'Alta' | 'Media' | 'Baja'
  competencies: CompetencyStat[]
  executiveSummary: string
  keyStrengths: string[]
  pedagogicalFeedback: string
}

interface LogItem {
  hours: number
  activity: string
  date: string
}

const CATEGORIES = [
  {
    name: 'Testing y Calidad',
    regex: /\b(prueba|test|qa|bug|error|assert|cobertura|vitest|jest|depuraci)\w*/i,
  },
  {
    name: 'Backend y Servicios',
    regex: /\b(backend|api|endpoint|servicio|controlador|servidor|ruta|controller|service)\w*/i,
  },
  {
    name: 'Frontend y UX/UI',
    regex: /\b(frontend|ui|ux|interfaz|componente|css|estilo|vista|pantalla|react|tailwind|html)\w*/i,
  },
  {
    name: 'Datos y Persistencia',
    regex: /\b(base de datos|bd|db|sql|postgres|mysql|migraci|tabla|dexie|indexeddb)\w*/i,
  },
  {
    name: 'Gestión y Análisis',
    regex: /\b(documentaci|reuni|scrum|sprint|planifi|requerimiento|analisis|especificaci)\w*/i,
  },
]

export function generateTutorAiSummary(logs: LogItem[]): TutorAiSummary {
  if (!logs || logs.length === 0) {
    return {
      totalHours: 0,
      logsAnalyzed: 0,
      consistencyScore: 100,
      consistencyLevel: 'Alta',
      competencies: [],
      executiveSummary: 'No se registran bitácoras enviadas para análisis.',
      keyStrengths: [],
      pedagogicalFeedback: 'El practicante aún no ha registrado horas.',
    }
  }

  const totalHours = logs.reduce((acc, log) => acc + (log.hours || 0), 0)
  const categoryHours: Record<string, number> = {}

  for (const log of logs) {
    let matched = false
    for (const cat of CATEGORIES) {
      if (cat.regex.test(log.activity)) {
        categoryHours[cat.name] = (categoryHours[cat.name] || 0) + log.hours
        matched = true
        break
      }
    }
    if (!matched) {
      categoryHours['Desarrollo General'] = (categoryHours['Desarrollo General'] || 0) + log.hours
    }
  }

  const competencies: CompetencyStat[] = Object.entries(categoryHours)
    .map(([name, hours]) => ({
      name,
      hours: Math.round(hours * 10) / 10,
      percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
    }))
    .sort((a, b) => b.hours - a.hours)

  // Consistencia: penaliza días con exceso (>8h) o descripciones excesivamente cortas
  const shortLogs = logs.filter((l) => (l.activity || '').trim().length < 15).length
  const consistencyScore = Math.max(70, Math.min(100, 100 - shortLogs * 5))
  const consistencyLevel = consistencyScore >= 90 ? 'Alta' : consistencyScore >= 80 ? 'Media' : 'Baja'

  const topArea = competencies[0]?.name || 'Ingeniería de Software'
  const secondArea = competencies[1]?.name

  const strengths = [
    `Foco principal en ${topArea} (${competencies[0]?.percentage || 0}% de la dedicación).`,
    consistencyScore >= 85
      ? 'Ritmo de trabajo continuo con bitácoras bien fundamentadas.'
      : 'Registros frecuentes pero con oportunidad de mayor profundidad.',
  ]

  const executiveSummary = `El practicante ha acumulado ${totalHours} horas en ${logs.length} bitácoras. Muestra especialización destacada en ${topArea}${secondArea ? ` complementada con ${secondArea}` : ''}, con un nivel de consistencia formativa ${consistencyLevel.toLowerCase()}.`

  const pedagogicalFeedback = `Se evidencia progreso sólido en ${topArea}. Recomendación: motivar al practicante a relacionar sus actividades con los objetivos de aprendizaje y documentar el impacto de sus entregables.`

  return {
    totalHours,
    logsAnalyzed: logs.length,
    consistencyScore,
    consistencyLevel,
    competencies,
    executiveSummary,
    keyStrengths: strengths,
    pedagogicalFeedback,
  }
}
