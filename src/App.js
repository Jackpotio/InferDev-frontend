
import { useState, useEffect, useRef } from "react";
import "./styles.css";
import { getMe, getProfile, logout, updateProfile } from "./auth";
const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";
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

const HTML_DOCTYPE_PATTERN = /^\s*<!doctype html/i;
const HTML_TAG_PATTERN = /^\s*<html/i;

const parseApiJsonResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const isHtml =
    contentType.includes("text/html") ||
    HTML_DOCTYPE_PATTERN.test(text) ||
    HTML_TAG_PATTERN.test(text);

  const parsePayload = () => {
    if (!text) return null;
    return JSON.parse(text);
  };

  if (!response.ok) {
    let detail = fallbackMessage || `HTTP ${response.status}`;
    try {
      const payload = parsePayload();
      if (Array.isArray(payload?.message)) {
        detail = payload.message.join(", ");
      } else if (typeof payload?.message === "string") {
        detail = payload.message;
      } else if (payload && typeof payload === "object") {
        detail = JSON.stringify(payload);
      } else if (text) {
        detail = text;
      }
    } catch {
      detail = isHtml
        ? "API가 JSON 대신 HTML을 반환했습니다. 서버 라우팅(/api) 또는 배포 구성을 확인해 주세요."
        : text || detail;
    }
    throw new Error(detail);
  }

  try {
    return parsePayload();
  } catch {
    throw new Error(
      isHtml
        ? "API가 JSON 대신 HTML을 반환했습니다. 서버 라우팅(/api) 또는 배포 구성을 확인해 주세요."
        : (fallbackMessage || "서버 응답이 JSON 형식이 아닙니다."),
    );
  }
};

const getLevelLabel = (value) => {
  if (value === null || value === undefined) return "확인 중";
  if (value >= 0.7) return "높은 편";
  if (value >= 0.4) return "중간 수준";
  return "낮은 편";
};

const formatDateYYYYMMDD = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

const getProviderLabel = (provider) => {
  if (provider === "google") return "Google";
  if (provider === "naver") return "Naver";
  return "-";
};

const buildAccountInfo = (
  account,
  fallback = { email: "", provider: undefined, joinedAt: null },
) => ({
  email: account?.email ?? fallback.email ?? "",
  provider: account?.provider ?? fallback.provider ?? null,
  providerLabel: account?.providerLabel ?? getProviderLabel(account?.provider ?? fallback.provider),
  joinedAt: account?.joinedAt ?? fallback.joinedAt ?? null,
});

const normalizeNotification = (item, index = 0) => {
  const fallbackCreatedAt = new Date().toISOString();
  const fallbackId = `notification-${Date.now()}-${index}`;

  if (!item || typeof item !== "object") {
    const text = String(item || "새 알림");
    return {
      id: fallbackId,
      title: text,
      message: text,
      detail: text,
      read: false,
      createdAt: fallbackCreatedAt,
    };
  }

  const messageText = String(item.message ?? item.title ?? "새 알림");
  const detailText = String(item.detail ?? messageText);
  const createdAt = new Date(item.createdAt || "");
  const createdAtISO = Number.isNaN(createdAt.getTime())
    ? fallbackCreatedAt
    : createdAt.toISOString();

  return {
    ...item,
    id: item.id || fallbackId,
    title: String(item.title ?? messageText),
    message: messageText,
    detail: detailText,
    read: Boolean(item.read),
    createdAt: createdAtISO,
  };
};

const normalizeSavedResult = (item, index = 0) => {
  const fallbackSavedAt = new Date().toISOString();
  const fallbackRecordId = `saved-result-${Date.now()}-${index}`;

  if (!item || typeof item !== "object") {
    return {
      recordId: fallbackRecordId,
      recordName: new Date(fallbackSavedAt).toLocaleString(),
      savedAt: fallbackSavedAt,
      topTrack: "",
      topJobId: "",
      topJobTitle: "추천 직무",
      summaryMainLine: "",
      summarySubLine: "",
      readiness: null,
      confidence: null,
      top3Jobs: [],
    };
  }

  const savedAt = new Date(item.savedAt || "");
  const normalizedSavedAt = Number.isNaN(savedAt.getTime()) ? fallbackSavedAt : savedAt.toISOString();

  return {
    ...item,
    recordId: item.recordId || fallbackRecordId,
    recordName: String(item.recordName ?? new Date(normalizedSavedAt).toLocaleString()),
    savedAt: normalizedSavedAt,
    top3Jobs: Array.isArray(item.top3Jobs) ? item.top3Jobs : [],
  };
};

const getSavedResultKey = (item, index = 0) => String(item?.recordId || `${item?.savedAt || "saved"}-${index}`);

const buildAppHash = ({ step, showLoginScreen, showProfileScreen, profileTab }) => {
  const params = new URLSearchParams();
  params.set("step", String(step));
  if (showLoginScreen) params.set("login", "1");
  if (showProfileScreen) params.set("profile", "1");
  if (showProfileScreen) params.set("tab", profileTab || "notifications");
  const query = params.toString();
  return query ? `#${query}` : "";
};

const parseAppHash = (hash) => {
  const raw = String(hash || "").replace(/^#/, "");
  const params = new URLSearchParams(raw);
  const parsedStep = Number(params.get("step"));
  const step = Number.isFinite(parsedStep) ? parsedStep : 0;
  const showLoginScreen = params.get("login") === "1";
  const showProfileScreen = params.get("profile") === "1";
  const tab = params.get("tab");
  const profileTab = tab || "notifications";
  return { step, showLoginScreen, showProfileScreen, profileTab };
};

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const decoded = JSON.parse(window.atob(padded));
    const joinedAtFromIat =
      typeof decoded.iat === "number" ? new Date(decoded.iat * 1000).toISOString() : null;
    return {
      userId: decoded.sub,
      email: decoded.email ?? null,
      role: decoded.role ?? "user",
      provider: decoded.provider ?? "local",
      joinedAt: decoded.joinedAt ?? joinedAtFromIat,
    };
  } catch (err) {
    return null;
  }
};

const JOB_DESCRIPTION_CONTENT = {
  web_frontend: {
    summary: "사용자 경험과 인터랙션 품질을 높이는 화면 개발 역할입니다.",
    fitReasonTemplates: [
      "사용자 관점에서 문제를 구조화하고 UI로 빠르게 풀어내는 강점이 잘 맞아요.",
      "디자인 의도를 코드로 안정적으로 구현하는 작업에서 강점을 보일 가능성이 높아요.",
    ],
    nextSteps: ["React 상태관리", "웹 성능 최적화", "접근성 개선"],
  },
  api_backend: {
    summary: "서비스 핵심 로직과 데이터 흐름을 안정적으로 설계하는 역할입니다.",
    fitReasonTemplates: [
      "논리적인 구조화와 문제 해결 성향이 API/DB 설계 업무와 잘 맞아요.",
      "복잡한 흐름을 단순화하고 안정성을 높이는 방식에 적합한 성향입니다.",
    ],
    nextSteps: ["트랜잭션/동시성", "API 설계", "관측성 기반 운영"],
  },
  ml_engineer: {
    summary: "모델 개발부터 서비스 적용까지 연결하는 실전형 AI 역할입니다.",
    fitReasonTemplates: [
      "데이터 해석과 실험 중심 접근이 모델 개선 사이클과 잘 맞아요.",
      "분석 결과를 실제 제품 지표로 연결하는 과정에서 강점이 드러날 수 있어요.",
    ],
    nextSteps: ["모델 서빙", "MLOps 파이프라인", "실험 설계/평가"],
  },
  devops_engineer: {
    summary: "개발-배포-운영 전 과정을 자동화하고 신뢰성을 높이는 역할입니다.",
    fitReasonTemplates: [
      "시스템 전체 흐름을 보고 병목을 줄이는 사고 방식이 강점으로 작동해요.",
      "문제 예방과 대응을 동시에 다루는 운영 관점과 잘 맞는 성향입니다.",
    ],
    nextSteps: ["CI/CD 고도화", "클라우드 아키텍처", "모니터링/알림 체계"],
  },
};

