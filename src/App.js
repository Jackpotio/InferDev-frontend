import { useState, useEffect } from "react";
import "./styles.css";

const JOBS = {
  frontend: "프론트엔드 개발자",
  backend: "백엔드 개발자",
  ai: "AI 엔지니어",
};

const JOB_DETAILS = {
  frontend: {
    title: "프론트엔드 개발자",
    img: "/assets/propensity.png",
    subfields: ["웹 퍼블리셔", "React 개발자", "Vue.js 개발자", "UI/UX 개발자"],
  },
  backend: {
    title: "백엔드 개발자",
    img: "/assets/carrer.png",
    subfields: ["Java/Spring 개발자", "Node.js 개발자", "데이터베이스 전문가", "API 개발자"],
  },
  ai: {
    title: "AI 엔지니어",
    img: "/assets/insight.png",
    subfields: ["머신러닝 엔지니어", "데이터 사이언티스트", "CV 엔지니어", "NLP 엔지니어"],
  },
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

function NavBar({ onLogoClick, onNavClick, isScrolled, onLoginClick, step }) {
  return (
    <div className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="logo" onClick={onLogoClick}>
        <img src="/assets/logo.png" alt="InferDev Logo" />
      </div>
      {step === 0 && (
        <div className="nav-links">
          <button onClick={() => onNavClick("analysis")}>성향 기반 분석</button>
          <button onClick={() => onNavClick("recommendation")}>
            맞춤 직무 추천
          </button>
          <button onClick={() => onNavClick("insights")}>개발자 인사이트</button>
        </div>
      )}
      <button onClick={onLoginClick} className="login-button-navbar">로그인</button> {/* Moved Login button outside nav-links */}
    </div>
  );
}

function App() {
  const [answerScores, setAnswerScores] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false); // New state for login screen

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

  const handleLoginClick = () => { // New function to show login screen
    setShowLoginScreen(true);
  };

  const handleCloseLogin = () => { // New function to hide login screen
    setShowLoginScreen(false);
  };

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
    setAnswerScores([]);
    setStep(0);
  };
  const handleOptionClick = (option) => {
    setAnswerScores((prev) => [...prev, option.score]);
    setScores((prev) => {
      const newScores = { ...prev };
      for (const key in option.score) {
        newScores[key] += option.score[key];
      }
      return newScores;
    });
    setCurrentQuestionIndex((prev) => {
      if (prev === filteredQuestions.length - 1) {
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

  const handleBack = () => {
    if (step === 2) {
      if (currentQuestionIndex > 0) {
        const lastScore = answerScores[answerScores.length - 1];
        const newScores = { ...scores };
        for (const key in lastScore) {
          newScores[key] -= lastScore[key];
        }
        setScores(newScores);
        setAnswerScores(answerScores.slice(0, -1));
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else {
        setStep(1);
      }
    } else if (step > 0) {
      setStep(step - 1);
    }
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
    setAnswerScores([]); // Reset scores for the new survey session
    setStep(2);
  };
  const getTopJob = () => {
    let topJob = "frontend";
    let maxScore = -1;

    for (const job in scores) {
      if (scores[job] > maxScore) {
        maxScore = scores[job];
        topJob = job;
      }
    }
    return topJob;
  };
  const topJob = step === 3 ? getTopJob() : null;
  const topJobDetails = topJob ? JOB_DETAILS[topJob] : null;

  return (
    <div className="app-container">
      <NavBar
        onLogoClick={() => (window.location.href = "/")}
        onNavClick={handleNavClick}
        isScrolled={isScrolled}
        onLoginClick={handleLoginClick}
        step={step}
      />
      <div className={`navbar-ghost ${isScrolled ? "navbar-ghost-scrolled" : ""}`} />

      {showLoginScreen && (
        <div className="login-screen-overlay">
          <div className="login-screen-modal">
            <h2>로그인</h2>
            <p>네이버 또는 구글로 로그인하세요.</p>
            <div className="login-buttons">
              <button className="naver-login-button">Naver 계정으로 로그인</button>
              <button className="google-login-button">Google 계정으로 로그인</button>
            </div>
            <button onClick={handleCloseLogin}>닫기</button>
          </div>
        </div>
      )}

      {!showLoginScreen && step > 0 && (
        <div className="app-body">
          {step === 1 && (
            <>
              <div className="left-panel">
                <h3>진행상황</h3>
                <div className="progress-steps">
                  <div className="progress-step active">기본 정보</div>
                  <div className="progress-step">설문 조사</div>
                  <div className="progress-step">결과 확인</div>
                </div>
              </div>
              <div className="center-panel">
                <div className="intro-card fade-in" key="step-1">
                  <p className="step-indicator">Step 1 / 기본정보</p>
                  <h1>기본 정보</h1>
                  <div className="step-description">시작하기 전에, 몇 가지만 알려주세요.</div>
                  <div className="question">
                    <p className="question-title">1. 전공이 IT 계열인가요?</p>
                    <label className={major === "it" ? "selected" : ""}>
                      <input type="radio" name="major" value="it" onChange={(e) => setMajor(e.target.value)} checked={major === "it"} />
                      <span className="radio-custom"></span> 예
                    </label>
                    <label className={major === "non-it" ? "selected" : ""}>
                      <input type="radio" name="major" value="non-it" onChange={(e) => setMajor(e.target.value)} checked={major === "non-it"} />
                      <span className="radio-custom"></span> 아니오
                    </label>
                    {major === "it" && (
                      <div className="question sub-question">
                        <p className="question-title">IT 계열 중 전공을 선택해주세요.</p>
                        <select onChange={(e) => setItmajorDetail(e.target.value)}>
                          <option value="">선택</option>
                          <option value="cs">컴퓨터·소프트웨어 계열</option>
                          <option value="ai">AI·데이터 계열</option>
                          <option value="ns">정보통신·보안 계열</option>
                          <option value="gc">게임·미디어·콘텐츠 IT 계열</option>
                          <option value="etc">기타 IT 관련 전공</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="question">
                    <p className="question-title">2. 코딩 경험이 있나요?</p>
                    <label className={codingExp === "yes" ? "selected" : ""}>
                      <input type="radio" name="coding" value="yes" onChange={(e) => setCodingExp(e.target.value)} checked={codingExp === "yes"} />
                      <span className="radio-custom"></span> 예
                    </label>
                    <label className={codingExp === "no" ? "selected" : ""}>
                      <input type="radio" name="coding" value="no" onChange={(e) => setCodingExp(e.target.value)} checked={codingExp === "no"} />
                      <span className="radio-custom"></span> 아니오
                    </label>
                  </div>
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
                  <button type="button" onClick={goToSurvey}>다음 단계로</button>
                  <button onClick={handleBack} className="back-button">뒤로가기</button>
                </div>
              </div>
              <div className="right-panel">
                <div className="context-box">
                  <h4>정보가 필요한 이유</h4>
                  <p>전공 및 코딩 경험에 따라 더 정확하고 개인화된 질문이 제공됩니다. 이 정보는 맞춤형 결과 분석에만 사용됩니다.</p>
                </div>
              </div>
            </>
          )}

          {step === 2 && currentQuestion && (
            <>
              <div className="left-panel">
                <h3>진행상황</h3>
                <div className="progress-steps">
                  <div className="progress-step completed">기본 정보</div>
                  <div className="progress-step active">설문 조사 ({currentQuestionIndex + 1}/{filteredQuestions.length})</div>
                  <div className="progress-step">결과 확인</div>
                </div>
              </div>
              <div className="center-panel">
                <div className="intro-card" key={`step-2-q-${currentQuestion.id}`}>
                  <p className="step-indicator">Step 2 / 설문조사</p>
                  <h1>{currentQuestion.question}</h1>
                  <div className="options">
                    {currentQuestion.options.map((option, index) => (
                      <button key={index} onClick={() => handleOptionClick(option)}>{option.text}</button>
                    ))}
                  </div>
                  <button onClick={handleBack} className="back-button">뒤로가기</button>
                </div>
              </div>
              <div className="right-panel">
                <div className="context-box">
                  <h4>질문 의도</h4>
                  <p>이 질문은 당신의 문제 해결 스타일과 선호하는 작업 환경을 파악하기 위해 설계되었습니다. 정답은 없으니 편하게 답변해주세요.</p>
                </div>
              </div>
            </>
          )}

          {step === 3 && topJobDetails && (
            <div className="result-page-new-layout">
              <div className="result-card-new fade-in">
                <h2 className="result-title">당신에게 어울리는 직무는</h2>
                <img src={topJobDetails.img} alt={topJobDetails.title} className="result-image" />
                <h1 className="result-job-title">{topJobDetails.title}</h1>
              </div>

              <div className="score-details-new fade-in">
                <h3>상세 점수</h3>
                <div className="score-list-new">
                  {Object.entries(scores)
                    .sort(([, a], [, b]) => b - a)
                    .map(([job, score]) => (
                      <div className="score-item-new" key={job}>
                        <div className="score-info">
                          <span className="score-job">{JOBS[job]}</span>
                          <span className="score-value">{score}점</span>
                        </div>
                        <div className="score-bar-container-new">
                          <div
                            className="score-bar-fill-new"
                            style={{ width: `${(score / Math.max(...Object.values(scores))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="subfield-section-new fade-in">
                <h3>추천 상세 분야</h3>
                <ul className="subfield-list-new">
                  {topJobDetails.subfields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>

              <div className="result-actions-new fade-in">
                <button type="button" onClick={resetSurvey} className="primary-button">
                  다시하기
                </button>
              </div>

              <div className="premium-section-new fade-in">
                <div className="premium-content">
                  <h4>더 깊이 있는 정보를 원하시나요?</h4>
                  <p>개발자 로드맵, 현직자 인터뷰, 예상 연봉 등 프리미엄 콘텐츠를 확인해보세요.</p>
                  <button className="premium-button">프리미엄 플랜 구독하기</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!showLoginScreen && step === 0 && (
        <div className="fade-in" key="step-0">
          <div className="main-header">
            <h1 className="main-title">코드는 짤 줄 아는데<br />내 미래는 어떻게 짜야 할지 모르겠다면.</h1>
            <p className="main-subtitle">지금 바로 성향 기반 진로 추천 설문에 참여하고<br />나에게 맞는 IT 진로를 확인해보세요!</p>
            <button type="button" className="cta-button" onClick={() => setStep(1)}>설문 시작</button>
          </div>
          <div id="analysis" className="survey-intro-section">
            <div className="intro-description">
              <div className="feature">
                <h2 className="feature-title">성향 기반 분석</h2>
                <p>간단한 설문을 통해 당신의 성향을 분석합니다.</p>
                <p>추가된 내용: 저희의 독자적인 알고리즘은 여러분의 답변을 분석하여 개발자로서의 잠재적 성향을 파악합니다. 창의적인 문제 해결을 즐기는지, 논리적이고 체계적인 접근을 선호하는지 등을 다각도로 분석하여 가장 적합한 직무 유형을 제시합니다.</p>
              </div>
            </div>
            <div className="image-placeholder"><img src="/assets/propensity.png" alt="성향 분석 관련 이미지" /></div>
          </div>
          <div id="recommendation" className="survey-intro-section">
            <div className="image-placeholder"><img src="/assets/carrer.png" alt="진로 추천 관련 이미지" /></div>
            <div className="intro-description">
              <div className="feature">
                <h2 className="feature-title">맞춤 진로 추천</h2>
                <p>분석 결과를 바탕으로 최적의 IT 진로를 추천해 드립니다.</p>
                <p>추가된 내용: 프론트엔드, 백엔드, AI 엔지니어 등 다양한 개발 직무 중에서 당신의 성향과 가장 일치하는 진로를 추천합니다. 각 직무의 특징, 필요한 기술 스택, 그리고 전망에 대한 정보를 함께 제공하여 구체적인 진로 계획을 세울 수 있도록 돕습니다.</p>
              </div>
            </div>
          </div>
          <div id="insights" className="survey-intro-section">
            <div className="intro-description">
              <div className="feature">
                <h2 className="feature-title">개발자 인사이트</h2>
                <p>현직 개발자들의 직무별 특징과 정보를 얻을 수 있습니다.</p>
                <p>추가된 내용: 각 직무별 현직 개발자들의 생생한 인터뷰와 경험담을 통해 실제 업무 환경과 직무의 장단점에 대한 깊이 있는 이해를 얻을 수 있습니다. 또한, 주니어 개발자에게 필요한 역량과 성장 가이드도 확인해보세요.</p>
              </div>
            </div>
            <div className="image-placeholder"><img src="/assets/insight.png" alt="개발자 인사이트 관련 이미지" /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;