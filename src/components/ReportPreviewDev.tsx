import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ComprehensiveAssessmentReport from '@/components/ComprehensiveAssessmentReport';
import { generateMockReport } from '@/utils/mockReport';

/**
 * 개발용 전용 화면 — 더미 데이터로 종합 리포트를 바로 띄워 PDF/Excel 내보내기 등을
 * 실제 8개 검사를 진행하지 않고 빠르게 확인하기 위함. main.tsx에서 DEV 모드에만 라우팅됨.
 */
export default function ReportPreviewDev() {
  const navigate = useNavigate();
  const report = useMemo(() => generateMockReport(), []);

  return <ComprehensiveAssessmentReport report={report} onClose={() => navigate('/')} />;
}
