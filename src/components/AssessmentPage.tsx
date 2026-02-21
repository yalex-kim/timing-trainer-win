import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainingType, BodyPart, TrainingRange } from '@/types';
import { InputEvent, BeatData, TimingFeedback, SessionResults as SessionResultsType, ComprehensiveAssessmentReport as ComprehensiveAssessmentReportType, UserProfile } from '@/types/evaluation';
import { useInputHandler } from '@/hooks/useInputHandler';
import { useAudioBeep } from '@/hooks/useAudioBeep';
import { TrainingDisplay } from './TrainingDisplay';
import ComprehensiveAssessmentReport from './ComprehensiveAssessmentReport';
import { evaluateInput, generateBeatData, aggregateSessionResults } from '@/utils/evaluator';
import { generateComprehensiveReport } from '@/utils/assessmentReport';

// 8가지 검사 정의
interface AssessmentTest {
  name: string;
  trainingType: TrainingType;
  bodyPart: BodyPart;
  trainingRange: TrainingRange;
}

const ASSESSMENT_TESTS: AssessmentTest[] = [
  { name: '왼손 (청각)', trainingType: 'audio', bodyPart: 'hand', trainingRange: 'left' },
  { name: '왼손 (시각)', trainingType: 'visual', bodyPart: 'hand', trainingRange: 'left' },
  { name: '오른손 (청각)', trainingType: 'audio', bodyPart: 'hand', trainingRange: 'right' },
  { name: '오른손 (시각)', trainingType: 'visual', bodyPart: 'hand', trainingRange: 'right' },
  { name: '왼발 (청각)', trainingType: 'audio', bodyPart: 'foot', trainingRange: 'left' },
  { name: '왼발 (시각)', trainingType: 'visual', bodyPart: 'foot', trainingRange: 'left' },
  { name: '오른발 (청각)', trainingType: 'audio', bodyPart: 'foot', trainingRange: 'right' },
  { name: '오른발 (시각)', trainingType: 'visual', bodyPart: 'foot', trainingRange: 'right' },
];

const BPM = 60; // 검사 모드는 60 BPM 고정
const BEATS_PER_TEST = 60; // 각 검사당 60비트 (1분)

