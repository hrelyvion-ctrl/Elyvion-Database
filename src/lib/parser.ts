// Smart resume parser — extracts structured data from raw text
export interface ParsedResume {
  name: string
  email: string
  phone: string
  skills: string[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
  summary: string
  experienceYears: number
}

export interface ExperienceEntry {
  title: string
  company: string
  duration: string
  description: string
}

export interface EducationEntry {
  degree: string
  institution: string
  year: string
}

const SKILL_KEYWORDS = [
  // Languages
  'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','Ruby','PHP','Swift','Kotlin','R','Scala','Dart',
  // Frontend
  'React','Next.js','Vue','Angular','Svelte','HTML','CSS','SASS','Tailwind','Bootstrap','jQuery','Redux','GraphQL',
  // Backend
  'Node.js','Express','FastAPI','Django','Flask','Spring','Laravel','NestJS','Fastify',
  // Databases
  'SQL','MySQL','PostgreSQL','MongoDB','Redis','SQLite','Cassandra','DynamoDB','Firebase','Supabase',
  // Cloud / DevOps
  'AWS','GCP','Azure','Docker','Kubernetes','Terraform','CI/CD','Jenkins','GitHub Actions','Linux','Nginx',
  // ML / Data
  'TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','Jupyter','Machine Learning','Deep Learning','NLP','Data Science',
  // Tools
  'Git','REST','Microservices','Agile','Scrum','Figma','Jira','Postman','VS Code',
]

export function parseResume(rawText: string): ParsedResume {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const text = rawText

  return {
    name: extractName(lines),
    email: extractEmail(text),
    phone: extractPhone(text),
    skills: extractSkills(text),
    experience: extractExperience(lines),
    education: extractEducation(lines),
    summary: extractSummary(lines),
    experienceYears: extractExperienceYears(text),
  }
}

function extractName(lines: string[]): string {
  // Name is usually in the first 8 non-empty lines, all caps or title case, no special chars
  for (const line of lines.slice(0, 10)) {
    const cleaned = line.trim()
    if (
      cleaned.length > 3 &&
      cleaned.length < 50 &&
      /^[A-Za-z\s.\-']+$/.test(cleaned) &&
      !/^(resume|curriculum|vitae|cv|page|email|phone|contact|address|mobile|summary|objective|academic|profile|personal\s*details)/i.test(cleaned) &&
      !cleaned.includes('@') &&
      !/\d/.test(cleaned)
    ) {
      return toTitleCase(cleaned)
    }
  }
  
  // Backup: Try to find name line before the email line if not found
  const emailIdx = lines.findIndex(l => l.includes('@'))
  if (emailIdx > 0) {
    for (let i = emailIdx - 1; i >= Math.max(0, emailIdx - 3); i--) {
        const line = lines[i].trim()
        if (line.length > 3 && line.length < 50 && /^[A-Za-z\s.\-']+$/.test(line) && !/\d/.test(line)) {
            return toTitleCase(line)
        }
    }
  }

  return 'Unknown'
}

function extractEmail(text: string): string {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/i)
  return match ? match[0].toLowerCase() : ''
}

function extractPhone(text: string): string {
  const match = text.match(/(\+?\d[\d\s\-().]{7,16}\d)/)
  return match ? match[0].replace(/\s+/g, ' ').trim() : ''
}

function extractSkills(text: string): string[] {
  const found = new Set<string>()
  const lower = text.toLowerCase()
  for (const skill of SKILL_KEYWORDS) {
    if (lower.includes(skill.toLowerCase())) {
      found.add(skill)
    }
  }
  // Also try to find skills section
  const skillSectionMatch = text.match(/skills?[:\s]+([^\n]{10,200})/i)
  if (skillSectionMatch) {
    const raw = skillSectionMatch[1]
    raw.split(/[,|•·\t]/).forEach(s => {
      const cleaned = s.trim().replace(/[^\w\s.#+]/g, '').trim()
      if (cleaned.length > 1 && cleaned.length < 30) found.add(cleaned)
    })
  }
  return Array.from(found).slice(0, 30)
}

function extractExperience(lines: string[]): ExperienceEntry[] {
  const experiences: ExperienceEntry[] = []
  let inSection = false
  let current: Partial<ExperienceEntry> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()

    if (/^(work\s*experience|experience|employment|professional\s*background)/i.test(lower)) {
      inSection = true
      continue
    }
    if (inSection && /^(education|skills|projects|certifications|awards)/i.test(lower)) {
      inSection = false
      if (current.title) experiences.push(current as ExperienceEntry)
      current = {}
    }
    if (inSection) {
      const dateMatch = line.match(/(\d{4})\s*[-–to]+\s*(\d{4}|present|current)/i)
      if (dateMatch) {
        if (current.title) experiences.push(current as ExperienceEntry)
        current = { duration: dateMatch[0], description: '' }
        const titleLine = lines[i - 1] || ''
        const parts = titleLine.split(/\s+at\s+|\s+@\s+|,\s*/i)
        current.title = parts[0]?.trim() || titleLine
        current.company = parts[1]?.trim() || ''
      } else if (current.duration && !current.company && /^[A-Z]/.test(line)) {
        current.company = line
      } else if (current.duration) {
        current.description = ((current.description || '') + ' ' + line).trim()
      }
    }
  }
  if (current.title) experiences.push(current as ExperienceEntry)
  return experiences.slice(0, 6)
}

function extractEducation(lines: string[]): EducationEntry[] {
  const education: EducationEntry[] = []
  let inSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^education/i.test(line)) { inSection = true; continue }
    if (inSection && /^(experience|skills|projects|work)/i.test(line)) inSection = false
    if (inSection) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/)
      const degreeParts = line.match(/(bachelor|master|phd|b\.?sc|m\.?sc|b\.?e|m\.?e|b\.?tech|m\.?tech|mba|associate)/i)
      if (degreeParts || yearMatch) {
        education.push({
          degree: line,
          institution: lines[i + 1] || '',
          year: yearMatch ? yearMatch[0] : '',
        })
      }
    }
  }
  return education.slice(0, 4)
}

function extractSummary(lines: string[]): string {
  const summaryIdx = lines.findIndex(l => /^(summary|objective|profile|about)/i.test(l))
  if (summaryIdx !== -1) {
    return lines.slice(summaryIdx + 1, summaryIdx + 5).join(' ').slice(0, 500)
  }
  return lines.slice(0, 3).join(' ').slice(0, 300)
}

function extractExperienceYears(text: string): number {
  // Priority 1: Direct summary mentions (e.g. "12+ years", "5 years of exp")
  const summaryMatch = text.match(/(\d+\.?\d*)\+?\s*years?\s*(of\s*)?(experience|exp|professional\s*exp)/i)
  if (summaryMatch) return parseFloat(summaryMatch[1])
  
  // Priority 2: Count year ranges from 1990 onwards (ignoring older/irrelevant dates)
  const currentYear = 2026
  const yearMatches = text.match(/\b(20\d{2}|199\d{1})\b/g)
  if (yearMatches && yearMatches.length >= 2) {
    const years = yearMatches.map(Number).filter(y => y <= currentYear).sort()
    // Find the earliest professional-looking year (after 20 or 21 if it's a recent resume)
    // For now, take the range but clamp to 30
    const range = Math.max(0, years[years.length - 1] - years[0])
    return Math.min(range, 30)
  }
  
  return 0
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}
