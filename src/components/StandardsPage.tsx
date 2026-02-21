<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import { AGE_BASED_STANDARDS, AgeGroup, TimingClass } from '@/types/evaluation';

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  'under7': '7세 이하',
=======

import { useNavigate } from 'react-router-dom';
import { AGE_BASED_STANDARDS, AgeGroup } from '@/types/evaluation';

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  'under7': '7세 미만',
>>>>>>> 0acaefdcf22a76565b148b2d55380980138266b4
  '8-9': '8-9세',
  '10-11': '10-11세',
  '12-13': '12-13세',
  '14-16': '14-16세',
  'over17': '17세 이상',
};

<<<<<<< HEAD
const CLASS_LABELS: Record<TimingClass, { label: string; color: string }> = {
  7: { label: '아주 잘함', color: '#10b981' },
  6: { label: '잘함', color: '#22c55e' },
  5: { label: '정상 이상', color: '#84cc16' },
  4: { label: '정상', color: '#3b82f6' },
  3: { label: '정상 이하', color: '#f59e0b' },
  2: { label: '못함', color: '#f97316' },
  1: { label: '아주 못함', color: '#ef4444' },
=======
const CLASS_LABELS: Record<number, string> = {
  7: 'Class 7 (아주 잘함)',
  6: 'Class 6 (잘함)',
  5: 'Class 5 (정상 이상)',
  4: 'Class 4 (정상)',
  3: 'Class 3 (경미한 결핍)',
  2: 'Class 2 (중등도 결핍)',
  1: 'Class 1 (극심한 결핍)',
>>>>>>> 0acaefdcf22a76565b148b2d55380980138266b4
};

export default function StandardsPage() {
  const navigate = useNavigate();

<<<<<<< HEAD
  const renderStandardsTable = (mode: 'visual' | 'auditory') => {
    const standards = AGE_BASED_STANDARDS[mode];
    const ageGroups: AgeGroup[] = ['under7', '8-9', '10-11', '12-13', '14-16', 'over17'];

    return (
      <div className="overflow-x-auto mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {mode === 'visual' ? '시각 모드 기준' : '청각 모드 기준'}
        </h2>
        <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-600 px-4 py-3 text-left">연령대</th>
              <th className="border border-gray-600 px-4 py-3 text-center">Class 7</th>
              <th className="border border-gray-600 px-4 py-3 text-center">Class 6</th>
              <th className="border border-gray-600 px-4 py-3 text-center">Class 5</th>
              <th className="border border-gray-600 px-4 py-3 text-center">Class 4</th>
              <th className="border border-gray-600 px-4 py-3 text-center">Class 3</th>
              <th className="border border-gray-600 px-4 py-3 text-center">Class 2</th>
              <th className="border border-gray-600 px-4 py-3 text-center">Class 1</th>
            </tr>
            <tr className="bg-gray-700 text-white text-sm">
              <th className="border border-gray-600 px-4 py-2"></th>
              <th className="border border-gray-600 px-2 py-2">아주 잘함</th>
              <th className="border border-gray-600 px-2 py-2">잘함</th>
              <th className="border border-gray-600 px-2 py-2">정상 이상</th>
              <th className="border border-gray-600 px-2 py-2">정상</th>
              <th className="border border-gray-600 px-2 py-2">정상 이하</th>
              <th className="border border-gray-600 px-2 py-2">못함</th>
              <th className="border border-gray-600 px-2 py-2">아주 못함</th>
            </tr>
          </thead>
          <tbody>
            {ageGroups.map((ageGroup, rowIndex) => {
              const ageStandards = standards[ageGroup];

              return (
                <tr key={ageGroup} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-4 py-3 font-bold text-gray-800">
                    {AGE_GROUP_LABELS[ageGroup]}
                  </td>
                  {[7, 6, 5, 4, 3, 2, 1].map((classNum) => {
                    const standard = ageStandards.find(s => s.class === classNum);
                    if (!standard) return <td key={classNum} className="border border-gray-300 px-2 py-3 text-center">-</td>;

                    const [min, max] = standard.range;
                    const rangeText = max === Infinity ? `${min}+` : `${min}-${max}`;
                    const classInfo = CLASS_LABELS[classNum as TimingClass];

                    return (
                      <td
                        key={classNum}
                        className="border border-gray-300 px-2 py-3 text-center font-medium"
                        style={{
                          backgroundColor: `${classInfo.color}20`,
                          color: classInfo.color,
                        }}
                      >
                        {rangeText}
                        <div className="text-xs text-gray-600 mt-1">ms</div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-800">연령별 검사 기준표</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              메인으로
            </button>
          </div>
          <p className="text-gray-600">
            연령대와 모드별로 Task Average(TA) 기준 Class 등급을 확인하세요.
            TA는 평균 타이밍 편차(ms)를 의미하며, 낮을수록 좋은 성적입니다.
          </p>
        </div>

        {/* Class 등급 설명 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Class 등급 설명</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {([7, 6, 5, 4, 3, 2, 1] as TimingClass[]).map((classNum) => {
              const classInfo = CLASS_LABELS[classNum];
              return (
                <div
                  key={classNum}
                  className="rounded-lg p-4 text-white font-bold text-center"
                  style={{ backgroundColor: classInfo.color }}
                >
                  <div className="text-2xl mb-1">Class {classNum}</div>
                  <div className="text-sm">{classInfo.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 청각 모드 표 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {renderStandardsTable('auditory')}
        </div>

        {/* 시각 모드 표 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {renderStandardsTable('visual')}
        </div>

        {/* 참고 사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-blue-800 mb-2">참고 사항</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Task Average (TA): 비트와 실제 입력 간 평균 타이밍 오차 (단위: ms)</li>
            <li>• 검사는 BPM 60으로 고정되며, 8가지 테스트를 순차적으로 진행합니다</li>
            <li>• 청각 모드: 소리에 반응, 시각 모드: 화면 깜빡임에 반응</li>
            <li>• 기준표는 QTrainer 표준 규준표를 기반으로 합니다</li>
=======
  const ageGroups: AgeGroup[] = ['under7', '8-9', '10-11', '12-13', '14-16', 'over17'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              연령별 타이밍 평가 기준표
            </h1>
            <p className="text-gray-600">
              QTrainer 표준 규준표 기반 (Task Average 기준, ms 단위)
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            홈으로
          </button>
        </div>

        {/* 청각 모드 기준표 */}
        <div className="mb-12 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">청각 모드 (Auditory) 기준</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Class
                  </th>
                  {ageGroups.map((ageGroup) => (
                    <th
                      key={ageGroup}
                      className="px-6 py-3 text-center text-sm font-semibold text-gray-700"
                    >
                      {AGE_GROUP_LABELS[ageGroup]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[7, 6, 5, 4, 3, 2, 1].map((classNum) => (
                  <tr key={classNum} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {CLASS_LABELS[classNum]}
                    </td>
                    {ageGroups.map((ageGroup) => {
                      const standard = AGE_BASED_STANDARDS.auditory[ageGroup].find(
                        (s) => s.class === classNum
                      );
                      if (!standard) return <td key={ageGroup} className="px-6 py-4 text-center text-sm text-gray-500">-</td>;

                      const [min, max] = standard.range;
                      return (
                        <td key={ageGroup} className="px-6 py-4 text-center text-sm text-gray-700">
                          {min === 0 ? '0' : min}
                          {' ~ '}
                          {max === Infinity ? '∞' : max}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 시각 모드 기준표 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-green-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">시각 모드 (Visual) 기준</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Class
                  </th>
                  {ageGroups.map((ageGroup) => (
                    <th
                      key={ageGroup}
                      className="px-6 py-3 text-center text-sm font-semibold text-gray-700"
                    >
                      {AGE_GROUP_LABELS[ageGroup]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[7, 6, 5, 4, 3, 2, 1].map((classNum) => (
                  <tr key={classNum} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {CLASS_LABELS[classNum]}
                    </td>
                    {ageGroups.map((ageGroup) => {
                      const standard = AGE_BASED_STANDARDS.visual[ageGroup].find(
                        (s) => s.class === classNum
                      );
                      if (!standard) return <td key={ageGroup} className="px-6 py-4 text-center text-sm text-gray-500">-</td>;

                      const [min, max] = standard.range;
                      return (
                        <td key={ageGroup} className="px-6 py-4 text-center text-sm text-gray-700">
                          {min === 0 ? '0' : min}
                          {' ~ '}
                          {max === Infinity ? '∞' : max}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 설명 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">평가 기준 안내</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Task Average (TA)</strong>: 모든 응답의 평균 절대 편차 (ms)</li>
            <li>• <strong>청각 모드</strong>: 소리 신호에 맞춰 반응하는 검사</li>
            <li>• <strong>시각 모드</strong>: 시각 신호에 맞춰 반응하는 검사 (청각보다 기준이 높음)</li>
            <li>• Class 7이 가장 우수한 수준, Class 1이 극심한 결핍 수준입니다</li>
            <li>• 연령이 높아질수록 더 엄격한 기준이 적용됩니다</li>
>>>>>>> 0acaefdcf22a76565b148b2d55380980138266b4
          </ul>
        </div>
      </div>
    </div>
  );
}
