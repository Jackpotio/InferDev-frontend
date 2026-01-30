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
    subfields: [
      "웹 퍼블리셔",
      "React 개발자",
      "Vue.js 개발자",
      "Angular 개발자",
      "UI/UX 개발자",
      "프론트엔드 아키텍트",
      "크로스플랫폼 앱 개발자 (React Native, Flutter)"
    ],
    similarJobs: ["웹 디자이너", "모바일 앱 개발자", "퍼블리셔", "백엔드 개발자 (풀스택 지향)", "게임 클라이언트 개발자"]
  },
  backend: {
    title: "백엔드 개발자",
    img: "/assets/carrer.png",
    subfields: [
      "Java/Spring 개발자",
      "Node.js 개발자",
      "Python/Django/Flask 개발자",
      "Go 개발자",
      "데이터베이스 전문가 (DBA)",
      "클라우드 백엔드 개발자",
      "마이크로서비스 개발자",
      "API 개발자"
    ],
    similarJobs: ["데브옵스 엔지니어", "시스템 엔지니어", "클라우드 엔지니어", "데이터 엔지니어", "보안 엔지니어"]
  },
  ai: {
    title: "AI 엔지니어",
    img: "/assets/insight.png",
    subfields: [
      "머신러닝 엔지니어",
      "데이터 사이언티스트",
      "자연어 처리 (NLP) 엔지니어",
      "컴퓨터 비전 (CV) 엔지니어",
      "강화 학습 (RL) 엔지니어",
      "AI 서비스 개발자",
      "데이터 엔지니어 (AI/ML Ops)"
    ],
    similarJobs: ["데이터 엔지니어", "빅데이터 개발자", "연구원", "로봇 공학자", "클라우드 AI/ML 엔지니어"]
  },
};

