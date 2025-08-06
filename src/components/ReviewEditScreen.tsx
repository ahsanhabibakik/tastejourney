"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { SmartQuestion, QuestionContext } from '@/services/smart-dynamic-questions';

interface ReviewEditScreenProps {
  answers: Record<string, any>;
  questions: SmartQuestion[];
  onAnswerUpdate: (questionId: string, newAnswer: any) => void;
  onConfirmAndGenerate: () => void;
  onBack: () => void;
  isFromRecommendations?: boolean;
  websiteData?: {
    themes: string[];
    contentType: string;
    hints: string[];
    socialLinks: Array<{ platform: string; url: string }>;
    location?: string;
  };
}

interface EditingState {
  questionId: string | null;
  tempValue: any;
  expanded: boolean;
}

export const ReviewEditScreen: React.FC<ReviewEditScreenProps> = ({
  answers,
  questions,
  onAnswerUpdate,
  onConfirmAndGenerate,
  onBack,
  isFromRecommendations = false,
  websiteData
}) => {
  const [editing, setEditing] = useState<EditingState>({
    questionId: null,
    tempValue: null,
    expanded: false
  });

  const getQuestionIcon = (questionId: string): string => {
    const iconMap: Record<string, string> = {
      budget: '💸',
      duration: '🗓️',
      style: '🌍',
      priorities: '🎯',
      accommodation: '🏨',
      climate: '☀️',
      activities: '🎲',
      transport: '🚗'
    };
    return iconMap[questionId] || '❓';
  };

  const formatAnswerDisplay = (questionId: string, answer: any): string => {
    if (!answer) return 'Not selected';
    
    if (Array.isArray(answer)) {
      return answer.length > 2 
        ? `${answer.slice(0, 2).join(', ')} +${answer.length - 2} more`
        : answer.join(', ');
    }
    
    return String(answer);
  };

  const getBudgetCategory = (budget: string): string => {
    if (!budget) return '';
    const amount = parseInt(budget.replace(/[^\d]/g, ''));
    if (amount < 500) return 'Ultra Budget';
    if (amount < 1500) return 'Budget';
    if (amount < 3000) return 'Mid-Range';
    if (amount < 6000) return 'Premium';
    return 'Luxury';
  };

  const getDailyBudget = (): string => {
    const budget = answers.budget;
    const duration = answers.duration;
    
    if (!budget || !duration) return '';
    
    const budgetAmount = parseInt(budget.replace(/[^\d]/g, ''));
    const durationDays = parseDurationToDays(duration);
    const dailyAmount = Math.floor(budgetAmount / durationDays);
    const currency = budget.match(/[₹₽¥€£$৳]/)?.[0] || '$';
    
    return `${currency}${dailyAmount}/day`;
  };

  const parseDurationToDays = (duration: string): number => {
    const lowerDuration = duration.toLowerCase();
    if (lowerDuration.includes('week')) {
      const weeks = parseInt(lowerDuration) || 1;
      return weeks * 7;
    }
    return parseInt(lowerDuration) || 1;
  };

  const handleEditClick = (questionId: string) => {
    setEditing({
      questionId,
      tempValue: answers[questionId],
      expanded: true
    });
  };

  const handleSaveEdit = () => {
    if (editing.questionId && editing.tempValue !== null) {
      onAnswerUpdate(editing.questionId, editing.tempValue);
    }
    setEditing({ questionId: null, tempValue: null, expanded: false });
  };

  const handleCancelEdit = () => {
    setEditing({ questionId: null, tempValue: null, expanded: false });
  };

  const renderInlineEditor = (questionId: string, currentAnswer: any) => {
    if (editing.questionId !== questionId) return null;

    const question = questions.find(q => q.id === questionId);
    if (!question) return null;

    return (
      <div className="mt-3 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{question.icon}</span>
          <h4 className="font-medium">{question.text}</h4>
        </div>

        {questionId === 'budget' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {['$300-500', '$500-1000', '$1000-2500', '$2500-5000', '$5000+'].map(option => (
                <Button
                  key={option}
                  variant={editing.tempValue === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditing({ ...editing, tempValue: option })}
                >
                  {option}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Custom amount (e.g. $800)"
                value={typeof editing.tempValue === 'string' && editing.tempValue.startsWith('$') && !['$300-500', '$500-1000', '$1000-2500', '$2500-5000', '$5000+'].includes(editing.tempValue) ? editing.tempValue : ''}
                onChange={(e) => setEditing({ ...editing, tempValue: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        ) : question.multiSelect ? (
          <div className="space-y-2">
            {question.options.map(option => {
              const isSelected = Array.isArray(editing.tempValue) && editing.tempValue.includes(option);
              return (
                <Button
                  key={option}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const current = Array.isArray(editing.tempValue) ? editing.tempValue : [];
                    const updated = isSelected 
                      ? current.filter(item => item !== option)
                      : [...current, option];
                    setEditing({ ...editing, tempValue: updated });
                  }}
                >
                  {isSelected && <Check className="w-4 h-4 mr-2" />}
                  {option}
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {question.options.map(option => (
              <Button
                key={option}
                variant={editing.tempValue === option ? "default" : "outline"}
                size="sm"
                onClick={() => setEditing({ ...editing, tempValue: option })}
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSaveEdit} size="sm">
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button onClick={handleCancelEdit} variant="outline" size="sm">
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const answeredQuestions = questions.filter(q => answers[q.id]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {isFromRecommendations ? 'Refine Your Preferences' : 'Review Your Answers'}
        </h2>
        <p className="text-muted-foreground">
          {isFromRecommendations 
            ? 'Update any preferences to get new recommendations'
            : 'Review and edit your answers before we generate recommendations'
          }
        </p>
      </div>

      {/* Smart Summary Cards */}
      {answers.budget && answers.duration && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📊</span>
            <h3 className="font-semibold">Trip Overview</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Budget Category:</span>
              <div className="font-medium">{getBudgetCategory(answers.budget)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Daily Budget:</span>
              <div className="font-medium">{getDailyBudget()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Answers List */}
      <div className="space-y-4">
        {answeredQuestions.map((question) => {
          const answer = answers[question.id];
          const isEditing = editing.questionId === question.id;
          
          return (
            <div key={question.id} className="border rounded-lg">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{getQuestionIcon(question.id)}</span>
                    <div className="flex-1">
                      <div className="font-medium capitalize">
                        {question.id.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatAnswerDisplay(question.id, answer)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(question.id)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <ChevronDown className="w-4 h-4" />
                        <span className="text-sm text-muted-foreground">Editing</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {renderInlineEditor(question.id, answer)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Impact Indicator */}
      {answers.budget && (
        <div className="bg-blue-50  rounded-lg p-4 border border-blue-200 ">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-medium text-blue-900 ">Budget Impact</h4>
              <p className="text-sm text-blue-700  mt-1">
                With your {answers.budget} budget, we'll recommend destinations that offer excellent value 
                and ensure all suggestions are within your financial comfort zone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={onConfirmAndGenerate}
          className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          {isFromRecommendations ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin opacity-80" />
                Re-calculate Recommendations
              </div>
            </>
          ) : (
            'Confirm & Generate Recommendations'
          )}
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="text-center text-sm text-muted-foreground">
        {answeredQuestions.length} of {questions.length} preferences set
      </div>
    </div>
  );
};