# InferDev Frontend (React)

IT 진로 적성검사 서비스 **InferDev**의 프론트엔드 SPA입니다.
사용자 설문 흐름, 조건부 질문 처리, 결과 화면 UI를 담당합니다.

---

## 1. 현재 개발 상태 요약

✅ 전체 설문 UX 플로우 구현 완료
✅ 백엔드 API 연동 완료
✅ 조건부 질문 필터링 구현
⚠️ 결과 화면 일부 데이터는 백엔드 로직 의존 (현재 mock)

---

## 2. 기술 스택

* React (CRA 기반)
* JavaScript
* Fetch API
* CSS (단일 styles.css)

---

## 3. 프로젝트 구조

```
src/
 ├─ App.js        # 전체 앱 로직 (상태, 설문, 결과)
 ├─ index.js
 ├─ styles.css
public/
 └─ assets/       # 이미지 리소스
```

⚠️ 현재는 **단일 App 컴포넌트 구조**

---

## 4. 주요 기능 흐름

### 1️⃣ 랜딩 페이지

* 서비스 소개
* 설문 시작 CTA

### 2️⃣ 기본 정보 입력

* 전공 여부
* IT 전공 상세
* 코딩 경험 및 수준

### 3️⃣ 설문 진행

* 조건에 맞는 질문만 필터링
* 질문 단위 순차 진행
* 선택지 클릭 시 자동 다음 질문

### 4️⃣ 결과 화면

* 추천 직무
* 유사 직무
* 점수 시각화 UI

---

## 5. API 연동 구조

```js
GET  /api/jobs
GET  /api/job-details
GET  /api/survey-questions
POST /api/recommendation
```

* `/api` 프록시 기반 통신
* 백엔드 포트 충돌 문제 해결 완료

---

## 6. 상태 관리 구조

* useState 기반 로컬 상태 관리
* 주요 상태:

  * step (진행 단계)
  * filteredQuestions
  * answerScores (questionId, optionId)
  * resultScores (백엔드 결과)

---

## 7. 현재 한계점

* 컴포넌트 분리 미흡
* 상태 구조 복잡
* 결과 화면 일부는 백엔드 구현 의존

---

## 8. 개선 예정 사항

* 컴포넌트 단위 분리
* 타입스크립트 전환
* 결과 시각화 컴포넌트 분리
* 로그인 기능 연동

---

## 9. 실행 방법

```bash
npm install
npm start
```

* 기본 포트: 3000

---

## 10. 설계 의도

이 프론트엔드는 단순 UI가 아니라,

> **사용자의 선택 흐름을 최대한 자연스럽게 유도하는 설문 UX**

를 목표로 설계되었습니다.
