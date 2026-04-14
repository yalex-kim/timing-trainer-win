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

  // 기본 생년월일 계산 (현 시점 기준 6년 전)
  const getDefaultBirthDate = () => {
    const today = new Date();
    const sixYearsAgo = new Date(today.getFullYear() - 6, today.getMonth(), today.getDate());
    return sixYearsAgo.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  };

  // 폼 입력 상태
  const [formData, setFormData] = useState({
    name: '',
    birthDate: getDefaultBirthDate(),
    gender: 'male' as 'male' | 'female',
  });

  // LocalStorage에서 사용자 정보 로드
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

  // FTDI 장치 자동 연결 (앱 시작 시 1회)
  // useRef로 StrictMode의 이중 실행 방지
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
        // 자동 연결 실패는 무시 — 사용자가 설정에서 수동 연결 가능
      }
    };
    autoConnectFtdi();
  }, []);

  // 사용자 정보 저장
  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initAudio(); // Initialize audio context on first user interaction
    const profile: UserProfile = {
      ...formData,
      age: calculateAge(formData.birthDate),
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setUserProfile(profile);
    setShowUserForm(false);
  };

  // 사용자 정보 수정
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

  // 커스텀 시퀀스 추가
  const addToSequence = (part: CustomBodyPart) => {
    const currentSequence = settings.customSequence || [];
    if (currentSequence.length >= 4) {
      alert('최대 4개까지만 선택 가능합니다.');
      return;
    }
    if (currentSequence.includes(part)) {
      return; // 이미 선택된 항목은 무시
    }
    setSettings({
      ...settings,
      customSequence: [...currentSequence, part],
    });
  };

  // 커스텀 시퀀스에서 제거
  const removeFromSequence = (index: number) => {
    const currentSequence = settings.customSequence || [];
    const newSequence = currentSequence.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      customSequence: newSequence.length > 0 ? newSequence : undefined,
    });
  };

  // 커스텀 시퀀스 초기화
  const clearSequence = () => {
    setSettings({
      ...settings,
      customSequence: undefined,
    });
  };

  // 훈련/검사 시작
  const handleStart = () => {
    initAudio(); // Ensure audio context is ready
    if (!userProfile) {
      alert('사용자 정보를 먼저 입력해주세요.');
      return;
    }

    if (mode === 'assessment') {
      navigate('/assessment');
    } else {
      // 훈련 모드: 커스텀 시퀀스가 필수
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

      // 커스텀 시퀀스 추가
      if (settings.customSequence) {
        params.set('customSequence', JSON.stringify(settings.customSequence));
      }

      navigate(`/training?${params.toString()}`);
    }
  };

  // 사용자 정보 입력 화면
  if (showUserForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            사용자 정보 입력
          </h1>

          <form onSubmit={handleUserFormSubmit} className="space-y-6">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생년월일
              </label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성별
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    formData.gender === 'male'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    formData.gender === 'female'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              {userProfile ? '정보 수정 완료' : '다음 단계로'}
            </button>

            {userProfile && (
              <button
                type="button"
                onClick={() => setShowUserForm(false)}
                className="w-full bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-all"
              >
                취소
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // 훈련 설정 화면
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Status Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-blue-600">Timing Trainer</h2>
          {userProfile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{userProfile.name}</span>
              <span>(만 {userProfile.age}세)</span>
              <button onClick={handleEditUser} className="text-blue-500 hover:underline ml-1">수정</button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
            serialStatus.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${serialStatus.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {serialStatus.isConnected ? `${serialStatus.portPath} 연결됨` : '장치 연결 없음'}
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="설정"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-xl w-full border border-gray-100">
          <h1 className="text-3xl font-black text-center mb-8 text-gray-800">
            어떤 활동을 하시겠습니까?
          </h1>

          <div className="space-y-8">
            {/* 모드 선택 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('training')}
                className={`flex flex-col items-center gap-3 py-6 rounded-2xl border-4 transition-all ${
                  mode === 'training'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <span className="text-4xl">🎯</span>
                <span className={`font-bold text-lg ${mode === 'training' ? 'text-blue-700' : 'text-gray-600'}`}>훈련 모드</span>
              </button>
              <button
                onClick={() => setMode('assessment')}
                className={`flex flex-col items-center gap-3 py-6 rounded-2xl border-4 transition-all ${
                  mode === 'assessment'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <span className="text-4xl">📋</span>
                <span className={`font-bold text-lg ${mode === 'assessment' ? 'text-green-700' : 'text-gray-600'}`}>검사 모드</span>
              </button>
            </div>

            {mode === 'training' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* 훈련 타입 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">훈련 감각</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSettings({ ...settings, trainingType: 'visual' })}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        settings.trainingType === 'visual' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      👁️ 시각
                    </button>
                    <button
                      onClick={() => setSettings({ ...settings, trainingType: 'audio' })}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        settings.trainingType === 'audio' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      👂 청각
                    </button>
                  </div>
                </div>

                {/* 커스텀 시퀀스 */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-gray-700">훈련 순서 선택 (최대 4개)</label>
                    {settings.customSequence && (
                      <button onClick={clearSequence} className="text-xs text-red-500 font-bold">초기화</button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {(['left-hand', 'right-hand', 'left-foot', 'right-foot'] as CustomBodyPart[]).map((part) => {
                      const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                      const isSelected = settings.customSequence?.includes(part);
                      return (
                        <button
                          key={part}
                          onClick={() => addToSequence(part)}
                          disabled={isSelected}
                          className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                            isSelected ? 'bg-gray-200 border-transparent text-gray-400 opacity-50' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          <span className="text-xl">{getBodyPartIcon(type as 'hand' | 'foot', side)}</span>
                          <span className="font-bold text-sm">{getBodyPartLabel(type as 'hand' | 'foot', side)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {settings.customSequence && (
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
                      {settings.customSequence.map((part, i) => {
                        const [side, type] = part.split('-') as ['left' | 'right', 'hand' | 'foot'];
                        return (
                          <div key={i} className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                            <span className="text-xs font-black text-blue-500">{i+1}</span>
                            <span className="text-sm font-bold">{getBodyPartLabel(type as 'hand' | 'foot', side)}</span>
                            <button onClick={() => removeFromSequence(i)} className="ml-1 text-red-400 hover:text-red-600 font-bold">✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">BPM (속도): {settings.bpm}</label>
                    <input
                      type="range" min="40" max="200" step="5"
                      value={settings.bpm}
                      onChange={(e) => setSettings({ ...settings, bpm: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">시간: {settings.durationMinutes}분</label>
                    <input
                      type="range" min="1" max="10"
                      value={settings.durationMinutes}
                      onChange={(e) => setSettings({ ...settings, durationMinutes: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === 'assessment' && (
              <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="font-black text-green-800 mb-3 flex items-center gap-2">
                  <span>ℹ️</span> 검사 안내
                </h3>
                <ul className="space-y-2 text-sm text-green-700 font-medium">
                  <li className="flex gap-2"><span>•</span> <span>BPM 60으로 고정되어 진행됩니다.</span></li>
                  <li className="flex gap-2"><span>•</span> <span>총 8가지 신체 부위 및 감각 테스트가 이어집니다.</span></li>
                  <li className="flex gap-2"><span>•</span> <span>검사 중에는 설정을 변경할 수 없습니다.</span></li>
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate('/standards')}
                className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                📊 기준표
              </button>
              <button
                onClick={handleStart}
                disabled={!mode || (mode === 'training' && (!settings.customSequence || settings.customSequence.length === 0))}
                className={`flex-[2] py-4 px-6 rounded-xl font-black text-xl shadow-lg transition-all transform active:scale-95 ${
                  !mode || (mode === 'training' && (!settings.customSequence || settings.customSequence.length === 0))
                    ? 'bg-gray-300 text-white cursor-not-allowed'
                    : mode === 'training'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {mode === 'training' ? '훈련 시작하기' : mode === 'assessment' ? '검사 시작하기' : '활동 선택'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">설정</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
            </div>
            <div className="p-6">
              <SerialSettings
                onStatusChange={(isConnected, path) => setSerialStatus({ isConnected, portPath: path })}
                initialConnected={serialStatus.isConnected}
                initialPortPath={serialStatus.portPath}
              />
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-all"
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
