import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronRight, Link, FileText, Image, 
  Video, Download, ExternalLink, Plus, X, Edit, Save, Upload, Paperclip
} from 'lucide-react';
import type { 
  ReferenceInfo, 
  ReferenceAttachment, 
  ReferenceLink, 
  AttachmentType,
  LinkType
} from '../../../types/goal';

interface ReferenceInfoPanelProps {
  title: string;
  referenceInfo?: ReferenceInfo;
  onUpdateReferenceInfo?: (info: ReferenceInfo) => Promise<void>;
  onAddAttachment?: (attachment: Omit<ReferenceAttachment, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  onRemoveAttachment?: (attachmentId: string) => Promise<void>;
  onAddLink?: (link: Omit<ReferenceLink, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  onRemoveLink?: (linkId: string) => Promise<void>;
  isUpdating?: boolean;
  readonly?: boolean;
}

export const ReferenceInfoPanel: React.FC<ReferenceInfoPanelProps> = ({
  title,
  referenceInfo,
  onUpdateReferenceInfo,
  onAddAttachment,
  onRemoveAttachment,
  onAddLink,
  onRemoveLink,
  isUpdating = false,
  readonly = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File;
    description: string;
    preview?: string;
  }>>([]);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    type: 'website' as LinkType,
    description: '',
    thumbnail: ''
  });

  const attachments = referenceInfo?.attachments || [];
  const links = referenceInfo?.links || [];
  const totalItems = attachments.length + links.length;

