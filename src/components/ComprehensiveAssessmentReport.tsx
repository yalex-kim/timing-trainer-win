'use client';

import { useState } from 'react';
import type { ComprehensiveAssessmentReport } from '@/types/evaluation';
import { exportToExcel } from '@/utils/excelExport';
import { exportToGoogleSheets, formatDataForGoogleSheets, isGoogleSheetsConfigured } from '@/utils/googleSheetsExport';

interface Props {
  report: ComprehensiveAssessmentReport;
  onClose: () => void;
}

export default function ComprehensiveAssessmentReportComponent({ report, onClose }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  // PDF Export — Chromium 네이티브 인쇄 엔진(printToPDF)으로 현재 화면을 그대로 PDF화.
  // 텍스트가 이미지가 아닌 실제 텍스트로 들어가 선택/검색이 가능하다. 버튼 바는 print:hidden으로,
  // 섹션 줄바꿈은 print:break-inside-avoid / print:break-before-page(섹션 6)로 제어한다.
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
      const fileName = `${report.patientInfo.name}_${report.patientInfo.age}세_타이밍검사_${report.patientInfo.testDate}_${timeStr}.pdf`;

      const api = window.electronAPI;
      if (api?.printToPDF) {
        const savedPath = await api.printToPDF(fileName);
        alert(`저장 완료:\n${savedPath}`);
      } else {
        // 개발 환경(브라우저) 폴백 — 인쇄 대화상자에서 'PDF로 저장'을 선택하면 된다.
        window.print();
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // Excel Export (누적 저장 → TT_Result/결과누적.xlsx)
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { results } = formatDataForGoogleSheets(report);
      const api = window.electronAPI;
      if (api?.appendExcel) {
        const savedPath = await api.appendExcel(results as Record<string, unknown>[]);
        alert(`저장 완료:\n${savedPath}`);
      } else {
        // 브라우저 폴백 (dev 환경)
        await exportToExcel(report);
      }
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Excel 생성에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // Google Sheets Export
  const handleExportGoogleSheets = async () => {
    setIsExporting(true);
    try {
      await exportToGoogleSheets(report);
      alert('Google Sheets에 데이터가 저장되었습니다!\n\n시트를 새로고침하여 확인하세요.');
    } catch (error) {
      console.error('Google Sheets export failed:', error);
      alert((error as Error).message || 'Google Sheets 저장에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const isSheetsConfigured = isGoogleSheetsConfigured();

  // Get color based on percentile
  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 75) return '#10b981'; // green
    if (percentile >= 50) return '#3b82f6'; // blue
    if (percentile >= 25) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Get level color
  const getLevelColor = (level: string): string => {
    if (level === '우수' || level.includes('잘함')) return '#10b981';
    if (level === '보통' || level.includes('정상')) return '#3b82f6';
    return '#ef4444';
  };

  // 종합 등급 (8개 검사 평균 클래스, 반올림)
  const overallGrade = Math.round(
    report.individualResults.reduce((sum, r) => sum + r.sessionResults.classLevel, 0) / report.individualResults.length
  );

  // 피드백 등급 분포 집계 (표현 전용 — evaluator.ts 색상/로직과 무관)
  const feedbackTotals = report.individualResults.reduce(
    (acc, r) => {
      acc.perfect += r.sessionResults.perfectCount;
      acc.excellent += r.sessionResults.excellentCount;
      acc.good += r.sessionResults.goodCount;
      acc.fair += r.sessionResults.fairCount;
      acc.poor += r.sessionResults.poorCount;
      acc.miss += r.sessionResults.missCount;
      return acc;
    },
    { perfect: 0, excellent: 0, good: 0, fair: 0, poor: 0, miss: 0 }
  );
  const feedbackTotal = Object.values(feedbackTotals).reduce((a, b) => a + b, 0) || 1;
  const FEEDBACK_DIST = [
    { key: 'perfect', label: 'PERFECT', color: '#1f9d57', count: feedbackTotals.perfect },
    { key: 'excellent', label: 'EXCELLENT', color: '#5bb98c', count: feedbackTotals.excellent },
    { key: 'good', label: 'GOOD', color: '#7ca9af', count: feedbackTotals.good },
    { key: 'fair', label: 'FAIR', color: '#e0b454', count: feedbackTotals.fair },
    { key: 'poor', label: 'POOR', color: '#e08a3c', count: feedbackTotals.poor },
    { key: 'miss', label: 'MISS', color: '#d9647a', count: feedbackTotals.miss },
  ];

  return (
    <div className="min-h-screen bg-tt-bg print:bg-white">
      {/* Action Buttons - 상단 고정, PDF 캡처에서 제외 */}
      <div className="sticky top-0 z-10 bg-tt-bg border-b border-tt-border-alt shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-wrap gap-3 justify-center">
          {isSheetsConfigured && (
            <button
              onClick={handleExportGoogleSheets}
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2"
              title="Google Sheets 데이터베이스에 저장 (시계열 분석용)"
            >
              <span>📈</span>
              <span>{isExporting ? '저장 중...' : 'Google Sheets에 저장'}</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="bg-tt-teal hover:bg-tt-teal-dark disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2"
            title="Excel 파일로 다운로드 (리포트 형식)"
          >
            <span>📊</span>
            <span>{isExporting ? '생성 중...' : 'Excel로 저장'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-tt-dark-panel hover:bg-[#0c1318] disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2"
            title="PDF 파일로 다운로드"
          >
            <span>📄</span>
            <span>{isExporting ? '생성 중...' : 'PDF로 저장'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-tt-card border border-tt-border-alt text-tt-muted-alt hover:bg-tt-border px-6 py-2.5 rounded-lg font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 print:p-0">

      {/* 보고서 내용 - PDF 인쇄(printToPDF) 시 그대로 출력되는 영역 */}
      <div className="max-w-6xl mx-auto bg-tt-card rounded-lg tt-card-shadow p-6 md:p-8 print:rounded-none">
        {/* Header */}
        <div className="bg-tt-dark-panel rounded-xl px-7 py-6 mb-8 flex flex-wrap items-center justify-between gap-4 text-white print:break-inside-avoid">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">
              {report.patientInfo.name} <span className="text-sm font-medium text-tt-dark-label-alt">· {report.patientInfo.gender === 'male' ? '남성' : '여성'} · 만 {report.patientInfo.age}세</span>
            </div>
            <div className="font-mono text-xs text-tt-dark-label mt-1.5">타이밍 협응 검사 · {report.patientInfo.testDate}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-tt-dark-label tracking-wider font-mono">종합 등급</div>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="font-mono text-4xl font-semibold text-[#2dd4bf] leading-none">{overallGrade}</span>
              <span className="text-sm text-tt-dark-label-alt">/ 7 등급</span>
            </div>
          </div>
        </div>

        {/* Section 1: Processing Capability */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-tt-heading mb-4 flex items-center">
            <span className="bg-tt-teal text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
            시청각 학습능력
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Visual Processing */}
            <div className="bg-tt-bg p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">시각 처리 능력</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Task Average:</span>
                  <span className="font-bold">{report.processingCapability.visual.taskAverage}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Class:</span>
                  <span className="font-bold">{report.processingCapability.visual.classLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">수준:</span>
                  <span className="font-bold" style={{ color: getLevelColor(report.processingCapability.visual.level) }}>
                    {report.processingCapability.visual.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">백분위:</span>
                  <span className="font-bold text-xl" style={{ color: getPercentileColor(report.processingCapability.visual.percentile) }}>
                    {report.processingCapability.visual.percentile}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${report.processingCapability.visual.percentile}%`,
                      backgroundColor: getPercentileColor(report.processingCapability.visual.percentile),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Auditory Processing */}
            <div className="bg-tt-bg p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">청각 처리 능력</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Task Average:</span>
                  <span className="font-bold">{report.processingCapability.auditory.taskAverage}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Class:</span>
                  <span className="font-bold">{report.processingCapability.auditory.classLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">수준:</span>
                  <span className="font-bold" style={{ color: getLevelColor(report.processingCapability.auditory.level) }}>
                    {report.processingCapability.auditory.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">백분위:</span>
                  <span className="font-bold text-xl" style={{ color: getPercentileColor(report.processingCapability.auditory.percentile) }}>
                    {report.processingCapability.auditory.percentile}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${report.processingCapability.auditory.percentile}%`,
                      backgroundColor: getPercentileColor(report.processingCapability.auditory.percentile),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Learning Style */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-tt-heading mb-4 flex items-center">
            <span className="bg-tt-teal text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
            학습 스타일
          </h2>

          <div className="bg-tt-bg p-6 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold mb-2 text-tt-teal">
                {report.learningStyle.dominantLabel}
              </div>
              <div className="text-tt-muted">
                차이: {report.learningStyle.difference}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-sm text-tt-muted">시각</div>
                <div className="font-mono text-2xl font-bold text-tt-heading">
                  {report.processingCapability.visual.percentile}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-tt-muted">청각</div>
                <div className="font-mono text-2xl font-bold text-tt-heading">
                  {report.processingCapability.auditory.percentile}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Attention */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-tt-heading mb-4 flex items-center">
            <span className="bg-tt-teal text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
            시청각 주의력
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Visual Attention */}
            <div className="bg-tt-bg p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">시각 주의력</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">표준편차:</span>
                  <span className="font-bold">{report.attention.visual.standardDeviation}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">수준:</span>
                  <span className="font-bold" style={{ color: getLevelColor(report.attention.visual.level) }}>
                    {report.attention.visual.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">백분위:</span>
                  <span className="font-bold text-xl" style={{ color: getPercentileColor(report.attention.visual.percentile) }}>
                    {report.attention.visual.percentile}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${report.attention.visual.percentile}%`,
                      backgroundColor: getPercentileColor(report.attention.visual.percentile),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Auditory Attention */}
            <div className="bg-tt-bg p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">청각 주의력</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">표준편차:</span>
                  <span className="font-bold">{report.attention.auditory.standardDeviation}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">수준:</span>
                  <span className="font-bold" style={{ color: getLevelColor(report.attention.auditory.level) }}>
                    {report.attention.auditory.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">백분위:</span>
                  <span className="font-bold text-xl" style={{ color: getPercentileColor(report.attention.auditory.percentile) }}>
                    {report.attention.auditory.percentile}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${report.attention.auditory.percentile}%`,
                      backgroundColor: getPercentileColor(report.attention.auditory.percentile),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Brain Speed */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-tt-heading mb-4 flex items-center">
            <span className="bg-tt-teal text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">4</span>
            뇌 인지속도
          </h2>

          <div className="bg-tt-bg p-6 rounded-lg">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">평균 Task Average</div>
                <div className="text-3xl font-bold text-gray-800">{report.brainSpeed.taskAverage}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">수준</div>
                <div className="text-3xl font-bold" style={{ color: getLevelColor(report.brainSpeed.level) }}>
                  {report.brainSpeed.level}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">백분위</div>
                <div className="text-3xl font-bold" style={{ color: getPercentileColor(report.brainSpeed.percentile) }}>
                  {report.brainSpeed.percentile}%
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="h-6 rounded-full transition-all flex items-center justify-center text-white text-sm font-bold"
                  style={{
                    width: `${report.brainSpeed.percentile}%`,
                    backgroundColor: getPercentileColor(report.brainSpeed.percentile),
                  }}
                >
                  {report.brainSpeed.percentile}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Sustainability */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-tt-heading mb-4 flex items-center">
            <span className="bg-tt-teal text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">5</span>
            지속성
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Visual Sustainability */}
            <div className="bg-tt-bg p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">시각 지속성</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">초반 평균</span>
                    <span className="font-bold">{report.sustainability.visual.earlyAverage}ms</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">후반 평균</span>
                    <span className="font-bold">{report.sustainability.visual.lateAverage}ms</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">오류율</span>
                    <span className="font-bold text-red-600">{report.sustainability.visual.errorRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${Math.min(100, report.sustainability.visual.errorRate)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">향상율</span>
                    <span className="font-bold text-green-600">{report.sustainability.visual.improvementRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${Math.min(100, report.sustainability.visual.improvementRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Auditory Sustainability */}
            <div className="bg-tt-bg p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">청각 지속성</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">초반 평균</span>
                    <span className="font-bold">{report.sustainability.auditory.earlyAverage}ms</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">후반 평균</span>
                    <span className="font-bold">{report.sustainability.auditory.lateAverage}ms</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">오류율</span>
                    <span className="font-bold text-red-600">{report.sustainability.auditory.errorRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${Math.min(100, report.sustainability.auditory.errorRate)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">향상율</span>
                    <span className="font-bold text-green-600">{report.sustainability.auditory.improvementRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${Math.min(100, report.sustainability.auditory.improvementRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Hemisphere Balance */}
        <div className="mb-8 print:break-inside-avoid print:break-before-page">
          <h2 className="text-2xl font-bold text-tt-heading mb-4 flex items-center">
            <span className="bg-tt-teal text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">6</span>
            좌우뇌 균형도
          </h2>

          <div className="bg-tt-bg p-6 rounded-lg">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-tt-muted mb-2">좌뇌</div>
                <div className="font-mono text-4xl font-bold text-tt-heading">{report.hemisphereBalance.leftBrain}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-tt-muted mb-2">균형도</div>
                <div className="text-3xl font-bold text-tt-teal">
                  {report.hemisphereBalance.correlation}
                </div>
                <div className="text-sm text-tt-light-muted mt-1">차이: {report.hemisphereBalance.difference}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-tt-muted mb-2">우뇌</div>
                <div className="font-mono text-4xl font-bold text-tt-heading">{report.hemisphereBalance.rightBrain}%</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="w-full bg-tt-border rounded-full h-3 relative">
                <div className="absolute left-1/2 -top-0.5 -bottom-0.5 w-0.5 bg-tt-light-muted-alt" />
                <div
                  className="absolute top-0 bottom-0 rounded-full bg-tt-teal"
                  style={{
                    left: `${50 - report.hemisphereBalance.difference / 2}%`,
                    width: `${report.hemisphereBalance.difference}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 피드백 등급 분포 (표현 전용 집계, PDF 캡처 범위 외) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-tt-heading mb-4">피드백 등급 분포</h2>
          <div className="bg-tt-bg p-6 rounded-lg">
            <div className="flex h-4.5 rounded-md overflow-hidden mb-4">
              {FEEDBACK_DIST.map((f) => (
                <div key={f.key} style={{ width: `${(f.count / feedbackTotal) * 100}%`, background: f.color }} />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5">
              {FEEDBACK_DIST.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-none" style={{ background: f.color }} />
                  <span className="text-xs text-tt-muted flex-1">{f.label}</span>
                  <span className="font-mono text-xs font-semibold text-tt-heading">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Individual Test Results */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-tt-heading mb-1">부위별 검사 결과</h2>
          <p className="text-xs text-tt-light-muted mb-4">
            평균오차: 비트와 실제 입력 간 타이밍 오차(ms, 낮을수록 정확) · 정답 부위율: 입력한 신체 부위가 지시된 부위와 일치한 비율(타이밍과 무관)
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-tt-bg">
                  <th className="border border-tt-border-alt px-4 py-2 text-left">검사명</th>
                  <th className="border border-tt-border-alt px-4 py-2 text-center">평균오차</th>
                  <th className="border border-tt-border-alt px-4 py-2 text-center">등급</th>
                  <th className="border border-tt-border-alt px-4 py-2 text-center" title="입력한 신체 부위가 지시된 부위와 일치한 비율(타이밍 정확도가 아님)">정답 부위율</th>
                  <th className="border border-tt-border-alt px-4 py-2 text-center">총 입력수</th>
                </tr>
              </thead>
              <tbody>
                {report.individualResults.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-tt-card' : 'bg-tt-bg'}>
                    <td className="border border-tt-border-alt px-4 py-2 font-medium text-tt-heading">
                      {result.testName}
                    </td>
                    <td className="border border-tt-border-alt px-4 py-2 text-center font-mono font-bold text-tt-heading">
                      {Math.round(result.sessionResults.taskAverage)}ms
                    </td>
                    <td className="border border-tt-border-alt px-4 py-2 text-center">
                      <span className="inline-block font-mono font-bold text-sm text-white bg-tt-teal rounded-md px-2.5 py-0.5">
                        {result.sessionResults.classLevel}
                      </span>
                    </td>
                    <td className="border border-tt-border-alt px-4 py-2 text-center font-mono text-tt-heading">
                      {result.sessionResults.accuracyRate}%
                    </td>
                    <td className="border border-tt-border-alt px-4 py-2 text-center font-mono text-tt-heading">
                      {result.sessionResults.totalBeats}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
