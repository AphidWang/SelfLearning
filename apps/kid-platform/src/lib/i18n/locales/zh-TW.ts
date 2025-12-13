/**
 * 繁體中文語言包
 * 整合所有字串定義
 */

import { commonStrings } from '../strings/common';
import { studentStrings } from '../strings/student';
import { teacherStrings } from '../strings/teacher';
import { coachStrings } from '../strings/coach';

export const zhTW = {
  common: commonStrings,
  student: studentStrings,
  teacher: teacherStrings,
  coach: coachStrings,
};

export type LocaleStrings = typeof zhTW;

