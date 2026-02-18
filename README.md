# InferDev Frontend (React)

InferDev의 프론트엔드 SPA입니다.  
설문 진행/결과 확인/프로필 오버레이(알림·계정·기록·플랜)를 제공합니다.

---

## 1. 현재 구현 상태

- 랜딩 + 설문 + 결과 화면 동작
- 단계별 질문(stage1/stage2) API 연동
- Google OAuth 로그인 연동
- 로그인 상태 기반 네비게이션(`로그인` ↔ `프로필`)
- 프로필 오버레이 탭 UI 구현
  - 알림함(읽음/전체읽음)
  - 계정 정보(이메일/가입일/로그인 방식)
  - 검사 기록(저장 결과 재조회)
  - 플랜/결제 관리(UI)
- 브라우저 뒤로가기/앞으로가기 상태 동기화(hash 기반)
- 프로필 오버레이 닫기 UX
  - 바깥 클릭 닫기
  - ESC 닫기

---

## 2. 기술 스택

- React (CRA)
- JavaScript
- Fetch API
- CSS (`src/styles.css`)

---

## 3. 프로젝트 구조

```txt
src/
 ├─ App.js        # 설문/결과/프로필 오버레이 전체 상태
 ├─ api.js        # 공통 API fetch 래퍼 (JWT 헤더 자동 첨부)
 ├─ auth.js       # auth/profile API 유틸
 ├─ index.js
 └─ styles.css
public/
 └─ assets/
```

---

## 4. 주요 화면/흐름

### 4.1 랜딩/설문

- step0: 랜딩
- step1: 기본 정보
- step2: 설문 진행
- step3: 결과

### 4.2 로그인

- 네비게이션 `로그인` 클릭 → 로그인 모달
- Google OAuth 진행 후 token hash 수신
- token 저장 + 사용자 상태 복원

### 4.3 프로필 (오버레이)

어느 step에서든 `프로필` 버튼 클릭 시 현재 화면 위 오버레이로 표시.

탭:
- `알림`: 알림 목록, 읽음/안읽음, 전체 읽음
- `계정 정보`: 이메일, 가입일(`YYYY.MM.DD`), 로그인 방식, 표시 이름
- `검사 기록`: 저장된 결과 선택 및 Top3 확인
- `플랜/결제`: 플랜 보기/결제 관리/구독 해지 UI

---

## 5. API 연동

기본 URL:
- `REACT_APP_API_URL` (예: `https://<backend>/api`)

사용 API:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/google`
- `GET /auth/me`
- `GET /auth/profile`
- `POST /auth/profile`
- `GET /jobs`
- `GET /job-details`
- `GET /career-tracks`
- `GET /survey-questions`
- `POST /recommendation/stage1`
- `POST /recommendation/final`

---

## 6. 상태/저장 전략

- 인증 토큰: `localStorage.accessToken`
- 검사 기록: 사용자별 `inferdev:savedResults:<userId>`
- 알림 목록: 사용자별 `inferdev:notifications:<userId>`
- 프로필 설정 원본: 백엔드 `/auth/profile`

---

## 7. 실행 방법

```bash
npm install
npm start
```

현재 dev 포트: `3001`

빌드:

```bash
npm run build
```

---

## 8. 환경변수

- `REACT_APP_API_URL`

예시:

```env
REACT_APP_API_URL=https://3000-<workspace-host>/api
```

---

## 9. 앞으로의 설계/구현 방향

### 단기

- App.js 모놀리식 구조 분리
  - `ProfileOverlay`, `SurveyFlow`, `ResultPanel` 컴포넌트화
- 알림함 UI 컴포넌트 분리 및 타입 정리
- 프로필 탭별 로딩/에러 상태 분리

### 중기

- 전역 상태 관리 도입 (Zustand/Redux Toolkit 중 선택)
- 라우팅 정식 도입 (react-router) + URL 상태 모델 명확화
- 디자인 시스템화 (버튼/카드/모달 공통 컴포넌트)

### 운영 단계

- 토큰 저장 전략 고도화 (httpOnly 쿠키 전환 검토)
- 접근성(키보드 포커스/aria) 강화
- E2E 테스트 (로그인→설문→저장→프로필 조회)

---

## 10. 참고

- 현재는 빠른 제품 검증 중심으로 구현되어 있고, 컴포넌트 분리/상태 분리는 다음 단계에서 진행 예정입니다.
