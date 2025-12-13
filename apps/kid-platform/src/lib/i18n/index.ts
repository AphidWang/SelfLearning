/**
 * i18n 系統核心
 * 提供 useI18n hook 和字串管理功能
 */

import { zhTW, type LocaleStrings } from './locales/zh-TW';

type Locale = 'zh-TW' | 'en-US';

const locales: Partial<Record<Locale, LocaleStrings>> = {
  'zh-TW': zhTW,
  // 'en-US': enUS, // 未來擴充
};

/**
 * 取得當前語言的字串
 */
function getStrings(locale: Locale = 'zh-TW'): LocaleStrings {
  return locales[locale] || locales['zh-TW'] || zhTW;
}

/**
 * 取得巢狀字串的類型安全 helper
 */
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? ObjectType[Key] extends { [key: string]: any }
      ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
      : `${Key}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type StringPath = NestedKeyOf<LocaleStrings> | string; // 允許 string 作為 fallback

/**
 * 根據路徑取得字串
 * 例如：t('student.welcome.title') => '歡迎回來！'
 */
function getString(path: StringPath, locale: Locale = 'zh-TW'): string {
  const strings = getStrings(locale);
  const keys = path.split('.');
  
  let value: any = strings;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key as keyof typeof value];
    } else {
      console.warn(`[i18n] String path not found: ${path}`);
      return path; // 回傳路徑作為 fallback
    }
  }
  
  return typeof value === 'string' ? value : path;
}

/**
 * React Hook 用於取得翻譯函數
 * 注意：這是簡化版本，實際使用時需要 React Context
 */
export function useI18n(locale: Locale = 'zh-TW') {
  const t = (path: StringPath): string => {
    return getString(path, locale);
  };

  return {
    t,
    locale,
    strings: getStrings(locale),
  };
}

/**
 * 直接取得字串（非 React Hook）
 */
export function t(path: StringPath, locale: Locale = 'zh-TW'): string {
  return getString(path, locale);
}

