import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatternGenerator, TimingEvaluator } from '@/utils/evaluator';
import { useInputHandler } from '@/hooks/useInputHandler';
import { useAudioBeep } from '@/hooks/useAudioBeep';
import { useUserProfile } from '@/hooks/useUserProfile';
import ComprehensiveAssessmentReport from '@/components/ComprehensiveAssessmentReport';
import { generateComprehensiveReport } from '@/utils/assessmentReport';
import { TrainingDisplay } from '@/components/TrainingDisplay';
import AppHeader from '@/components/AppHeader';
import { BODY_PART_HEX } from '@/utils/bodyPartColors';
import type { CustomBodyPart, TrainingType, BodyPart, TrainingRange } from '@/types';
import type {
  BeatData,
  InputEvent,
  InputType,
  TrainingSession,
  SessionResults as SessionResultsType,
  TimingFeedback as TimingFeedbackType,
} from '@/types/evaluation';

// 검사 순서 정의
interface AssessmentTest {
  id: number;
  name: string;
  bodyPart: BodyPart;
  trainingRange: TrainingRange;
  trainingType: TrainingType;
}

const ASSESSMENT_SEQUENCE: AssessmentTest[] = [
  { id: 1, name: '왼손 청각', bodyPart: 'hand', trainingRange: 'left', trainingType: 'audio' },
  { id: 2, name: '왼손 시각', bodyPart: 'hand', trainingRange: 'left', trainingType: 'visual' },
  { id: 3, name: '오른손 청각', bodyPart: 'hand', trainingRange: 'right', trainingType: 'audio' },
  { id: 4, name: '오른손 시각', bodyPart: 'hand', trainingRange: 'right', trainingType: 'visual' },
  { id: 5, name: '왼발 청각', bodyPart: 'foot', trainingRange: 'left', trainingType: 'audio' },
  { id: 6, name: '왼발 시각', bodyPart: 'foot', trainingRange: 'left', trainingType: 'visual' },
  { id: 7, name: '오른발 청각', bodyPart: 'foot', trainingRange: 'right', trainingType: 'audio' },
  { id: 8, name: '오른발 시각', bodyPart: 'foot', trainingRange: 'right', trainingType: 'visual' },
];

const BPM = 60;
const DURATION_SECONDS = 40;

type AssessmentPhase = 'ready' | 'countdown' | 'testing' | 'waiting' | 'complete';

const EyeIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EarIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 0 1-7 0" /><path d="M8.5 8.5a3.5 3.5 0 1 1 7 0c0 2.5-3 2.5-3 5" />
  </svg>
);

// 8개 시퀀스를 부위 4행 × 자극타입(청각/시각) 2열로 그룹화 (표시 전용, 순서/로직은 ASSESSMENT_SEQUENCE 그대로)
const ROW_CONFIG: { part: CustomBodyPart; label: string; audioId: number; visualId: number }[] = [
  { part: 'left-hand', label: '왼손', audioId: 1, visualId: 2 },
  { part: 'right-hand', label: '오른손', audioId: 3, visualId: 4 },
  { part: 'left-foot', label: '왼발', audioId: 5, visualId: 6 },
  { part: 'right-foot', label: '오른발', audioId: 7, visualId: 8 },
];

