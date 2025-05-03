export const colors = {
  indigo: {
    100: 'bg-indigo-100 dark:bg-indigo-900/30',
    500: 'bg-indigo-500 dark:bg-indigo-500',
    600: 'text-indigo-600 dark:text-indigo-400',
    border: '#4F46E5'
  },
  green: {
    100: 'bg-green-100 dark:bg-green-900/30',
    500: 'bg-green-500 dark:bg-green-500',
    600: 'text-green-600 dark:text-green-400',
    border: '#16A34A'
  },
  orange: {
    100: 'bg-orange-100 dark:bg-orange-900/30',
    500: 'bg-orange-500 dark:bg-orange-500',
    600: 'text-orange-600 dark:text-orange-400',
    border: '#EA580C'
  },
  purple: {
    100: 'bg-purple-100 dark:bg-purple-900/30',
    500: 'bg-purple-500 dark:bg-purple-500',
    600: 'text-purple-600 dark:text-purple-400',
    border: '#9333EA'
  }
};

export const card = {
  base: 'bg-white dark:bg-gray-800 rounded-lg shadow',
  border: 'border-l-4'
};

export const text = {
  label: 'text-sm font-medium text-gray-500 dark:text-gray-400',
  value: 'text-2xl font-semibold text-gray-900 dark:text-white',
  title: 'text-xl font-semibold text-gray-900 dark:text-white',
  body: 'text-sm text-gray-500 dark:text-gray-400',
  link: 'text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium',
  name: 'font-medium text-gray-900 dark:text-white',
  description: 'text-sm text-gray-600 dark:text-gray-300',
  meta: 'text-sm text-gray-500 dark:text-gray-400',
  activity: 'text-sm font-medium text-gray-900 dark:text-white'
};

export const iconContainer = {
  base: 'flex-shrink-0 p-3 rounded-lg',
};

export const layout = {
  section: {
    header: 'flex items-center justify-between mb-4',
    content: 'space-y-6',
    wrapper: 'space-y-6'
  },
  divider: 'border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0',
  row: 'flex justify-between items-start',
  icon: {
    wrapper: 'mr-4 flex-shrink-0',
    circle: 'h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center',
    base: 'text-indigo-600 dark:text-indigo-400'
  },
  activity: {
    container: 'flex',
    content: 'space-y-1'
  },
  grid: {
    main: 'grid grid-cols-1 xl:grid-cols-3 gap-6',
    sidebar: 'xl:col-span-2 space-y-6'
  },
  card: {
    base: 'bg-white dark:bg-gray-800 rounded-lg shadow',
    padding: 'p-4',
    interactive: 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer',
    border: 'border border-gray-200 dark:border-gray-700'
  },
  table: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
  tableHeader: 'bg-gray-50 dark:bg-gray-800/50',
  tableHeaderCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
  tableRow: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
  tableCell: 'px-6 py-4 whitespace-nowrap'
};

type SubjectStyle = {
  bg: string;
  text: string;
  accent: string;
};

type SubjectColors = {
  [key: string]: SubjectStyle;
};

export const subjects = {
  colors: {
    '國語': {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      accent: '#3B82F6'
    },
    '英語': {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-800 dark:text-cyan-300',
      accent: '#06B6D4'  // 青色，仍保留國際清新感但與藍色有明顯區別
    
    },
    '數學': {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-300',
      accent: '#F97316'
    },
    '自然': {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-800 dark:text-emerald-300',
      accent: '#10B981'
    },
    '社會': {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-300',
      accent: '#F59E0B'
    },
    '藝術': {
      bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
      text: 'text-fuchsia-800 dark:text-fuchsia-300',
      accent: '#D946EF'
    },
    '體育': {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-800 dark:text-rose-300',
      accent: '#E11D48'
    },
    '自訂': {
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-800 dark:text-violet-300',
      accent: '#8B5CF6'
    }
  } as SubjectColors,
  getSubjectStyle: (subjectName: string) => {
    const defaultStyle = {
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      text: 'text-gray-800 dark:text-gray-300',
      accent: '#6B7280'
    };
    return subjects.colors[subjectName] || defaultStyle;
  }
};

export const taskStyles = {
  title: 'text-sm font-medium text-gray-900 dark:text-white',
  description: 'text-sm text-gray-600 dark:text-gray-300 break-words',
  dueDate: {
    overdue: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200',
    upcoming: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400'
  },
  status: {
    completed: 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400',
    'in_progress': 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400',
    waiting_feedback: 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    pending: 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400',
    overdue: 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  },
  badge: {
    feedback: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  }
};

export const goalStatusColors = {
  active: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
} as const;

export const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
} as const; 