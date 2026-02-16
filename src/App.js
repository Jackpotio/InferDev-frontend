
import { useState, useEffect } from "react";
import "./styles.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;
const TRAIT_LABELS = {
  UI: "UI/UX 감각",
  LOGIC: "논리/구조",
  DATA: "데이터 분석",
  SYSTEM: "시스템 이해",
  SECURITY: "보안 민감도",
  AI: "AI 친화성",
  COMM: "협업/소통",
  CREATIVE: "창의성",
};

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
  const [stage1Answers, setStage1Answers] = useState([]);
  const [stage2Answers, setStage2Answers] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);

  // States for fetched data
  const [fetchedJobs, setFetchedJobs] = useState([]);
  const [fetchedJobDetails, setFetchedJobDetails] = useState([]);
  const [fetchedCareerTracks, setFetchedCareerTracks] = useState([]);
  const [fetchedSurveyQuestions, setFetchedSurveyQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.error("API call failed:", err));
  }, []);

  // Initial fetched data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [jobsRes, jobDetailsRes, questionsRes, careerTracksRes] = await Promise.all([
          fetch(`/api/jobs`),
          fetch(`/api/job-details`),
          fetch(`/api/survey-questions?stage=1`),
          fetch(`/api/career-tracks`),
        ]);

        if (!jobsRes.ok || !jobDetailsRes.ok || !questionsRes.ok || !careerTracksRes.ok) {
          throw new Error("Failed to fetch initial survey data");
        }

        const jobsData = await jobsRes.json();
        const jobDetailsData = await jobDetailsRes.json();
        const questionsData = await questionsRes.json();
        const careerTracksData = await careerTracksRes.json();

        setFetchedJobs(jobsData);
        setFetchedJobDetails(jobDetailsData);
        setFetchedSurveyQuestions(questionsData);
        setFetchedCareerTracks(careerTracksData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);


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

  const handleLoginClick = () => {
    setShowLoginScreen(true);
  };

  const handleCloseLogin = () => {
    setShowLoginScreen(false);
  };

  const resetSurvey = () => {
    setMajor("");
    setItmajorDetail("");
    setCodingExp("");
    setCodingLevel("");

    // Initialize scores based on fetched job keys
    const initialScores = {};
    fetchedJobs.forEach(job => {
      initialScores[job.id] = 0;
    });
    setScores(initialScores);

    setFilteredQuestions([]);
    setCurrentQuestionIndex(0);
    setStage1Answers([]);
    setStage2Answers([]);
    setSurveyStage(1);
    setStep(0);
    setTopJob(null);
    setTopTrack("");
    setResultScores(null);
    setResultRanking([]);
    setTraitScores(null);
    setSkillScores(null);
    setReadiness(null);
    setConfidence(null);
  };

  const [scores, setScores] = useState({}); // Will be updated by backend response
  const [resultScores, setResultScores] = useState(null); // Stores final scores from backend
  const [resultRanking, setResultRanking] = useState([]);
  const [traitScores, setTraitScores] = useState(null);
  const [skillScores, setSkillScores] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [confidence, setConfidence] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [major, setMajor] = useState("");
  const [itMajorDetail, setItmajorDetail] = useState("");

  const [codingExp, setCodingExp] = useState("");
  const [codingLevel, setCodingLevel] = useState("");

  const [step, setStep] = useState(0);

  const [filteredQuestions, setFilteredQuestions] = useState([]);

  const [topJob, setTopJob] = useState(null);
  const [topTrack, setTopTrack] = useState("");
  const [surveyStage, setSurveyStage] = useState(1);

  const currentQuestion = filteredQuestions[currentQuestionIndex] || null;

  const surveyCondition = {
    major,
    itMajorDetail,
    codingExp,
  };

  const filterQuestions = () => {
    return fetchedSurveyQuestions.filter((q) => {
      if (!q.condition || Object.keys(q.condition).length === 0) {
        return true;
      }

      return Object.entries(q.condition).every(
        ([key, value]) => surveyCondition[key] === value
      );
    });
  };

  const handleOptionClick = (option) => {
    const newAnswer = { questionId: currentQuestion.id, optionId: option.id };

    if (surveyStage === 1) {
      setStage1Answers((prev) => {
        const next = [...prev, newAnswer];
        if (currentQuestionIndex === filteredQuestions.length - 1) {
          submitStage1(next);
          return next;
        }
        return next;
      });
    } else {
      setStage2Answers((prev) => {
        const next = [...prev, newAnswer];
        if (currentQuestionIndex === filteredQuestions.length - 1) {
          submitFinal(next);
          return next;
        }
        return next;
      });
    }

    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };


  const handleBack = () => {
    if (step === 2) {
      if (currentQuestionIndex > 0) {
        if (surveyStage === 1) {
          setStage1Answers(stage1Answers.slice(0, -1));
        } else {
          setStage2Answers(stage2Answers.slice(0, -1));
        }
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
    setStage1Answers([]);
    setStage2Answers([]);
    setSurveyStage(1);
    setCurrentQuestionIndex(0);
    setStep(2);
  };

  const submitStage1 = async (finalAnswers) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recommendation/stage1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: finalAnswers,
          stage: 1,
          userId: 1, //TODO: replace with actual user ID
          major,
          itMajorDetail,
          codingExp,
          codingLevel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendation");
      }

      const result = await response.json();
      setTopTrack(result.topTrack || "");
      setTraitScores(result.traitScores || {});
      setConfidence(result.confidence ?? null);

      const stage2Res = await fetch(
        `/api/survey-questions?stage=2&track=${encodeURIComponent(result.topTrack || "")}`,
      );
      if (!stage2Res.ok) {
        throw new Error("Failed to fetch stage2 survey questions");
      }
      const stage2Questions = await stage2Res.json();
      if (!Array.isArray(stage2Questions) || stage2Questions.length === 0) {
        throw new Error("No stage2 survey questions available for this track");
      }

      setFilteredQuestions(stage2Questions);
      setCurrentQuestionIndex(0);
      setSurveyStage(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitFinal = async (finalStage2Answers) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recommendation/final`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1,
          stage: 2,
          track: topTrack,
          answers: finalStage2Answers,
          stage1Answers,
          stage2Answers: finalStage2Answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get final recommendation");
      }

      const result = await response.json();
      setTopTrack(result.topTrack || topTrack);
      setTopJob(result.topJob);
      setResultScores(result.scores);
      setResultRanking(result.ranking || []);
      setTraitScores(result.traitScores || {});
      setSkillScores(result.skillScores || {});
      setReadiness(result.readiness ?? null);
      setConfidence(result.confidence ?? null);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="loading-screen">데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="error-screen">오류 발생: {error}</div>;
  }


  const topJobDetails = topJob ? fetchedJobDetails.find(detail => detail.jobId === topJob) : null;
  const sortedResultEntries =
    resultRanking.length > 0
      ? resultRanking.map(({ jobId, score }) => [jobId, score])
      : resultScores
        ? Object.entries(resultScores).sort(([, a], [, b]) => b - a)
        : [];
  const maxResultScore = sortedResultEntries[0]?.[1] || 1;
  const topTraits = traitScores
    ? Object.entries(traitScores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
    : [];
  const topSkills = skillScores
    ? Object.entries(skillScores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
    : [];
  const top3Jobs = sortedResultEntries.slice(0, 3).map(([jobId, score], index) => {
    const job = fetchedJobs.find((item) => item.id === jobId);
    const detail = fetchedJobDetails.find((item) => item.jobId === jobId);
    return {
      rank: index + 1,
      jobId,
      score,
      name: job?.name || jobId,
      description: detail?.title || `${job?.name || jobId}에 강점을 보이는 성향입니다.`,
    };
  });

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
                    <div className="progress-step active">
                      {surveyStage === 1 ? "1단계 성향 설문" : "2단계 정밀 설문"} ({currentQuestionIndex + 1}/{filteredQuestions.length})
                    </div>
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
                <p className="result-meta">
                  추천 트랙: {topTrack || "-"} | 준비도: {readiness !== null ? `${Math.round(readiness * 100)}%` : "-"} | 확신도: {confidence !== null ? `${Math.round(confidence * 100)}%` : "-"}
                </p>
                <p className="result-job-description">
                  {/* Placeholder for a brief description of the job type, if available */}
                </p>
              </div>

              <div className="result-top3-section">
                <h3 className="section-title">Top 3 추천 직무</h3>
                <div className="top3-job-cards">
                  {top3Jobs.map((job) => (
                    <div className="top3-job-card" key={job.jobId}>
                      <div className="top3-card-head">
                        <span className="top3-rank-badge">#{job.rank}</span>
                        <span className="top3-score">{job.score}점</span>
                      </div>
                      <h4 className="top3-job-name">{job.name}</h4>
                      <p className="top3-job-desc">{job.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-details-section">
                <div className="result-scores-card">
                  <h3 className="section-title">상세 점수</h3>
                  <div className="score-list">
                    {sortedResultEntries
                      .filter(([, score]) => score !== 0)
                      .map(([jobId, score]) => {
                        const job = fetchedJobs.find(j => j.id === jobId);
                        return (
                          <div className="score-item" key={jobId}>
                            <div className="score-info">
                              <span className="score-job-label">{job?.name || jobId}</span>
                              <span className="score-value-display">{score}점</span>
                            </div>
                            <div className="score-bar-container">
                              <div
                                className="score-bar-fill"
                                style={{ width: `${(score / maxResultScore) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="result-subfields-card">
                  <h3 className="section-title">상위 성향 Trait</h3>
                  <ul className="trait-list">
                    {topTraits.map(([traitKey, score]) => (
                      <li key={traitKey} className="trait-item">
                        <span className="trait-label">{TRAIT_LABELS[traitKey] || traitKey}</span>
                        <span className="trait-score">{score.toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="result-subfields-card">
                  <h3 className="section-title">상위 준비도 Skill</h3>
                  <ul className="trait-list">
                    {topSkills.map(([skillKey, score]) => (
                      <li key={skillKey} className="trait-item">
                        <span className="trait-label">{skillKey}</span>
                        <span className="trait-score">{score.toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="result-subfields-card">
                  <h3 className="section-title">이런 강점이 있어요</h3>
                  <ul className="subfield-list">
                    {topJobDetails.strengths.map((strength) => (
                      <li key={strength} className="subfield-item">{strength}</li>
                    ))}
                  </ul>
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

// A temporary function to handle navigation clicks
function handleNavClick(section) {
  const element = document.getElementById(section);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

export default App;
