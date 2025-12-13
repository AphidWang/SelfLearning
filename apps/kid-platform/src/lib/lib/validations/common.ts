/**
 * 通用驗證 schemas
 * 使用 yup 定義
 */

import * as yup from 'yup';

/**
 * 名字驗證（小朋友友善的錯誤訊息）
 */
export const nameSchema = yup
  .string()
  .trim()
  .min(2, '名字至少要 2 個字喔！')
  .max(20, '名字不能超過 20 個字')
  .required('請告訴我你的名字～')
  .default('');

/**
 * 電子郵件驗證
 */
export const emailSchema = yup
  .string()
  .trim()
  .email('請輸入有效的電子郵件地址')
  .required('請輸入電子郵件')
  .default('');

/**
 * 密碼驗證
 */
export const passwordSchema = yup
  .string()
  .min(6, '密碼至少要 6 個字')
  .required('請輸入密碼')
  .default('');

/**
 * 必填文字驗證
 */
export const requiredTextSchema = yup
  .string()
  .trim()
  .required('這是必填欄位')
  .default('');

/**
 * 選填文字驗證
 */
export const optionalTextSchema = yup
  .string()
  .trim()
  .default('');
