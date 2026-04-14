import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { TrainingType, BodyPart, TrainingRange, CustomBodyPart } from '@/types';
import type {
  BeatData,
  InputEvent,
  InputType,
  TrainingSession,
  TimingFeedback as TimingFeedbackType,
} from '@/types/evaluation';
import { PatternGenerator, TimingEvaluator } from '@/utils/evaluator';
import { useInputHandler } from '@/hooks/useInputHandler';
import { useAudioBeep } from '@/hooks/useAudioBeep';
import { useUserProfile } from '@/hooks/useUserProfile';
import SessionResults from '@/components/SessionResults';
import { TrainingDisplay } from '@/components/TrainingDisplay';

type TrainingPhase = 'countdown' | 'training' | 'results';

export default function TrainingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const trainingType = (searchParams.get('trainingType') as TrainingType) || 'visual';
  const bodyPart = (searchParams.get('bodyPart') as BodyPart) || 'hand';
  const trainingRange = (searchParams.get('trainingRange') as TrainingRange) || 'both';
  const bpm = parseInt(searchParams.get('bpm') || '60');
  const duration = parseInt(searchParams.get('duration') || '1');

  // 커스텀 시퀀스 파싱
  const customSequenceParam = searchParams.get('customSequence');
  const customSequence: CustomBodyPart[] | null = useMemo(() => {
    if (!customSequenceParam) return null;
    try {
      const parsed = JSON.parse(customSequenceParam);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch (error) {
      console.error('Failed to parse custom sequence:', error);
      return null;
    }
  }, [customSequenceParam]);

  // 훈련 패턴 결정
  const pattern = useMemo(() => {
    if (customSequence) return null;
    return PatternGenerator.settingsToPattern(bodyPart, trainingRange);
  }, [customSequence, bodyPart, trainingRange]);

  // 상태 관리
  const [phase, setPhase] = useState<TrainingPhase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<TimingFeedbackType | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);

  // 시각 훈련용 상태 — currentBeat에서 파생: 별도 state로 관리 시 마지막 비트에서
  // clearInterval이 비동기 실행되어 여분 tick이 발생, side가 잘못 토글되는 버그 방지
  const currentSide: 'left' | 'right' = currentBeat % 2 === 0 ? 'left' : 'right';
  const [isActive, setIsActive] = useState(false);

  // Custom hooks
  const { userProfile, isLoading } = useUserProfile();
  const { playBeep, initAudio } = useAudioBeep();
  
  const handleExit = () => navigate('/');
  const handleRestart = () => window.location.reload();

  const intervalMs = 60000 / bpm;
  const totalBeats = Math.floor((duration * 60 * 1000) / intervalMs);
  const startTimeRef = useRef<number>(0);
  const sessionRef = useRef<TrainingSession | null>(null);
  const startTrainingRef = useRef<(() => void) | null>(null);
  // 비트 카운터를 타이머 콜백에서 동기적으로 추적: clearInterval을 React state updater
  // 내부(비동기)가 아닌 콜백 본문(동기)에서 호출하기 위해 필요
  const beatCounterRef = useRef(0);

  // sessionRef 동기화
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // 세션 초기화 및 시작
  const startTraining = useCallback(() => {
    if (!userProfile) return;
    if (!customSequence && !pattern) return;

    initAudio(); // Initialize audio context on user action
    startTimeRef.current = performance.now();
    const beats: BeatData[] = [];

    for (let i = 0; i < totalBeats; i++) {
      let expectedInput;
      if (customSequence) {
        const sequenceIndex = i % customSequence.length;
        const part = customSequence[sequenceIndex];
        expectedInput = {
          beatNumber: i,
          expectedTypes: [part as InputType],
          isAlternating: true,
          alternateIndex: sequenceIndex,
        };
      } else if (pattern) {
        expectedInput = PatternGenerator.generateExpectedInput(pattern, i);
      } else {
        continue;
      }

      beats.push({
        beatNumber: i,
        expectedTime: i * intervalMs,
        expectedInput,
        actualInput: null,
        actualTime: null,
        deviation: null,
        isCorrectInput: false,
        isWrongInput: false,
        feedback: null,
      });
    }

    const newSession: TrainingSession = {
      sessionId: `session-${Date.now()}`,
      sessionNumber: 0,
      date: new Date().toISOString(),
      startTime: Date.now(),
      userProfile,
      settings: {
        trainingType,
        bodyPart,
        trainingRange,
        bpm,
        durationMinutes: duration,
        pattern: (customSequence ? 'all-alternate' : pattern) as any,
      },
      beats,
    };

    setSession(newSession);
    setIsRunning(true);
    setPhase('training');
  }, [totalBeats, pattern, customSequence, intervalMs, trainingType, bodyPart, trainingRange, bpm, duration, userProfile]);

  // startTrainingRef 동기화 — stale closure 방지
  useEffect(() => {
    startTrainingRef.current = startTraining;
  }, [startTraining]);

  // 카운트다운 로직
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      const timer = setTimeout(() => {
        startTrainingRef.current?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, countdown]);

  // 세션 종료
  const finishSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setIsRunning(false);

    const results = TimingEvaluator.evaluateSession(
      currentSession.beats,
      currentSession.userProfile.age!,
      currentSession.settings.trainingType
    );

    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, results, endTime: Date.now() };
    });

    setPhase('results');
  }, []);

  // 입력 처리
  const handleInput = useCallback((inputEvent: InputEvent) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setSession((prev) => {
      if (!prev) return prev;

      const inputTimestamp = inputEvent.timestamp;
      let closestBeatIndex = -1;
      let minDistance = Infinity;

      // floor/ceil 기반 탐색: 이전 비트가 이미 맞춰진 상태에서
      // 다음 비트를 일찍 누르는 경우도 탐색 창에 항상 포함되도록 함
      const searchStart = Math.max(0, Math.floor(inputTimestamp / intervalMs) - 1);
      const searchEnd = Math.min(prev.beats.length - 1, Math.ceil(inputTimestamp / intervalMs) + 1);

      for (let i = searchStart; i <= searchEnd; i++) {
        const beat = prev.beats[i];
        if (beat.actualInput !== null) continue;

        const distance = Math.abs(inputTimestamp - beat.expectedTime);
        if (distance < minDistance) {
          minDistance = distance;
          closestBeatIndex = i;
        }
      }

      // 허용 창을 ±intervalMs/2로 제한: 각 비트의 절반 구간만 허용하여
      // 늦은 입력이 다음 비트에 잘못 할당되는 현상 방지
      if (closestBeatIndex === -1 || minDistance > intervalMs / 2) return prev;

      const currentBeatData = prev.beats[closestBeatIndex];

      const { feedback, isCorrectInput } = TimingEvaluator.evaluateBeat(
        currentBeatData.expectedTime,
        inputEvent.timestamp,
        inputEvent.type,
        currentBeatData.expectedInput
      );

      const updatedBeat: BeatData = {
        ...currentBeatData,
        actualInput: inputEvent,
        actualTime: inputEvent.timestamp,
        deviation: feedback.deviation,
        isCorrectInput,
        isWrongInput: !isCorrectInput,
        feedback,
      };

      const newBeats = [...prev.beats];
      newBeats[closestBeatIndex] = updatedBeat;

      setCurrentFeedback(feedback);

      return { ...prev, beats: newBeats };
    });
  }, [intervalMs]);

  // 입력 핸들러 등록
  useInputHandler({
    onInput: handleInput,
    enableKeyboard: phase === 'training',
    startTimeRef,
  });

  // 터치 입력 핸들러
  const handleTouchInput = useCallback((inputType: InputType) => {
    if (!session || !isRunning) return;

    const touchEvent: InputEvent = {
      type: inputType,
      timestamp: performance.now() - startTimeRef.current,
      source: 'touch',
      rawData: { inputType },
    };

    handleInput(touchEvent);
  }, [session, isRunning, handleInput]);

  // 비트 진행
  useEffect(() => {
    if (!isRunning || phase !== 'training') return;

    beatCounterRef.current = 0;

    // beat 0 즉시 flash (t=0): 첫 번째 가이드가 왼손부터 시작
    // setInterval은 첫 tick이 intervalMs 후에 발화하므로 beat 0는 별도로 처리
    if (trainingType === 'audio') playBeep();
    setIsActive(true);
    const firstFlashOff = setTimeout(() => setIsActive(false), intervalMs * 0.3);

    if (totalBeats <= 1) {
      setTimeout(() => finishSession(), 500);
      return () => clearTimeout(firstFlashOff);
    }

    // beat 1 ~ totalBeats-1: intervalMs 간격으로 진행
    const beatTimer = setInterval(() => {
      // Guard: 마지막 비트에 이미 도달했으면 차단
      if (beatCounterRef.current >= totalBeats - 1) {
        clearInterval(beatTimer);
        return;
      }

      if (trainingType === 'audio') {
        playBeep();
      }

      setIsActive(true);
      setTimeout(() => {
        setIsActive(false);
      }, intervalMs * 0.3);

      const nextBeat = beatCounterRef.current + 1;
      beatCounterRef.current = nextBeat;

      // 마지막 비트 도달 시 타이머 즉시 종료 (동기 clearInterval → 여분 tick 없음)
      if (nextBeat >= totalBeats - 1) {
        clearInterval(beatTimer);
        setTimeout(() => finishSession(), 500);
      }

      setCurrentBeat((prev) => {
        const currentSession = sessionRef.current;
        if (currentSession) {
          const previousBeat = currentSession.beats[prev];
          if (previousBeat && previousBeat.actualInput === null) {
            const missFeedback: TimingFeedbackType = {
              category: 'miss',
              deviation: 999,
              direction: 'late',
              points: 0,
              color: '#999999',
              message: 'MISSED',
              displayText: 'NO INPUT',
            };
            setCurrentFeedback(missFeedback);
          }
        }

        return nextBeat;
      });
    }, intervalMs);

    return () => {
      clearTimeout(firstFlashOff);
      clearInterval(beatTimer);
    };
  }, [isRunning, phase, intervalMs, totalBeats, trainingType, playBeep, finishSession]);

  // 타이머
  useEffect(() => {
    if (!isRunning || phase !== 'training') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase]);

  // ESC 키로 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (isLoading || !userProfile) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white text-2xl">로딩중...</div>;
  }

  if (phase === 'results' && session?.results) {
    return <SessionResults results={session.results} onRestart={handleRestart} onExit={handleExit} />;
  }

  const currentBeatData = session?.beats[currentBeat];
  const nextBeatData = session?.beats[currentBeat + 1];

  const handleLeftTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTouchInput(bodyPart === 'hand' ? 'left-hand' : 'left-foot');
  };

  const handleRightTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTouchInput(bodyPart === 'hand' ? 'right-hand' : 'right-foot');
  };

  if (phase === 'countdown') {
    return (
      <div className="relative">
        {/* 뒤에 훈련 화면 미리 표시 */}
        <TrainingDisplay
          trainingType={trainingType}
          bodyPart={bodyPart}
          trainingRange={trainingRange}
          bpm={bpm}
          timeRemaining={duration * 60}
          currentBeat={0}
          totalBeats={totalBeats}
          isActive={false}
          currentSide={currentSide}
          currentFeedback={null}
          currentBeatData={undefined}
          nextBeatData={undefined}
          onLeftTouch={handleLeftTouch}
          onRightTouch={handleRightTouch}
          onExit={handleExit}
          customSequence={customSequence || undefined}
        />
        {/* 카운트다운 오버레이 */}
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-white text-4xl font-bold mb-8">훈련 시작</h2>
            <div className="text-white text-9xl font-bold mb-4 animate-pulse">{countdown}</div>
            <div className="text-white text-2xl">시작까지...</div>
          </div>
        </div>
      </div>
    );
  }

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
      currentBeatData={currentBeatData}
      nextBeatData={nextBeatData}
      onLeftTouch={handleLeftTouch}
      onRightTouch={handleRightTouch}
      onExit={handleExit}
      customSequence={customSequence || undefined}
    />
  );
}
