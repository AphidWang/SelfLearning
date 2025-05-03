export const SUBJECTS = {
  CHINESE: '國語',
  ENGLISH: '英語',
  MATH: '數學',
  SCIENCE: '自然',
  SOCIAL: '社會',
  ARTS: '藝術',
  PE: '體育',
  CUSTOM: '自訂'
} as const;

export type SubjectType = typeof SUBJECTS[keyof typeof SUBJECTS]; 