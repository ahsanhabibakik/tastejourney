"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Clock, MessageSquare, Sparkles } from 'lucide-react';

interface ChatHistoryProps {
  messages: Array<{
    id: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
    component?: string;
  }>;
  userAnswers: Record<string, any>;
  onMessageClick?: (messageId: string) => void;
  className?: string;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  userAnswers,
  onMessageClick,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Filter meaningful messages for history
  const historyMessages = messages.filter(msg => 
    msg.text.trim() && 
    !msg.component && 
    msg.text.length > 10
  );

  // Group messages by session/flow
  const questionsSession = messages.filter(msg => 
    msg.component === 'smart-questions' || 
    (msg.text.includes('question') && msg.isBot)
  );

  const recommendationsSession = messages.filter(msg => 
    msg.component === 'recommendations' ||
    (msg.text.includes('recommendation') && msg.isBot)
  );

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const truncateText = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`bg-card rounded-xl border border-border/30 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Chat History</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{historyMessages.length} messages</span>
          {Object.keys(userAnswers).length > 0 && (
            <span>{Object.keys(userAnswers).length} preferences set</span>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
          {/* Sessions */}
          <div className="space-y-3">
            {questionsSession.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Preference Questions</span>
                </div>
                <div className="pl-3 space-y-1">
                  {Object.keys(userAnswers).map(key => (
                    <div key={key} className="text-xs">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <span className="ml-1 text-foreground">
                        {Array.isArray(userAnswers[key]) 
                          ? userAnswers[key].join(', ')
                          : userAnswers[key]
                        }
                      </span>
                    </div>
                  ))}\n                </div>
              </div>
            )}

            {recommendationsSession.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>Recommendations</span>
                </div>
                <div className="text-xs text-muted-foreground pl-3">
                  Generated personalized travel recommendations
                </div>
              </div>
            )}
          </div>

          {/* Recent Messages */}
          {showDetails && historyMessages.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Message Details
              </button>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {historyMessages.slice(-5).map((message) => (
                  <div
                    key={message.id}
                    className="group cursor-pointer hover:bg-muted/30 rounded p-2 transition-colors"
                    onClick={() => onMessageClick?.(message.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        message.isBot ? 'bg-primary' : 'bg-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground line-clamp-2">
                          {truncateText(message.text)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}\n              </div>
            </div>
          )}

          {/* Toggle Details */}
          {historyMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs"
            >
              {showDetails ? 'Hide' : 'Show'} Message Details
            </Button>
          )}
        </div>
      )}
    </div>
  );
};