const PLAN_CATALOG = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    summary: "기본 진로 탐색에 필요한 핵심 기능을 제공합니다.",
    highlights: [
      "기본 설문 및 결과 확인",
      "검사 기록 저장(최대 20개)",
      "프로필/알림 기본 기능",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    summary: "심화 분석과 학습 가이드를 포함한 고급 기능을 제공합니다.",
    highlights: [
      "심화 리포트 및 역량 진단",
      "개인화 학습 로드맵 추천",
      "우선 알림 및 신규 기능 선공개",
    ],
  },
];

const PLAN_COMPARE_ROWS = [
  { label: "기본 설문/결과", free: "제공", premium: "제공" },
  { label: "검사 기록 관리", free: "기본", premium: "확장" },
  { label: "심화 분석 리포트", free: "미제공", premium: "제공" },
  { label: "학습 로드맵", free: "기본", premium: "고급 추천" },
  { label: "알림 우선순위", free: "기본", premium: "우선 제공" },
];

const PREMIUM_GUIDE_BLOCKS = [
  {
    title: "개인 맞춤 심화 리포트",
    points: [
      "성향 점수 변화를 시계열로 확인",
      "직무 적합도 근거와 보완 포인트 제시",
      "다음 2주 학습 우선순위 추천",
    ],
  },
  {
    title: "실행 중심 커리어 플랜",
    points: [
      "주차별 학습 로드맵 자동 생성",
      "포트폴리오 주제/난이도 추천",
      "현직자 인사이트 기반 체크리스트 제공",
    ],
  },
  {
    title: "프리미엄 운영 지원",
    points: [
      "신규 기능 우선 체험",
      "고급 알림 및 저장 결과 확장",
      "정책 업데이트/이벤트 우선 안내",
    ],
  },
];

const getJobDescriptionText = (jobId) => {
  const content = JOB_DESCRIPTION_CONTENT[jobId];
  if (!content) {
    return "현재 추천 결과를 기반으로 적합 직무를 분석 중입니다. 핵심 역량을 단계적으로 보강하면 추천 정밀도를 더 높일 수 있어요.";
  }

  const fitReason = content.fitReasonTemplates[0] || "";
  const nextStepText =
    content.nextSteps && content.nextSteps.length > 0
      ? `다음 단계로는 ${content.nextSteps.slice(0, 2).join(", ")} 학습을 추천해요.`
      : "";

  return `${content.summary} ${fitReason} ${nextStepText}`.trim();
};

function NavBar({
  onLogoClick,
  onNavClick,
  isScrolled,
  onLoginClick,
  onProfileClick,
  step,
  user,
}) {
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
        {user ? (
          <button onClick={onProfileClick} className="login-button-navbar">프로필</button>
        ) : (
          <button onClick={onLoginClick} className="login-button-navbar">로그인</button>
        )}
      </div>
    </div>
  );
}

