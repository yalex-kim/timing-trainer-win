# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 명령어

```bash
npm run dev          # 개발 서버 실행 (Vite + Electron 핫 리로드)
npm run build        # TypeScript 컴파일 + Vite 번들 + Electron 패키징
npm run build:win    # Windows 빌드 (x64, NSIS 설치 파일 + 포터블 EXE)
npm run build:dir    # 패키징 없이 빌드 (디렉토리 출력, 빠른 반복 작업용)
npm run lint         # ESLint 검사
```

테스트 스위트는 아직 구성되지 않았습니다.

## 아키텍처

**Electron + React 데스크탑 앱**으로, Interactive Metronome (IM) 연구를 기반으로 한 타이밍 평가 시스템입니다. 네 가지 신체 부위(좌/우 손, 좌/우 발)의 타이밍 및 협응력을 훈련하고 임상 수준의 평가 보고서를 생성합니다.

### 프로세스 구조

- **`electron/main.ts`** — 메인 프로세스: 윈도우 관리, IPC를 통한 시리얼 포트 I/O, 파일 시스템 접근
- **`electron/preload.ts`** — 렌더러에 `window.electronAPI`(시리얼 포트 연결/해제/데이터)를 노출하는 보안 IPC 브릿지
- **`src/`** — React 렌더러 (HashRouter SPA, 파일 시스템 API 직접 사용 불가)

### 핵심 도메인 (`src/types/evaluation.ts`)

가장 중요한 파일. 다음을 포함합니다:
- **`AGE_BASED_STANDARDS`** — 연령 그룹(7세 미만 ~ 18세 이상)과 자극 유형(청각/시각)에 따라 구분된 TA(Task Average) 임계값의 14개 배열로 구성된 심리측정 테이블. 모든 등급 계산의 기준
- **등급 1–7** — TA(ms 편차)를 연령별 기준표와 비교하여 산출
- **6단계 피드백 시스템** — PERFECT → EXCELLENT → GOOD → FAIR → POOR → MISS, ms 편차 범위에 매핑

### 세션 데이터 흐름

1. 사용자가 프로필(이름, 생년월일, 성별) 입력 → **localStorage** 저장
2. 모드 + 신체 부위 순서 + BPM 선택 → 훈련/평가 페이지로 이동
3. 훈련 페이지가 **Web Audio API** (`AudioContext`)로 메트로놈 비트를 생성하고 키보드(A/S/D/F 키 → 신체 부위 매핑) 또는 시리얼 포트로부터 입력 타임스탬프 수집
4. `src/utils/evaluator.ts`가 **Task Average (TA)** = 타이밍 편차의 중앙값을 계산하고 기준표에서 등급으로 매핑
5. 평가 모드는 8개의 순차적 테스트(4 신체 부위 × 2 자극 유형: 시각/청각) 실행
6. 결과를 **ExcelJS** (XLSX) 또는 **jsPDF + html-to-image** (PDF)로 내보내기

### 두 가지 앱 모드

- **훈련 모드** — 사용자 설정: 1–4개 신체 부위, 시각 또는 청각 자극, BPM 40–200, 1–10분 지속
- **평가 모드** — BPM 60의 표준화된 8개 테스트 배터리; 학습 유형 분석(시각/청각 우세), 좌우뇌 균형, 지속성 지표를 포함한 통합 보고서 생성

### 주요 훅

- `src/hooks/` — 입력 처리(키보드/시리얼/USB), 오디오 비프음 생성, localStorage 기반 사용자 프로필 관리

### 입력 소스

키보드(기본), USB 시리얼 장치(`serialport` npm 패키지), 터치 버튼에서 입력을 받습니다. 모두 `InputMapping` 인터페이스를 통해 라우팅됩니다.

### Qtrainer_YB 시리얼 프로토콜

**하드웨어:** AVR 마이크로컨트롤러 기반 4-채널 입력 단말 (Atmel Studio 프로젝트: `C:\Users\user\Documents\Atmel Studio\7.0\Qtrainer_YB\Qtrainer_YB`)

**시리얼 통신 설정:**
- Baud Rate: **115200**
- Data bits: 8, Stop bits: 1, Parity: None

**데이터 프로토콜:**
- 버튼 누름 시 **단일 ASCII 문자 1개** 전송 (줄바꿈 없음)
- `'1'` → 왼손 (Left Hand, PJ0)
- `'2'` → 오른손 (Right Hand, PJ1)
- `'3'` → 왼발 (Left Foot, PJ2)
- `'4'` → 오른발 (Right Foot, PJ3)
- 버튼 릴리스 이벤트는 전송하지 않음 (Press only)
- 초기화 시 텍스트 메시지 전송: `"System Ready\r\n"`, `"Monitoring switches: LH, RH, LF, RF\r\n"` → 앱에서 무시됨

**구현 위치:**
- `electron/main.ts` — `SerialPort` raw `data` 이벤트로 수신, 문자 단위로 렌더러에 전달
- `src/hooks/useInputHandler.ts` — `QTRAINER_MAP` 객체로 문자 → `InputType` 매핑

### Windows 패키징

`electron-builder`가 NSIS 설치 파일(한국어 로케일: "타이밍 훈련")과 포터블 EXE를 생성합니다. `build:win`은 x64 전용입니다.

## 주요 의존성

| 용도 | 패키지 |
|------|--------|
| 데스크탑 셸 | Electron 40 |
| 프론트엔드 | React 19, React Router 7 |
| 스타일링 | Tailwind CSS 4 (Vite 플러그인) |
| 시리얼 포트 | serialport 13 |
| 차트 | Recharts 3 |
| Excel 내보내기 | ExcelJS 4 |
| PDF 내보내기 | jsPDF 4 + html-to-image |
| 오디오 | Web Audio API (라이브러리 없음) |

## 참고사항

- 모든 사용자 데이터는 **localStorage**에 저장 — 백엔드 및 인증 없음
- UI 레이블과 주석은 **한국어**로 작성되며, 도메인 용어는 IM 연구 관례를 따름
- `src/config/constants.ts`는 워킹 트리에서 삭제됨 (git status에서 `D` 표시) — 참조하지 말 것; 상수는 인라인으로 이동됨
- `src/utils/evaluator.ts`에 스테이징되지 않은 변경사항 있음 — 편집 전 현재 상태 확인 필요
