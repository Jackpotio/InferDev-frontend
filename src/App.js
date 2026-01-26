import { useState, useEffect } from "react";
import "./styles.css";

const JOBS = {
  frontend: "프론트엔드 개발자",
  backend: "백엔드 개발자",
  ai: "AI 엔지니어",
};

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

function NavBar({ onLogoClick, onNavClick, isScrolled }) {
  return (
    <div className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="logo" onClick={onLogoClick}>
        <img src="/assets/logo.png" alt="InferDev Logo" />
      </div>
      <div className="nav-links">
        <button onClick={() => onNavClick("analysis")}>성향 기반 분석</button>
        <button onClick={() => onNavClick("recommendation")}>
          맞춤 직무 추천
        </button>
        <button onClick={() => onNavClick("insights")}>개발자 인사이트</button>
      </div>
    </div>
  );
}

function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        // Adjust scroll threshold as needed
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
  const handleOptionClick = (option) => {
    setScores((prev) => {
      const newScroes = { ...prev };

      for (const key in option.score) {
        newScroes[key] += option.score[key];
      }

      return newScroes;
    });
    setCurrentQuestionIndex((prev) => {
      const isLastQuestion = prev === filteredQuestions.length - 1;

      if (isLastQuestion) {
        setStep(3);
        return prev;
      }
      return prev + 1;
    });
  };

  const handleNavClick = (sectionId) => {
    const scrollToSection = () => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    };

    if (step !== 0) {
      resetSurvey();
      setTimeout(scrollToSection, 100);
    } else {
      scrollToSection();
    }
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
    // 1. Validate major
    if (!major) {
      alert("전공 여부를 선택해주세요.");
      return;
    }
    if (major === "it" && !itMajorDetail) {
      alert("IT 계열 전공을 선택해주세요.");
      return;
    }

    // 2. Validate coding experience
    if (!codingExp) {
      alert("코딩 경험 여부를 선택해주세요.");
      return;
    }
    if (codingExp === "yes" && !codingLevel) {
      alert("코딩 경험 수준을 선택해주세요.");
      return;
    }

    // If all validations pass, proceed to the next step
    const questions = filterQuestions();
    setFilteredQuestions(questions);
    setStep(2);
  };

  return (
    <div className="app-container">
      <NavBar
        onLogoClick={() => (window.location.href = "/")}
        onNavClick={handleNavClick}
        isScrolled={isScrolled}
      />
      <div className={`navbar-ghost ${isScrolled ? "navbar-ghost-scrolled" : ""}`} />
      {step === 0 && (
        <div className="fade-in" key="step-0">
          <div className="main-header">
            <h1 className="main-title">
              나에게 꼭 맞는
              <br />
              개발자 직무는 무엇일까?
            </h1>
            <p className="main-subtitle">
              지금 바로 성향 기반 직무 추천 설문에 참여하고
              <br />
              나에게 맞는 직무를 확인해보세요!
            </p>
            <button
              type="button"
              className="cta-button"
              onClick={() => setStep(1)}
            >
              설문 시작
            </button>
          </div>

          <div id="analysis" className="survey-intro-section">
            <div className="intro-description">
              <div className="feature">
                <h2 className="feature-title">성향 기반 분석</h2>
                <p>간단한 설문을 통해 당신의 성향을 분석합니다.</p>
                <p>
                  추가된 내용: 저희의 독자적인 알고리즘은 여러분의 답변을
                  분석하여 개발자로서의 잠재적 성향을 파악합니다. 창의적인
                  문제 해결을 즐기는지, 논리적이고 체계적인 접근을 선호하는지
                  등을 다각도로 분석하여 가장 적합한 직무 유형을 제시합니다.
                </p>
              </div>
            </div>
            <div className="image-placeholder">
              <img src="/assets/propensity.png" alt="성향 분석 관련 이미지" />
            </div>
          </div>

          <div id="recommendation" className="survey-intro-section">
            <div className="image-placeholder">
              <img src="/assets/carrer.png" alt="진로 추천 관련 이미지" />
            </div>
            <div className="intro-description">
              <div className="feature">
                <h2 className="feature-title">맞춤 진로 추천</h2>
                <p>분석 결과를 바탕으로 최적의 IT 진로를 추천해 드립니다.</p>
                <p>
                  추가된 내용: 프론트엔드, 백엔드, AI 엔지니어 등 다양한 개발
                  직무 중에서 당신의 성향과 가장 일치하는 진로를 추천합니다. 각
                  직무의 특징, 필요한 기술 스택, 그리고 전망에 대한 정보를 함께
                  제공하여 구체적인 진로 계획을 세울 수 있도록 돕습니다.
                </p>
              </div>
            </div>
          </div>

          <div id="insights" className="survey-intro-section">
            <div className="intro-description">
              <div className="feature">
                <h2 className="feature-title">개발자 인사이트</h2>
                <p>현직 개발자들의 직무별 특징과 정보를 얻을 수 있습니다.</p>
                <p>
                  추가된 내용: 각 직무별 현직 개발자들의 생생한 인터뷰와 경험담을
                  통해 실제 업무 환경과 직무의 장단점에 대한 깊이 있는 이해를
                  얻을 수 있습니다. 또한, 주니어 개발자에게 필요한 역량과 성장
                  가이드도 확인해보세요.
                </p>
              </div>
            </div>
            <div className="image-placeholder">
              <img src="/assets/insight.png" alt="개발자 인사이트 관련 이미지" />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="intro-card fade-in" key="step-1">
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
        <div className="intro-card" key={`step-2-q-${currentQuestion.id}`}>
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
        <div className="intro-card fade-in" key="step-3">
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
//test