function App() {
  const isSyncingFromHistoryRef = useRef(false);
  const hasInitializedHistorySyncRef = useRef(false);
  const [stage1Answers, setStage1Answers] = useState([]);
  const [stage2Answers, setStage2Answers] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [step, setStep] = useState(0);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [savedResultSnapshot, setSavedResultSnapshot] = useState(null);
  const [savedResultHistory, setSavedResultHistory] = useState([]);
  const [selectedSavedResultIndex, setSelectedSavedResultIndex] = useState(0);
  const [profileTab, setProfileTab] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [isNotificationDeleteMode, setIsNotificationDeleteMode] = useState(false);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState([]);
  const [isHistoryDeleteMode, setIsHistoryDeleteMode] = useState(false);
  const [selectedHistoryKeys, setSelectedHistoryKeys] = useState([]);
  const [planBillingCycle, setPlanBillingCycle] = useState("monthly");
  const [showPremiumGuideOnly, setShowPremiumGuideOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileSettings, setProfileSettings] = useState({
    notifyResultSaved: true,
    notifyPremium: false,
    displayName: "",
    gender: "",
    plan: "free",
  });
  const [accountInfo, setAccountInfo] = useState({
    email: "",
    provider: null,
    providerLabel: "-",
    joinedAt: null,
  });

  // States for fetched data
  const [fetchedJobs, setFetchedJobs] = useState([]);
  const [fetchedJobDetails, setFetchedJobDetails] = useState([]);
  const [fetchedCareerTracks, setFetchedCareerTracks] = useState([]);
  const [fetchedSurveyQuestions, setFetchedSurveyQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => parseApiJsonResponse(res, "헬스 체크 응답을 파싱하지 못했습니다."))
      .then(data => console.log(data))
      .catch(err => console.error("API call failed:", err));
  }, []);

  useEffect(() => {
    const hashToken = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
    if (!hashToken) return;

    localStorage.setItem("accessToken", hashToken);
    const decoded = decodeJwtPayload(hashToken);
    if (decoded?.userId) {
      setCurrentUser(decoded);
    }
    window.history.replaceState({}, "", "/");
  }, []);

  useEffect(() => {
    const stateFromHash = parseAppHash(window.location.hash);
    setStep(stateFromHash.step);
    setShowLoginScreen(stateFromHash.showLoginScreen);
    setShowProfileScreen(stateFromHash.showProfileScreen);
    setProfileTab(stateFromHash.profileTab);
    hasInitializedHistorySyncRef.current = true;
  }, []);

  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const me = await getMe();
        setCurrentUser(me);
      } catch (err) {
        console.error("Failed to restore auth session:", err);
        if (err?.status === 401 || String(err?.message || "").toLowerCase().includes("unauthorized")) {
          logout();
          setCurrentUser(null);
          return;
        }
        const fallbackUser = decodeJwtPayload(token);
        if (fallbackUser?.userId) {
          setCurrentUser(fallbackUser);
          return;
        }
        logout();
        setCurrentUser(null);
      }
    };

    restoreAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setShowProfileScreen(false);
      setSavedResultSnapshot(null);
      setSavedResultHistory([]);
      setSelectedSavedResultIndex(0);
      setNotifications([]);
      setSelectedNotificationId(null);
      setIsNotificationDeleteMode(false);
      setSelectedNotificationIds([]);
      setIsHistoryDeleteMode(false);
      setSelectedHistoryKeys([]);
      setShowPremiumGuideOnly(false);
      setProfileSettings({
        notifyResultSaved: true,
        notifyPremium: false,
        displayName: "",
        gender: "",
        plan: "free",
      });
      setAccountInfo({
        email: "",
        provider: null,
        providerLabel: "-",
        joinedAt: null,
      });
      return;
    }

    const userId = currentUser.userId || currentUser.id;
    if (!userId) return;
    setAccountInfo((prev) => ({
      ...prev,
      email: currentUser.email ?? prev.email ?? "",
      provider: prev.provider ?? currentUser.provider ?? null,
      providerLabel: prev.providerLabel !== "-" ? prev.providerLabel : getProviderLabel(currentUser.provider),
      joinedAt: prev.joinedAt ?? currentUser.joinedAt ?? null,
    }));

    const userStorageKey = `inferdev:savedResults:${userId}`;
    try {
      const saved = localStorage.getItem(userStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      const normalized = Array.isArray(parsed)
        ? parsed.map((item, index) => normalizeSavedResult(item, index))
        : [];
      setSavedResultHistory(normalized);
      setSavedResultSnapshot(normalized[0] || null);
      setSelectedSavedResultIndex(0);
      setIsHistoryDeleteMode(false);
      setSelectedHistoryKeys([]);
    } catch (err) {
      console.error("Failed to read saved profile results:", err);
      setSavedResultHistory([]);
      setSavedResultSnapshot(null);
      setIsHistoryDeleteMode(false);
      setSelectedHistoryKeys([]);
    }

    const notificationStorageKey = `inferdev:notifications:${userId}`;
    try {
      const savedNotifications = localStorage.getItem(notificationStorageKey);
      const parsed = savedNotifications ? JSON.parse(savedNotifications) : [];
      const normalized = Array.isArray(parsed)
        ? parsed.map((item, index) => normalizeNotification(item, index))
        : [];
      setNotifications(normalized);
      setSelectedNotificationId(null);
      setIsNotificationDeleteMode(false);
      setSelectedNotificationIds([]);
    } catch (err) {
      console.error("Failed to read notifications:", err);
      setNotifications([]);
      setSelectedNotificationId(null);
      setIsNotificationDeleteMode(false);
      setSelectedNotificationIds([]);
    }

    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        setProfileSettings({
          notifyResultSaved: profile.notifyResultSaved ?? true,
          notifyPremium: profile.notifyPremium ?? false,
          displayName: profile.displayName ?? "",
          gender: profile.gender ?? "",
          plan: profile.plan ?? "free",
        });
        setAccountInfo(
          buildAccountInfo(profile.account, {
            email: currentUser.email ?? "",
            provider: currentUser.provider,
            joinedAt: currentUser.joinedAt ?? null,
          }),
        );
      } catch (err) {
        console.error("Failed to read profile settings:", err);
        setProfileSettings({
          notifyResultSaved: true,
          notifyPremium: false,
          displayName: "",
          gender: "",
          plan: "free",
        });
        setAccountInfo(
          buildAccountInfo(undefined, {
            email: currentUser.email ?? "",
            provider: currentUser.provider,
            joinedAt: currentUser.joinedAt ?? null,
          }),
        );
      }
    };

    loadProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.userId) return;
    if (currentUser.provider && currentUser.joinedAt) return;

    const enrichMe = async () => {
      try {
        const me = await getMe();
        setCurrentUser((prev) => ({ ...prev, ...me }));
      } catch (err) {
        console.error("Failed to enrich auth session:", err);
      }
    };

    enrichMe();
  }, [currentUser?.userId, currentUser?.provider, currentUser?.joinedAt]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!hasInitializedHistorySyncRef.current) return;
    const nextHash = buildAppHash({ step, showLoginScreen, showProfileScreen, profileTab });
    const currentHash = window.location.hash || "";

    if (nextHash === currentHash) return;

    if (isSyncingFromHistoryRef.current) {
      isSyncingFromHistoryRef.current = false;
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${nextHash}`);
      return;
    }

    window.history.pushState({}, "", `${window.location.pathname}${window.location.search}${nextHash}`);
  }, [step, showLoginScreen, showProfileScreen, profileTab]);

  useEffect(() => {
    const handlePopState = () => {
      isSyncingFromHistoryRef.current = true;
      const stateFromHash = parseAppHash(window.location.hash);
      setStep(stateFromHash.step);
      setShowLoginScreen(stateFromHash.showLoginScreen);
      setShowProfileScreen(stateFromHash.showProfileScreen);
      setProfileTab(stateFromHash.profileTab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!showProfileScreen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowProfileScreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showProfileScreen]);

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

  const handleProfileClick = () => {
    setShowLoginScreen(false);
    setShowProfileScreen(true);
    setProfileTab("notifications");
  };

  const handleCloseProfile = () => {
    setShowProfileScreen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setCurrentUser(null);
    setShowProfileScreen(false);
    setStep(0);
    setToastMessage("로그아웃되었습니다.");
  };

  const handleGoogleOAuthLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handlePremiumClick = () => {
    setShowPremiumModal(true);
  };

  const handlePremiumNotify = () => {
    setShowPremiumModal(false);
    if (profileSettings.notifyPremium) {
      addNotification("프리미엄 출시 알림 신청이 접수되었습니다.");
    }
    setToastMessage("프리미엄 알림 신청이 접수됐어요. 출시 시 안내드릴게요.");
  };

  const handleMoveToPremiumGuide = () => {
    setShowPremiumModal(false);
    setStep(0);
    window.setTimeout(() => handleNavClick("recommendation"), 120);
    setToastMessage("기능 안내 섹션으로 이동했어요.");
  };

  const currentUserId = currentUser?.userId || currentUser?.id || 1;
  const currentUserRealId = currentUser?.userId || currentUser?.id;
  const currentUserStorageKey = currentUser?.userId || currentUser?.id
    ? `inferdev:savedResults:${currentUser.userId || currentUser.id}`
    : null;
  const currentNotificationStorageKey = currentUser?.userId || currentUser?.id
    ? `inferdev:notifications:${currentUser.userId || currentUser.id}`
    : null;

  const persistNotifications = (nextNotifications) => {
    const normalized = (Array.isArray(nextNotifications) ? nextNotifications : [])
      .map((item, index) => normalizeNotification(item, index));
    setNotifications(normalized);
    if (currentNotificationStorageKey) {
      localStorage.setItem(currentNotificationStorageKey, JSON.stringify(normalized));
    }
  };

  const addNotification = (message, detail = "") => {
    if (!currentUserRealId) return;
    const text = String(message || "새 알림");
    const detailText = String(detail || text);
    const next = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: text,
        message: text,
        detail: detailText,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...notifications,
    ].slice(0, 50);
    persistNotifications(next);
  };

  const markNotificationAsRead = (notificationId) => {
    let changed = false;
    const next = notifications.map((item) => {
      if (item.id !== notificationId || item.read) {
        return item;
      }
      changed = true;
      return { ...item, read: true };
    });
    if (!changed) return;
    persistNotifications(next);
  };

  const handleOpenNotification = (notificationId) => {
    setSelectedNotificationId((prev) => (prev === notificationId ? null : notificationId));
    markNotificationAsRead(notificationId);
  };

  const markAllNotificationsAsRead = () => {
    const next = notifications.map((item) => ({ ...item, read: true }));
    persistNotifications(next);
  };

  const toggleNotificationDeleteMode = () => {
    if (isNotificationDeleteMode) {
      setIsNotificationDeleteMode(false);
      setSelectedNotificationIds([]);
      return;
    }
    setIsNotificationDeleteMode(true);
    setSelectedNotificationId(null);
    setSelectedNotificationIds([]);
  };

  const toggleNotificationDeleteTarget = (notificationId) => {
    setSelectedNotificationIds((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId],
    );
  };

  const handleDeleteSelectedNotifications = () => {
    if (selectedNotificationIds.length === 0) {
      setToastMessage("삭제할 알림을 선택해 주세요.");
      return;
    }
    const targets = new Set(selectedNotificationIds);
    const next = notifications.filter((item) => !targets.has(item.id));
    if (selectedNotificationId && targets.has(selectedNotificationId)) {
      setSelectedNotificationId(null);
    }
    persistNotifications(next);
    setIsNotificationDeleteMode(false);
    setSelectedNotificationIds([]);
    setToastMessage(`${targets.size}개의 알림을 삭제했어요.`);
  };

  const persistCurrentResult = () => {
    const savedAt = new Date().toISOString();
    const snapshot = {
      recordId: `saved-result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recordName: new Date(savedAt).toLocaleString(),
      savedAt,
      topTrack: topTrack || "",
      topJobId: topResultJobId || topJob || "",
      topJobTitle: topJobDetails?.title || partialResultTitle || "추천 직무",
      summaryMainLine,
      summarySubLine,
      readiness,
      confidence,
      top3Jobs: top3Jobs.slice(0, 3),
    };
    if (!currentUserStorageKey) {
      return null;
    }
    const nextHistory = [snapshot, ...savedResultHistory].slice(0, 20);
    localStorage.setItem(currentUserStorageKey, JSON.stringify(nextHistory));
    localStorage.setItem("inferdev:lastResult", JSON.stringify(snapshot));
    setSavedResultHistory(nextHistory);
    setSelectedSavedResultIndex(0);
    setSavedResultSnapshot(snapshot);
    return snapshot;
  };

  const toggleHistoryDeleteMode = () => {
    if (isHistoryDeleteMode) {
      setIsHistoryDeleteMode(false);
      setSelectedHistoryKeys([]);
      return;
    }
    setIsHistoryDeleteMode(true);
    setSelectedHistoryKeys([]);
  };

  const toggleHistoryDeleteTarget = (historyKey) => {
    setSelectedHistoryKeys((prev) =>
      prev.includes(historyKey)
        ? prev.filter((key) => key !== historyKey)
        : [...prev, historyKey],
    );
  };

  const handleDeleteSelectedHistory = () => {
    if (selectedHistoryKeys.length === 0) {
      setToastMessage("삭제할 검사 기록을 선택해 주세요.");
      return;
    }

    const targets = new Set(selectedHistoryKeys);
    const nextHistory = savedResultHistory.filter(
      (result, index) => !targets.has(getSavedResultKey(result, index)),
    );

    if (currentUserStorageKey) {
      localStorage.setItem(currentUserStorageKey, JSON.stringify(nextHistory));
    }

    if (nextHistory.length > 0) {
      localStorage.setItem("inferdev:lastResult", JSON.stringify(nextHistory[0]));
    } else {
      localStorage.removeItem("inferdev:lastResult");
    }

    setSavedResultHistory(nextHistory);
    setSavedResultSnapshot(nextHistory[0] || null);
    setSelectedSavedResultIndex(0);
    setIsHistoryDeleteMode(false);
    setSelectedHistoryKeys([]);
    setToastMessage(`${targets.size}개의 검사 기록을 삭제했어요.`);
  };

  const handleRenameSelectedHistory = () => {
    if (isHistoryDeleteMode) {
      setToastMessage("삭제 선택 모드에서는 이름을 수정할 수 없어요.");
      return;
    }
    if (!selectedSavedResult) {
      setToastMessage("이름을 수정할 검사 기록을 먼저 선택해 주세요.");
      return;
    }

    const currentName = String(
      selectedSavedResult.recordName || selectedSavedResult.topJobTitle || "추천 직무",
    );
    const nextNameRaw = window.prompt("검사 기록 이름을 입력해 주세요.", currentName);
    if (nextNameRaw === null) return;

    const nextName = nextNameRaw.trim();
    if (!nextName) {
      setToastMessage("기록 이름은 비워둘 수 없어요.");
      return;
    }

    const targetKey = getSavedResultKey(selectedSavedResult, selectedSavedResultIndex);
    const nextHistory = savedResultHistory.map((result, index) => {
      const key = getSavedResultKey(result, index);
      if (key !== targetKey) return result;
      return { ...result, recordName: nextName };
    });

    if (currentUserStorageKey) {
      localStorage.setItem(currentUserStorageKey, JSON.stringify(nextHistory));
    }
    if (nextHistory.length > 0) {
      const nextSnapshotIndex = nextHistory.findIndex(
        (result, index) => getSavedResultKey(result, index) === targetKey,
      );
      const nextSnapshot = nextHistory[nextSnapshotIndex >= 0 ? nextSnapshotIndex : 0];
      localStorage.setItem("inferdev:lastResult", JSON.stringify(nextSnapshot));
      setSavedResultSnapshot(nextSnapshot);
      if (nextSnapshotIndex >= 0) {
        setSelectedSavedResultIndex(nextSnapshotIndex);
      }
    }
    setSavedResultHistory(nextHistory);
    setToastMessage("검사 기록 이름을 수정했어요.");
  };

  const handleOpenSavedResultInMainView = (savedResult, index) => {
    if (!savedResult) {
      setToastMessage("이동할 저장 결과를 찾지 못했어요.");
      return;
    }

    const ranking = Array.isArray(savedResult.top3Jobs)
      ? savedResult.top3Jobs
        .map((job, orderIndex) => ({
          jobId: job?.jobId || "",
          score: Number(job?.score) || 0,
          rank: Number(job?.rank) || orderIndex + 1,
        }))
        .filter((item) => item.jobId)
      : [];

    if (
      ranking.length === 0 &&
      typeof savedResult.readiness !== "number" &&
      typeof savedResult.confidence !== "number"
    ) {
      setToastMessage("저장 결과 데이터가 부족해서 결과 화면으로 이동할 수 없어요.");
      return;
    }

    const restoredScores = ranking.reduce((acc, item) => {
      acc[item.jobId] = item.score;
      return acc;
    }, {});

    setTopTrack(savedResult.topTrack || "");
    setTopJob(savedResult.topJobId || ranking[0]?.jobId || "");
    setResultRanking(ranking);
    setResultScores(restoredScores);
    setTraitScores({});
    setSkillScores({});
    setReadiness(typeof savedResult.readiness === "number" ? savedResult.readiness : null);
    setConfidence(typeof savedResult.confidence === "number" ? savedResult.confidence : null);
    setIsScoreListExpanded(false);
    setError(null);
    setLoading(false);

    setSavedResultSnapshot(savedResult);
    if (Number.isInteger(index)) {
      setSelectedSavedResultIndex(index);
    }

    setShowProfileScreen(false);
    setShowPremiumGuideOnly(false);
    setStep(3);
    setToastMessage("저장된 검사 결과 화면으로 이동했어요.");
  };

  const handleSaveResult = () => {
    const saved = persistCurrentResult();
    if (!saved) {
      setToastMessage("로그인 후 결과를 저장할 수 있어요.");
      return;
    }
    if (profileSettings.notifyResultSaved) {
      addNotification(`적성검사 결과가 저장되었습니다: ${saved.topJobTitle || "추천 직무"}`);
    }
    setToastMessage("결과를 저장했어요.");
  };

  const handleSaveResultAndNext = () => {
    const saved = persistCurrentResult();
    if (!saved) {
      setToastMessage("로그인 후 프로필에서 저장 결과를 확인할 수 있어요.");
      setShowLoginScreen(true);
      return;
    }
    if (profileSettings.notifyResultSaved) {
      addNotification(`적성검사 결과가 저장되었습니다: ${saved.topJobTitle || "추천 직무"}`);
    }
    setProfileTab("history");
    setShowProfileScreen(true);
    setToastMessage("결과를 저장하고 내 결과로 이동했어요.");
  };

  const handleShareResult = async () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const shareText = `InferDev 추천 결과: ${topJobDetails?.title || partialResultTitle || "추천 직무"}\n${summaryMainLine}\n${baseUrl}`;
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(shareText);
      setToastMessage("공유 링크를 클립보드에 복사했어요.");
    } catch (err) {
      setToastMessage("링크 복사에 실패했어요. 브라우저 권한을 확인해 주세요.");
    }
  };

  const handleToggleNotifyResultSaved = async () => {
    const next = {
      ...profileSettings,
      notifyResultSaved: !profileSettings.notifyResultSaved,
    };
    setProfileSettings(next);
    try {
      await updateProfile({ notifyResultSaved: next.notifyResultSaved });
    } catch (err) {
      setProfileSettings(profileSettings);
      setToastMessage("알림 설정 저장에 실패했어요.");
      return;
    }
    setToastMessage("알림 설정을 변경했어요.");
  };

  const handleToggleNotifyPremium = async () => {
    const next = {
      ...profileSettings,
      notifyPremium: !profileSettings.notifyPremium,
    };
    setProfileSettings(next);
    try {
      await updateProfile({ notifyPremium: next.notifyPremium });
    } catch (err) {
      setProfileSettings(profileSettings);
      setToastMessage("알림 설정 저장에 실패했어요.");
      return;
    }
    setToastMessage("알림 설정을 변경했어요.");
  };

  const handleDisplayNameChange = (event) => {
    setProfileSettings({
      ...profileSettings,
      displayName: event.target.value,
    });
  };

  const handleSaveAccountSettings = async () => {
    const payload = {
      displayName: profileSettings.displayName,
      ...(profileSettings.gender ? { gender: profileSettings.gender } : {}),
    };

    const shouldRetryWithoutGender = (error) => {
      const text = String(error?.message || "");
      return text.includes("gender") || text.includes("forbidNonWhitelisted");
    };

    try {
      let profile;
      try {
        profile = await updateProfile(payload);
      } catch (error) {
        if (!shouldRetryWithoutGender(error)) {
          throw error;
        }
        profile = await updateProfile({ displayName: profileSettings.displayName });
      }
      setProfileSettings({
        ...profileSettings,
        displayName: profile.displayName ?? "",
        gender: profile.gender ?? "",
      });
      setAccountInfo(
        buildAccountInfo(profile.account, {
          email: currentUser?.email ?? accountInfo.email,
          provider: currentUser?.provider,
          joinedAt: currentUser?.joinedAt ?? accountInfo.joinedAt,
        }),
      );
    } catch (err) {
      const detail = String(err?.message || "");
      if (err?.status === 401 || detail.toLowerCase().includes("unauthorized")) {
        setToastMessage("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      } else if (detail.toLowerCase().includes("failed to fetch")) {
        setToastMessage("계정 설정 저장 실패: 네트워크 또는 서버 연결을 확인해 주세요.");
      } else {
        setToastMessage(`계정 설정 저장 실패: ${detail || "알 수 없는 오류"}`);
      }
      return;
    }
    setToastMessage("계정 설정이 저장되었어요.");
  };

  const handleGenderChange = (event) => {
    setProfileSettings({
      ...profileSettings,
      gender: event.target.value,
    });
  };

  const handleOpenPlanGuide = () => {
    setShowProfileScreen(false);
    setShowPremiumGuideOnly(true);
    setStep(3);
    setToastMessage("결과 화면의 프리미엄 안내로 이동했어요.");
  };

  const handleManageBilling = () => {
    setToastMessage("결제 관리 페이지는 준비 중입니다.");
  };

  const handleUpgradePremium = async () => {
    const next = { ...profileSettings, plan: "premium" };
    setProfileSettings(next);
    try {
      await updateProfile({ plan: "premium" });
    } catch (err) {
      setProfileSettings(profileSettings);
      setToastMessage("플랜 변경에 실패했어요.");
      return;
    }
    setShowPremiumGuideOnly(false);
    setToastMessage("Premium 플랜으로 변경했어요.");
  };

  const handleCancelPremium = async () => {
    const next = { ...profileSettings, plan: "free" };
    setProfileSettings(next);
    try {
      await updateProfile({ plan: "free" });
    } catch (err) {
      setToastMessage("플랜 변경에 실패했어요.");
      return;
    }
    setShowPremiumGuideOnly(false);
    setToastMessage("Free 플랜으로 변경했어요.");
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
    setShowPremiumGuideOnly(false);
    setStep(0);
    setTopJob(null);
    setTopTrack("");
    setResultScores(null);
    setResultRanking([]);
    setTraitScores(null);
    setSkillScores(null);
    setReadiness(null);
    setConfidence(null);
    setIsScoreListExpanded(false);
    setShowPremiumModal(false);
  };

  const [scores, setScores] = useState({}); // Will be updated by backend response
  const [resultScores, setResultScores] = useState(null); // Stores final scores from backend
  const [resultRanking, setResultRanking] = useState([]);
  const [traitScores, setTraitScores] = useState(null);
  const [skillScores, setSkillScores] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [isScoreListExpanded, setIsScoreListExpanded] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [major, setMajor] = useState("");
  const [itMajorDetail, setItmajorDetail] = useState("");

  const [codingExp, setCodingExp] = useState("");
  const [codingLevel, setCodingLevel] = useState("");

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
          userId: currentUserId,
          major,
          itMajorDetail,
          codingExp,
          codingLevel,
        }),
      });

      const result = await parseApiJsonResponse(
        response,
        "1단계 추천 응답을 파싱하지 못했습니다.",
      );
      setTopTrack(result.topTrack || "");
      setTraitScores(result.traitScores || {});
      setConfidence(result.confidence ?? null);

      const stage2Res = await fetch(
        `/api/survey-questions?stage=2&track=${encodeURIComponent(result.topTrack || "")}`,
      );
      if (!stage2Res.ok) {
        throw new Error("Failed to fetch stage2 survey questions");
      }
      const stage2Questions = await parseApiJsonResponse(
        stage2Res,
        "2단계 설문 문항 응답을 파싱하지 못했습니다.",
      );
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
          userId: currentUserId,
          stage: 2,
          track: topTrack,
          answers: finalStage2Answers,
          stage1Answers,
          stage2Answers: finalStage2Answers,
        }),
      });

      const result = await parseApiJsonResponse(
        response,
        "최종 추천 응답을 파싱하지 못했습니다.",
      );
      setTopTrack(result.topTrack || topTrack);
      setTopJob(result.topJob);
      setResultScores(result.scores);
      setResultRanking(result.ranking || []);
      setTraitScores(result.traitScores || {});
      setSkillScores(result.skillScores || {});
      setReadiness(result.readiness ?? null);
      setConfidence(result.confidence ?? null);
      setIsScoreListExpanded(false);
      setShowPremiumGuideOnly(false);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (loading && step !== 3) {
    return <div className="loading-screen">데이터를 불러오는 중입니다...</div>;
  }

  if (error && step !== 3) {
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
  const nonZeroResultEntries = sortedResultEntries.filter(([, score]) => score !== 0);
  const displayedResultEntries = isScoreListExpanded
    ? nonZeroResultEntries
    : nonZeroResultEntries.slice(0, 3);
  const hasMoreThanThreeScores = nonZeroResultEntries.length > 3;
  const isScoreListEmpty = displayedResultEntries.length === 0;
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
  const hasResultSummaryData =
    sortedResultEntries.length > 0 ||
    topTraits.length > 0 ||
    topSkills.length > 0 ||
    readiness !== null ||
    confidence !== null;
  const topResultJobId = sortedResultEntries[0]?.[0] || topJob;
  const topResultJob = topResultJobId ? fetchedJobs.find((job) => job.id === topResultJobId) : null;
  const partialResultTitle = topResultJob?.name || "추천 직무";
  const primaryJobIdForDescription = topJobDetails?.jobId || topResultJobId;
  const resultJobDescription = getJobDescriptionText(primaryJobIdForDescription);
  let resultViewState = "error";
  if (step === 3) {
    if (loading) {
      resultViewState = "loading";
    } else if (topJobDetails) {
      resultViewState = "ready";
    } else if (hasResultSummaryData) {
      resultViewState = "partial";
    }
  }
  const topTraitLabels = topTraits
    .slice(0, 2)
    .map(([traitKey]) => TRAIT_LABELS[traitKey] || traitKey);
  const topSkillLabels = topSkills
    .slice(0, 3)
    .map(([skillKey]) => String(skillKey).replace(/_/g, " "));
  const topScore = sortedResultEntries[0]?.[1] ?? 0;
  const secondScore = sortedResultEntries[1]?.[1] ?? 0;
  const scoreGap = topScore - secondScore;
  const profileTone = scoreGap >= 10 ? "뚜렷" : "복합";
  const readinessLabel = getLevelLabel(readiness);
  const confidenceLabel = getLevelLabel(confidence);
  const summaryMainLine =
    topTraitLabels.length > 0
      ? `${topTraitLabels.join("/")} 성향이 강하고, 실행 준비도는 ${readinessLabel}이에요.`
      : `현재 데이터 기준 실행 준비도는 ${readinessLabel}이에요.`;
  const summarySubLine =
    profileTone === "뚜렷"
      ? `상위 직무 선호가 뚜렷하게 나타났어요. 추천 확신도는 ${confidenceLabel}이며, 강점 스킬은 ${topSkillLabels.slice(0, 2).join("/") || "분석 중"}입니다.`
      : `여러 직무가 비슷하게 높은 복합 성향이에요. 추천 확신도는 ${confidenceLabel}이며, 강점 스킬은 ${topSkillLabels.slice(0, 2).join("/") || "분석 중"}입니다.`;
  const selectedSavedResult = savedResultHistory[selectedSavedResultIndex] || savedResultSnapshot;
  const unreadNotifications = notifications.filter((item) => !item.read);
  const allNotificationsRead = notifications.length > 0 && unreadNotifications.length === 0;
  const socialProviderLabel = getProviderLabel(accountInfo.provider);
  const currentPlan = profileSettings.plan === "premium" ? "premium" : "free";
  const formatPlanPrice = (value) => {
    if (!value) return "무료";
    return `${value.toLocaleString()}원`;
  };
  const recommendedPlan = profileSettings.notifyPremium ? "premium" : "free";
  const renewalLabel = currentPlan === "premium" ? "다음 결제일: 결제 시작 후 1개월 주기" : "현재 결제 없음";
  const notificationStatusMessage = notifications.length === 0
    ? "새로운 알림이 없습니다."
    : allNotificationsRead
      ? "모든 알림을 확인했습니다."
      : `읽지 않은 알림이 ${unreadNotifications.length}개 있습니다.`;

  return (
    <div className="app-container">
      <NavBar
        onLogoClick={() => (window.location.href = "/")}
        onNavClick={handleNavClick}
        isScrolled={isScrolled}
        onLoginClick={handleLoginClick}
        onProfileClick={handleProfileClick}
        step={step}
        user={currentUser}
      />
      <div className={`navbar-ghost ${isScrolled ? "navbar-ghost-scrolled" : ""}`} />

      {showLoginScreen && (
        <div className="login-screen-overlay">
          <div className="login-screen-modal">
            <h2>로그인</h2>
            <p>네이버 또는 구글로 로그인하세요.</p>
            <div className="login-buttons">
              <button className="naver-login-button" disabled title="네이버 로그인 준비 중">
                Naver 계정으로 로그인 (준비 중)
              </button>
              <button className="google-login-button" onClick={handleGoogleOAuthLogin}>
                Google 계정으로 로그인
              </button>
            </div>
            <button onClick={handleCloseLogin}>닫기</button>
          </div>
        </div>
      )}

      {showPremiumModal && (
        <div className="login-screen-overlay">
          <div className="login-screen-modal">
            <h2>프리미엄 플랜 준비 중</h2>
            <p>고급 리포트와 로드맵 기능을 준비하고 있습니다.</p>
            <div className="score-empty-actions">
              <button type="button" className="button-primary" onClick={handlePremiumNotify}>
                알림 신청
              </button>
              <button type="button" className="button-secondary" onClick={handleMoveToPremiumGuide}>
                기능 안내 보기
              </button>
            </div>
            <button type="button" onClick={() => setShowPremiumModal(false)}>닫기</button>
          </div>
        </div>
      )}

      {showProfileScreen && currentUser && (
        <div className="login-screen-overlay" onClick={handleCloseProfile}>
          <div className="profile-screen-modal" onClick={(event) => event.stopPropagation()}>
            <div className="profile-panel">
              <div className="result-header">
                <h2 className="result-main-title">프로필</h2>
                <p className="result-meta">계정과 설정을 탭으로 나눠 확인하세요.</p>
              </div>

              <div className="profile-tabs">
                <button
                  type="button"
                  className={profileTab === "notifications" ? "profile-tab-button active" : "profile-tab-button"}
                  onClick={() => setProfileTab("notifications")}
                >
                  알림
                </button>
                <button
                  type="button"
                  className={profileTab === "account" ? "profile-tab-button active" : "profile-tab-button"}
                  onClick={() => setProfileTab("account")}
                >
                  계정 정보
                </button>
                <button
                  type="button"
                  className={profileTab === "history" ? "profile-tab-button active" : "profile-tab-button"}
                  onClick={() => setProfileTab("history")}
                >
                  검사 기록
                </button>
                <button
                  type="button"
                  className={profileTab === "plan" ? "profile-tab-button active" : "profile-tab-button"}
                  onClick={() => setProfileTab("plan")}
                >
                  플랜/결제
                </button>
              </div>

              <div className="profile-tab-content">
                {profileTab === "notifications" && (
                  <div className="result-top3-section">
                    <div className="profile-section-header">
                      <h3 className="section-title">알림함</h3>
                      <span className="profile-section-status">{notificationStatusMessage}</span>
                      {notifications.length > 0 && (
                        <div className="profile-inline-actions">
                          <button
                            type="button"
                            className="profile-inline-action"
                            onClick={markAllNotificationsAsRead}
                          >
                            전체 읽음 처리
                          </button>
                          <button
                            type="button"
                            className={`profile-inline-action ${isNotificationDeleteMode ? "danger" : ""}`}
                            onClick={toggleNotificationDeleteMode}
                          >
                            {isNotificationDeleteMode ? "삭제 선택 취소" : "알림 삭제"}
                          </button>
                          {isNotificationDeleteMode && (
                            <button
                              type="button"
                              className="profile-inline-action confirm"
                              onClick={handleDeleteSelectedNotifications}
                            >
                              선택 삭제 확인
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="score-list">
                        {notifications.map((item) => (
                          <div
                            className={
                              item.read
                                ? `score-item notification-item ${selectedNotificationId === item.id ? "open" : ""} ${isNotificationDeleteMode ? "delete-mode" : ""} ${selectedNotificationIds.includes(item.id) ? "delete-selected" : ""}`
                                : `score-item notification-item unread ${selectedNotificationId === item.id ? "open" : ""} ${isNotificationDeleteMode ? "delete-mode" : ""} ${selectedNotificationIds.includes(item.id) ? "delete-selected" : ""}`
                            }
                            key={item.id}
                          >
                            <button
                              type="button"
                              className="notification-item-button"
                              onClick={() => {
                                if (isNotificationDeleteMode) {
                                  toggleNotificationDeleteTarget(item.id);
                                  return;
                                }
                                handleOpenNotification(item.id);
                              }}
                            >
                              <div className="score-info notification-item-head">
                                <span className="score-job-label notification-title">
                                  {isNotificationDeleteMode && (
                                    <span
                                      className={
                                        selectedNotificationIds.includes(item.id)
                                          ? "notification-select-badge selected"
                                          : "notification-select-badge"
                                      }
                                    >
                                      {selectedNotificationIds.includes(item.id) ? "선택됨" : "선택"}
                                    </span>
                                  )}
                                  {!item.read && <span className="notification-unread-dot" aria-hidden="true" />}
                                  {item.title || item.message}
                                </span>
                                <span className="notification-time">
                                  {new Date(item.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </button>
                            {!isNotificationDeleteMode && selectedNotificationId === item.id && (
                              <div className="notification-detail">
                                <p>{item.detail || item.message}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

                {profileTab === "account" && (
                  <div className="result-top3-section">
                    <h3 className="section-title">계정 정보</h3>
                    <div className="profile-account-grid">
                      <div className="profile-account-row">
                        <span className="profile-account-label">이메일</span>
                        <span className="profile-account-value">{accountInfo.email || "-"}</span>
                      </div>
                      <div className="profile-account-row">
                        <span className="profile-account-label">가입일</span>
                        <span className="profile-account-value">{formatDateYYYYMMDD(accountInfo.joinedAt)}</span>
                      </div>
                      <div className="profile-account-row">
                        <span className="profile-account-label">로그인 방식</span>
                        <span className="profile-account-value">{socialProviderLabel}</span>
                      </div>
                      <label className="profile-account-field">
                        <span className="profile-account-label">이름</span>
                        <input
                          type="text"
                          value={profileSettings.displayName}
                          onChange={handleDisplayNameChange}
                          placeholder="이름을 입력하세요"
                        />
                      </label>
                      <label className="profile-account-field">
                        <span className="profile-account-label">성별</span>
                        <select value={profileSettings.gender} onChange={handleGenderChange}>
                          <option value="">선택 안 함</option>
                          <option value="male">남성</option>
                          <option value="female">여성</option>
                          <option value="other">기타</option>
                          <option value="unspecified">응답 안 함</option>
                        </select>
                      </label>
                    </div>
                    <div className="result-action-buttons profile-account-actions">
                      <button type="button" className="button-primary" onClick={handleSaveAccountSettings}>
                        계정 설정 저장
                      </button>
                      <button type="button" className="button-secondary" onClick={handleLogoutClick}>
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}

                {profileTab === "history" && (
                  <>
                    <div className="result-top3-section">
                      <div className="profile-section-header">
                        <h3 className="section-title">저장된 검사 기록</h3>
                        {savedResultHistory.length > 0 && (
                          <div className="profile-inline-actions">
                            <button
                              type="button"
                              className="profile-inline-action"
                              onClick={handleRenameSelectedHistory}
                            >
                              이름 수정
                            </button>
                            <button
                              type="button"
                              className={`profile-inline-action ${isHistoryDeleteMode ? "danger" : ""}`}
                              onClick={toggleHistoryDeleteMode}
                            >
                              {isHistoryDeleteMode ? "선택 취소" : "기록 삭제"}
                            </button>
                            {isHistoryDeleteMode && (
                              <button
                                type="button"
                                className="profile-inline-action confirm"
                                onClick={handleDeleteSelectedHistory}
                              >
                                선택 삭제 확인
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {savedResultHistory.length === 0 && (
                        <p className="result-meta">아직 저장된 결과가 없습니다.</p>
                      )}
                      {savedResultHistory.length > 0 && (
                        <div className="result-action-buttons">
                          {savedResultHistory.map((result, index) => {
                            const historyKey = getSavedResultKey(result, index);
                            const isSelectedForDelete = selectedHistoryKeys.includes(historyKey);
                            return (
                            <button
                              type="button"
                              key={historyKey}
                              className={
                                isHistoryDeleteMode
                                  ? `button-secondary history-record-button delete-mode ${isSelectedForDelete ? "delete-selected" : ""}`
                                  : `history-record-button ${index === selectedSavedResultIndex ? "button-primary" : "button-secondary"}`
                              }
                              onClick={() => {
                                if (isHistoryDeleteMode) {
                                  toggleHistoryDeleteTarget(historyKey);
                                  return;
                                }
                                setSelectedSavedResultIndex(index);
                                setSavedResultSnapshot(result);
                              }}
                            >
                              {isHistoryDeleteMode && (isSelectedForDelete ? "[선택됨] " : "[선택] ")}
                              {(result.recordName || "저장된 기록")}
                            </button>
                            );
                          })}
                        </div>
                      )}
                      {selectedSavedResult && !isHistoryDeleteMode && (
                        <div className="result-action-buttons history-open-result-action">
                          <button
                            type="button"
                            className="button-primary history-open-result-button"
                            onClick={() => handleOpenSavedResultInMainView(selectedSavedResult, selectedSavedResultIndex)}
                          >
                            <span className="history-open-result-label">결과 화면으로 이동</span>
                            <span className="history-open-result-sub">선택한 검사 기록을 메인 결과 화면에서 확인합니다</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {selectedSavedResult?.top3Jobs?.length > 0 && (
                      <div className="result-top3-section">
                        <h3 className="section-title">저장된 Top 3</h3>
                        <div className="top3-job-cards">
                          {selectedSavedResult.top3Jobs.map((job, index) => (
                            <div className="top3-job-card" key={`${job.jobId}-${index}`}>
                              <div className="top3-card-head">
                                <span className="top3-rank-badge">#{job.rank || index + 1}</span>
                                <span className="top3-score">{job.score}점</span>
                              </div>
                              <h4 className="top3-job-name">{job.name}</h4>
                              <p className="top3-job-desc">{job.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {profileTab === "plan" && (
                  <>
                    <div className="result-top3-section plan-overview-section">
                      <div className="plan-header-row">
                        <h3 className="section-title">플랜 보기</h3>
                        <span className={`plan-current-chip ${currentPlan}`}>
                          현재 플랜: {currentPlan === "premium" ? "Premium" : "Free"}
                        </span>
                      </div>
                      <p className="result-meta">{renewalLabel}</p>
                      <p className="plan-recommendation-text">
                        추천 플랜: {recommendedPlan === "premium" ? "Premium" : "Free"} (현재 사용 패턴 기준)
                      </p>
                      <div className="plan-billing-toggle">
                        <button
                          type="button"
                          className={planBillingCycle === "monthly" ? "plan-toggle-button active" : "plan-toggle-button"}
                          onClick={() => setPlanBillingCycle("monthly")}
                        >
                          월간 결제
                        </button>
                        <button
                          type="button"
                          className={planBillingCycle === "yearly" ? "plan-toggle-button active" : "plan-toggle-button"}
                          onClick={() => setPlanBillingCycle("yearly")}
                        >
                          연간 결제(할인)
                        </button>
                      </div>
                      <div className="plan-card-grid">
                        {PLAN_CATALOG.map((plan) => {
                          const isCurrent = currentPlan === plan.id;
                          const price =
                            planBillingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                          const cycleLabel = planBillingCycle === "yearly" ? "/년" : "/월";
                          return (
                            <article
                              key={plan.id}
                              className={isCurrent ? "plan-card current" : "plan-card"}
                            >
                              <div className="plan-card-head">
                                <h4>{plan.name}</h4>
                                {plan.id === "premium" && <span className="plan-card-badge">추천</span>}
                              </div>
                              <p className="plan-price">
                                {formatPlanPrice(price)}
                                <span>{price ? cycleLabel : ""}</span>
                              </p>
                              <p className="plan-summary">{plan.summary}</p>
                              <ul className="plan-highlight-list">
                                {plan.highlights.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                              {isCurrent ? (
                                <button type="button" className="button-secondary" disabled>
                                  현재 이용 중
                                </button>
                              ) : plan.id === "premium" ? (
                                <button type="button" className="button-primary" onClick={handleUpgradePremium}>
                                  Premium으로 변경
                                </button>
                              ) : (
                                <button type="button" className="button-secondary" onClick={handleCancelPremium}>
                                  Free로 변경
                                </button>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </div>

                    <div className="result-top3-section">
                      <h3 className="section-title">기능 비교</h3>
                      <div className="plan-compare-wrapper">
                        <table className="plan-compare-table">
                          <thead>
                            <tr>
                              <th>기능</th>
                              <th>Free</th>
                              <th>Premium</th>
                            </tr>
                          </thead>
                          <tbody>
                            {PLAN_COMPARE_ROWS.map((row) => (
                              <tr key={row.label}>
                                <td>{row.label}</td>
                                <td>{row.free}</td>
                                <td>{row.premium}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="result-top3-section">
                      <h3 className="section-title">결제 및 안내</h3>
                      <div className="result-action-buttons">
                        <button type="button" className="button-secondary" onClick={handleManageBilling}>
                          결제 수단 관리
                        </button>
                        <button type="button" className="button-secondary" onClick={handleOpenPlanGuide}>
                          결과 화면 프리미엄 소개 보기
                        </button>
                      </div>
                      <div className="plan-faq-list">
                        <p><strong>Q.</strong> 플랜은 언제든 변경할 수 있나요? <strong>A.</strong> 네, 즉시 변경됩니다.</p>
                        <p><strong>Q.</strong> 연간 결제는 어떤 이점이 있나요? <strong>A.</strong> 월간 대비 할인된 금액으로 이용할 수 있습니다.</p>
                        <p><strong>Q.</strong> 결제 오류가 나면 어떻게 하나요? <strong>A.</strong> 결제 수단 관리에서 카드 정보를 갱신해 주세요.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="result-action-buttons">
                <button type="button" className="button-secondary" onClick={handleCloseProfile}>
                  닫기
                </button>
              </div>
            </div>
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

          {step === 3 && (
            <div className="result-container fade-in">
              {showPremiumGuideOnly && (
                <div id="premium-callout" className="premium-callout premium-callout-expanded">
                  <div className="premium-hero">
                    <span className="premium-badge">PREMIUM GUIDE</span>
                    <h3>프리미엄 플랜 상세 안내</h3>
                    <p>
                      결과 데이터가 없어도 이 화면에서 프리미엄 혜택, 가격, 적용 방식까지 한 번에 확인할 수 있어요.
                    </p>
                  </div>

                  <div className="premium-guide-grid">
                    {PREMIUM_GUIDE_BLOCKS.map((block) => (
                      <article key={block.title} className="premium-guide-card">
                        <h4>{block.title}</h4>
                        <ul>
                          {block.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>

                  <div className="premium-pricing-summary">
                    <p><strong>현재 플랜:</strong> {currentPlan === "premium" ? "Premium" : "Free"}</p>
                    <p><strong>월간:</strong> {formatPlanPrice(PLAN_CATALOG[1].monthlyPrice)}/월</p>
                    <p><strong>연간:</strong> {formatPlanPrice(PLAN_CATALOG[1].yearlyPrice)}/년</p>
                  </div>

                  <div className="result-action-buttons premium-guide-actions">
                    {currentPlan === "premium" ? (
                      <button type="button" className="button-secondary" onClick={handleManageBilling}>
                        결제 수단 관리
                      </button>
                    ) : (
                      <button type="button" className="button-primary" onClick={handleUpgradePremium}>
                        Premium 플랜으로 시작하기
                      </button>
                    )}
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => {
                        setShowPremiumGuideOnly(false);
                        setProfileTab("plan");
                        setShowProfileScreen(true);
                        setToastMessage("플랜 탭으로 돌아왔어요.");
                      }}
                    >
                      플랜 탭으로 돌아가기
                    </button>
                  </div>
                </div>
              )}

              {!showPremiumGuideOnly && (
                <>
              {resultViewState === "loading" && (
                <div className="result-state-card">
                  <h2>결과 계산/조회 중입니다</h2>
                  <p>잠시만 기다려주세요. 추천 결과를 준비하고 있습니다.</p>
                </div>
              )}

              {resultViewState === "ready" && (
                <>
                  <div className="result-header">
                    <h2 className="result-main-title">당신에게 어울리는 직무는</h2>
                    <img src={topJobDetails.img} alt={topJobDetails.title} className="result-main-image" />
                    <h1 className="result-job-type">{topJobDetails.title}</h1>
                    <p className="result-meta">
                      추천 트랙: {topTrack || "-"} | 준비도: {readiness !== null ? `${Math.round(readiness * 100)}%` : "-"} | 확신도: {confidence !== null ? `${Math.round(confidence * 100)}%` : "-"}
                    </p>
                    <p className="result-summary-main">{summaryMainLine}</p>
                    <p className="result-summary-sub">{summarySubLine}</p>
                    <p className="result-job-description">
                      {resultJobDescription}
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
                        {isScoreListEmpty ? (
                          <div className="score-empty-state">
                            <p>이번 설문에서는 특정 영역 점수가 낮게 측정됐어요.</p>
                            <p>질문 응답이 일부 빠졌거나 중립 응답이 많으면 이렇게 나올 수 있어요.</p>
                            <div className="score-empty-actions">
                              <button type="button" onClick={resetSurvey} className="button-primary">
                                다시 검사하기
                              </button>
                              <button type="button" onClick={handleSaveResultAndNext} className="button-secondary">
                                결과 저장하고 다음으로
                              </button>
                            </div>
                          </div>
                        ) : (
                          displayedResultEntries.map(([jobId, score]) => {
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
                          })
                        )}
                      </div>
                      {hasMoreThanThreeScores && (
                        <button
                          type="button"
                          className="score-toggle-button"
                          onClick={() => setIsScoreListExpanded((prev) => !prev)}
                        >
                          {isScoreListExpanded ? "닫기" : "더보기"}
                        </button>
                      )}
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
                </>
              )}

              {resultViewState === "partial" && (
                <>
                  <div className="result-header">
                    <h2 className="result-main-title">추천 결과 일부를 먼저 보여드립니다</h2>
                    <h1 className="result-job-type">{partialResultTitle}</h1>
                    <p className="result-meta">
                      추천 트랙: {topTrack || "-"} | 준비도: {readiness !== null ? `${Math.round(readiness * 100)}%` : "-"} | 확신도: {confidence !== null ? `${Math.round(confidence * 100)}%` : "-"}
                    </p>
                    <p className="result-summary-main">{summaryMainLine}</p>
                    <p className="result-summary-sub">{summarySubLine}</p>
                    <p className="result-job-description">{resultJobDescription}</p>
                    <p className="result-fallback-note">
                      대표 직무 상세 정보가 없어 점수/랭킹 중심으로 결과를 표시합니다.
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
                        {isScoreListEmpty ? (
                          <div className="score-empty-state">
                            <p>이번 설문에서는 특정 영역 점수가 낮게 측정됐어요.</p>
                            <p>질문 응답이 일부 빠졌거나 중립 응답이 많으면 이렇게 나올 수 있어요.</p>
                            <div className="score-empty-actions">
                              <button type="button" onClick={resetSurvey} className="button-primary">
                                다시 검사하기
                              </button>
                              <button type="button" onClick={handleSaveResultAndNext} className="button-secondary">
                                결과 저장하고 다음으로
                              </button>
                            </div>
                          </div>
                        ) : (
                          displayedResultEntries.map(([jobId, score]) => {
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
                          })
                        )}
                      </div>
                      {hasMoreThanThreeScores && (
                        <button
                          type="button"
                          className="score-toggle-button"
                          onClick={() => setIsScoreListExpanded((prev) => !prev)}
                        >
                          {isScoreListExpanded ? "닫기" : "더보기"}
                        </button>
                      )}
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
                  </div>
                </>
              )}

              {resultViewState === "error" && (
                <div className="result-state-card result-state-error">
                  <h2>결과 데이터를 불러오지 못했습니다</h2>
                  <p>일시적인 문제이거나 결과 데이터가 비어 있습니다. 다시 시도해 주세요.</p>
                  {error && <p className="result-error-message">오류 내용: {error}</p>}
                </div>
              )}

              <div className="result-actions">
                <div className="result-action-buttons">
                  <button type="button" onClick={handleSaveResult} className="button-primary">
                    결과 저장하기
                  </button>
                  <button type="button" onClick={handleShareResult} className="button-secondary">
                    공유하기
                  </button>
                  <button type="button" onClick={resetSurvey} className="button-secondary">
                    다시하기
                  </button>
                </div>
                <div id="premium-callout" className="premium-callout">
                  <h4>더 깊이 있는 정보를 원하시나요?</h4>
                  <p>개발자 로드맵, 현직자 인터뷰, 예상 연봉 등 프리미엄 콘텐츠를 확인해보세요.</p>
                  <button type="button" className="button-secondary" onClick={handlePremiumClick}>
                    프리미엄 플랜 구독하기
                  </button>
                </div>
              </div>
                </>
              )}
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
      {toastMessage && <div className="app-toast">{toastMessage}</div>}
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
