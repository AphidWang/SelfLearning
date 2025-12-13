/**
 * 表單驗證 schemas
 * 針對不同表單的驗證規則
 */

import * as yup from 'yup';
import { nameSchema, emailSchema, passwordSchema, requiredTextSchema } from './common';

/**
 * 學生註冊/登入表單
 */
export const studentAuthSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/**
 * 學生資料更新表單
 */
export const studentProfileSchema = yup.object({
  name: nameSchema,
  nickname: yup
    .string()
    .trim()
    .max(20, '暱稱不能超過 20 個字')
    .default(''),
});

/**
 * 課程紀錄表單
 */
export const courseRecordSchema = yup.object({
  studentId: requiredTextSchema,
  date: yup
    .date()
    .required('請選擇日期')
    .default(new Date()),
  content: yup
    .string()
    .trim()
    .min(10, '內容至少要 10 個字')
    .required('請輸入課程內容')
    .default(''),
  notes: yup
    .string()
    .trim()
    .default(''),
});

/**
 * 訊息表單
 */
export const messageSchema = yup.object({
  recipientId: requiredTextSchema,
  subject: yup
    .string()
    .trim()
    .max(50, '標題不能超過 50 個字')
    .required('請輸入標題')
    .default(''),
  content: yup
    .string()
    .trim()
    .min(10, '內容至少要 10 個字')
    .required('請輸入訊息內容')
    .default(''),
});

