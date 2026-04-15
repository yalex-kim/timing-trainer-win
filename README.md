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

> **개발 환경 주의**: Claude Code 터미널에서 `npm run dev` 실행 시 `ELECTRON_RUN_AS_NODE=1` 환경변수로 인해 창이 열리지 않을 수 있습니다. 별도의 PowerShell/CMD 터미널에서 실행하세요.

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

결과 파일은 실행파일 옆 `TT_Result/` 폴더에 자동 저장됩니다.

| 형식 | 저장 경로 | 비고 |
|------|----------|------|
| PDF  | `TT_Result/이름_나이세_타이밍검사_날짜_시분초.pdf` | 검사마다 개별 파일 |
| Excel | `TT_Result/TimingTrainer_Assessment_Data.xlsx` | 전체 누적 저장 |

- **개발 모드**에서는 프로젝트 루트 상위 폴더 기준으로 저장됩니다.

## 입력 장치

### 키보드

| 키 | 신체 부위 |
|----|----------|
| A  | 왼손     |
| S  | 오른손   |
| D  | 왼발     |
| F  | 오른발   |

### USB 시리얼 장치 (Qtrainer_YB)

FTDI 장치는 앱 시작 시 자동 연결됩니다. 수동 연결은 우측 상단 설정(⚙️)에서 가능합니다.

- **통신 설정**: Baud Rate 115200, Data bits 8, Stop bits 1, Parity None
- **프로토콜**: 버튼 누름마다 단일 ASCII 문자 전송
  - `1` = 왼손, `2` = 오른손, `3` = 왼발, `4` = 오른발

## 데이터 저장

모든 사용자 프로필 및 세션 기록은 **localStorage**에 저장됩니다. 별도의 서버나 인증이 필요하지 않습니다.

## 릴리즈

GitHub Actions를 통해 Windows 실행파일을 자동으로 빌드합니다.  
`v*` 형식의 태그를 push하면 빌드가 트리거되고 GitHub Releases에 exe가 업로드됩니다.

```bash
# 1. package.json의 "version" 수정
# 2. commit + push (태그 없이)
git add package.json
git commit -m "chore: 버전 x.x.x"
git push origin main

# 3. 동일한 버전으로 태그 push → Actions 트리거
git tag vx.x.x
git push origin vx.x.x
```

빌드 결과물 (GitHub Releases):
- `Timing Trainer-x.x.x.exe` — 통합 설치 파일 (x64 + ia32)
- `Timing Trainer-x.x.x-x64.exe` — x64 전용 설치 파일
- `Timing Trainer-x.x.x-portable.exe` — 포터블 EXE (설치 불필요)
