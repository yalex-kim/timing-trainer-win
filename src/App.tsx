import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_SETTINGS } from '@/types';
import type { TrainingSettings, CustomBodyPart } from '@/types';
import type { UserProfile } from '@/types/evaluation';
import { calculateAge } from '@/utils/evaluator';
import { getBodyPartLabel, getBodyPartIcon } from '@/utils/bodyPartColors';
import SerialSettings from '@/components/SerialSettings';
import { useAudioBeep } from '@/hooks/useAudioBeep';

export default function Home() {
  const navigate = useNavigate();
  const { initAudio } = useAudioBeep();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
    if (currentSequence.length >= 4) {
      alert('최대 4개까지만 선택 가능합니다.');
      return;
    }
    if (currentSequence.includes(part)) return;
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

  const handleStart = () => {
    initAudio();
    if (!userProfile) {
      alert('사용자 정보를 먼저 입력해주세요.');
      return;
    }
    if (mode === 'assessment') {
      navigate('/assessment');
    } else {
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
    }
  };

  /* ── 신체 부위 색상 매핑 ── */
  const partColorMap: Record<CustomBodyPart, { bg: string; border: string; text: string }> = {
    'left-hand':  { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-700' },
    'right-hand': { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700' },
    'left-foot':  { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
    'right-foot': { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700' },
  };

  /* ─────────────────────────────────────────
     사용자 정보 입력 화면
  ───────────────────────────────────────── */
  if (showUserForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          {/* 카드 상단 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Timing Trainer
            </p>
            <h1 className="text-2xl font-bold">
              {userProfile ? '사용자 정보 수정' : '사용자 등록'}
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              정확한 평가를 위해 정보를 입력해 주세요
            </p>
          </div>

          {/* 폼 영역 */}
          <form onSubmit={handleUserFormSubmit} className="px-8 py-7 space-y-5">
            {/* 이름 */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                이름
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="홍길동"
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                생년월일
              </label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-2.5 text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                성별
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                    formData.gender === 'male'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
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
                      : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300 hover:text-pink-600'
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
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-lg font-semibold text-sm transition-all shadow-sm"
              >
                {userProfile ? '수정 완료' : '시작하기'}
              </button>
              {userProfile && (
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-medium text-sm transition-all"
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
     메인 허브 화면
  ───────────────────────────────────────── */
  const isStartDisabled =
    !mode || (mode === 'training' && (!settings.customSequence || settings.customSequence.length === 0));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* ── 상단 네비게이션 바 ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-0 flex justify-between items-stretch shadow-sm">
        {/* 브랜드 */}
        <div className="flex items-center gap-3 py-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">TT</span>
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">Timing Trainer</span>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            v{__APP_VERSION__}
          </span>
        </div>

        {/* 우측 액션 */}
        <div className="flex items-center gap-3">
          {/* 시리얼 상태 */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            serialStatus.isConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              serialStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`} />
            {serialStatus.isConnected ? serialStatus.portPath : '장치 없음'}
          </div>

          {/* 사용자 칩 */}
          {userProfile && (
            <button
              onClick={handleEditUser}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-semibold text-slate-700 border border-slate-200"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                {userProfile.name.charAt(0)}
              </span>
              <span>{userProfile.name}</span>
              <span className="text-slate-400">만 {userProfile.age}세</span>
            </button>
          )}

          {/* 설정 버튼 */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="설정"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── 메인 콘텐츠 ── */}
      <main className="flex-1 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">

          {/* 카드 헤더 */}
          <div className="px-7 pt-7 pb-5 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-800">활동 선택</h1>
            <p className="text-sm text-slate-500 mt-0.5">훈련 또는 검사 모드를 선택하세요</p>
          </div>

          <div className="px-7 py-6 space-y-6">

            {/* ── 모드 선택 카드 ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* 훈련 모드 */}
              <button
                onClick={() => setMode('training')}
                className={`relative flex flex-col items-center gap-2.5 py-5 px-4 rounded-xl border-2 transition-all ${
                  mode === 'training'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {mode === 'training' && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
                <span className="text-3xl">🎯</span>
                <div className="text-center">
                  <div className={`font-bold text-sm ${mode === 'training' ? 'text-blue-700' : 'text-slate-700'}`}>훈련 모드</div>
                  <div className="text-xs text-slate-400 mt-0.5">자유 설정</div>
                </div>
              </button>

              {/* 검사 모드 */}
              <button
                onClick={() => setMode('assessment')}
                className={`relative flex flex-col items-center gap-2.5 py-5 px-4 rounded-xl border-2 transition-all ${
                  mode === 'assessment'
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {mode === 'assessment' && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
                <span className="text-3xl">📋</span>
                <div className="text-center">
                  <div className={`font-bold text-sm ${mode === 'assessment' ? 'text-emerald-700' : 'text-slate-700'}`}>검사 모드</div>
                  <div className="text-xs text-slate-400 mt-0.5">표준화 검사</div>
                </div>
              </button>
            </div>

            {/* ── 훈련 설정 ── */}
            {mode === 'training' && (
              <div className="space-y-5 animate-fade-up">

                {/* 훈련 감각 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    훈련 감각
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'visual', label: '시각', icon: '👁️' },
                      { value: 'audio',  label: '청각', icon: '👂' },
                    ].map(({ value, label, icon }) => (
                      <button
                        key={value}
                        onClick={() => setSettings({ ...settings, trainingType: value as 'visual' | 'audio' })}
                        className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                          settings.trainingType === value
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                        }`}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 훈련 순서 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      훈련 순서 <span className="text-slate-400 normal-case font-normal">(최대 4개)</span>
                    </label>
                    {settings.customSequence && (
                      <button
                        onClick={clearSequence}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                      >
                        초기화
                      </button>
                    )}
                  </div>

                  {/* 신체 부위 선택 버튼 */}
                  <div className="grid grid-cols-2 gap-2">
                    {(['left-hand', 'right-hand', 'left-foot', 'right-foot'] as CustomBodyPart[]).map((part) => {
                      const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                      const isSelected = settings.customSequence?.includes(part);
                      const colors = partColorMap[part];
                      return (
                        <button
                          key={part}
                          onClick={() => addToSequence(part)}
                          disabled={isSelected}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                            isSelected
                              ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                              : `bg-white border-slate-200 text-slate-700 hover:${colors.bg} hover:${colors.border} hover:${colors.text}`
                          }`}
                        >
                          <span className="text-base">{getBodyPartIcon(type as 'hand' | 'foot', side)}</span>
                          <span>{getBodyPartLabel(type as 'hand' | 'foot', side)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 선택된 순서 태그 */}
                  {settings.customSequence && settings.customSequence.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                      {settings.customSequence.map((part, i) => {
                        const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                        const colors = partColorMap[part];
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${colors.bg} ${colors.border}`}
                          >
                            <span className={`text-xs font-black ${colors.text} w-4 text-center`}>{i + 1}</span>
                            <span className={`text-xs font-semibold ${colors.text}`}>
                              {getBodyPartLabel(type as 'hand' | 'foot', side)}
                            </span>
                            <button
                              onClick={() => removeFromSequence(i)}
                              className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors leading-none"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* BPM / 시간 슬라이더 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">BPM</label>
                      <span className="text-lg font-black text-blue-600">{settings.bpm}</span>
                    </div>
                    <input
                      type="range" min="40" max="200" step="5"
                      value={settings.bpm}
                      onChange={(e) => setSettings({ ...settings, bpm: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>40</span><span>200</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">시간</label>
                      <span className="text-lg font-black text-blue-600">{settings.durationMinutes}분</span>
                    </div>
                    <input
                      type="range" min="1" max="10"
                      value={settings.durationMinutes}
                      onChange={(e) => setSettings({ ...settings, durationMinutes: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1분</span><span>10분</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 검사 모드 안내 ── */}
            {mode === 'assessment' && (
              <div className="animate-fade-up border border-emerald-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-600 px-4 py-2.5 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="text-white text-xs font-semibold">검사 안내</span>
                </div>
                <div className="bg-emerald-50 px-4 py-3 space-y-1.5">
                  {[
                    'BPM 60 고정, 테스트당 40초',
                    '청각·시각 × 손·발 = 총 8개 테스트',
                    '검사 중 설정 변경 불가',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 하단 버튼 영역 ── */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => navigate('/standards')}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
                기준표
              </button>
              <button
                onClick={handleStart}
                disabled={isStartDisabled}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-[0.98] ${
                  isStartDisabled
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : mode === 'training'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : mode === 'assessment'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {mode === 'training'
                  ? '훈련 시작하기'
                  : mode === 'assessment'
                  ? '검사 시작하기'
                  : '활동을 선택하세요'}
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* ── 설정 모달 ── */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-up">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">장치 설정</h2>
                <p className="text-xs text-slate-400 mt-0.5">시리얼 포트 연결을 관리합니다</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              <SerialSettings
                onStatusChange={(isConnected, path) => setSerialStatus({ isConnected, portPath: path })}
                initialConnected={serialStatus.isConnected}
                initialPortPath={serialStatus.portPath}
              />
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl transition-all"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
