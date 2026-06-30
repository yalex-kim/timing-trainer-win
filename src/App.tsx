import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_SETTINGS } from '@/types';
import type { TrainingSettings, CustomBodyPart } from '@/types';
import type { UserProfile } from '@/types/evaluation';
import { calculateAge } from '@/utils/evaluator';
import { getBodyPartLabel, BODY_PART_HEX } from '@/utils/bodyPartColors';
import { BodyPartSvgIcon } from '@/components/icons/BodyPartIcons';
import SerialSettings from '@/components/SerialSettings';
import AppHeader from '@/components/AppHeader';
import { useAudioBeep } from '@/hooks/useAudioBeep';

const ALL_BODY_PARTS: CustomBodyPart[] = ['left-hand', 'right-hand', 'left-foot', 'right-foot'];

export default function Home() {
  const navigate = useNavigate();
  const { initAudio } = useAudioBeep();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [step, setStep] = useState<'home' | 'setup'>('home');
  const [mode, setMode] = useState<'training' | 'assessment' | null>(null);
  const [settings, setSettings] = useState<TrainingSettings>(DEFAULT_SETTINGS);
  const [serialStatus, setSerialStatus] = useState({ isConnected: false, portPath: '' });

  const getDefaultBirthDate = () => {
    const today = new Date();
    const sixYearsAgo = new Date(today.getFullYear() - 6, today.getMonth(), today.getDate());
    return sixYearsAgo.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: '',
    birthDate: getDefaultBirthDate(),
    gender: 'male' as 'male' | 'female',
  });

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const profile = JSON.parse(stored) as UserProfile;
      profile.age = calculateAge(profile.birthDate);
      setUserProfile(profile);
    } else {
      setShowUserForm(true);
    }
  }, []);

  const ftdiAutoConnectDone = useRef(false);
  useEffect(() => {
    if (ftdiAutoConnectDone.current) return;
    ftdiAutoConnectDone.current = true;

    const autoConnectFtdi = async () => {
      try {
        const portList = await window.electronAPI.listPorts();
        const ftdi = portList.find((p: any) => {
          const mfr = (p.manufacturer ?? '').toLowerCase();
          const vid = (p.vendorId ?? '').toLowerCase();
          const pnp = (p.pnpId ?? '').toLowerCase();
          return (
            mfr.includes('ftdi') ||
            mfr.includes('future technology') ||
            vid === '0403' ||
            pnp.includes('vid_0403')
          );
        });
        if (ftdi) {
          await window.electronAPI.connect(ftdi.path, 115200);
          setSerialStatus({ isConnected: true, portPath: ftdi.path });
        }
      } catch {
        // 자동 연결 실패는 무시
      }
    };
    autoConnectFtdi();
  }, []);

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initAudio();
    const profile: UserProfile = {
      ...formData,
      age: calculateAge(formData.birthDate),
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setUserProfile(profile);
    setShowUserForm(false);
  };

  const handleEditUser = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        birthDate: userProfile.birthDate,
        gender: userProfile.gender,
      });
    }
    setShowUserForm(true);
  };

  const addToSequence = (part: CustomBodyPart) => {
    const currentSequence = settings.customSequence || [];
    if (currentSequence.length >= 8) {
      alert('최대 8개까지만 선택 가능합니다.');
      return;
    }
    setSettings({ ...settings, customSequence: [...currentSequence, part] });
  };

  const removeFromSequence = (index: number) => {
    const currentSequence = settings.customSequence || [];
    const newSequence = currentSequence.filter((_, i) => i !== index);
    setSettings({ ...settings, customSequence: newSequence.length > 0 ? newSequence : undefined });
  };

  const clearSequence = () => {
    setSettings({ ...settings, customSequence: undefined });
  };

  /* ── 홈 화면: 모드만 고른 뒤 "세션 시작" — 훈련은 설정 화면으로, 검사는 바로 시작 ── */
  const handleHomeNext = () => {
    initAudio();
    if (!userProfile) {
      alert('사용자 정보를 먼저 입력해주세요.');
      return;
    }
    if (mode === 'assessment') {
      navigate('/assessment');
      return;
    }
    if (mode === 'training') {
      setStep('setup');
    }
  };

  /* ── 훈련 설정 화면: 실제 훈련 시작 ── */
  const handleStart = () => {
    initAudio();
    if (!userProfile) {
      alert('사용자 정보를 먼저 입력해주세요.');
      return;
    }
    if (!settings.customSequence || settings.customSequence.length === 0) {
      alert('훈련할 순서를 선택해주세요. (최소 1개 이상)');
      return;
    }
    const params = new URLSearchParams({
      trainingType: settings.trainingType,
      bodyPart: settings.bodyPart,
      trainingRange: settings.trainingRange,
      bpm: settings.bpm.toString(),
      duration: settings.durationMinutes.toString(),
    });
    if (settings.customSequence) {
      params.set('customSequence', JSON.stringify(settings.customSequence));
    }
    navigate(`/training?${params.toString()}`);
  };

  /* ─────────────────────────────────────────
     사용자 정보 입력 화면
  ───────────────────────────────────────── */
  if (showUserForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tt-bg">
        <div className="bg-tt-card rounded-2xl tt-card-shadow w-full max-w-sm overflow-hidden">
          {/* 카드 상단 헤더 */}
          <div className="bg-tt-teal px-8 py-6 text-white">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
              Timing Trainer
            </p>
            <h1 className="text-2xl font-bold">
              {userProfile ? '사용자 정보 수정' : '사용자 등록'}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              정확한 평가를 위해 정보를 입력해 주세요
            </p>
          </div>

          {/* 폼 영역 */}
          <form onSubmit={handleUserFormSubmit} className="px-8 py-7 space-y-5">
            {/* 이름 */}
            <div>
              <label className="block text-xs font-semibold text-tt-light-muted uppercase tracking-wider mb-1.5">
                이름
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 text-tt-heading bg-tt-bg border border-tt-border-alt rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tt-teal focus:border-transparent transition-all"
                placeholder="홍길동"
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-xs font-semibold text-tt-light-muted uppercase tracking-wider mb-1.5">
                생년월일
              </label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-2.5 text-tt-heading bg-tt-bg border border-tt-border-alt rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tt-teal focus:border-transparent transition-all"
              />
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-xs font-semibold text-tt-light-muted uppercase tracking-wider mb-1.5">
                성별
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                    formData.gender === 'male'
                      ? 'bg-tt-teal text-white border-tt-teal shadow-sm'
                      : 'bg-tt-card text-tt-muted-alt border-tt-border-alt hover:border-tt-teal hover:text-tt-teal'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                    formData.gender === 'female'
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'bg-tt-card text-tt-muted-alt border-tt-border-alt hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            {/* 버튼 */}
            <div className="pt-1 space-y-2">
              <button
                type="submit"
                className="w-full bg-tt-teal hover:bg-tt-teal-dark active:bg-tt-teal-dark text-white py-3 rounded-lg font-semibold text-sm transition-all shadow-sm"
              >
                {userProfile ? '수정 완료' : '시작하기'}
              </button>
              {userProfile && (
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="w-full bg-tt-bg hover:bg-tt-border-alt text-tt-muted-alt py-2.5 rounded-lg font-medium text-sm transition-all"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     ① 홈 · 활동 선택
  ───────────────────────────────────────── */
  if (step === 'home') {
    return (
      <div className="min-h-screen bg-tt-card flex flex-col">
        <AppHeader
          serialStatus={serialStatus}
          userProfile={userProfile}
          onEditUser={handleEditUser}
          onOpenSettings={() => setShowSettings(true)}
        />

        <main className="flex-1 bg-tt-bg flex items-center justify-center p-10">
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* 좌측: 히어로 */}
            <div>
              <div className="font-mono text-xs tracking-[2px] text-tt-teal font-semibold mb-[18px]">
                01 — 활동 선택
              </div>
              <h1 className="m-0 text-[42px] font-extrabold text-tt-heading leading-[1.12] tracking-[-1.2px]">
                오늘의<br />세션을<br />시작합니다
              </h1>
              <p className="mt-5 text-[14.5px] text-tt-muted max-w-[310px] leading-[1.65]">
                Interactive Metronome 기반 타이밍 협응 훈련 및 표준화 평가 시스템.
              </p>
              <div className="mt-7 font-mono text-[12.5px] text-tt-light-muted border-t border-tt-border-soft pt-4 max-w-[310px] leading-[1.9]">
                대상 &nbsp;·&nbsp; {userProfile ? `${userProfile.name} (만 ${userProfile.age}세)` : '미등록'}<br />
                장치 &nbsp;·&nbsp; {serialStatus.isConnected ? serialStatus.portPath : '미연결'}
              </div>
            </div>

            {/* 우측: 모드 카드 */}
            <div className="flex flex-col gap-3.5">
              <button
                onClick={() => setMode('training')}
                className={`bg-tt-card rounded-[7px] px-6 py-[22px] flex gap-[18px] items-center cursor-pointer border transition-all text-left ${
                  mode === 'training'
                    ? 'border-[1.5px] border-tt-teal shadow-[0_8px_22px_rgba(15,110,120,.1)]'
                    : 'border-tt-border-alt hover:border-tt-teal/50'
                }`}
              >
                <div className="font-mono text-[13px] text-tt-teal font-semibold w-[18px]">A</div>
                <div className="flex-1">
                  <div className="text-lg font-extrabold text-tt-heading">훈련 모드</div>
                  <div className="text-[13px] text-tt-muted mt-0.5">BPM · 부위 · 시간 자유 설정</div>
                </div>
                <div className="w-[42px] h-[42px] rounded-[9px] bg-tt-teal/10 flex items-center justify-center flex-none">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f6e78" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.6" fill="#0f6e78" stroke="none" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => setMode('assessment')}
                className={`bg-tt-card rounded-[7px] px-6 py-[22px] flex gap-[18px] items-center cursor-pointer border transition-all text-left ${
                  mode === 'assessment'
                    ? 'border-[1.5px] border-tt-teal shadow-[0_8px_22px_rgba(15,110,120,.1)]'
                    : 'border-tt-border-alt hover:border-tt-teal/50'
                }`}
              >
                <div className="font-mono text-[13px] text-tt-teal font-semibold w-[18px]">B</div>
                <div className="flex-1">
                  <div className="text-lg font-extrabold text-tt-heading">검사 모드</div>
                  <div className="text-[13px] text-tt-muted mt-0.5">8개 표준화 테스트 · 등급 평가</div>
                </div>
                <div className="w-[42px] h-[42px] rounded-[9px] bg-tt-teal/10 flex items-center justify-center flex-none">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f6e78" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="M9 12h6M9 16h4" />
                  </svg>
                </div>
              </button>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => navigate('/standards')}
                  className="flex items-center gap-2 bg-tt-card border border-tt-border-soft rounded-lg px-[18px] h-[50px] text-[13.5px] font-semibold text-tt-muted-alt hover:border-tt-teal hover:text-tt-teal transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                  </svg>
                  기준표
                </button>
                <button
                  onClick={handleHomeNext}
                  disabled={!mode}
                  className={`flex-1 rounded-lg h-[50px] text-[14.5px] font-bold flex items-center justify-center gap-2 transition-all ${
                    !mode
                      ? 'bg-tt-border-alt text-tt-light-muted cursor-not-allowed'
                      : 'bg-tt-teal hover:bg-tt-teal-dark text-white'
                  }`}
                >
                  세션 시작 <span className="text-base">→</span>
                </button>
              </div>

              {import.meta.env.DEV && (
                <button
                  onClick={() => navigate('/dev/report-preview')}
                  className="text-xs text-tt-light-muted hover:text-tt-teal transition-colors text-left mt-1"
                >
                  🧪 더미 데이터로 리포트 미리보기 (개발용)
                </button>
              )}
            </div>
          </div>
        </main>

        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            serialStatus={serialStatus}
            onStatusChange={(isConnected, path) => setSerialStatus({ isConnected, portPath: path })}
          />
        )}
      </div>
    );
  }

  /* ─────────────────────────────────────────
     ② 훈련 설정
  ───────────────────────────────────────── */
  const isSetupStartDisabled = !settings.customSequence || settings.customSequence.length === 0;
  const estimatedReps = Math.round(settings.durationMinutes * settings.bpm);
  const durationLabel = `${settings.durationMinutes}:00`;

  return (
    <div className="min-h-screen bg-tt-card flex flex-col">
      <AppHeader
        serialStatus={serialStatus}
        userProfile={userProfile}
        onEditUser={handleEditUser}
        onOpenSettings={() => setShowSettings(true)}
        breadcrumb={{ parent: '활동 선택', current: '훈련 설정', onParentClick: () => setStep('home') }}
      />

      <main className="flex-1 bg-tt-bg grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[22px] p-[28px_30px] overflow-auto">
        <div className="flex flex-col gap-[18px]">
          {/* 신체 부위 */}
          <div>
            <div className="flex items-baseline justify-between mb-[11px]">
              <span className="text-[15px] font-extrabold text-tt-heading">신체 부위</span>
              <span className="font-mono text-[11.5px] text-tt-light-muted">
                {settings.customSequence?.length || 0}개 선택 · 최대 8개 (중복 가능)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-[11px]">
              {ALL_BODY_PARTS.map((part) => {
                const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                const selectedCount = settings.customSequence?.filter((p) => p === part).length || 0;
                const hex = BODY_PART_HEX[part];
                const selected = selectedCount > 0;
                return (
                  <button
                    key={part}
                    onClick={() => addToSequence(part)}
                    style={selected ? { background: hex, borderColor: hex } : undefined}
                    className={`relative flex flex-col items-center gap-[9px] py-4 px-2.5 rounded-[11px] border-2 transition-all ${
                      selected ? '' : 'bg-tt-card border-tt-border-alt hover:border-tt-teal/40'
                    }`}
                  >
                    <BodyPartSvgIcon bodyPart={type} side={side} size={34} color={selected ? '#fff' : hex} />
                    <span className={`text-base font-extrabold ${selected ? 'text-white' : 'text-tt-heading'}`}>
                      {getBodyPartLabel(type, side)}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold rounded-[5px] px-[7px] py-px ${
                        selected ? 'text-white bg-white/20' : 'text-tt-light-muted bg-tt-bg'
                      }`}
                    >
                      {{ 'left-hand': 'E', 'right-hand': 'I', 'left-foot': 'C', 'right-foot': 'M' }[part]}
                    </span>
                    {selected && (
                      <span
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border text-[10px] font-black flex items-center justify-center"
                        style={{ color: hex, borderColor: hex }}
                      >
                        {selectedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {settings.customSequence && settings.customSequence.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-tt-border-soft">
                {settings.customSequence.map((part, i) => {
                  const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                  const hex = BODY_PART_HEX[part];
                  return (
                    <div
                      key={i}
                      style={{ borderColor: hex, background: `${hex}1a` }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                    >
                      <span className="text-xs font-black w-4 text-center" style={{ color: hex }}>{i + 1}</span>
                      <span className="text-xs font-semibold" style={{ color: hex }}>
                        {getBodyPartLabel(type, side)}
                      </span>
                      <button
                        onClick={() => removeFromSequence(i)}
                        className="ml-0.5 text-tt-light-muted hover:text-red-500 transition-colors leading-none"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={clearSequence}
                  className="text-xs text-tt-light-muted hover:text-red-500 transition-colors font-medium px-1"
                >
                  초기화
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-[18px]">
            {/* 자극 유형 */}
            <div>
              <div className="text-[15px] font-extrabold text-tt-heading mb-[11px]">자극 유형</div>
              <div className="flex bg-tt-border p-1 rounded-[10px] gap-1">
                {[
                  { value: 'visual', label: '시각' },
                  { value: 'audio', label: '청각' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSettings({ ...settings, trainingType: value as 'visual' | 'audio' })}
                    className={`flex-1 rounded-[7px] py-[11px] flex flex-col items-center gap-1.5 transition-all ${
                      settings.trainingType === value ? 'bg-tt-teal text-white' : 'text-tt-muted-alt'
                    }`}
                  >
                    <span className="text-[13px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 세션 시간 */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[15px] font-extrabold text-tt-heading">세션 시간</span>
                <span className="text-base font-black text-tt-teal font-mono">{durationLabel}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.durationMinutes}
                onChange={(e) => setSettings({ ...settings, durationMinutes: parseInt(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, #0f6e78 ${((settings.durationMinutes - 1) / 9) * 100}%, #e6eaed ${((settings.durationMinutes - 1) / 9) * 100}%)`,
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-[14px]"
              />
              <div className="flex justify-between text-xs text-tt-light-muted mt-1">
                <span>1분</span><span>10분</span>
              </div>
            </div>
          </div>

          {/* 템포 (BPM) */}
          <div>
            <div className="flex items-baseline justify-between mb-[13px]">
              <span className="text-[15px] font-extrabold text-tt-heading">템포 (BPM)</span>
              <span className="font-mono text-[11.5px] text-tt-light-muted">범위 40 – 200</span>
            </div>
            <div className="bg-tt-card border border-tt-border-alt rounded-[11px] px-[22px] py-5 flex items-center gap-[22px]">
              <button
                onClick={() => setSettings({ ...settings, bpm: Math.max(40, settings.bpm - 5) })}
                className="w-11 h-11 rounded-[10px] border border-tt-border-alt bg-tt-bg text-[22px] text-tt-muted-alt flex-none"
              >
                −
              </button>
              <div className="flex-1">
                <div className="flex items-baseline gap-[7px] justify-center mb-[13px]">
                  <span className="font-mono text-[44px] font-semibold text-tt-heading leading-none">{settings.bpm}</span>
                  <span className="text-sm text-tt-light-muted font-semibold">BPM</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  step="5"
                  value={settings.bpm}
                  onChange={(e) => setSettings({ ...settings, bpm: parseInt(e.target.value) })}
                  style={{
                    background: `linear-gradient(to right, #0f6e78 ${((settings.bpm - 40) / 160) * 100}%, #e6eaed ${((settings.bpm - 40) / 160) * 100}%)`,
                  }}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <button
                onClick={() => setSettings({ ...settings, bpm: Math.min(200, settings.bpm + 5) })}
                className="w-11 h-11 rounded-[10px] border border-tt-border-alt bg-tt-bg text-[22px] text-tt-muted-alt flex-none"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* SESSION SUMMARY */}
        <div className="bg-tt-dark-panel rounded-xl p-6 flex flex-col text-white">
          <div className="font-mono text-[11px] tracking-[1.5px] text-tt-dark-label font-semibold mb-[18px]">
            SESSION SUMMARY
          </div>
          <div className="flex flex-col gap-[15px] flex-1">
            <div>
              <div className="text-[11.5px] text-tt-light-muted-alt mb-[7px]">선택 부위</div>
              <div className="flex flex-wrap gap-[7px]">
                {(settings.customSequence || []).map((part, i) => {
                  const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                  return (
                    <span
                      key={i}
                      style={{ background: BODY_PART_HEX[part] }}
                      className="flex items-center gap-1.5 rounded-[7px] px-[11px] py-[5px] text-[13px] font-bold"
                    >
                      {getBodyPartLabel(type, side)}
                    </span>
                  );
                })}
                {(!settings.customSequence || settings.customSequence.length === 0) && (
                  <span className="text-[13px] text-tt-dark-label">미선택</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-[14px]">
              <span className="text-[13px] text-tt-dark-label-alt">자극 유형</span>
              <span className="text-sm font-bold">{settings.trainingType === 'visual' ? '시각' : '청각'}</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-[14px]">
              <span className="text-[13px] text-tt-dark-label-alt">템포</span>
              <span className="font-mono text-[15px] font-semibold">{settings.bpm} BPM</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-[14px]">
              <span className="text-[13px] text-tt-dark-label-alt">세션 시간</span>
              <span className="font-mono text-[15px] font-semibold">{durationLabel}</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-[14px]">
              <span className="text-[13px] text-tt-dark-label-alt">예상 반복</span>
              <span className="font-mono text-[15px] font-semibold">≈ {estimatedReps} 회</span>
            </div>
          </div>
          <button
            onClick={handleStart}
            disabled={isSetupStartDisabled}
            className={`rounded-[10px] h-[54px] text-base font-extrabold flex items-center justify-center gap-[9px] mt-[18px] transition-all ${
              isSetupStartDisabled ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-tt-teal hover:bg-tt-teal-dark text-white'
            }`}
          >
            훈련 시작 <span className="text-lg">▶</span>
          </button>
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          serialStatus={serialStatus}
          onStatusChange={(isConnected, path) => setSerialStatus({ isConnected, portPath: path })}
        />
      )}
    </div>
  );
}

/* ── 설정 모달 ── */
function SettingsModal({
  onClose,
  serialStatus,
  onStatusChange,
}: {
  onClose: () => void;
  serialStatus: { isConnected: boolean; portPath: string };
  onStatusChange: (isConnected: boolean, path: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-tt-card rounded-2xl tt-card-shadow w-full max-w-md overflow-hidden animate-fade-up">
        <div className="flex justify-between items-center px-6 py-4 border-b border-tt-border-alt">
          <div>
            <h2 className="text-lg font-bold text-tt-heading">장치 설정</h2>
            <p className="text-xs text-tt-light-muted mt-0.5">시리얼 포트 연결을 관리합니다</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-tt-bg text-tt-light-muted hover:text-tt-muted-alt transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">
          <SerialSettings
            onStatusChange={onStatusChange}
            initialConnected={serialStatus.isConnected}
            initialPortPath={serialStatus.portPath}
          />
        </div>
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-tt-dark-panel hover:bg-[#0c1318] text-white font-semibold text-sm rounded-xl transition-all"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