export default function AssessmentPage() {
  const navigate = useNavigate();

  // 사용자 프로필 로드
  const [userProfile] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('userProfile');
    return stored ? JSON.parse(stored) : null;
  });

  // 검사 진행 상태
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [allTestsResults, setAllTestsResults] = useState<{
    testName: string;
    sessionResults: SessionResultsType;
  }[]>([]);
  const [showingReport, setShowingReport] = useState(false);
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveAssessmentReportType | null>(null);

  // 현재 검사
  const currentTest = ASSESSMENT_TESTS[currentTestIndex];

  // 세션 상태
  const [isActive, setIsActive] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60); // 각 검사는 1분
  const [currentFeedback, setCurrentFeedback] = useState<TimingFeedback | null>(null);
  const [currentTestComplete, setCurrentTestComplete] = useState(false);

  // 비트 데이터
  const [beatsData, setBeatsData] = useState<BeatData[]>([]);

  // 오디오
  const { playBeep } = useAudioBeep();

  // 비트 데이터 생성
  useEffect(() => {
    if (!currentTest) return;

    const beats = generateBeatData({
      totalBeats: BEATS_PER_TEST,
      bpm: BPM,
      bodyPart: currentTest.bodyPart,
      trainingRange: currentTest.trainingRange,
      trainingType: currentTest.trainingType,
    });
    setBeatsData(beats);
    setCurrentBeat(0);
    setTimeRemaining(60);
    setCurrentTestComplete(false);
    setIsActive(true);
  }, [currentTest]);

  // 입력 처리
  const handleInput = useCallback((inputEvent: InputEvent) => {
    if (!isActive || currentBeat >= beatsData.length) return;

    const currentBeatData = beatsData[currentBeat];
    if (!currentBeatData) return;

    const feedback = evaluateInput(inputEvent, currentBeatData, userProfile);

    // 피드백 표시
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
      type: currentTest.bodyPart === 'hand' ? 'left-hand' : 'left-foot',
      timestamp: performance.now(),
      source: 'touch',
    };
    handleInput(inputEvent);
  }, [currentTest, handleInput]);

  const handleRightTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const inputEvent: InputEvent = {
      type: currentTest.bodyPart === 'hand' ? 'right-hand' : 'right-foot',
      timestamp: performance.now(),
      source: 'touch',
    };
    handleInput(inputEvent);
  }, [currentTest, handleInput]);

  // 타이머
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsActive(false);
          setCurrentTestComplete(true);
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

    const beatInterval = (60 / BPM) * 1000;
    const timer = setInterval(() => {
      setCurrentBeat(prev => {
        const next = prev + 1;

        if (next >= BEATS_PER_TEST) {
          setIsActive(false);
          setCurrentTestComplete(true);
          return prev;
        }

        // 청각 모드: 비프음 재생
        if (currentTest.trainingType === 'audio') {
          playBeep();
        }

        return next;
      });
    }, beatInterval);

    return () => clearInterval(timer);
  }, [isActive, currentTest, playBeep]);

  // 현재 검사 완료 처리
  useEffect(() => {
    if (!currentTestComplete || beatsData.length === 0) return;

    // 결과 계산
    const results = aggregateSessionResults(beatsData, userProfile, currentTest.trainingType);

    // 결과 저장
    setAllTestsResults(prev => [
      ...prev,
      {
        testName: currentTest.name,
        sessionResults: results,
      }
    ]);

    // 다음 검사로 이동 또는 종료
    setTimeout(() => {
      if (currentTestIndex < ASSESSMENT_TESTS.length - 1) {
        setCurrentTestIndex(prev => prev + 1);
      } else {
        // 모든 검사 완료: 종합 보고서 생성
        const report = generateComprehensiveReport(
          [...allTestsResults, { testName: currentTest.name, sessionResults: results }],
          userProfile
        );
        setComprehensiveReport(report);
        setShowingReport(true);
      }
    }, 2000); // 2초 대기 후 다음 검사
  }, [currentTestComplete, beatsData, userProfile, currentTest, currentTestIndex, allTestsResults]);

  // 종료 핸들러
  const handleExit = useCallback(() => {
    if (window.confirm('검사를 종료하시겠습니까?')) {
      navigate('/');
    }
  }, [navigate]);

  // 종합 보고서 화면
  if (showingReport && comprehensiveReport) {
    return (
      <ComprehensiveAssessmentReport
        report={comprehensiveReport}
        onClose={() => navigate('/')}
      />
    );
  }

  // 검사 대기 화면
  if (currentTestComplete) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-4xl font-bold mb-4">{currentTest.name} 완료</h2>
          <p className="text-xl">
            {currentTestIndex < ASSESSMENT_TESTS.length - 1
              ? `다음 검사: ${ASSESSMENT_TESTS[currentTestIndex + 1].name}`
              : '검사 결과 생성 중...'}
          </p>
          <div className="mt-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // 검사 진행 화면
  return (
    <TrainingDisplay
      trainingType={currentTest.trainingType}
      bodyPart={currentTest.bodyPart}
      trainingRange={currentTest.trainingRange}
      bpm={BPM}
      timeRemaining={timeRemaining}
      currentBeat={currentBeat}
      totalBeats={BEATS_PER_TEST}
      isActive={isActive}
      currentSide={currentTest.trainingRange === 'both' ? 'left' : currentTest.trainingRange}
      currentFeedback={currentFeedback}
      currentBeatData={beatsData[currentBeat]}
      nextBeatData={beatsData[currentBeat + 1]}
      onLeftTouch={handleLeftTouch}
      onRightTouch={handleRightTouch}
      onExit={handleExit}
      title={`검사 모드 (${currentTestIndex + 1}/${ASSESSMENT_TESTS.length}) - ${currentTest.name}`}
    />
  );
}
