"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { smartDynamicQuestionService, SmartQuestion, QuestionContext } from '@/services/smart-dynamic-questions';
import { QuestionEditPanel } from './QuestionEditPanel';

interface SmartQuestionFlowProps {
  websiteData: {
    themes: string[];
    contentType: string;
    hints: string[];
    socialLinks: Array<{ platform: string; url: string }>;
    location?: string;
  };
  onComplete: (answers: Record<string, any>) => void;
  onQuestionChange?: (question: SmartQuestion, questionNumber: number, context: QuestionContext) => void;
}

export const SmartQuestionFlow: React.FC<SmartQuestionFlowProps> = ({
  websiteData,
  onComplete,
  onQuestionChange
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<SmartQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [context, setContext] = useState<QuestionContext>({
    themes: websiteData.themes,
    contentType: websiteData.contentType,
    hints: websiteData.hints,
    socialLinks: websiteData.socialLinks,
    audienceLocation: websiteData.location || 'Global',
    previousAnswers: {}
  });
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const loadNextQuestion = useCallback(async () => {
    setLoading(true);
    setValidationError('');
    
    try {
      const question = await smartDynamicQuestionService.generateNextQuestion(
        context,
        questionNumber
      );

      if (question) {
        console.log(`🔄 Initial loading question ${questionNumber}: ${question.text}`);
        setCurrentQuestion(question);
        setSelectedOptions([]);
        setCustomInput('');
        setShowCustomInput(false);
        
        if (onQuestionChange) {
          onQuestionChange(question, questionNumber, context);
        }
      } else {
        // No more questions - complete the flow
        console.log('Initial load: Question flow complete');
        onComplete(context.previousAnswers);
      }
    } catch (error) {
      console.error('Error loading initial question:', error);
      onComplete(context.previousAnswers);
    } finally {
      setLoading(false);
    }
  }, [context, questionNumber, onQuestionChange, onComplete]);

  // Load the first question
  useEffect(() => {
    if (questionNumber === 1 && !currentQuestion) {
      loadNextQuestion();
    }
  }, [questionNumber, currentQuestion, loadNextQuestion]);

  const handleAnswer = useCallback(async (answer: string | string[]) => {
    if (!currentQuestion) return;

    // Validate the answer
    const validation = smartDynamicQuestionService.validateAnswer(
      currentQuestion.id,
      answer,
      context
    );

    if (!validation.valid) {
      setValidationError(validation.message || 'Invalid answer');
      return;
    }

    // Update context with the new answer
    const newContext = smartDynamicQuestionService.updateContext(
      context,
      currentQuestion.id,
      answer
    );
    
    console.log('📝 Answer recorded:', { 
      question: currentQuestion.id, 
      answer,
      budget: newContext.budget,
      dailyBudget: newContext.dailyBudget,
      previousAnswers: newContext.previousAnswers
    });

    // Check if this was the final question
    if (questionNumber >= 4) {
      console.log('🎉 All questions completed, finalizing answers');
      onComplete(newContext.previousAnswers);
      return;
    }

    // Update context and question number before loading next question
    setContext(newContext);
    const nextQuestionNumber = questionNumber + 1;
    setQuestionNumber(nextQuestionNumber);
    
    // Load next question with updated context
    setLoading(true);
    setValidationError('');
    
    try {
      const nextQuestion = await smartDynamicQuestionService.generateNextQuestion(
        newContext,
        nextQuestionNumber
      );

      if (nextQuestion) {
        console.log(`🔄 Loading question ${nextQuestionNumber}: ${nextQuestion.text}`);
        setCurrentQuestion(nextQuestion);
        setSelectedOptions([]);
        setCustomInput('');
        setShowCustomInput(false);
        
        if (onQuestionChange) {
          onQuestionChange(nextQuestion, nextQuestionNumber, newContext);
        }
      } else {
        // No more questions - complete the flow
        console.log('🎉 Question flow complete - no more questions');
        onComplete(newContext.previousAnswers);
      }
    } catch (error) {
      console.error('Error loading next question:', error);
      onComplete(newContext.previousAnswers);
    } finally {
      setLoading(false);
    }

  }, [currentQuestion, context, questionNumber, onComplete, onQuestionChange]);

  const handleOptionClick = useCallback((option: string) => {
    if (!currentQuestion) {
      console.warn('⚠️ handleOptionClick called but no current question');
      return;
    }

    console.log(`👆 User clicked option: "${option}" for question: ${currentQuestion.id}`);

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
      // Clear validation error before processing answer
      setValidationError('');
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
      const finalAnswer = currentQuestion?.id === 'budget' 
        ? `${context.currency || '$'}${customInput.trim()}`
        : customInput.trim();
      handleAnswer(finalAnswer);
    }
  }, [customInput, currentQuestion, context.currency, handleAnswer]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    }
  }, [handleCustomSubmit]);

  const handleEditQuestion = useCallback((questionId: string) => {
    // Find the question to edit
    const questionMap = { duration: 1, budget: 2, contentFormat: 3, climate: 4 };
    const targetQuestionNumber = questionMap[questionId as keyof typeof questionMap];
    
    if (targetQuestionNumber) {
      setEditingQuestionId(questionId);
      setQuestionNumber(targetQuestionNumber);
      loadNextQuestion();
    }
  }, [loadNextQuestion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading personalized question...</span>
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
      {/* Show edit panel if user has answered questions */}
      {Object.keys(context.previousAnswers).length > 0 && (
        <QuestionEditPanel
          answers={context.previousAnswers}
          onEditQuestion={handleEditQuestion}
          className="mb-4"
        />
      )}
      
      <div className="flex items-start gap-3">
        <span className="text-2xl">{currentQuestion.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-medium">{currentQuestion.text}</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {questionNumber}/4
            </span>
          </div>
          
          {/* Show budget context info */}
          {context.budget && questionNumber > 1 && (
            <div className="text-sm text-muted-foreground mb-3 p-2 bg-muted/30 rounded">
              Budget: {context.currency}{context.budget}
              {context.dailyBudget && ` • Daily: ${context.currency}${context.dailyBudget}`}
              {context.duration && ` • Duration: ${context.duration} days`}
            </div>
          )}
          
          {validationError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">
              {validationError}
            </div>
          )}
          
          {showCustomInput ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {currentQuestion.id === 'budget' && (
                  <span className="text-lg">{context.currency || '$'}</span>
                )}
                <Input
                  type="number"
                  placeholder={currentQuestion.id === 'budget' ? "Enter amount..." : "Enter custom value..."}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleCustomSubmit}
                  disabled={!customInput.trim()}
                  size="sm"
                >
                  Continue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomInput('');
                    setValidationError('');
                  }}
                  size="sm"
                >
                  Back to options
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
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => handleOptionClick(option)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {currentQuestion.multiSelect && isSelected && (
                        <span className="text-green-600">✓</span>
                      )}
                      <span className="flex-1">{option}</span>
                    </div>
                  </Button>
                );
              })}
              
              {currentQuestion.multiSelect && selectedOptions.length > 0 && (
                <div className="mt-4 pt-3 border-t">
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
      
      {/* Progress indicator */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Progress:</span>
          <div className="flex gap-1">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  i < questionNumber ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({questionNumber}/4)</span>
        </div>
      </div>
    </div>
  );
};