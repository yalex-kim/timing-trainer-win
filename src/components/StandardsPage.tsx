import { useNavigate } from 'react-router-dom';
import { AGE_BASED_STANDARDS } from '@/types/evaluation';
import type { AgeGroup, TimingClass } from '@/types/evaluation';

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  'under7': '7세 이하',
  '8-9':    '8–9세',
  '10-11':  '10–11세',
  '12-13':  '12–13세',
  '14-16':  '14–16세',
  'over17': '17세 이상',
};

const CLASS_LABELS: Record<TimingClass, { label: string; color: string; desc: string }> = {
  7: { label: '아주 잘함', color: '#059669', desc: 'Excellent' },
  6: { label: '잘함',     color: '#16a34a', desc: 'Good' },
  5: { label: '정상 이상', color: '#65a30d', desc: 'Above Average' },
  4: { label: '정상',     color: '#2563eb', desc: 'Average' },
  3: { label: '정상 이하', color: '#d97706', desc: 'Below Average' },
  2: { label: '못함',     color: '#ea580c', desc: 'Poor' },
  1: { label: '아주 못함', color: '#dc2626', desc: 'Very Poor' },
};

export default function StandardsPage() {
  const navigate = useNavigate();

  const renderStandardsTable = (mode: 'visual' | 'auditory') => {
    const standards = AGE_BASED_STANDARDS[mode];
    const ageGroups: AgeGroup[] = ['under7', '8-9', '10-11', '12-13', '14-16', 'over17'];
    const classNums = [7, 6, 5, 4, 3, 2, 1] as TimingClass[];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 w-28">
                연령대
              </th>
              {classNums.map((c) => {
                const info = CLASS_LABELS[c];
                return (
                  <th
                    key={c}
                    className="px-3 py-3 text-center border-b border-slate-200"
                    style={{ backgroundColor: `${info.color}10` }}
                  >
                    <div className="font-bold text-xs" style={{ color: info.color }}>
                      Class {c}
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5" style={{ color: `${info.color}99` }}>
                      {info.label}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ageGroups.map((ageGroup, rowIndex) => {
              const ageStandards = standards[ageGroup];
              return (
                <tr
                  key={ageGroup}
                  className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">
                    {AGE_GROUP_LABELS[ageGroup]}
                  </td>
                  {classNums.map((classNum) => {
                    const standard = ageStandards.find((s) => s.class === classNum);
                    const classInfo = CLASS_LABELS[classNum];

                    if (!standard) {
                      return (
                        <td key={classNum} className="px-3 py-3 text-center text-slate-300 text-xs">
                          —
                        </td>
                      );
                    }

                    const [min, max] = standard.range;
                    const rangeText = max === Infinity ? `${min}+` : `${min}–${max}`;

                    return (
                      <td
                        key={classNum}
                        className="px-3 py-3 text-center"
                        style={{ backgroundColor: `${classInfo.color}08` }}
                      >
                        <span
                          className="font-bold tabular-nums text-xs"
                          style={{ color: classInfo.color }}
                        >
                          {rangeText}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">ms</div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── 상단 헤더 ── */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <button
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
                메인
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-sm text-slate-600 font-medium">기준표</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">연령별 검사 기준표</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all border border-slate-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            돌아가기
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── 소개 문구 ── */}
        <p className="text-sm text-slate-500">
          Task Average(TA)는 비트와 실제 입력 간 평균 타이밍 오차(ms)입니다. 낮을수록 정확한 타이밍입니다.
        </p>

        {/* ── Class 등급 범례 ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Class 등급 범례</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {([7, 6, 5, 4, 3, 2, 1] as TimingClass[]).map((classNum) => {
                const info = CLASS_LABELS[classNum];
                return (
                  <div
                    key={classNum}
                    className="rounded-xl p-3 text-center border"
                    style={{
                      backgroundColor: `${info.color}12`,
                      borderColor: `${info.color}30`,
                    }}
                  >
                    <div className="text-xs font-black mb-0.5" style={{ color: info.color }}>
                      C{classNum}
                    </div>
                    <div className="text-[10px] font-semibold leading-tight" style={{ color: `${info.color}cc` }}>
                      {info.label}
                    </div>
                    <div className="text-[9px] mt-0.5" style={{ color: `${info.color}66` }}>
                      {info.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 청각 모드 기준표 ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-2 h-5 rounded-full bg-blue-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">청각 모드 기준표</h2>
              <p className="text-xs text-slate-400 mt-0.5">소리에 반응 · BPM 60 고정</p>
            </div>
          </div>
          {renderStandardsTable('auditory')}
        </div>

        {/* ── 시각 모드 기준표 ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-2 h-5 rounded-full bg-violet-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">시각 모드 기준표</h2>
              <p className="text-xs text-slate-400 mt-0.5">화면 깜빡임에 반응 · BPM 60 고정</p>
            </div>
          </div>
          {renderStandardsTable('visual')}
        </div>

        {/* ── 참고 사항 ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">참고 사항</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-blue-700">
            <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">•</span>Task Average (TA): 비트와 실제 입력 간 평균 타이밍 오차 (단위: ms)</li>
            <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">•</span>검사는 BPM 60으로 고정되며, 8가지 테스트를 순차적으로 진행합니다</li>
            <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">•</span>청각 모드: 소리에 반응 / 시각 모드: 화면 깜빡임에 반응</li>
            <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">•</span>기준표는 QTrainer 표준 규준표를 기반으로 합니다</li>
          </ul>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
