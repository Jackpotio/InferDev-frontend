import { useState } from "react";
import "./styles.css";

const JOBS = {
  frontend: "프론트엔드 개발자",
  backend: "백엔드 개발자",
  ai: "AI 엔지니어",
};

{
  /*이거 질문에 조건 붙이는 건 추후로 미뤄야할듯 */
}
const SURVEY_QUESTIONS = [
  {
    id: 1,
    question: "예시 질문 1",
    options: [
      { text: "예시 답변 1", score: { frontend: 0 } },
      { text: "예시 답변 2", score: { backend: 0 } },
    ],
  },
  {
    id: 2,
    question: "전공자 예시 질문 1",
    options: [
      { text: "예시 답변 1", score: { frontend: 2 } },
      { text: "예시 답변 2", score: { backend: 0 } },
    ],
    condition: {
      major: "it",
      or: [{ codingExp: "yes" }, { codingExp: "no" }],
    },
  },
  {
    id: 3,
    question: "코딩 경험 유자 질문 1",
    options: [
      { text: "예시 답변 1", score: { frontend: 1 } },
      { text: "예시 답변 2", score: { backend: 5 } },
    ],
  },
  {
    id: 4,
    question: "프론트엔드 개발자 유도 질문 1",
    options: [
      { text: "예시 답변 1", score: { frontend: 10 } },
      { text: "예시 답변 2", score: { backend: 0 } },
    ],
  },
  {
    id: 5,
    question: "코딩 경험 O 전공자 질문",
    options: [
      { text: "예시 답변 1", score: { frontend: 10 } },
      { text: "예시 답변 2", score: { backend: 0 } },
    ],
  },
];

function App() {
  {
    /*state 초기화 */
  }
  const resetSurvey = () => {
    setMajor("");
    setItmajorDetail("");
    setCodingExp("");
    setCodingLevel("");

    setScores({
      frontend: 0,
      backend: 0,
      ai: 0,
    });

    setFilteredQuestions([]);
    setCurrentQuestionIndex(0);
    setStep(0);
  };
  {
    /* 답변 클릭 시 점수 종합 및 이동 함수 */
  }
  const handleOptionClick = (option) => {
    // 1. 점수 반영 (아직 구조만)
    setScores((prev) => {
      const newScroes = { ...prev };

      for (const key in option.score) {
        newScroes[key] += option.score[key];
      }

      return newScroes;
    });
    //2. 다음 질문으로 이동
    setCurrentQuestionIndex((prev) => {
      const isLastQuestion = prev === filteredQuestions.length - 1;

      if (isLastQuestion) {
        setStep(3);
        return prev;
      }
      return prev + 1;
    });
  };

  const [scores, setScores] = useState({
    frontend: 0,
    backend: 0,
    ai: 0,
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [major, setMajor] = useState("");
  const [itMajorDetail, setItmajorDetail] = useState("");

  const [codingExp, setCodingExp] = useState("");
  const [codingLevel, setCodingLevel] = useState("");

  const [step, setStep] = useState(0);

  const [filteredQuestions, setFilteredQuestions] = useState([]);

  const currentQuestion = filteredQuestions[currentQuestionIndex] || null;

  const surveyCondition = {
    major,
    itMajorDetail,
    codingExp,
  };

  const filterQuestions = () => {
    return SURVEY_QUESTIONS.filter((q) => {
      if (!q.condition) return true;

      for (const key in q.condition) {
        if (surveyCondition[key] !== q.condition[key]) {
          return false;
        }
      }

      return true;
    });
  };

  const goToSurvey = () => {
    const questions = filterQuestions();
    setFilteredQuestions(questions);
    setStep(2);
  };

  return (
    <div className="intro-page">
      {step === 0 && (
        <div className="intro-card">
          <h1>개발자 설문조사</h1>

          <section className="intro-description">
            <p>개발자 성향, 지금 바로 확인해보세요.</p>

            <p>설문 기반으로 당신에게 맞는 IT 직무를 추천해요.</p>

            <p>소요 시간: 약 5분</p>
          </section>

          <button type="button" onClick={() => setStep(1)}>
            설문 시작하기
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="intro-card">
          <p className="step-indicator">Step 1 / 기본정보</p>

          <h1>기본 정보</h1>
          <div className="step-description">
            시작하기 전에, 몇 가지만 알려주세요.
            {/* 질문 1 */}
            <div className="question">
              <p className="question-title">1. 전공이 IT 계열인가요? </p>

              <label>
                <input
                  type="radio"
                  name="major"
                  value="it"
                  onChange={(e) => setMajor(e.target.value)}
                />
                예
              </label>

              <label>
                <input
                  type="radio"
                  name="major"
                  value="non-it"
                  onChange={(e) => setMajor(e.target.value)}
                />
                아니오
              </label>

              {/*IT 전공일 때만 표시 */}
              {major === "it" && (
                <div className="question sub-question">
                  <p className="question-title">
                    IT 계열 중 전공을 선택해주세요.
                  </p>

                  <select onChange={(e) => setItmajorDetail(e.target.value)}>
                    <option value=""> 선택</option>
                    <option value="cs">컴퓨터·소프트웨어 계열</option>
                    <option value="ai">AI·데이터 계열</option>
                    <option value="ns">정보통신·보안 계열</option>
                    <option value="gc">게임·미디어·콘텐츠 IT 계열</option>
                    <option value="etc">기타 IT 관련 전공</option>
                  </select>
                </div>
              )}
            </div>
            {/* 질문 2 */}
            <div className="question">
              <p className="question-title"> 2. 코딩 경험이 있나요?</p>

              <label>
                <input
                  type="radio"
                  name="coding"
                  value="yes"
                  onChange={(e) => setCodingExp(e.target.value)}
                />
                예
              </label>
              <label>
                <input
                  type="radio"
                  name="coding"
                  value="no"
                  onChange={(e) => setCodingExp(e.target.value)}
                />
                아니오
              </label>
            </div>
            {/* 코딩 경험 있을 때만 표시 */}
            {codingExp === "yes" && (
              <div className="question sub-question">
                <p className="question-title">코딩 경험 수준을 선택해주세요.</p>
                <select onChange={(e) => setCodingLevel(e.target.value)}>
                  <option value="">선택</option>
                  <option value="basic">기초 문법 이해</option>
                  <option value="project">개인 프로젝트 경험</option>
                  <option value="team">팀 프로젝트 경험</option>
                  <option value="practical">실무 또는 인턴 경험</option>
                </select>
              </div>
            )}
            <button type="button" onClick={goToSurvey}>
              다음 단계로
            </button>
          </div>
        </div>
      )}

      {step === 2 && currentQuestion && (
        <div className="intro-card">
          <p className="step-indicator">Step 2 / 설문조사</p>
          <h1>{currentQuestion.question}</h1>
          <div className="options">
            {currentQuestion.options.map((option, index) => (
              <button key={index} onClick={() => handleOptionClick(option)}>
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="intro-card">
          <p className="step-indicator"> Step 3 / 결과</p>

          <h1>설문결과</h1>

          <p className="step-description">
            당신의 설문 결과는 다음과 같습니다.
          </p>

          <div className="result-list">
            <div className="result-item">
              프론트엔드 개발자 점수: {scores.frontend}
            </div>
            <div className="result-item">
              백엔드 개발자 점수: {scores.backend}
            </div>
            <div className="result-item">AI 개발자 점수: {scores.ai}</div>
          </div>
          <button type="button" onClick={resetSurvey}>
            처음으로
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
