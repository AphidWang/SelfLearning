import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { Plus, Search, BookOpen, Calendar, Tag } from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  subject: string;
  tags: string[];
}

const mockEntries: JournalEntry[] = [
  {
    id: '1',
    title: '今日反思',
    content: '今天閱讀了居禮夫人的生平，她的堅持和毅力讓我很受啟發。在遇到困難時也要像她一樣堅持下去。我學到了很多關於放射性元素的知識，也對科學家的研究精神有了更深的認識。',
    date: new Date(),
    subject: '自然科學',
    tags: ['閱讀心得', '科學家', '反思']
  },
  {
    id: '2',
    title: '遊記初稿',
    content: '上週去了海邊，我觀察到許多有趣的海洋生物。寫作過程中我發現可以加入更多細節來描述潮間帶的生態系統。下次修改時要著重描寫顏色和形狀的變化。',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    subject: '國語',
    tags: ['作文', '遊記', '海洋生物']
  },
  {
    id: '3',
    title: '數學解題思路',
    content: '今天學習了分數除法，一開始覺得很困難，但是在理解了倒數的概念後就豁然開朗。我發現把複雜的問題拆解成小步驟會更容易理解。',
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    subject: '數學',
    tags: ['解題技巧', '分數', '心得']
  }
];

const StudentJournal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(mockEntries);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || entry.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <PageLayout title="學習日誌">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="搜尋日誌..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增日誌
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {filteredEntries.map((entry) => (
              <div 
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {entry.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Intl.DateTimeFormat('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }).format(entry.date)}
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line">
                  {entry.content}
                </p>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {entry.subject}
                  </span>
                  
                  {entry.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                科目篩選
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedSubject('all')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedSubject === 'all'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  全部科目
                </button>
                {['國語', '數學', '英語', '自然科學', '社會'].map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedSubject === subject
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                寫作提示
              </h3>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <p>• 記錄今天學到的重要概念</p>
                <p>• 描述你遇到的困難和解決方法</p>
                <p>• 分享學習過程中的心得感受</p>
                <p>• 寫下還想深入了解的問題</p>
                <p>• 連結不同科目之間的關係</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default StudentJournal;