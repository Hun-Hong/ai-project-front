import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('careerAdvisor', () => {
  // ====== STATE ======
  
  // 앱 기본 상태
  const isOnboardingCompleted = ref(false)
  
  // 사용자 정보
  const user = ref({
    id: 1,
    name: '상담자',
    sessionId: generateSessionId(),
    careerInfo: {
      currentJob: '',
      experience: '',
      industry: '',
      goals: []
    }
  })

  // 커리어 상담 대화 내역
  const conversations = ref([])
  
  // RAG 설정
  const ragSettings = ref({
    enabled: true,
    searchDepth: 5,
    relevanceThreshold: 0.7,
    maxSources: 3,
    useSemanticSearch: true
  })

  // 커리어 데이터베이스 설정
  const careerDatabase = ref({
    jobCategories: [
      'IT/소프트웨어', '마케팅/광고', '영업/고객관리', '기획/전략',
      '디자인', '인사/총무', '회계/재무', '연구개발', '제조/생산',
      '교육', '의료/보건', '서비스업', '금융/보험', '건설/부동산'
    ],
    skillCategories: [
      '프로그래밍', '데이터분석', '디지털마케팅', '프로젝트관리',
      '언어능력', '커뮤니케이션', '리더십', '문제해결', '창의성'
    ],
    experienceLevels: [
      '신입', '1-3년차', '4-6년차', '7-10년차', '10년차 이상'
    ],
    companySizes: [
      '스타트업(1-50명)', '중소기업(51-300명)', '중견기업(301-1000명)', '대기업(1000명 이상)'
    ]
  })

  // 앱 통계
  const stats = ref({
    totalConsultations: 0,
    totalMessages: 0,
    averageResponseTime: 0,
    userSatisfaction: 0,
    topQuestionCategories: []
  })

  // 자주 묻는 커리어 질문들
  const careerFAQ = ref([
    {
      id: 1,
      category: '취업 준비',
      question: '신입 개발자 취업을 위해 어떤 준비를 해야 하나요?',
      answer: '포트폴리오 프로젝트 2-3개, 기본적인 알고리즘 문제 해결 능력, Git 사용법, 그리고 지원하는 회사의 기술 스택 학습이 필요합니다.'
    },
    {
      id: 2,
      category: '이직',
      question: '언제 이직하는 것이 좋을까요?',
      answer: '최소 1년 이상 근무 후, 더 이상 성장할 기회가 없거나 목표와 맞지 않을 때, 그리고 충분한 준비가 되었을 때가 적절합니다.'
    },
    {
      id: 3,
      category: '연봉협상',
      question: '연봉 협상은 어떻게 해야 하나요?',
      answer: '시장 조사를 통한 적정 연봉 파악, 본인의 성과와 기여도 정량화, 그리고 감정이 아닌 데이터 기반의 논리적 접근이 중요합니다.'
    }
  ])

  // 커리어 조언 템플릿
  const adviceTemplates = ref([
    {
      id: 1,
      category: '취업준비',
      title: '신입 취업 가이드',
      template: '포트폴리오 → 기술 스택 학습 → 네트워킹 → 지원서 작성 → 면접 준비'
    },
    {
      id: 2,
      category: '이직',
      title: '이직 로드맵',
      template: '현재 상황 분석 → 목표 설정 → 스킬업 → 이력서 업데이트 → 지원 및 면접'
    },
    {
      id: 3,
      category: '승진',
      title: '승진 전략',
      template: '성과 관리 → 리더십 개발 → 네트워킹 → 비전 제시 → 승진 면담'
    }
  ])

  // ====== GETTERS ======
  
  // 현재 세션의 상담 수
  const currentSessionConsultations = computed(() => {
    return conversations.value.length
  })

  // 사용자 만족도 계산
  const satisfactionRate = computed(() => {
    if (stats.value.totalConsultations === 0) return 0
    return Math.round((stats.value.userSatisfaction / stats.value.totalConsultations) * 100)
  })

  // 카테고리별 질문 통계
  const getQuestionStats = computed(() => {
    const categoryCount = {}
    conversations.value.forEach(conv => {
      const category = detectQuestionCategory(conv.userMessage)
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })
    return categoryCount
  })

  // 최근 상담 요약
  const recentConsultationSummary = computed(() => {
    const recent = conversations.value.slice(-5)
    return recent.map(conv => ({
      timestamp: conv.timestamp,
      userQuestion: conv.userMessage.substring(0, 50) + '...',
      advice: conv.aiResponse.substring(0, 100) + '...',
      category: detectQuestionCategory(conv.userMessage)
    }))
  })

  // ====== ACTIONS ======

  // 온보딩 완료 상태 설정
  const setOnboardingCompleted = (completed) => {
    isOnboardingCompleted.value = completed
    localStorage.setItem('career_advisor_onboarding_completed', completed.toString())
  }

  // 사용자 커리어 정보 업데이트
  const updateUserCareerInfo = (careerInfo) => {
    user.value.careerInfo = { ...user.value.careerInfo, ...careerInfo }
    localStorage.setItem('career_advisor_user_info', JSON.stringify(user.value))
  }

  // 새 상담 대화 추가
  const addConsultation = (userMessage, aiResponse, sources = []) => {
    const consultation = {
      id: Date.now(),
      sessionId: user.value.sessionId,
      userMessage,
      aiResponse,
      sources,
      timestamp: new Date(),
      responseTime: Math.random() * 3000 + 1000, // 1-4초 시뮬레이션
      userFeedback: null,
      category: detectQuestionCategory(userMessage),
      ragMetadata: {
        searchQuery: userMessage,
        documentsRetrieved: sources.length,
        relevanceScore: sources.length > 0 ? Math.max(...sources.map(s => s.relevance)) : 0
      }
    }
    
    conversations.value.push(consultation)
    updateStats()
    
    return consultation
  }

  // 사용자 피드백 추가
  const addUserFeedback = (consultationId, feedback) => {
    const consultation = conversations.value.find(conv => conv.id === consultationId)
    if (consultation) {
      consultation.userFeedback = feedback
      updateUserSatisfaction(feedback)
    }
  }

  // 상담 내역 삭제
  const clearConsultations = () => {
    conversations.value = []
    resetStats()
  }

  // 특정 상담 삭제
  const deleteConsultation = (consultationId) => {
    const index = conversations.value.findIndex(conv => conv.id === consultationId)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      updateStats()
    }
  }

  // RAG 기반 커리어 조언 생성 시뮬레이션
  const generateCareerAdvice = async (userMessage) => {
    // 실제 구현에서는 백엔드 RAG 파이프라인 호출
    const { response, sources } = await simulateRAGResponse(userMessage)
    const consultation = addConsultation(userMessage, response, sources)
    return consultation
  }

  // RAG 응답 시뮬레이션 (실제로는 백엔드 API 호출)
  const simulateRAGResponse = async (userMessage) => {
    // 지연 시뮬레이션 (검색 + 생성 시간)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
    
    const category = detectQuestionCategory(userMessage)
    const mockSources = generateMockSources(category)
    const response = generateContextualAdvice(userMessage, category, mockSources)
    
    return {
      response,
      sources: mockSources
    }
  }

  // 질문 카테고리 감지
  const detectQuestionCategory = (message) => {
    const keywords = {
      '취업': ['취업', '신입', '채용', '입사', '지원'],
      '이직': ['이직', '전직', '옮기', '바꾸', '회사 변경'],
      '승진': ['승진', '팀장', '승격', '진급', '리더'],
      '연봉': ['연봉', '급여', '월급', '임금', '협상'],
      '개발자': ['개발자', '프로그래머', '프로그래밍', '코딩', 'IT'],
      '마케팅': ['마케팅', '광고', '브랜딩', '홍보'],
      '기획': ['기획', '전략', '프로젝트', 'PM'],
      '디자인': ['디자인', 'UI', 'UX', '디자이너'],
      '스킬업': ['스킬', '역량', '능력', '학습', '공부'],
      '네트워킹': ['네트워킹', '인맥', '관계', '멘토'],
      '면접': ['면접', '인터뷰', '질문', '답변'],
      '포트폴리오': ['포트폴리오', '작품', '프로젝트', '경험']
    }

    for (const [category, keywordList] of Object.entries(keywords)) {
      if (keywordList.some(keyword => message.includes(keyword))) {
        return category
      }
    }
    
    return '일반상담'
  }

  // 모의 RAG 소스 생성
  const generateMockSources = (category) => {
    const sourcesDB = {
      '취업': [
        { id: 1, title: '2024 신입 채용 트렌드 분석', relevance: 95 },
        { id: 2, title: '업계별 신입 요구역량 조사', relevance: 89 },
        { id: 3, title: '성공적인 취업 준비 가이드', relevance: 87 }
      ],
      '이직': [
        { id: 4, title: '이직 성공 전략 및 타이밍', relevance: 93 },
        { id: 5, title: '경력직 채용시장 동향', relevance: 91 },
        { id: 6, title: '이직 시 연봉 협상 가이드', relevance: 85 }
      ],
      '개발자': [
        { id: 7, title: '개발자 커리어 로드맵 2024', relevance: 96 },
        { id: 8, title: '기술 스택별 연봉 조사', relevance: 92 },
        { id: 9, title: '개발자 포트폴리오 작성법', relevance: 88 }
      ],
      '연봉': [
        { id: 10, title: '직무별 연봉 현황 보고서', relevance: 94 },
        { id: 11, title: '연봉 협상 성공 사례 분석', relevance: 90 },
        { id: 12, title: '경력별 연봉 상승 패턴', relevance: 86 }
      ]
    }

    return sourcesDB[category] || [
      { id: 13, title: '커리어 개발 종합 가이드', relevance: 82 },
      { id: 14, title: '직장인 성장 전략', relevance: 79 },
      { id: 15, title: '업계 동향 분석 리포트', relevance: 75 }
    ]
  }

  // 상황별 맞춤 조언 생성
  const generateContextualAdvice = (userMessage, category, sources) => {
    const adviceTemplates = {
      '취업': `**취업 준비 맞춤 전략** 💼

🎯 **현재 취업 시장 분석**
최신 데이터에 따르면, 올해 신입 채용은 전년 대비 15% 증가했으며, 특히 IT와 마케팅 분야의 수요가 높습니다.

📋 **단계별 취업 준비 계획**
1. **자기분석** (1-2주)
   • 관심 분야와 강점 파악
   • 커리어 목표 설정
   
2. **역량 강화** (2-3개월)
   • 직무 관련 필수 스킬 학습
   • 포트폴리오 프로젝트 진행
   
3. **지원 전략** (1개월)
   • 타겟 회사 리스트업
   • 맞춤형 지원서 작성

💡 **성공 포인트**
• 지원하는 직무의 트렌드와 요구사항을 정확히 파악하세요
• 단순 스펙보다는 실무 적용 능력을 어필하세요
• 지속적인 네트워킹과 정보 수집이 중요합니다

구체적인 희망 직무나 업계를 알려주시면 더 세부적인 조언을 드릴 수 있어요!`,

      '이직': `**전략적 이직 가이드** 🚀

⏰ **이직 최적 타이밍**
현재 시장 상황을 보면, 상반기(1-4월)가 가장 활발한 채용 시즌입니다. 최소 1년 이상 현재 회사에서 경험을 쌓은 후 이직을 고려하는 것이 좋습니다.

📊 **이직 준비 체크리스트**
✅ **이직 사유 명확화**
• 현재 문제점과 개선하고 싶은 부분
• 새로운 환경에서 얻고자 하는 것

✅ **시장 조사**
• 희망 직무의 연봉 수준 파악
• 요구되는 스킬과 경험 분석

✅ **역량 점검**
• 현재 보유 스킬 vs 시장 요구사항
• 부족한 부분의 보완 계획

🎯 **성공적인 이직 전략**
• 현재 업무에서의 성과를 구체적으로 정리하세요
• 이직 후 기여할 수 있는 가치를 명확히 어필하세요
• 급하게 결정하지 말고 충분한 준비 시간을 가지세요

현재 어떤 직무에서 어떤 이유로 이직을 고려하고 계신지 알려주시면 더 구체적인 조언을 드릴게요!`,

      '개발자': `**개발자 커리어 성장 로드맵** 👨‍💻

🚀 **개발자 커리어 트랙**
• **프론트엔드**: React, Vue, Angular 등 사용자 인터페이스 개발
• **백엔드**: 서버, 데이터베이스, API 설계 및 구축
• **풀스택**: 프론트엔드와 백엔드 전반적 개발
• **DevOps**: 인프라, 배포 자동화, 모니터링
• **데이터**: 데이터 분석, 머신러닝, AI 개발

📚 **경력별 성장 가이드**

**신입~2년차**: 기초 탄탄히
• 프로그래밍 언어 숙련도 향상
• 알고리즘, 자료구조 학습
• 클린 코드 작성법 습득

**3~5년차**: 전문성 강화
• 특정 분야 전문가로 성장
• 아키텍처 설계 능력 개발
• 팀 프로젝트 리드 경험

**5년차 이상**: 리더십 개발
• 시니어 개발자로서 멘토링
• 기술적 의사결정 참여
• CTO, 아키텍트 등 커리어 확장

💼 **취업/이직 핵심 포인트**
• **포트폴리오**: 실제 서비스 수준의 완성도 높은 프로젝트
• **깃허브**: 일관된 커밋과 코드 품질 관리
• **기술 블로그**: 학습 과정과 문제 해결 경험 공유

현재 어떤 개발 분야에 관심이 있으시고, 몇 년차 개발자이신지 알려주시면 더 맞춤형 조언을 드릴 수 있어요!`,

      '연봉': `**연봉 협상 성공 전략** 💰

📊 **시장 기준 연봉 조사**
최신 데이터에 따르면, 동일 직무 동일 경력의 평균 연봉을 파악하는 것이 협상의 첫 단계입니다.

**협상 전 준비사항**
• 업계 평균 연봉 조사
• 본인의 성과와 기여도 정량화
• 추가 가치 창출 계획 수립

💪 **협상 전략**

**1단계: 데이터 수집**
• 시장 조사를 통한 적정 연봉 파악
• 회사 내부 연봉 구조 이해
• 본인의 성과 지표 정리

**2단계: 협상 포인트 준비**
• 구체적인 성과와 기여도
• 향후 계획과 목표
• 시장 가치 대비 현재 연봉 비교

**3단계: 협상 진행**
• 감정이 아닌 논리적 접근
• 단계적 인상 계획 제시
• 연봉 외 복리후생도 고려

⏰ **최적 협상 타이밍**
• 성과평가 시즌 (보통 연말/연초)
• 프로젝트 성공 직후
• 추가 업무나 책임 부여 시

현재 몇 년차이시고 어떤 직무에서 일하고 계신지 알려주시면 더 구체적인 협상 전략을 제안해드릴게요!`
    }

    return adviceTemplates[category] || `**커리어 맞춤 조언** 🎯

질문해주신 내용을 바탕으로 개인화된 조언을 준비했습니다.

**현재 상황 분석**
최신 업계 데이터와 트렌드를 바탕으로 분석한 결과, 다음과 같은 접근이 효과적일 것 같습니다.

**추천 액션 플랜**
1. **단기 목표** (1-3개월)
   • 즉시 실행 가능한 개선사항
   
2. **중기 목표** (3-12개월)
   • 역량 강화 및 경험 축적
   
3. **장기 목표** (1-3년)
   • 커리어 목표 달성을 위한 단계적 계획

더 구체적인 상황과 목표를 알려주시면 더 정확하고 실용적인 조언을 드릴 수 있어요!`
  }

  // 통계 업데이트
  const updateStats = () => {
    stats.value.totalConsultations = conversations.value.length
    stats.value.totalMessages = conversations.value.length * 2
    
    if (conversations.value.length > 0) {
      const avgResponseTime = conversations.value.reduce((sum, conv) => sum + conv.responseTime, 0) / conversations.value.length
      stats.value.averageResponseTime = Math.round(avgResponseTime)
    }
    
    // 인기 질문 카테고리 업데이트
    const categoryStats = getQuestionStats.value
    stats.value.topQuestionCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))
  }

  // 사용자 만족도 업데이트
  const updateUserSatisfaction = (feedback) => {
    if (feedback === 'like') {
      stats.value.userSatisfaction += 1
    }
  }

  // 통계 리셋
  const resetStats = () => {
    stats.value = {
      totalConsultations: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      userSatisfaction: 0,
      topQuestionCategories: []
    }
  }

  // RAG 설정 업데이트
  const updateRAGSettings = (newSettings) => {
    ragSettings.value = { ...ragSettings.value, ...newSettings }
    localStorage.setItem('career_advisor_rag_settings', JSON.stringify(ragSettings.value))
  }

  // ====== UTILITY FUNCTIONS ======

  // 세션 ID 생성
  function generateSessionId() {
    return 'career_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 상담 내역 내보내기
  const exportConsultations = () => {
    const data = {
      user: user.value,
      conversations: conversations.value,
      stats: stats.value,
      exportDate: new Date(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `career_consultations_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 상담 내역 가져오기
  const importConsultations = (jsonData) => {
    try {
      const data = JSON.parse(jsonData)
      if (data.conversations && Array.isArray(data.conversations)) {
        conversations.value = data.conversations
        updateStats()
        return true
      }
    } catch (error) {
      console.error('Import failed:', error)
    }
    return false
  }

  // 커리어 진단 리포트 생성
  const generateCareerReport = () => {
    const report = {
      userInfo: user.value.careerInfo,
      consultationSummary: {
        total: conversations.value.length,
        categories: getQuestionStats.value,
        satisfactionRate: satisfactionRate.value
      },
      recommendations: [
        '지속적인 스킬 개발을 통한 경쟁력 강화',
        '네트워킹 확대로 기회 발굴',
        '정기적인 커리어 목표 점검 및 조정'
      ],
      nextSteps: [
        '명확한 단기/장기 목표 설정',
        '부족한 역량 파악 및 개발 계획 수립',
        '시장 동향 지속적 모니터링'
      ]
    }
    
    return report
  }

  // 앱 초기화
  const initializeApp = () => {
    console.log('Initializing Career Advisor app...')
    
    // localStorage에서 온보딩 상태 확인
    const completed = localStorage.getItem('career_advisor_onboarding_completed')
    if (completed === 'true') {
      isOnboardingCompleted.value = true
    }

    // localStorage에서 사용자 정보 불러오기
    const savedUserInfo = localStorage.getItem('career_advisor_user_info')
    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo)
        user.value = { ...user.value, ...userInfo }
      } catch (error) {
        console.warn('사용자 정보 로드 실패:', error)
      }
    }

    // localStorage에서 RAG 설정 불러오기
    const savedRAGSettings = localStorage.getItem('career_advisor_rag_settings')
    if (savedRAGSettings) {
      try {
        const settings = JSON.parse(savedRAGSettings)
        ragSettings.value = { ...ragSettings.value, ...settings }
      } catch (error) {
        console.warn('RAG 설정 로드 실패:', error)
      }
    }
    
    console.log('Career Advisor initialization complete')
  }

  // 데이터 초기화 (개발/테스트용)
  const resetAllData = () => {
    isOnboardingCompleted.value = false
    conversations.value = []
    user.value = {
      id: 1,
      name: '상담자',
      sessionId: generateSessionId(),
      careerInfo: {
        currentJob: '',
        experience: '',
        industry: '',
        goals: []
      }
    }
    resetStats()
    
    localStorage.removeItem('career_advisor_onboarding_completed')
    localStorage.removeItem('career_advisor_user_info')
    localStorage.removeItem('career_advisor_rag_settings')
    
    console.log('커리어 어드바이저 데이터가 초기화되었습니다.')
  }

  // 앱 시작 시 초기화 실행
  initializeApp()

  // ====== RETURN ======
  return {
    // State
    isOnboardingCompleted,
    user,
    conversations,
    ragSettings,
    careerDatabase,
    stats,
    careerFAQ,
    adviceTemplates,
    
    // Getters
    currentSessionConsultations,
    satisfactionRate,
    getQuestionStats,
    recentConsultationSummary,
    
    // Actions
    setOnboardingCompleted,
    updateUserCareerInfo,
    addConsultation,
    addUserFeedback,
    clearConsultations,
    deleteConsultation,
    generateCareerAdvice,
    updateRAGSettings,
    exportConsultations,
    importConsultations,
    generateCareerReport,
    resetAllData
  }
})