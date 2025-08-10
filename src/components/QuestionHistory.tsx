"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Edit2, History, RefreshCw } from 'lucide-react';

interface QuestionHistoryProps {
  answers: Record<string, any>;
  isExpanded?: boolean;
  onEditQuestion: (questionId: string) => void;
  onRestart: () => void;
  showInChat?: boolean;
  className?: string;
}

const questionDetails = {
  duration: {
    label: 'Trip Length',
    icon: '📅',
    category: 'Planning'
  },
  budget: {
    label: 'Budget',
    icon: '💰',
    category: 'Financial'
  },
  contentFormat: {
    label: 'Content Format',
    icon: '📸',
    category: 'Style'
  },
  climate: {
    label: 'Climate Preference',
    icon: '🌡️',
    category: 'Environment'
  }
};

export const QuestionHistory: React.FC<QuestionHistoryProps> = ({
  answers,
  isExpanded: initialExpanded = false,
  onEditQuestion,
  onRestart,
  showInChat = false,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  const answeredQuestions = Object.keys(answers).filter(key => 
    key !== 'undefined' && answers[key] && answers[key] !== ''
  );

  if (answeredQuestions.length === 0) {
    return null;
  }

  const formatAnswer = (answer: any) => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return String(answer);
  };

  return (
    <div className={`bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Your Preferences</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {answeredQuestions.length} of 4 questions answered
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRestart}
              className="h-8 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Restart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${(answeredQuestions.length / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {answeredQuestions.map((questionId) => {
            const details = questionDetails[questionId as keyof typeof questionDetails];
            const answer = answers[questionId];
            
            if (!details) return null;
            
            return (
              <div 
                key={questionId}
                className="group relative"
              >
                <Button
                  variant="ghost"
                  onClick={() => onEditQuestion(questionId)}
                  className="w-full p-3 h-auto justify-start hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-start gap-3 w-full">
                    <span className="text-xl mt-0.5">{details.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {details.category}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-medium text-foreground">
                          {details.label}
                        </span>
                      </div>
                      <div className="text-sm text-foreground font-medium">
                        {formatAnswer(answer)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs text-primary">Edit</span>
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}

          {/* Summary Section */}
          {showInChat && answeredQuestions.length === 4 && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="text-xs text-muted-foreground mb-2">Quick Summary</div>
              <div className="grid grid-cols-2 gap-2">
                {answeredQuestions.map((questionId) => {
                  const details = questionDetails[questionId as keyof typeof questionDetails];
                  const answer = answers[questionId];
                  
                  if (!details) return null;
                  
                  return (
                    <div key={questionId} className="flex items-center gap-2 text-xs">
                      <span>{details.icon}</span>
                      <span className="text-muted-foreground">{formatAnswer(answer)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};