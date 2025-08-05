"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DynamicQuestionV2, UserContextV2 } from '@/services/dynamic-questions-v2';

interface DynamicQuestionFlowProps {
  websiteData: {
    themes: string[];
    contentType: string;
    hints: string[];
    socialLinks: Array<{ platform: string; url: string }>;
    location?: string;
  };
  onComplete: (answers: Record<string, any>) => void;
  onQuestionChange?: (question: DynamicQuestionV2, questionNumber: number) => void;
}

export const DynamicQuestionFlow: React.FC<DynamicQuestionFlowProps> = ({
  websiteData,
  onComplete,
  onQuestionChange
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<DynamicQuestionV2 | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Load the first question
  useEffect(() => {
    loadNextQuestion();
  }, []);

  const loadNextQuestion = useCallback(async () => {
    setLoading(true);
    try {
      const userContext: UserContextV2 = {
        themes: websiteData.themes,
        contentType: websiteData.contentType,
        hints: websiteData.hints,
        socialLinks: websiteData.socialLinks,
        audienceLocation: websiteData.location || 'Global',
        previousAnswers: answers
      };

      const response = await fetch('/api/dynamic-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userContext,
          questionNumber,
          previousQuestions
        })
      });

      const result = await response.json();

      if (result.success && result.question) {
        setCurrentQuestion(result.question);
        setSelectedOptions([]);
        setCustomInput('');
        setShowCustomInput(false);
        
        if (onQuestionChange) {
          onQuestionChange(result.question, questionNumber);
        }
      } else {
        // No more questions or error - complete the flow
        console.log('Question flow complete or error:', result);
        onComplete(answers);
      }
    } catch (error) {
      console.error('Error loading question:', error);
      // Complete with current answers on error
      onComplete(answers);
    } finally {
      setLoading(false);
    }
  }, [websiteData, answers, questionNumber, previousQuestions, onQuestionChange, onComplete]);

  const handleAnswer = useCallback(async (answer: string | string[]) => {
    if (!currentQuestion) return;

    // Update answers
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: answer
    };
    setAnswers(newAnswers);

    // Update question history
    setPreviousQuestions([...previousQuestions, currentQuestion.text]);

    // Check if this was the final question
    if (currentQuestion.id === 'final' || questionNumber >= 5) {
      onComplete(newAnswers);
      return;
    }

    // Load next question
    setQuestionNumber(questionNumber + 1);
    await loadNextQuestion();
  }, [currentQuestion, answers, previousQuestions, questionNumber, onComplete, loadNextQuestion]);

  const handleOptionClick = useCallback((option: string) => {
    if (!currentQuestion) return;

    if (option === 'Custom amount' || option.toLowerCase().includes('custom')) {
      setShowCustomInput(true);
      return;
    }

    if (currentQuestion.multiSelect) {
      setSelectedOptions(prev => {
        if (prev.includes(option)) {
          return prev.filter(o => o !== option);
        }
        return [...prev, option];
      });
    } else {
      handleAnswer(option);
    }
  }, [currentQuestion, handleAnswer]);

  const handleMultiSelectConfirm = useCallback(() => {
    if (selectedOptions.length > 0) {
      handleAnswer(selectedOptions);
    }
  }, [selectedOptions, handleAnswer]);

  const handleCustomSubmit = useCallback(() => {
    if (customInput.trim()) {
      handleAnswer(customInput.trim());
    }
  }, [customInput, handleAnswer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Generating personalized question...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{currentQuestion.icon}</span>
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-3">{currentQuestion.text}</h3>
          
          {showCustomInput ? (
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter your custom amount..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomSubmit();
                  }
                }}
                className="w-full"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCustomSubmit}
                  disabled={!customInput.trim()}
                >
                  Submit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomInput('');
                  }}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOptions.includes(option);
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => handleOptionClick(option)}
                  >
                    {currentQuestion.multiSelect && isSelected && "✓ "}
                    {option}
                  </Button>
                );
              })}
              
              {currentQuestion.multiSelect && selectedOptions.length > 0 && (
                <div className="mt-4 pt-2 border-t">
                  <Button
                    onClick={handleMultiSelectConfirm}
                    className="w-full"
                    variant="default"
                  >
                    Continue with {selectedOptions.length} selection{selectedOptions.length > 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {currentQuestion.metadata && (
        <div className="text-xs text-muted-foreground mt-2">
          {currentQuestion.metadata.budgetRange && (
            <span>Budget aware: ${currentQuestion.metadata.budgetRange.min}-${currentQuestion.metadata.budgetRange.max}</span>
          )}
          {currentQuestion.contextAware && (
            <span className="ml-2">• Context-aware question</span>
          )}
        </div>
      )}
    </div>
  );
};