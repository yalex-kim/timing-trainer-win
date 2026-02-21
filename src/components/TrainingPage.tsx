import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrainingType, BodyPart, TrainingRange, CustomBodyPart } from '@/types';
import { InputEvent, BeatData, TimingFeedback, SessionResults as SessionResultsType } from '@/types/evaluation';
import { UserProfile } from '@/types/evaluation';
import { useInputHandler } from '@/hooks/useInputHandler';
import { useAudioBeep } from '@/hooks/useAudioBeep';
import { TrainingDisplay } from './TrainingDisplay';
import SessionResults from './SessionResults';
import { evaluateInput, generateBeatData, aggregateSessionResults } from '@/utils/evaluator';

export default function TrainingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL params에서 설정 가져오기
  const trainingType = (searchParams.get('trainingType') as TrainingType) || 'visual';
  const bodyPart = (searchParams.get('bodyPart') as BodyPart) || 'hand';
  const trainingRange = (searchParams.get('trainingRange') as TrainingRange) || 'both';
  const bpm = parseInt(searchParams.get('bpm') || '60');
  const durationMinutes = parseInt(searchParams.get('duration') || '1');
  const customSequence = searchParams.get('customSequence')
    ? JSON.parse(searchParams.get('customSequence')!) as CustomBodyPart[]
    : undefined;

  // 사용자 프로필 로드
  const [userProfile] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('userProfile');
    return stored ? JSON.parse(stored) : null;
  });

  // 세션 상태
  const [isActive, setIsActive] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [currentSide, setCurrentSide] = useState<'left' | 'right'>('left');
  const [currentFeedback, setCurrentFeedback] = useState<TimingFeedback | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResultsType | null>(null);

  // 비트 데이터
  const [beatsData, setBeatsData] = useState<BeatData[]>([]);
  const totalBeats = Math.floor((durationMinutes * 60 * bpm) / 60);

  // 오디오
  const { playBeep } = useAudioBeep();

  // 비트 데이터 생성
  useEffect(() => {
    const beats = generateBeatData({
      totalBeats,
      bpm,
      bodyPart,
      trainingRange,
      trainingType,
      customSequence,
    });
    setBeatsData(beats);
  }, [totalBeats, bpm, bodyPart, trainingRange, trainingType, customSequence]);

  // 입력 처리
  const handleInput = useCallback((inputEvent: InputEvent) => {
    if (!isActive || currentBeat >= beatsData.length) return;

    const currentBeatData = beatsData[currentBeat];
    if (!currentBeatData) return;

    const feedback = evaluateInput(inputEvent, currentBeatData, userProfile);

    // 피드백 표시 (1초 동안)
    setCurrentFeedback(feedback);
    setTimeout(() => setCurrentFeedback(null), 1000);

    // 비트 데이터 업데이트
    currentBeatData.userInput = inputEvent;
    currentBeatData.timingFeedback = feedback;
  }, [isActive, currentBeat, beatsData, userProfile]);

  useInputHandler({
    onInput: handleInput,
    enableKeyboard: true,
  });

  // 터치 핸들러
  const handleLeftTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const inputEvent: InputEvent = {
      type: bodyPart === 'hand' ? 'left-hand' : 'left-foot',
      timestamp: performance.now(),
      source: 'touch',
    };
    handleInput(inputEvent);
  }, [bodyPart, handleInput]);

  const handleRightTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const inputEvent: InputEvent = {
      type: bodyPart === 'hand' ? 'right-hand' : 'right-foot',
      timestamp: performance.now(),
      source: 'touch',
    };
    handleInput(inputEvent);
  }, [bodyPart, handleInput]);

  // 타이머 & 비트 진행
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsActive(false);
          setSessionComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // 비트 진행
  useEffect(() => {
    if (!isActive) return;

    const beatInterval = (60 / bpm) * 1000;
    const timer = setInterval(() => {
      setCurrentBeat(prev => {
        const next = prev + 1;

        if (next >= totalBeats) {
          setIsActive(false);
          setSessionComplete(true);
          return prev;
        }

        // 청각 모드: 비프음 재생
        if (trainingType === 'audio') {
          playBeep();
        }

        // 좌우 교대 (both 모드인 경우)
        if (trainingRange === 'both' && !customSequence) {
          setCurrentSide(prev => prev === 'left' ? 'right' : 'left');
        }

        return next;
      });
    }, beatInterval);

    return () => clearInterval(timer);
  }, [isActive, bpm, totalBeats, trainingType, trainingRange, customSequence, playBeep]);

  // 세션 시작
  useEffect(() => {
    if (beatsData.length > 0) {
      setIsActive(true);
    }
  }, [beatsData]);

  // 세션 종료 시 결과 계산
  useEffect(() => {
    if (sessionComplete && beatsData.length > 0) {
      const results = aggregateSessionResults(beatsData, userProfile, trainingType);
      setSessionResults(results);
    }
  }, [sessionComplete, beatsData, userProfile, trainingType]);

  // 종료 핸들러
  const handleExit = useCallback(() => {
    if (window.confirm('훈련을 종료하시겠습니까?')) {
      navigate('/');
    }
  }, [navigate]);

  const handleRestart = useCallback(() => {
    window.location.reload();
  }, []);

  // 결과 화면
  if (sessionComplete && sessionResults) {
    return (
      <SessionResults
        results={sessionResults}
        onRestart={handleRestart}
        onExit={handleExit}
      />
    );
  }

  // 훈련 화면
  return (
    <TrainingDisplay
      trainingType={trainingType}
      bodyPart={bodyPart}
      trainingRange={trainingRange}
      bpm={bpm}
      timeRemaining={timeRemaining}
      currentBeat={currentBeat}
      totalBeats={totalBeats}
      isActive={isActive}
      currentSide={currentSide}
      currentFeedback={currentFeedback}
      currentBeatData={beatsData[currentBeat]}
      nextBeatData={beatsData[currentBeat + 1]}
      onLeftTouch={handleLeftTouch}
      onRightTouch={handleRightTouch}
      onExit={handleExit}
      title="훈련 모드"
      customSequence={customSequence}
    />
  );
}
