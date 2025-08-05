// Test file for Dynamic Question System V2
// This tests the budget-aware, context-sensitive question generation

import { dynamicQuestionServiceV2, UserContextV2 } from '../services/dynamic-questions-v2';

async function testDynamicQuestions() {
  console.log('🧪 Testing Dynamic Question System V2\n');
  
  // Test Case 1: Low Budget Scenario (500 Taka)
  console.log('=== TEST CASE 1: Low Budget (৳500) ===');
  const lowBudgetContext: UserContextV2 = {
    themes: ['photography', 'street', 'culture'],
    contentType: 'Photography',
    hints: ['budget traveler', 'street photographer'],
    socialLinks: [],
    audienceLocation: 'Bangladesh',
    previousAnswers: {
      budget: '৳500'
    }
  };
  
  const question1 = await dynamicQuestionServiceV2.generateNextQuestion(lowBudgetContext, 2, ['What\'s your travel budget?']);
  console.log('Question:', question1.text);
  console.log('Options:', question1.options);
  console.log('Context-aware:', question1.contextAware);
  console.log('---\n');
  
  // Test Case 2: Medium Budget Scenario ($1500)
  console.log('=== TEST CASE 2: Medium Budget ($1500) ===');
  const mediumBudgetContext: UserContextV2 = {
    themes: ['food', 'travel', 'lifestyle'],
    contentType: 'Food & Travel',
    hints: ['food blogger', 'travel vlogger'],
    socialLinks: [{ platform: 'YouTube', url: '@foodtraveler' }],
    audienceLocation: 'USA',
    previousAnswers: {
      budget: '$1500',
      duration: '1 week'
    }
  };
  
  const question2 = await dynamicQuestionServiceV2.generateNextQuestion(
    mediumBudgetContext, 
    3, 
    ['What\'s your travel budget?', 'How long would you like to travel?']
  );
  console.log('Question:', question2.text);
  console.log('Options:', question2.options);
  console.log('Daily budget context:', question2.metadata);
  console.log('---\n');
  
  // Test Case 3: High Budget Luxury Scenario
  console.log('=== TEST CASE 3: High Budget ($5000+) ===');
  const luxuryContext: UserContextV2 = {
    themes: ['luxury', 'lifestyle', 'fashion'],
    contentType: 'Luxury Lifestyle',
    hints: ['luxury traveler', 'fashion influencer'],
    socialLinks: [{ platform: 'Instagram', url: '@luxurylifestyle' }],
    audienceLocation: 'Dubai',
    previousAnswers: {
      budget: '$8000',
      duration: '2 weeks',
      style: 'Luxury experiences'
    }
  };
  
  const question3 = await dynamicQuestionServiceV2.generateNextQuestion(
    luxuryContext, 
    4, 
    ['Budget?', 'Duration?', 'Style?']
  );
  console.log('Question:', question3.text);
  console.log('Options:', question3.options);
  console.log('---\n');
  
  // Test Case 4: Sequential Context Building
  console.log('=== TEST CASE 4: Sequential Context Building ===');
  const sequentialContext: UserContextV2 = {
    themes: ['adventure', 'outdoor', 'photography'],
    contentType: 'Adventure Travel',
    hints: ['adventure seeker', 'outdoor enthusiast'],
    socialLinks: [],
    audienceLocation: 'Canada',
    previousAnswers: {}
  };
  
  // Simulate a full question flow
  const answers: Record<string, any> = {};
  const questions: string[] = [];
  
  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Question ${i} ---`);
    sequentialContext.previousAnswers = answers;
    
    const question = await dynamicQuestionServiceV2.generateNextQuestion(
      sequentialContext,
      i,
      questions
    );
    
    console.log('Q:', question.text);
    console.log('Options:', question.options.slice(0, 3), '...');
    
    // Simulate user answer
    let simulatedAnswer: string;
    if (i === 1) simulatedAnswer = '$800';
    else if (i === 2) simulatedAnswer = '5 days';
    else if (i === 3) simulatedAnswer = 'Adventure & outdoor activities';
    else if (i === 4) simulatedAnswer = 'Free attractions & nature';
    else simulatedAnswer = 'Hiking trails';
    
    answers[question.id] = simulatedAnswer;
    questions.push(question.text);
    console.log('User answered:', simulatedAnswer);
  }
  
  console.log('\n=== FINAL CONTEXT ===');
  console.log('All answers:', answers);
  
  // Test Case 5: Edge Cases
  console.log('\n=== TEST CASE 5: Edge Cases ===');
  
  // Very low budget
  const veryLowBudget: UserContextV2 = {
    themes: ['backpacking', 'budget'],
    contentType: 'Budget Travel',
    hints: ['backpacker'],
    socialLinks: [],
    audienceLocation: 'India',
    previousAnswers: {
      budget: '₹2000' // About $25
    }
  };
  
  const edgeQuestion1 = await dynamicQuestionServiceV2.generateNextQuestion(veryLowBudget, 2, []);
  console.log('Very Low Budget Question:', edgeQuestion1.text);
  console.log('Options:', edgeQuestion1.options);
  
  // Test validation
  console.log('\n=== VALIDATION TESTS ===');
  const testAnswers = {
    budget: '$300',
    style: 'Luxury Travel'
  };
  
  console.log('Testing budget-style conflict...');
  console.log('Budget: $300, Style: Luxury Travel');
  console.log('Expected: Should generate budget-appropriate questions');
  
  const conflictContext: UserContextV2 = {
    themes: ['travel'],
    contentType: 'Travel',
    hints: [],
    socialLinks: [],
    previousAnswers: testAnswers
  };
  
  const conflictQuestion = await dynamicQuestionServiceV2.generateNextQuestion(conflictContext, 3, []);
  console.log('Generated Question:', conflictQuestion.text);
  console.log('Options are budget-appropriate:', !conflictQuestion.options.some(opt => 
    opt.toLowerCase().includes('luxury') || opt.toLowerCase().includes('premium')
  ));
}

// Run the tests
testDynamicQuestions().catch(console.error);