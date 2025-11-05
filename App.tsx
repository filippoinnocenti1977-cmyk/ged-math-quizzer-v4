import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Question } from './types';
import { generateQuestion, generateExplanation } from './services/geminiService';
import QuestionCard from './components/QuestionCard';
import Explanation from './components/Explanation';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [score, setScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const timerRef = useRef<number | null>(null);

  const handleAnswerSelect = useCallback(async (selectedIndex: number) => {
    if (isAnswered) return;

    setIsAnswered(true);
    setSelectedAnswerIndex(selectedIndex);
    setQuestionsAnswered(prev => prev + 1);

    if (question) {
      if (selectedIndex === question.correctAnswerIndex) {
        setScore(prevScore => prevScore + 1);
      } else {
        setIsLoading(true);
        try {
          const incorrectSelection = selectedIndex === -1 ? undefined : question.options[selectedIndex];
          const generatedExplanation = await generateExplanation(question, incorrectSelection);
          setExplanation(generatedExplanation);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not fetch explanation.');
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [isAnswered, question]);

  useEffect(() => {
    if (isAnswered || !question) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    setTimeLeft(60);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!);
          handleAnswerSelect(-1); 
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [question, isAnswered, handleAnswerSelect]);
  
  const fetchNextQuestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedAnswerIndex(null);
    setIsAnswered(false);
    setExplanation('');
    try {
      const newQuestion = await generateQuestion(difficulty, questionHistory);
      setQuestion(newQuestion);
      setQuestionHistory(prev => [...prev, newQuestion.question].slice(-5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, questionHistory]);

  useEffect(() => {
    const getFirstQuestionForDifficulty = async () => {
        setIsLoading(true);
        setError(null);
        setQuestion(null);
        setSelectedAnswerIndex(null);
        setIsAnswered(false);
        setExplanation('');
        try {
            const newQuestion = await generateQuestion(difficulty, []);
            setQuestion(newQuestion);
            setQuestionHistory([newQuestion.question]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    getFirstQuestionForDifficulty();
  }, [difficulty]);

  const handleDifficultyChange = (level: 'easy' | 'medium' | 'hard') => {
    if (difficulty !== level) {
      setDifficulty(level);
      setScore(0);
      setQuestionsAnswered(0);
      setQuestionHistory([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900">GED Math Quizzer</h1>
          <p className="text-slate-600 mt-2 text-lg">Sharpen your skills for test day!</p>
        </header>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6">
            <p className="text-2xl font-bold text-slate-700 bg-slate-200/50 rounded-lg py-2 px-4 inline-block order-2 sm:order-1">
                Score: <span className="text-blue-600 tabular-nums">{score}</span> / <span className="tabular-nums">{questionsAnswered}</span>
            </p>
            <div className={`
              text-2xl font-bold rounded-lg py-2 px-4 transition-colors duration-300 order-1 sm:order-2
              ${timeLeft <= 10 ? 'text-red-600 bg-red-100/75' : 'text-slate-700 bg-slate-200/50'}
            `}>
                Time Left: <span className="tabular-nums w-[70px] inline-block text-center">{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>
        </div>

        <div className="flex justify-center space-x-2 sm:space-x-4 mb-8">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              className={`
                px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300
                capitalize text-base shadow-sm
                ${difficulty === level
                  ? 'bg-blue-600 text-white transform scale-105 shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-100 hover:shadow-md'}
              `}
            >
              {level}
            </button>
          ))}
        </div>

        <main className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 min-h-[400px] flex flex-col justify-center">
          {isLoading && !question && <LoadingSpinner />}
          {error && (
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <button
                onClick={fetchNextQuestion}
                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
          {question && (
            <div>
              <QuestionCard
                question={question}
                onAnswerSelect={handleAnswerSelect}
                selectedAnswerIndex={selectedAnswerIndex}
                isAnswered={isAnswered}
              />
              {isLoading && isAnswered && <LoadingSpinner />}
              {explanation && <Explanation text={explanation} />}

              {isAnswered && (
                <div className="text-center mt-10">
                  <button
                    onClick={fetchNextQuestion}
                    className="bg-blue-600 text-white font-bold py-3 px-8 text-lg rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                  >
                    Next Question
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;