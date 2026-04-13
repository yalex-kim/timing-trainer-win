# 타이밍 트레이너 (Timing Trainer)

Interactive Metronome(IM) 연구를 기반으로 한 타이밍 훈련 및 과제수행능력 평가 시스템입니다.  
좌/우 손, 좌/우 발 네 가지 신체 부위의 타이밍 협응력을 훈련하고 임상 수준의 평가 보고서를 생성합니다.

## 기술 스택

- **프레임워크**: Electron 40 + React 19 + TypeScript 5
- **빌드 도구**: Vite 7 + electron-builder
- **스타일링**: Tailwind CSS 4
- **시리얼 통신**: serialport 13 (USB 입력 장치)
- **오디오**: Web Audio API
- **차트**: Recharts 3
- **내보내기**: ExcelJS 4 (XLSX), jsPDF 4 + html-to-image (PDF)

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (Vite + Electron 핫 리로드)
npm run dev

# 린트 검사
npm run lint

# Windows 빌드 (NSIS 설치 파일 + 포터블 EXE)
npm run build:win

# 패키징 없이 빌드 (빠른 확인용)
npm run build:dir
```

## 주요 기능

### 훈련 모드
- 1–4개 신체 부위 선택, 시각 또는 청각 자극, BPM 40–200 설정
- 1–10분 훈련 세션
- 실시간 피드백: PERFECT → EXCELLENT → GOOD → FAIR → POOR → MISS

### 평가 모드
- BPM 60 고정, 4 신체 부위 × 2 자극 유형(시각/청각) = 8개 표준화 테스트
- 연령별 기준표 기반 등급(1–7) 산출
- 학습 유형(시각/청각 우세), 좌우뇌 균형, 지속성 분석 포함 통합 보고서

### 결과 내보내기
- Excel(XLSX) 및 PDF 형식 지원

## 입력 장치

| 키 | 신체 부위 |
|----|----------|
| A | 왼손 |
| S | 오른손 |
| D | 왼발 |
| F | 오른발 |

USB 시리얼 장치도 지원합니다 (앱 설정에서 포트 연결).

## 데이터 저장

모든 사용자 프로필 및 세션 기록은 **localStorage**에 저장됩니다. 별도의 서버나 인증이 필요하지 않습니다.