const SURVEY_QUESTIONS = [
  {
    id: 1,
    question: "새로운 기술을 배우는 것에 대한 태도는 어떤가요?",
    options: [
      { text: "항상 적극적으로 새로운 기술을 탐구하고 적용하는 것을 즐깁니다.", score: { frontend: 2, ai: 2 }, subfieldScores: { "React 개발자": 2, "Vue.js 개발자": 2, "머신러닝 엔지니어": 2, "강화 학습 (RL) 엔지니어": 2 } },
      { text: "필요에 따라 새로운 기술을 학습하지만, 안정적인 기술 스택을 선호합니다.", score: { backend: 2 }, subfieldScores: { "Java/Spring 개발자": 2, "데이터베이스 전문가 (DBA)": 1 } },
      { text: "익숙한 기술을 깊게 파고드는 것을 선호합니다.", score: {}, subfieldScores: { "웹 퍼블리셔": 1, "API 개발자": 1 } },
    ],
  },
  {
    id: 2,
    question: "프로젝트 진행 시 가장 중요하게 생각하는 부분은 무엇인가요?",
    options: [
      { text: "사용자에게 보여지는 부분의 아름다움과 사용성(UX)을 최우선으로 생각합니다.", score: { frontend: 3 }, subfieldScores: { "UI/UX 개발자": 3, "웹 퍼블리셔": 2 } },
      { text: "시스템의 안정성, 효율성, 그리고 대용량 트래픽 처리 능력을 중요하게 생각합니다.", score: { backend: 3 }, subfieldScores: { "Go 개발자": 2, "클라우드 백엔드 개발자": 2, "마이크로서비스 개발자": 2 } },
      { text: "데이터 분석을 통해 새로운 가치를 창출하고 문제 해결에 기여하는 것입니다.", score: { ai: 3 }, subfieldScores: { "데이터 사이언티스트": 3, "머신러닝 엔지니어": 2 } },
    ],
  },
  {
    id: 3,
    question: "수학적/통계적 사고가 필요한 문제를 해결하는 것에 대한 거부감이 없나요?",
    options: [
      { text: "매우 흥미를 느끼며, 복잡한 문제 해결을 즐깁니다.", score: { ai: 3 }, subfieldScores: { "데이터 사이언티스트": 3, "머신러닝 엔지니어": 3, "자연어 처리 (NLP) 엔지니어": 2, "컴퓨터 비전 (CV) 엔지니어": 2 } },
      { text: "어느 정도 필요하다면 할 수 있지만, 주된 관심사는 아닙니다.", score: { backend: 1 }, subfieldScores: { "데이터베이스 전문가 (DBA)": 1, "Python/Django/Flask 개발자": 1 } },
      { text: "수학적 문제보다는 시각적이고 직관적인 결과에 관심이 많습니다.", score: { frontend: 1 }, subfieldScores: { "UI/UX 개발자": 1, "웹 퍼블리셔": 1 } },
    ],
  },
  {
    id: 4,
    question: "다른 사람들과 협업하는 것을 선호하나요, 아니면 독립적으로 일하는 것을 선호하나요?",
    options: [
      { text: "팀원들과 활발하게 소통하며 함께 결과물을 만들어내는 것을 선호합니다.", score: { frontend: 1, backend: 1, ai: 1 }, subfieldScores: { "React 개발자": 1, "Angular 개발자": 1, "Java/Spring 개발자": 1, "AI 서비스 개발자": 1 } },
      { text: "필요할 때는 협업하지만, 주로 혼자 깊이 있는 작업을 하는 것을 선호합니다.", score: { ai: 1, backend: 1 }, subfieldScores: { "데이터 사이언티스트": 1, "데이터베이스 전문가 (DBA)": 1, "머신러닝 엔지니어": 1 } },
      { text: "정해진 가이드라인 안에서 독립적으로 일하는 것이 편합니다.", score: { frontend: 1 }, subfieldScores: { "웹 퍼블리셔": 1 } },
    ],
  },
  {
    id: 5,
    question: "시스템의 '보이지 않는' 부분, 즉 데이터 처리, 서버 관리 등에 관심이 많나요?",
    options: [
      { text: "네, 시스템의 기반을 다지는 일에 큰 흥미를 느낍니다.", score: { backend: 3 }, subfieldScores: { "Java/Spring 개발자": 2, "Node.js 개발자": 2, "클라우드 백엔드 개발자": 3, "마이크로서비스 개발자": 2 } },
      { text: "어느 정도 관심은 있지만, 사용자 경험에 더 중점을 둡니다.", score: { frontend: 1 }, subfieldScores: { "프론트엔드 아키텍트": 1 } },
      { text: "데이터를 분석하고 모델을 만드는 것에 더 관심이 있습니다.", score: { ai: 2 }, subfieldScores: { "데이터 엔지니어 (AI/ML Ops)": 2 } },
    ],
  },
  {
    id: 6,
    question: "새로운 기능을 개발할 때, 가장 중요하게 생각하는 것은 무엇인가요?",
    options: [
      { text: "사용자 인터페이스(UI)의 반응성과 디자인의 완성도입니다.", score: { frontend: 3 }, subfieldScores: { "UI/UX 개발자": 3, "크로스플랫폼 앱 개발자 (React Native, Flutter)": 2 } },
      { text: "코드의 재사용성과 유지보수 용이성, 확장성입니다.", score: { backend: 2, frontend: 1 }, subfieldScores: { "프론트엔드 아키텍트": 2, "Java/Spring 개발자": 2, "Go 개발자": 1 } },
      { text: "개발된 기능이 얼마나 정확하고 효율적으로 문제를 해결하는지입니다.", score: { ai: 3, backend: 1 }, subfieldScores: { "머신러닝 엔지니어": 2, "자연어 처리 (NLP) 엔지니어": 2, "컴퓨터 비전 (CV) 엔지니어": 2 } },
    ],
  },
  {
    id: 7,
    question: "데이터를 수집, 가공, 분석하여 의미 있는 인사이트를 도출하는 과정에 흥미를 느끼나요?",
    options: [
      { text: "매우 흥미를 느끼며, 데이터를 통해 숨겨진 패턴을 찾는 것을 즐깁니다.", score: { ai: 3 }, subfieldScores: { "데이터 사이언티스트": 3, "데이터 엔지니어 (AI/ML Ops)": 2 } },
      { text: "데이터베이스 관리나 데이터 흐름을 설계하는 것에 관심이 있습니다.", score: { backend: 2 }, subfieldScores: { "데이터베이스 전문가 (DBA)": 3, "데이터 엔지니어 (AI/ML Ops)": 1 } },
      { text: "데이터를 시각화하여 사용자들이 쉽게 이해하도록 돕는 것에 관심이 있습니다.", score: { frontend: 1 }, subfieldScores: { "UI/UX 개발자": 1 } },
    ],
  },
];