export default function AssessmentPage() {
  const navigate = useNavigate();

  // Custom hooks
  const { userProfile, isLoading } = useUserProfile();
  const { playBeep, initAudio } = useAudioBeep();
  
  // Navigation Handlers
  const handleExit = () => navigate('/');
  const handleRestart = () => window.location.reload();

  // 검사 진행 상태
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [phase, setPhase] = useState<AssessmentPhase>('ready');
  const [countdown, setCountdown] = useState(5);

  // 현재 검사 세션
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<TimingFeedbackType | null>(null);
  // currentFeedback이 어느 입력 타입(부위)에 대한 것인지 — 표시 시점에 currentBeat가 이미
  // 다음 비트로 넘어가 있을 수 있어, 피드백 생성 시점의 expectedTypes를 별도로 기억해 둔다.
  const [currentFeedbackTypes, setCurrentFeedbackTypes] = useState<InputType[] | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(DURATION_SECONDS);

  // 시각 훈련용 상태
  const [currentSide, setCurrentSide] = useState<'left' | 'right'>('left');
  const [isActive, setIsActive] = useState(false);

  // 모든 검사 결과 저장
  const [allResults, setAllResults] = useState<SessionResultsType[]>([]);
  const [completedSessions, setCompletedSessions] = useState<TrainingSession[]>([]);

  const intervalMs = 60000 / BPM;
  const totalBeats = Math.floor((DURATION_SECONDS * 1000) / intervalMs);
  const startTimeRef = useRef<number>(0);
  const sessionRef = useRef<TrainingSession | null>(null);
  const currentTestIndexRef = useRef<number>(0);

  const currentTest = ASSESSMENT_SEQUENCE[currentTestIndex];

  // Refs 동기화
  useEffect(() => {
    currentTestIndexRef.current = currentTestIndex;
  }, [currentTestIndex]);

  // sessionRef 동기화
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // 검사 시작
  const startTest = useCallback(() => {
    if (!userProfile || !currentTest) return;

    initAudio(); // Initialize audio context on user action
    const pattern = PatternGenerator.settingsToPattern(currentTest.bodyPart, currentTest.trainingRange);
    startTimeRef.current = performance.now();
    const beats: BeatData[] = [];

    for (let i = 0; i < totalBeats; i++) {
      const expectedInput = PatternGenerator.generateExpectedInput(pattern, i);
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
      sessionId: `assessment-${currentTestIndexRef.current}-${Date.now()}`,
      sessionNumber: currentTestIndexRef.current,
      date: new Date().toISOString(),
      startTime: Date.now(),
      userProfile,
      settings: {
        trainingType: currentTest.trainingType,
        bodyPart: currentTest.bodyPart,
        trainingRange: currentTest.trainingRange,
        bpm: BPM,
        durationMinutes: DURATION_SECONDS / 60,
        pattern,
      },
      beats,
    };

    setSession(newSession);
    setCurrentBeat(0);
    setIsRunning(true);
    setPhase('testing');
    setTimeRemaining(DURATION_SECONDS);
  }, [userProfile, currentTest, totalBeats, intervalMs]);

  // 카운트다운 로직
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      const timer = setTimeout(() => {
        startTest();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, countdown, startTest]);

  // 검사 종료
  const finishTest = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    // StrictMode 이중 호출 방지: ref를 즉시 null로 초기화
    sessionRef.current = null;

    setIsRunning(false);

    const results = TimingEvaluator.evaluateSession(
      currentSession.beats,
      currentSession.userProfile.age!,
      currentSession.settings.trainingType
    );

    // Store both results and completed session with results attached
    const completedSession: TrainingSession = {
      ...currentSession,
      results,
    };

    setAllResults((prev) => [...prev, results]);
    setCompletedSessions((prev) => [...prev, completedSession]);
    setSession(null);

    // 다음 검사가 있으면 대기 상태, 없으면 완료
    if (currentTestIndexRef.current < ASSESSMENT_SEQUENCE.length - 1) {
      setPhase('waiting');
    } else {
      setPhase('complete');
    }
  }, []);

  // 입력 처리
  const handleInput = useCallback((inputEvent: InputEvent) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setSession((prev) => {
      if (!prev) return prev;

      // useInputHandler에서 startTimeRef 기준으로 계산된 타임스탬프 사용
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
      if (closestBeatIndex === -1 || minDistance > intervalMs / 2) {
        return prev;
      }

      const currentBeatData = prev.beats[closestBeatIndex];

      const { feedback, isCorrectInput } = TimingEvaluator.evaluateBeat(
        currentBeatData.expectedTime,
        inputTimestamp,
        inputEvent.type,
        currentBeatData.expectedInput
      );

      const updatedBeat: BeatData = {
        ...currentBeatData,
        actualInput: inputEvent,
        actualTime: inputTimestamp,
        deviation: feedback.deviation,
        isCorrectInput,
        isWrongInput: !isCorrectInput,
        feedback,
      };

      const newBeats = [...prev.beats];
      newBeats[closestBeatIndex] = updatedBeat;

      setCurrentFeedback(feedback);
      setCurrentFeedbackTypes(currentBeatData.expectedInput.expectedTypes);

      return { ...prev, beats: newBeats };
    });
  }, [intervalMs]);

  // 입력 핸들러 등록
  useInputHandler({
    onInput: handleInput,
    enableKeyboard: phase === 'testing',
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
    if (!isRunning || phase !== 'testing') return;

    const beatTimer = setInterval(() => {
      if (currentTest.trainingType === 'audio') {
        playBeep();
      }

      // 시각/청각 모두 화면 깜빡임 효과
      setIsActive(true);
      if (currentTest.trainingRange === 'both') {
        setCurrentSide((prev) => (prev === 'left' ? 'right' : 'left'));
      }
      setTimeout(() => {
        setIsActive(false);
      }, intervalMs * 0.3);

      setCurrentBeat((prev) => {
        const currentSession = sessionRef.current;
        if (currentSession && prev > 0) {
          const previousBeat = currentSession.beats[prev - 1];
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
            setCurrentFeedbackTypes(previousBeat.expectedInput.expectedTypes);
          }
        }

        if (prev + 1 >= totalBeats) {
          clearInterval(beatTimer);
          setTimeout(() => {
            finishTest();
          }, 500);
          return prev + 1;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(beatTimer);
  }, [isRunning, phase, intervalMs, totalBeats, currentTest, playBeep, finishTest]);

  // 타이머
  useEffect(() => {
    if (!isRunning || phase !== 'testing') return;

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

  // 다음 검사로 진행
  const handleNextTest = useCallback(() => {
    setCurrentTestIndex((prev) => prev + 1);
    setCountdown(5);
    setPhase('countdown');
    setCurrentFeedback(null);
    setCurrentFeedbackTypes(null);
  }, []);

  // Enter 키로 다음 검사 시작
  useEffect(() => {
    if (phase !== 'waiting') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      handleNextTest();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, handleNextTest]);

  // ESC 키로 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'testing') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, phase]);

  // 로딩 중
  if (isLoading || !userProfile) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white text-2xl">
        로딩중...
      </div>
    );
  }

  // 완료 화면 (종합 결과)
  if (phase === 'complete' && completedSessions.length >= 8) {
    try {
      const report = generateComprehensiveReport(completedSessions.slice(0, 8));

      return (
        <ComprehensiveAssessmentReport
          report={report}
          onClose={handleExit}
        />
      );
    } catch (error) {
      console.error('Failed to generate comprehensive report:', error);

      // Fallback
      const totalTaskAverage = allResults.reduce((sum, r) => sum + r.taskAverage, 0) / allResults.length;

      return (
        <div className="fixed inset-0 bg-black overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center">
            <div className="bg-white rounded-lg shadow-2xl p-8 m-8 max-w-4xl w-full">
              <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
                검사 완료
              </h1>

              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">종합 리포트 생성 실패: {(error as Error).message}</p>
              </div>

              <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h2 className="text-2xl font-bold text-green-800 mb-4">종합 결과</h2>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">전체 평균 Task Average</div>
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    {totalTaskAverage.toFixed(1)}ms
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleRestart} className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold">다시 검사</button>
                <button onClick={handleExit} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold">홈으로</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // 준비/대기 화면 (8개 시퀀스 진행 그리드 + 다음 검사 사이드바) — phase==='ready'|'waiting' 공용
  if (phase === 'ready' || phase === 'waiting') {
    const doneCount = completedSessions.length;
    const nextIndex = doneCount;
    const nextTest = ASSESSMENT_SEQUENCE[nextIndex];
    const isWaiting = phase === 'waiting';

    const cellStatus = (testId: number) => {
      const idx = testId - 1;
      if (idx < doneCount) return { state: 'done' as const, grade: allResults[idx]?.classLevel };
      if (idx === nextIndex) return { state: 'next' as const };
      return { state: 'waiting' as const };
    };

    const renderCell = (testId: number) => {
      const status = cellStatus(testId);
      if (status.state === 'done') {
        return (
          <div className="bg-tt-card border border-tt-border-alt rounded-[10px] p-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#1f9d57]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f9d57" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-10" />
              </svg>
              완료
            </span>
            <span className="font-mono text-sm font-semibold text-tt-heading">
              {status.grade}<span className="text-[11px] text-tt-light-muted">등급</span>
            </span>
          </div>
        );
      }
      if (status.state === 'next') {
        return (
          <div className="bg-tt-teal border-[1.5px] border-tt-teal rounded-[10px] p-3 flex items-center justify-between shadow-[0_6px_16px_rgba(15,110,120,.25)]">
            <span className="text-[12.5px] font-extrabold text-white">{isWaiting ? '진행 중' : '다음'}</span>
            <span className="font-mono text-xs font-semibold text-white/80">NOW</span>
          </div>
        );
      }
      return (
        <div className="bg-tt-bg border border-dashed border-tt-border-alt rounded-[10px] p-3 flex items-center justify-center">
          <span className="text-[12.5px] font-semibold text-tt-light-muted">대기</span>
        </div>
      );
    };

    const handleStartNext = () => {
      if (isWaiting) {
        handleNextTest();
      } else {
        setCountdown(5);
        setPhase('countdown');
      }
    };

    return (
      <div className="fixed inset-0 bg-tt-card flex flex-col">
        <AppHeader
          serialStatus={{ isConnected: false, portPath: '' }}
          userProfile={userProfile}
          breadcrumb={{ parent: '활동 선택', current: '표준 검사', onParentClick: handleExit }}
        />
        <main className="flex-1 bg-tt-bg grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-5.5 p-[28px_30px] overflow-auto">
          <div className="flex flex-col">
            <div className="flex items-baseline justify-between mb-1.5">
              <h2 className="m-0 text-xl font-extrabold text-tt-heading tracking-tight">표준 평가 배터리</h2>
              <span className="font-mono text-xs text-tt-light-muted">BPM {BPM} 고정 · 8개 테스트</span>
            </div>
            <p className="m-0 mb-4 text-[13px] text-tt-muted">
              4개 부위 × 시각/청각 자극 = 8개 표준화 테스트. 연령 기준표로 등급(1–7)을 산출합니다.
            </p>

            <div className="grid grid-cols-[150px_1fr_1fr] gap-2.5 items-center mb-2">
              <div />
              <div className="flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-tt-muted">
                <EyeIcon /> 시각
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-tt-muted">
                <EarIcon /> 청각
              </div>
            </div>

            <div className="flex flex-col gap-2.5 flex-1">
              {ROW_CONFIG.map((row) => (
                <div key={row.part} className="grid grid-cols-[150px_1fr_1fr] gap-2.5 items-stretch">
                  <div className="flex items-center gap-2.5 bg-tt-card border border-tt-border-alt rounded-[10px] px-3.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: BODY_PART_HEX[row.part] }} />
                    <span className="text-sm font-extrabold text-tt-heading">{row.label}</span>
                  </div>
                  {renderCell(row.audioId)}
                  {renderCell(row.visualId)}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-tt-card border border-tt-border-alt rounded-xl p-5.5 text-center">
              <div className="relative w-24 h-24 mx-auto mb-3.5">
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r="42" fill="none" stroke="#e6eaed" strokeWidth={9} />
                  <circle
                    cx="48" cy="48" r="42" fill="none" stroke="#0f6e78" strokeWidth={9} strokeLinecap="round"
                    strokeDasharray="263.9" strokeDashoffset={263.9 * (1 - doneCount / 8)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl font-semibold text-tt-heading leading-none">{doneCount}</span>
                  <span className="text-[11px] text-tt-light-muted">/ 8</span>
                </div>
              </div>
              <div className="text-[13px] text-tt-muted">완료한 검사</div>
            </div>

            <div className="bg-tt-card border border-tt-border-alt rounded-xl p-5 flex-1 flex flex-col">
              <div className="font-mono text-[11px] tracking-wider text-tt-light-muted-alt font-semibold mb-3.5">NEXT TEST</div>
              {nextTest && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ background: BODY_PART_HEX[`${nextTest.trainingRange}-${nextTest.bodyPart}` as CustomBodyPart] }} />
                    <span className="text-xl font-extrabold text-tt-heading">{ROW_CONFIG.find((r) => `${nextTest.trainingRange}-${nextTest.bodyPart}` === r.part)?.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] text-tt-muted mb-auto">
                    {nextTest.trainingType === 'audio' ? <EarIcon /> : <EyeIcon />}
                    {nextTest.trainingType === 'audio' ? '청각' : '시각'} 자극 · {DURATION_SECONDS}초
                  </div>
                  <button
                    onClick={handleStartNext}
                    className="bg-tt-teal hover:bg-tt-teal-dark rounded-[10px] h-12.5 text-[15px] font-extrabold text-white flex items-center justify-center gap-2 mt-4 transition-all"
                  >
                    검사 시작 <span className="text-base">▶</span>
                  </button>
                </>
              )}
              {isWaiting && (
                <p className="text-xs text-tt-light-muted text-center mt-3">(또는 Enter 키를 눌러주세요)</p>
              )}
              <button onClick={handleExit} className="mt-2 text-xs text-tt-light-muted hover:text-red-500 transition-colors">
                검사 중단하고 홈으로
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 검사 진행 화면 공통 변수
  const currentBeatData = session?.beats[currentBeat];
  const nextBeatData = session?.beats[currentBeat + 1];

  const handleLeftTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTouchInput(currentTest.bodyPart === 'hand' ? 'left-hand' : 'left-foot');
  };

  const handleRightTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTouchInput(currentTest.bodyPart === 'hand' ? 'right-hand' : 'right-foot');
  };

  // 카운트다운 화면 — TrainingDisplay를 뒤에 보여주고 반투명 오버레이로 카운트다운 표시
  if (phase === 'countdown') {
    return (
      <div className="relative">
        <TrainingDisplay
          trainingType={currentTest.trainingType}
          bodyPart={currentTest.bodyPart}
          trainingRange={currentTest.trainingRange}
          bpm={BPM}
          timeRemaining={DURATION_SECONDS}
          currentBeat={0}
          totalBeats={totalBeats}
          isActive={false}
          currentSide={currentSide}
          currentFeedback={null}
          currentFeedbackTypes={null}
          currentBeatData={undefined}
          nextBeatData={undefined}
          onLeftTouch={handleLeftTouch}
          onRightTouch={handleRightTouch}
          onExit={handleExit}
          title={`${currentTest.name} (${currentTestIndex + 1}/${ASSESSMENT_SEQUENCE.length})`}
          showFeedback={false}
        />
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-white text-4xl font-bold mb-8">{currentTest.name}</h2>
            <div className="text-white text-9xl font-bold mb-4 animate-pulse">{countdown}</div>
            <div className="text-white text-2xl">검사 시작까지...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TrainingDisplay
      trainingType={currentTest.trainingType}
      bodyPart={currentTest.bodyPart}
      trainingRange={currentTest.trainingRange}
      bpm={BPM}
      timeRemaining={timeRemaining}
      currentBeat={currentBeat}
      totalBeats={totalBeats}
      isActive={isActive}
      currentSide={currentSide}
      currentFeedback={currentFeedback}
      currentFeedbackTypes={currentFeedbackTypes}
      currentBeatData={currentBeatData}
      nextBeatData={nextBeatData}
      onLeftTouch={handleLeftTouch}
      onRightTouch={handleRightTouch}
      onExit={handleExit}
      title={`${currentTest.name} (${currentTestIndex + 1}/${ASSESSMENT_SEQUENCE.length})`}
      showFeedback={false}
    />
  );
}
