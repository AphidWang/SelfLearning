/**
 * 科目常數定義
 * 未來可擴充為使用者可自訂
 */

export const SUBJECTS = {
  CHINESE: '國語',
  ENGLISH: '英語',
  MATH: '數學',
  SCIENCE: '自然',
  SOCIAL: '社會',
  ARTS: '藝術',
  PE: '體育',
  CUSTOM: '自訂',
} as const;

export type SubjectType = typeof SUBJECTS[keyof typeof SUBJECTS];

/**
 * 科目顏色映射
 * 未來可擴充為使用者可自訂
 */
export const SUBJECT_COLORS: Record<SubjectType, string> = {
  國語: '#3B82F6', // blue
  英語: '#06B6D4', // cyan
  數學: '#F97316', // orange
  自然: '#10B981', // emerald
  社會: '#F59E0B', // amber
  藝術: '#D946EF', // fuchsia
  體育: '#E11D48', // rose
  自訂: '#8B5CF6', // violet
};

/**
 * 取得科目顏色
 */
export function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject as SubjectType] || SUBJECT_COLORS.自訂;
}

/**
 * 取得所有科目選項
 */
export function getSubjectOptions(): Array<{ value: SubjectType; label: string; color: string }> {
  return Object.values(SUBJECTS).map((subject) => ({
    value: subject,
    label: subject,
    color: SUBJECT_COLORS[subject],
  }));
}