  // 獲取附件類型對應的圖標
  const getAttachmentIcon = (type: AttachmentType) => {
    switch (type) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'pdf':
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  // 獲取連結類型對應的圖標
  const getLinkIcon = (type: LinkType) => {
    switch (type) {
      case 'youtube':
        return Video;
      case 'github':
        return Link;
      default:
        return Link;
    }
  };

  // 處理文件上傳
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = 5 - uploadedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    const newFiles = filesToAdd.map(file => {
      const fileData = {
        file,
        description: '',
        preview: undefined as string | undefined
      };
      
      // 為圖片生成預覽
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.file === file 
                ? { ...f, preview: e.target?.result as string }
                : f
            )
          );
        };
        reader.readAsDataURL(file);
      }
      
      return fileData;
    });
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // 清空 input
    event.target.value = '';
  };

  // 移除上傳的文件
  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 更新文件描述
  const updateFileDescription = (index: number, description: string) => {
    setUploadedFiles(prev => 
      prev.map((file, i) => 
        i === index ? { ...file, description } : file
      )
    );
  };

  // 獲取文件類型
  const getFileType = (file: File): AttachmentType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  // 處理添加附件
  const handleAddAttachment = async () => {
    if (uploadedFiles.length === 0) return;
    
    try {
      // 這裡應該先上傳文件到雲端存儲，獲取 URL
      // 目前為示例，使用 createObjectURL
      for (const fileData of uploadedFiles) {
        const attachment = {
          title: fileData.description || fileData.file.name,
          url: URL.createObjectURL(fileData.file), // 實際應該是上傳後的 URL
          type: getFileType(fileData.file),
          size: fileData.file.size,
          thumbnail: fileData.preview || ''
        };
        
        await onAddAttachment?.(attachment);
      }
      
      // 清空狀態
      setUploadedFiles([]);
      setShowAddAttachment(false);
    } catch (error) {
      console.error('添加附件失敗:', error);
    }
  };

  // 處理添加連結
  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    
    try {
      await onAddLink?.(newLink);
      setNewLink({
        title: '',
        url: '',
        type: 'website',
        description: '',
        thumbnail: ''
      });
      setShowAddLink(false);
    } catch (error) {
      console.error('添加連結失敗:', error);
    }
  };

  // 處理項目點擊
  const handleItemClick = (url: string, type: AttachmentType | LinkType) => {
    // 根據類型決定行為
    if (type === 'image' || type === 'video' || type === 'pdf') {
      // 在新分頁中預覽
      window.open(url, '_blank');
    } else if (type === 'document' || type === 'audio' || type === 'other') {
      // 下載
      window.open(url, '_blank');
    } else {
      // 連結類型，在新分頁中開啟
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      {/* 標題和展開/收合按鈕 */}
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 -m-1 p-1 rounded transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>
          {totalItems > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!readonly && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddAttachment(false); // 關閉附件表單
                  setShowAddLink(true);
                  setIsExpanded(true);
                }}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="添加連結"
              >
                <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddLink(false); // 關閉連結表單
                  setShowAddAttachment(true);
                  setIsExpanded(true);
                }}
                className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                title="添加附件"
              >
                <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
            </>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* 展開內容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {/* 附件列表 */}
            {attachments.map((attachment) => {
              const Icon = getAttachmentIcon(attachment.type);
              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleItemClick(attachment.url, attachment.type)}
                >
                  <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {attachment.title}
                    </div>
                    {(attachment.size || 0) > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {((attachment.size || 0) / 1024 / 1024).toFixed(1)} MB
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {attachment.type === 'image' || attachment.type === 'video' || attachment.type === 'pdf' ? (
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    ) : (
                      <Download className="w-3 h-3 text-gray-400" />
                    )}
                    {!readonly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveAttachment?.(attachment.id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="移除附件"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 連結列表 */}
            {links.map((link) => {
              const Icon = getLinkIcon(link.type);
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleItemClick(link.url, link.type)}
                >
                  <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {link.title}
                    </div>
                    {link.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {link.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                    {!readonly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveLink?.(link.id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="移除連結"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 空狀態 */}
            {totalItems === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Link className="w-6 h-6 opacity-50" />
                  <FileText className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-sm">尚無參考資訊</p>
                {!readonly && (
                  <p className="text-xs">點擊 <span className="text-blue-600">🔗</span> 添加連結或 <span className="text-green-600">📄</span> 添加附件</p>
                )}
              </div>
            )}

            {/* 添加附件表單 */}
            {!readonly && showAddAttachment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 border-2 border-dashed border-green-200 dark:border-green-800 rounded-lg bg-green-50/50 dark:bg-green-900/20"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      上傳附件 ({uploadedFiles.length}/5)
                    </h5>
                    <button
                      onClick={() => {
                        setShowAddAttachment(false);
                        setUploadedFiles([]);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* 文件上傳區域 */}
                  {uploadedFiles.length < 5 && (
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                      />
                      <div className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-6 text-center hover:border-green-400 dark:hover:border-green-600 transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          點擊或拖拽文件到此處
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          最多 {5 - uploadedFiles.length} 個文件，支援圖片、影片、音頻、PDF、文件等
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 已上傳文件列表 */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400">已選擇的文件：</h6>
                      {uploadedFiles.map((fileData, index) => {
                        const Icon = getAttachmentIcon(getFileType(fileData.file));
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                            {/* 文件預覽/圖標 */}
                            <div className="flex-shrink-0">
                              {fileData.preview ? (
                                <img 
                                  src={fileData.preview} 
                                  alt="預覽" 
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* 文件信息 */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {fileData.file.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                              </div>
                              <input
                                type="text"
                                value={fileData.description}
                                onChange={(e) => updateFileDescription(index, e.target.value)}
                                placeholder="文件說明（選填）"
                                className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </div>
                            
                            {/* 移除按鈕 */}
                            <button
                              onClick={() => removeUploadedFile(index)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              title="移除文件"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* 操作按鈕 */}
                  {uploadedFiles.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddAttachment}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                        {isUpdating ? '上傳中...' : `添加 ${uploadedFiles.length} 個附件`}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddAttachment(false);
                          setUploadedFiles([]);
                        }}
                        className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 添加連結表單 */}
            {!readonly && showAddLink && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      添加連結
                    </h5>
                    <button
                      onClick={() => setShowAddLink(false)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    placeholder="連結標題"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="連結 URL"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <textarea
                    value={newLink.description}
                    onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                    placeholder="連結描述（選填）"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <select
                    value={newLink.type}
                    onChange={(e) => setNewLink({ ...newLink, type: e.target.value as LinkType })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="website">網站</option>
                    <option value="youtube">YouTube</option>
                    <option value="github">GitHub</option>
                    <option value="drive">雲端硬碟</option>
                    <option value="other">其他</option>
                  </select>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddLink}
                      disabled={isUpdating || !newLink.title.trim() || !newLink.url.trim()}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Link className="w-4 h-4" />
                      {isUpdating ? '添加中...' : '添加連結'}
                    </button>
                    <button
                      onClick={() => setShowAddLink(false)}
                      className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 