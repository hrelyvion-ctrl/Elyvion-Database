// Shared TypeScript types across the app
export interface Resume {
  id: number
  filename: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  raw_text: string
  parsed_name: string
  parsed_email: string
  parsed_phone: string
  parsed_skills: string   // JSON array string
  parsed_experience: string  // JSON array string
  parsed_education: string   // JSON array string
  parsed_summary: string
  experience_years: number
  status: 'new' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
  rating: number
  tags: string  // JSON array string
  notes: string
  uploaded_at: string
  updated_at: string
}

export interface ResumeWithParsed extends Omit<Resume, 'parsed_skills' | 'parsed_experience' | 'parsed_education' | 'tags'> {
  parsed_skills: string[]
  parsed_experience: ExperienceEntry[]
  parsed_education: EducationEntry[]
  tags: string[]
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

export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

export interface AnalyticsData {
  total: number
  new_count: number
  shortlisted: number
  rejected: number
  hired: number
  top_skills: { skill: string; count: number }[]
  by_experience: { range: string; count: number }[]
  recent_uploads: { date: string; count: number }[]
  avg_rating: number
}

export type SortField = 'uploaded_at' | 'parsed_name' | 'experience_years' | 'rating'
export type SortOrder = 'asc' | 'desc'
export type StatusFilter = 'all' | 'new' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'

export function parseResumeJson(resume: Resume): ResumeWithParsed {
  return {
    ...resume,
    parsed_skills: safeJsonParse(resume.parsed_skills, []),
    parsed_experience: safeJsonParse(resume.parsed_experience, []),
    parsed_education: safeJsonParse(resume.parsed_education, []),
    tags: safeJsonParse(resume.tags, []),
  }
}

function safeJsonParse<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) } catch { return fallback }
}