function NavBar({ onLogoClick, onNavClick, isScrolled, onLoginClick, step }) {
  return (
    <div className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-section navbar-section-left">
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
      </div>
      <div className="navbar-section navbar-section-center">
        {/* This section is now empty when step === 0, flex:1 will distribute space */}
      </div>
      <div className="navbar-section navbar-section-right">
        <button onClick={onLoginClick} className="login-button-navbar">로그인</button>
      </div>
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
    setSubfieldScores({}); // Reset subfield scores

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
    // Add subfield scores accumulation
    setSubfieldScores((prev) => {
      const newSubfieldScores = { ...prev };
      if (option.subfieldScores) {
        for (const key in option.subfieldScores) {
          newSubfieldScores[key] = (newSubfieldScores[key] || 0) + option.subfieldScores[key];
        }
      }
      return newSubfieldScores;
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
    // Initialize new job categories with 0
    data: 0,
    devops: 0,
    mobile: 0,
    game: 0,
  });
  const [subfieldScores, setSubfieldScores] = useState({}); // New state for subfield scores

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

  const getTopRecommendation = (jobScores, subfieldScores) => {
    let topJob = "frontend";
    let maxJobScore = -1;

    for (const job in jobScores) {
      if (jobScores[job] > maxJobScore) {
        maxJobScore = jobScores[job];
        topJob = job;
      }
    }

    let topSubfield = null;
    let maxSubfieldScore = -1;

    // Filter subfield scores relevant to the topJob's subfields
    const relevantSubfields = JOB_DETAILS[topJob].subfields;
    for (const subfield of relevantSubfields) {
      const score = subfieldScores[subfield] || 0;
      if (score > maxSubfieldScore) {
        maxSubfieldScore = score;
        topSubfield = subfield;
      }
    }
    // If no specific subfield scored, pick the first one from the list as default
    if (!topSubfield && relevantSubfields.length > 0) {
      topSubfield = relevantSubfields[0];
    }


    return { topJob, topSubfield };
  };

  const { topJob, topSubfield } = step === 3 ? getTopRecommendation(scores, subfieldScores) : { topJob: null, topSubfield: null };
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
            <div className="result-container fade-in">
              <div className="result-header">
                <h2 className="result-main-title">당신에게 어울리는 직무는</h2>
                <img src={topJobDetails.img} alt={topJobDetails.title} className="result-main-image" />
                <h1 className="result-job-type">{topJobDetails.title}</h1>
                {topSubfield && (
                  <p className="result-subfield">{topSubfield}</p>
                )}
                <p className="result-job-description">
                  {/* Placeholder for a brief description of the job type, if available */}
                </p>
              </div>

              <div className="result-details-section">
                <div className="result-scores-card">
                  <h3 className="section-title">상세 점수</h3>
                  <div className="score-list">
                    {Object.entries(scores)
                      .sort(([, a], [, b]) => b - a)
                      .map(([job, score]) => (
                        <div className="score-item" key={job}>
                          <div className="score-info">
                            <span className="score-job-label">{JOBS[job]}</span>
                            <span className="score-value-display">{score}점</span>
                          </div>
                          <div className="score-bar-container">
                            <div
                              className="score-bar-fill"
                              style={{ width: `${(score / Math.max(...Object.values(scores))) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="result-subfields-card">
                  <h3 className="section-title">추천 진로와 비슷한 분야</h3>
                  <ul className="subfield-list">
                    {topJobDetails.similarJobs.map((job) => (
                      <li key={job} className="subfield-item">{job}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="result-actions">
                <button type="button" onClick={resetSurvey} className="button-primary">
                  다시하기
                </button>
                <div className="premium-callout">
                  <h4>더 깊이 있는 정보를 원하시나요?</h4>
                  <p>개발자 로드맵, 현직자 인터뷰, 예상 연봉 등 프리미엄 콘텐츠를 확인해보세요.</p>
                  <button className="button-secondary">프리미엄 플랜 구독하기</button>
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
                <p>저희의 독자적인 알고리즘은 여러분의 답변을 분석하여 개발자로서의 잠재적 성향을 파악합니다. 창의적인 문제 해결을 즐기는지, 논리적이고 체계적인 접근을 선호하는지 등을 다각도로 분석하여 가장 적합한 직무 유형을 제시합니다.</p>
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
                <p>프론트엔드, 백엔드, AI 엔지니어 등 다양한 개발 직무 중에서 당신의 성향과 가장 일치하는 진로를 추천합니다. 각 직무의 특징, 필요한 기술 스택, 그리고 전망에 대한 정보를 함께 제공하여 구체적인 진로 계획을 세울 수 있도록 돕습니다.</p>
              </div>
            </div>
          </div>
          <div id="insights" className="survey-intro-section">
            <div className="intro-description">
              <div className="feature">
                <h2 className="feature-title">개발자 인사이트</h2>
                <p>현직 개발자들의 직무별 특징과 정보를 얻을 수 있습니다.</p>
                <p>각 직무별 현직 개발자들의 생생한 인터뷰와 경험담을 통해 실제 업무 환경과 직무의 장단점에 대한 깊이 있는 이해를 얻을 수 있습니다. 또한, 주니어 개발자에게 필요한 역량과 성장 가이드도 확인해보세요.</p>
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