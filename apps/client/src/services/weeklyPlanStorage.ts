// 週計劃的數據結構

export interface PlanItem {
  id: string;
  subject: string;
  goal: string;
  task?: string;  // 任務
  backgroundColor?: string;  // 背景色 (hex, 不含 #)
}

export interface DaySlot {
  items: PlanItem[];
}

export interface DaySchedule {
  clubBefore: DaySlot;    // 上午前的社團活動
  morning: DaySlot;       // 上午
  afternoon: DaySlot;     // 下午
  clubAfter: DaySlot;     // 下午後的社團活動
  noteAfter: DaySlot;     // 下午後的小紀錄（每日紀錄）
}

export interface WeeklyPlan {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface ImportantEvent {
  id: string;
  title: string;
  current?: number;   // 當前進度
  total?: number;     // 總進度
}

export interface WeeklyPlanData {
  weeklyPlan: WeeklyPlan;
  importantEvents: ImportantEvent[];
  lastUpdated: string;
  version: string;
}

class WeeklyPlanStorageService {
  private readonly STORAGE_KEY = 'weekly-plan-v2';
  private readonly VERSION = '2.1.0';

  private createEmptySlot(): DaySlot {
    return {
      items: [{ id: this.generateId(), subject: '', goal: '', task: '', backgroundColor: 'ffffff' }]
    };
  }

  private createEmptyDay(): DaySchedule {
    return {
      clubBefore: this.createEmptySlot(),
      morning: this.createEmptySlot(),
      afternoon: this.createEmptySlot(),
      clubAfter: this.createEmptySlot(),
      noteAfter: this.createEmptySlot()
    };
  }

  private createEmptyWeeklyPlan(): WeeklyPlan {
    return {
      monday: this.createEmptyDay(),
      tuesday: this.createEmptyDay(),
      wednesday: this.createEmptyDay(),
      thursday: this.createEmptyDay(),
      friday: this.createEmptyDay(),
      saturday: this.createEmptyDay(),
      sunday: this.createEmptyDay()
    };
  }

  private generateId(): string {
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 確保每個 slot 至少有一個空行
  private ensureEmptyLine(slot: DaySlot): DaySlot {
    const items = [...slot.items];
    // 如果最後一個項目不是空的，或沒有項目，則添加一個空項目
    const lastItem = items[items.length - 1];
    if (!lastItem || (lastItem.subject && lastItem.goal && lastItem.task)) {
      items.push({ id: this.generateId(), subject: '', goal: '', task: '', backgroundColor: 'ffffff' });
    }
    return { items };
  }

  // 預設資料
  private getDefaultData(): WeeklyPlanData {
    return {
      weeklyPlan: this.createEmptyWeeklyPlan(),
      importantEvents: [],
      lastUpdated: new Date().toISOString(),
      version: this.VERSION
    };
  }

  // 載入資料
  async loadData(): Promise<WeeklyPlanData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        const defaultData = this.getDefaultData();
        await this.saveData(defaultData);
        return defaultData;
      }

      const parsed: WeeklyPlanData = JSON.parse(stored);
      
      // 遷移舊數據，確保所有項目都有新欄位
      const migrateItems = (items: any[]) => {
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => ({
          id: item.id || this.generateId(),
          subject: item.subject || '',
          goal: item.goal || '',
          task: item.task || '',
          backgroundColor: item.backgroundColor || 'ffffff'
        }));
      };

      const migrateDay = (day: any): DaySchedule => {
        if (!day) {
          return this.createEmptyDay();
        }
        return {
          clubBefore: { items: migrateItems(day.clubBefore?.items || []) },
          morning: { items: migrateItems(day.morning?.items || []) },
          afternoon: { items: migrateItems(day.afternoon?.items || []) },
          clubAfter: { items: migrateItems(day.clubAfter?.items || []) },
          noteAfter: { items: migrateItems(day.noteAfter?.items || []) }
        };
      };

      // 確保所有 slot 都有至少一個空行
      const ensureEmptyLines = (day: DaySchedule): DaySchedule => ({
        clubBefore: this.ensureEmptyLine(day.clubBefore),
        morning: this.ensureEmptyLine(day.morning),
        afternoon: this.ensureEmptyLine(day.afternoon),
        clubAfter: this.ensureEmptyLine(day.clubAfter),
        noteAfter: this.ensureEmptyLine(day.noteAfter)
      });

      // 檢查版本 - 如果版本不匹配，進行資料遷移
      const needsMigration = !parsed.version || parsed.version !== this.VERSION;
      
      if (needsMigration) {
        console.warn(`資料版本不匹配 (${parsed.version || 'unknown'} -> ${this.VERSION})，進行資料遷移`);
      }

      const migratedData: WeeklyPlanData = {
        weeklyPlan: {
          monday: ensureEmptyLines(migrateDay(parsed.weeklyPlan?.monday)),
          tuesday: ensureEmptyLines(migrateDay(parsed.weeklyPlan?.tuesday)),
          wednesday: ensureEmptyLines(migrateDay(parsed.weeklyPlan?.wednesday)),
          thursday: ensureEmptyLines(migrateDay(parsed.weeklyPlan?.thursday)),
          friday: ensureEmptyLines(migrateDay(parsed.weeklyPlan?.friday)),
          saturday: ensureEmptyLines(migrateDay(parsed.weeklyPlan?.saturday)),
          sunday: ensureEmptyLines(migrateDay(parsed.weeklyPlan?.sunday))
        },
        importantEvents: Array.isArray(parsed.importantEvents) ? parsed.importantEvents : [],
        lastUpdated: new Date().toISOString(),
        version: this.VERSION
      };

      // 如果進行了遷移，立即儲存遷移後的資料
      if (needsMigration) {
        await this.saveData(migratedData);
      }

      return migratedData;
    } catch (error) {
      console.error('載入週計劃資料失敗:', error);
      const defaultData = this.getDefaultData();
      return defaultData;
    }
  }

  // 儲存資料
  async saveData(data: WeeklyPlanData): Promise<void> {
    try {
      const dataToSave: WeeklyPlanData = {
        ...data,
        lastUpdated: new Date().toISOString(),
        version: this.VERSION
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('儲存週計劃資料失敗:', error);
      throw new Error('儲存失敗，請稍後再試');
    }
  }

  // 清除資料
  async clearData(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('清除週計劃資料失敗:', error);
      throw new Error('清除失敗');
    }
  }
}

// 導出單例實例
export const weeklyPlanStorage = new WeeklyPlanStorageService();
