"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';

interface QuestionEditPanelProps {
  answers: Record<string, any>;
  onEditQuestion: (questionId: string) => void;
  className?: string;
}

const questionLabels = {
  duration: 'Trip Length',
  budget: 'Budget',
  contentFormat: 'Content Format',
  climate: 'Climate Preference'
};

export const QuestionEditPanel: React.FC<QuestionEditPanelProps> = ({
  answers,
  onEditQuestion,
  className = ""
}) => {
  const answeredQuestions = Object.keys(answers).filter(key => 
    key !== 'undefined' && answers[key] && answers[key] !== ''
  );

  if (answeredQuestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-card/50 rounded-xl p-4 border border-border/30 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Edit2 className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Your Answers</h3>
        <span className="text-xs text-muted-foreground">Click to edit</span>
      </div>
      
      <div className="space-y-2">
        {answeredQuestions.map((questionId) => {
          const label = questionLabels[questionId as keyof typeof questionLabels] || questionId;
          const answer = answers[questionId];
          const displayAnswer = Array.isArray(answer) ? answer.join(', ') : answer;
          
          return (
            <div key={questionId} className="group">
              <Button
                variant="ghost"
                onClick={() => onEditQuestion(questionId)}
                className="w-full justify-between h-auto p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="text-left flex-1">
                  <div className="text-xs text-muted-foreground font-medium">{label}</div>
                  <div className="text-sm text-foreground mt-1 line-clamp-2">
                    {displayAnswer}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <Edit2 className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/30">
        <div className="text-xs text-muted-foreground text-center">
          {answeredQuestions.length}/4 questions completed
        </div>
        <div className="flex mt-2">
          <div 
            className="h-1 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(answeredQuestions.length / 4) * 100}%` }}
          ></div>
          <div 
            className="h-1 bg-muted rounded-full flex-1"
          ></div>
        </div>
      </div>
    </div>
  );
};