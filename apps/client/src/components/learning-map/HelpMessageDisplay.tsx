import React from 'react';
import { AlertTriangle, MessageSquare } from 'lucide-react';

interface HelpMessageDisplayProps {
  needHelp?: boolean;
  helpMessage?: string;
  replyMessage?: string;
  replyAt?: string;
  className?: string;
  compact?: boolean; // 緊湊模式，適用於較小的空間
}

export const HelpMessageDisplay: React.FC<HelpMessageDisplayProps> = ({
  needHelp,
  helpMessage,
  replyMessage,
  replyAt,
  className = '',
  compact = false
}) => {
  // 如果沒有任何訊息就不顯示
  if (!needHelp && !replyMessage) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 求助訊息 */}
      {needHelp && helpMessage && (
        <div className={`p-3 bg-orange-50 border border-orange-200 rounded-xl ${compact ? 'p-2' : ''}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={`text-orange-600 mt-0.5 flex-shrink-0 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <div className="flex-1">
              <div className={`font-medium text-orange-800 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                求助訊息
              </div>
              <p className={`text-orange-700 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                {helpMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 老師回覆 */}
      {replyMessage && (
        <div className={`p-3 bg-blue-50 border border-blue-200 rounded-xl ${compact ? 'p-2' : ''}`}>
          <div className="flex items-start gap-2">
            <MessageSquare className={`text-blue-600 mt-0.5 flex-shrink-0 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={`font-medium text-blue-800 ${compact ? 'text-xs' : 'text-sm'}`}>
                  老師回覆
                </div>
                {replyAt && (
                  <div className={`text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {new Date(replyAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <p className={`text-blue-700 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                {replyMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 