# Survey Frontend

## 프로젝트 개요

이 레포지토리는 **설문조사 웹 서비스의 프론트엔드**를 담당한다.

사용자는 단계별 설문(UI Step 기반)을 통해 정보를 입력하고, 입력 결과는 백엔드 API로 전송되어 분석·처리된다.

본 프론트엔드는 단순 화면 구현이 아닌, **상태 관리·입력 검증·API 연동 구조를 학습하고 설계하는 것**을 핵심 목표로 한다.

---

## 기술 스택

* **React** (Function Component 기반)
* **JavaScript → TypeScript (점진적 전환 고려)**
* **상태 관리**: useState / useEffect (초기), 추후 Context 또는 Zustand 고려
* **스타일링**: CSS / CSS Module (단순·명확한 구조 우선)
* **개발 환경**: CodeSandbox (사지방 환경 고려)

---

## 디렉토리 구조 (예정)

```text
src/
 ├─ components/        # 재사용 가능한 UI 컴포넌트
 │   ├─ StepLayout.jsx
 │   ├─ QuestionCard.jsx
 │   └─ ProgressBar.jsx
 │
 ├─ pages/             # 단계별 설문 페이지
 │   ├─ Step0Intro.jsx
 │   ├─ Step1Basic.jsx
 │   ├─ Step2Survey.jsx
 │   └─ Step3Result.jsx
 │
 ├─ data/              # 설문 질문/옵션 데이터
 │   └─ surveyQuestions.js
 │
 ├─ api/               # 백엔드 API 통신 로직
 │   └─ surveyApi.js
 │
 ├─ hooks/             # 커스텀 훅
 │   └─ useSurveyState.js
 │
 ├─ App.jsx
 └─ index.js
```

---

## 핵심 기능 설계

### 1. Step 기반 설문 흐름

* Step 0: 서비스 소개 및 시작
* Step 1: 기본 정보 입력 (전공, 코딩 경험 등)
* Step 2: 조건에 따라 필터링된 설문 문항 진행
* Step 3: 설문 완료 및 결과 확인

각 Step은 **상태로만 제어**되며, 페이지 새로고침 없이 이동한다.

---

### 2. 설문 질문 필터링 로직

* Step 1에서 입력한 정보(전공, 경험 여부 등)를 기준으로
* 전체 질문 리스트(SURVEY_QUESTIONS)에서 조건에 맞는 문항만 필터링

> 프론트에서 필터링을 수행하되,
> 백엔드에서도 동일한 검증이 가능하도록 구조를 단순화한다.

---

### 3. 상태 관리 전략

* 모든 설문 입력값은 하나의 surveyState 객체로 관리
* Step 이동 시 상태 누적
* Step 3 → Step 0 이동 시 **상태 초기화 필수**

---

### 4. 백엔드 API 연동

#### 요청

```http
POST /survey/submit
```

```json
{
  "major": "it",
  "codingExp": "yes",
  "scores": {
    "frontend": 3,
    "backend": 2,
    "ai": 1
  }
}
```

#### 응답 (예정)

```json
{
  "success": true,
  "result": "frontend"
}
```

---

## 개발 원칙

* UI보다 **로직과 구조 우선**
* 한 번에 많은 기능 구현 ❌
* 단계별로 명확한 목표 설정 후 진행
* 프론트는 **입력 → 상태 → API 전송**까지만 책임

---

## 향후 확장 방향

* TypeScript 전환
* 입력값 프론트 단 검증 추가
* 설문 결과 시각화
* 로그인/히스토리 기능 (백엔드 연동)

---

## 목표

이 프로젝트의 프론트엔드는 단순 결과물이 아니라:

* React 상태 흐름 이해
* 조건부 렌더링과 데이터 필터링
* 백엔드와의 명확한 역할 분리

를 학습하기 위한 **구조 중심 실습 프로젝트**이다.
