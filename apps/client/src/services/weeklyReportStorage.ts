interface SubjectData {
  id: string;
  subject: string;
  topic: string;
  goals: string[];
  extraGoals: string[];
  plannedSessions: number;
  difficulty: number; // 0-5
  efficiency: number; // 0-5
  focus: number; // 0-5
  mood: string;
  completedSessions: number;
}

interface WeeklyReportData {
  subjects: SubjectData[];
  lastUpdated: string;
  version: string;
}

class WeeklyReportStorageService {
  private readonly STORAGE_KEY = 'weekly-progress-report';
  private readonly VERSION = '1.0.0';

  // 預設資料
  private getDefaultData(): WeeklyReportData {
    return {
      subjects: [
        {
          id: '1',
          subject: '國語',
          topic: '寫作',
          goals: ['150 字的遊記'],
          extraGoals: [''],
          plannedSessions: 2,
          difficulty: 0,
          efficiency: 0,
          focus: 0,
          mood: '',
          completedSessions: 0
        },
        {
          id: '2',
          subject: '英文',
          topic: '單字',
          goals: ['學習五個單字', '用學習的單字造句'],
          extraGoals: [''],
          plannedSessions: 2,
          difficulty: 0,
          efficiency: 0,
          focus: 0,
          mood: '',
          completedSessions: 0
        },
        {
          id: '3',
          subject: '閩南語',
          topic: '',
          goals: [''],
          extraGoals: [''],
          plannedSessions: 3,
          difficulty: 0,
          efficiency: 0,
          focus: 0,
          mood: '',
          completedSessions: 0
        },
        {
          id: '4',
          subject: '數學',
          topic: '',
          goals: [''],
          extraGoals: [''],
          plannedSessions: 3,
          difficulty: 0,
          efficiency: 0,
          focus: 0,
          mood: '',
          completedSessions: 0
        },
        {
          id: '5',
          subject: '自然',
          topic: '',
          goals: [''],
          extraGoals: [''],
          plannedSessions: 6,
          difficulty: 0,
          efficiency: 0,
          focus: 0,
          mood: '',
          completedSessions: 0
        },
        {
          id: '6',
          subject: '社會',
          topic: '',
          goals: [''],
          extraGoals: [''],
          plannedSessions: 4,
          difficulty: 0,
          efficiency: 0,
          focus: 0,
          mood: '',
          completedSessions: 0
        },
        {
          id: '7',
          subject: '資訊',
          topic: '',
          goals: [''],
          extraGoals: [''],
          plannedSessions: 1,
          difficulty: 0,
          efficiency: 0,
          focus: 0,
          mood: '',
          completedSessions: 0
        },
        {
          id: '8',
          subject: '藝術日',
          topic: '',
          goals: [''],
          extraGoals: [''],
          plannedSessions: 6,
          difficulty: 0,
          efficiency: 0,
          focus: 0,
          mood: '',
          completedSessions: 0
        }
      ],
      lastUpdated: new Date().toISOString(),
      version: this.VERSION
    };
  }

  // 載入資料
  async loadData(): Promise<SubjectData[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        // 第一次使用，返回預設資料
        const defaultData = this.getDefaultData();
        await this.saveData(defaultData.subjects);
        return defaultData.subjects;
      }

      const parsed: WeeklyReportData = JSON.parse(stored);
      
      // 檢查版本兼容性
      if (parsed.version !== this.VERSION) {
        console.warn('資料版本不匹配，使用預設資料');
        const defaultData = this.getDefaultData();
        await this.saveData(defaultData.subjects);
        return defaultData.subjects;
      }

      // 資料遷移：確保新欄位存在
      const migratedSubjects = parsed.subjects.map(subject => ({
        ...subject,
        extraGoals: subject.extraGoals || [''],
        // 將舊版字串型別轉為數字，缺失時給 0
        difficulty: Math.max(0, Math.min(5, typeof (subject as any).difficulty === 'number' ? (subject as any).difficulty : parseInt((subject as any).difficulty || '0') || 0)),
        efficiency: Math.max(0, Math.min(5, typeof (subject as any).efficiency === 'number' ? (subject as any).efficiency : parseInt((subject as any).efficiency || '0') || 0)),
        focus: Math.max(0, Math.min(5, typeof (subject as any).focus === 'number' ? (subject as any).focus : parseInt((subject as any).focus || '0') || 0)),
        mood: (subject as any).mood || ''
      }));

      return migratedSubjects;
    } catch (error) {
      console.error('載入週報資料失敗:', error);
      // 出錯時返回預設資料
      const defaultData = this.getDefaultData();
      return defaultData.subjects;
    }
  }

  // 儲存資料
  async saveData(subjects: SubjectData[]): Promise<void> {
    try {
      const data: WeeklyReportData = {
        subjects,
        lastUpdated: new Date().toISOString(),
        version: this.VERSION
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('儲存週報資料失敗:', error);
      throw new Error('儲存失敗，請稍後再試');
    }
  }

  // 清除資料
  async clearData(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('清除週報資料失敗:', error);
      throw new Error('清除失敗');
    }
  }

  // 匯出資料
  async exportData(): Promise<WeeklyReportData | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('匯出週報資料失敗:', error);
      return null;
    }
  }

  // 匯入資料
  async importData(data: WeeklyReportData): Promise<void> {
    try {
      // 驗證資料格式
      if (!data.subjects || !Array.isArray(data.subjects)) {
        throw new Error('無效的資料格式');
      }

      // 更新版本和時間戳
      data.version = this.VERSION;
      data.lastUpdated = new Date().toISOString();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('匯入週報資料失敗:', error);
      throw new Error('匯入失敗，資料格式錯誤');
    }
  }

  // 獲取最後更新時間
  async getLastUpdated(): Promise<string | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const parsed: WeeklyReportData = JSON.parse(stored);
      return parsed.lastUpdated;
    } catch (error) {
      console.error('獲取更新時間失敗:', error);
      return null;
    }
  }
}

// 導出單例實例
export const weeklyReportStorage = new WeeklyReportStorageService();
export type { SubjectData, WeeklyReportData };
