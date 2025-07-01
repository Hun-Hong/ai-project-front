import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // ====== STATE ======
  
  // 앱 기본 상태
  const isOnboardingCompleted = ref(false)
  
  // 사용자 정보 (간소화)
  const user = ref({
    id: 1,
    name: '사용자',
    sessionId: generateSessionId()
  })

  // AI 대화 내역
  const conversations = ref([])
  
  // AI 설정
  const aiSettings = ref({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    language: 'ko'
  })

  // 앱 통계
  const stats = ref({
    totalConversations: 0,
    totalMessages: 0,
    averageResponseTime: 0,
    userSatisfaction: 0
  })

  // 자주 묻는 질문들
  const faq = ref([
    {
      id: 1,
      category: '기본 사용법',
      question: 'AI 챗봇은 어떻게 사용하나요?',
      answer: '텍스트 입력창에 질문이나 요청사항을 입력하고 Enter키를 누르면 AI가 답변해드립니다.'
    },
    {
      id: 2,
      category: '기능',
      question: '어떤 종류의 질문을 할 수 있나요?',
      answer: '정보 검색, 텍스트 작성, 번역, 계산, 창작 도움 등 다양한 분야의 질문이 가능합니다.'
    },
    {
      id: 3,
      category: '제한사항',
      question: 'AI가 답변할 수 없는 것이 있나요?',
      answer: '실시간 정보, 개인정보, 의료진단, 법률자문 등은 정확한 답변을 드리기 어려울 수 있습니다.'
    }
  ])

  // 빠른 응답 템플릿
  const quickResponses = ref([
    { id: 1, icon: '📊', text: '데이터 분석에 대해 알려주세요', category: 'analysis' },
    { id: 2, icon: '💡', text: '창의적인 아이디어가 필요해요', category: 'creative' },
    { id: 3, icon: '📝', text: '글 작성을 도와주세요', category: 'writing' },
    { id: 4, icon: '🔍', text: '정보를 찾아주세요', category: 'search' },
    { id: 5, icon: '🛠️', text: '문제 해결 방법을 알려주세요', category: 'problem-solving' },
    { id: 6, icon: '📚', text: '학습 자료를 추천해주세요', category: 'learning' },
    { id: 7, icon: '🌐', text: '번역을 도와주세요', category: 'translation' },
    { id: 8, icon: '🧮', text: '계산을 도와주세요', category: 'calculation' }
  ])

  // ====== GETTERS ======
  
  // 현재 세션의 대화 수
  const currentSessionMessages = computed(() => {
    return conversations.value.length
  })

  // 사용자 만족도 계산
  const satisfactionRate = computed(() => {
    if (stats.value.totalConversations === 0) return 0
    return Math.round((stats.value.userSatisfaction / stats.value.totalConversations) * 100)
  })

  // 카테고리별 빠른 응답
  const getQuickResponsesByCategory = computed(() => (category) => {
    return quickResponses.value.filter(response => response.category === category)
  })

  // 최근 대화 요약
  const recentConversationSummary = computed(() => {
    const recent = conversations.value.slice(-5)
    return recent.map(conv => ({
      timestamp: conv.timestamp,
      userMessage: conv.userMessage.substring(0, 50) + '...',
      aiResponse: conv.aiResponse.substring(0, 100) + '...'
    }))
  })

  // ====== ACTIONS ======

  // 온보딩 완료 상태 설정
  const setOnboardingCompleted = (completed) => {
    isOnboardingCompleted.value = completed
    localStorage.setItem('ai_chatbot_onboarding_completed', completed.toString())
  }

  // 새 대화 추가
  const addConversation = (userMessage, aiResponse) => {
    const conversation = {
      id: Date.now(),
      sessionId: user.value.sessionId,
      userMessage,
      aiResponse,
      timestamp: new Date(),
      responseTime: Math.random() * 2000 + 500, // 0.5-2.5초 시뮬레이션
      userFeedback: null // 좋아요/싫어요
    }
    
    conversations.value.push(conversation)
    updateStats()
    
    return conversation
  }

  // 사용자 피드백 추가
  const addUserFeedback = (conversationId, feedback) => {
    const conversation = conversations.value.find(conv => conv.id === conversationId)
    if (conversation) {
      conversation.userFeedback = feedback
      updateUserSatisfaction(feedback)
    }
  }

  // 대화 내역 삭제
  const clearConversations = () => {
    conversations.value = []
    resetStats()
  }

  // 특정 대화 삭제
  const deleteConversation = (conversationId) => {
    const index = conversations.value.findIndex(conv => conv.id === conversationId)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      updateStats()
    }
  }

  // AI 응답 생성 시뮬레이션
  const generateAIResponse = async (userMessage) => {
    // 실제 구현에서는 AI API 호출
    const response = await simulateAIResponse(userMessage)
    const conversation = addConversation(userMessage, response)
    return conversation
  }

  // AI 응답 시뮬레이션 (실제로는 OpenAI API 등을 사용)
  const simulateAIResponse = async (userMessage) => {
    // 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // 키워드 기반 응답 생성
    const responses = {
      '안녕': '안녕하세요! 저는 AI 어시스턴트입니다. 무엇을 도와드릴까요?',
      '데이터': '데이터 분석에 대해 궁금하시군요! 어떤 종류의 데이터 분석에 대해 알고 싶으신가요?\n\n• **통계 분석**: 기술통계, 추론통계\n• **시각화**: 차트, 그래프, 대시보드\n• **머신러닝**: 예측 모델링, 분류, 회귀\n\n구체적인 질문이 있으시면 더 자세히 설명해드리겠습니다.',
      '아이디어': '창의적인 아이디어를 찾고 계시는군요! 🎨\n\n구체적으로 어떤 분야의 아이디어가 필요하신지 알려주시면 더 맞춤형 제안을 드릴 수 있습니다.\n\n• 비즈니스 아이디어\n• 프로젝트 기획\n• 마케팅 캠페인\n• 창작 활동\n\n어떤 영역에서 도움이 필요하신가요?',
      '글': '글 작성을 도와드리겠습니다! ✍️\n\n어떤 종류의 글을 작성하시려고 하나요?\n\n• **비즈니스**: 보고서, 제안서, 이메일\n• **학술**: 논문, 리포트, 에세이\n• **창작**: 블로그, 소설, 시나리오\n• **마케팅**: 카피라이팅, 광고 문구\n\n목적과 대상 독자를 알려주시면 더 효과적인 글 작성을 도와드릴 수 있습니다.',
      '정보': '정보 검색을 도와드리겠습니다! 🔍\n\n어떤 주제에 대한 정보가 필요하신가요? 구체적으로 알려주시면 더 정확하고 유용한 정보를 제공할 수 있습니다.\n\n**팁**: 질문을 구체적으로 해주실수록 더 정확한 답변을 드릴 수 있어요!',
      '문제': '문제 해결을 도와드리겠습니다! 🛠️\n\n어떤 문제에 직면하고 계신지 구체적으로 설명해주시면 다음과 같은 방식으로 도움을 드릴 수 있습니다:\n\n1. **문제 분석**: 상황 파악 및 원인 분석\n2. **해결책 제시**: 단계별 솔루션 제안\n3. **실행 계획**: 구체적인 액션 플랜\n4. **예상 결과**: 기대 효과 및 주의사항',
      '학습': '학습 자료 추천을 도와드리겠습니다! 📚\n\n어떤 분야를 공부하시려고 하나요?\n\n**인기 분야별 추천**:\n• **프로그래밍**: Python, JavaScript, 웹개발\n• **디자인**: UI/UX, 그래픽 디자인\n• **비즈니스**: 마케팅, 경영, 데이터 분석\n• **언어**: 영어, 중국어, 일본어\n\n현재 수준과 목표를 알려주시면 더 맞춤형 자료를 추천해드릴게요!',
      '번역': '번역을 도와드리겠습니다! 🌐\n\n어떤 언어에서 어떤 언어로 번역이 필요하신가요?\n\n**지원 가능한 번역**:\n• 한국어 ↔ 영어\n• 한국어 ↔ 일본어\n• 한국어 ↔ 중국어\n• 기타 주요 언어들\n\n번역할 텍스트를 입력해주시면 자연스럽고 정확한 번역을 제공해드리겠습니다.',
      '계산': '계산을 도와드리겠습니다! 🧮\n\n어떤 종류의 계산이 필요하신가요?\n\n**가능한 계산**:\n• 기본 수학 연산\n• 통계 계산\n• 환율 계산\n• 단위 변환\n• 복리 계산\n• 확률 계산\n\n구체적인 계산 내용을 알려주세요!'
    }
    
    // 키워드 매칭
    for (const [keyword, response] of Object.entries(responses)) {
      if (userMessage.toLowerCase().includes(keyword)) {
        return response
      }
    }
    
    // 기본 응답들
    const defaultResponses = [
      '흥미로운 질문이네요! 더 구체적으로 설명해주시면 더 도움이 될 답변을 드릴 수 있습니다. 🤔',
      '좋은 질문입니다. 이 주제에 대해 더 자세히 알아보시겠어요? 어떤 부분이 궁금하신지 알려주세요! 💡',
      '네, 이해했습니다. 어떤 부분을 더 깊이 다뤄보면 좋을까요? 구체적인 예시나 상황을 들어주시면 더 정확한 도움을 드릴 수 있어요. 📝',
      '도움이 되는 정보를 제공하고 싶습니다. 조금 더 구체적인 상황이나 목적을 알려주실 수 있나요? 🎯'
    ]
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  // 통계 업데이트
  const updateStats = () => {
    stats.value.totalConversations = conversations.value.length
    stats.value.totalMessages = conversations.value.length * 2 // 사용자 + AI 메시지
    
    if (conversations.value.length > 0) {
      const avgResponseTime = conversations.value.reduce((sum, conv) => sum + conv.responseTime, 0) / conversations.value.length
      stats.value.averageResponseTime = Math.round(avgResponseTime)
    }
  }

  // 사용자 만족도 업데이트
  const updateUserSatisfaction = (feedback) => {
    if (feedback === 'like') {
      stats.value.userSatisfaction += 1
    }
    // 'dislike'의 경우 만족도 점수는 그대로 유지
  }

  // 통계 리셋
  const resetStats = () => {
    stats.value = {
      totalConversations: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      userSatisfaction: 0
    }
  }

  // AI 설정 업데이트
  const updateAISettings = (newSettings) => {
    aiSettings.value = { ...aiSettings.value, ...newSettings }
    localStorage.setItem('ai_chatbot_settings', JSON.stringify(aiSettings.value))
  }

  // 빠른 응답 추가
  const addQuickResponse = (response) => {
    quickResponses.value.push({
      id: Date.now(),
      ...response
    })
  }

  // 빠른 응답 삭제
  const deleteQuickResponse = (responseId) => {
    const index = quickResponses.value.findIndex(response => response.id === responseId)
    if (index !== -1) {
      quickResponses.value.splice(index, 1)
    }
  }

  // ====== UTILITY FUNCTIONS ======

  // 세션 ID 생성
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 대화 내역 내보내기
  const exportConversations = () => {
    const data = {
      user: user.value,
      conversations: conversations.value,
      stats: stats.value,
      exportDate: new Date()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai_conversations_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 대화 내역 가져오기
  const importConversations = (jsonData) => {
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

  // 앱 초기화
  const initializeApp = () => {
    console.log('Initializing app...')
    
    // localStorage에서 온보딩 상태 확인
    const completed = localStorage.getItem('ai_chatbot_onboarding_completed')
    console.log('Onboarding status from localStorage:', completed)
    
    if (completed === 'true') {
      isOnboardingCompleted.value = true
      console.log('Onboarding set to completed')
    } else {
      console.log('Onboarding set to not completed')
    }

    // localStorage에서 AI 설정 불러오기
    const savedSettings = localStorage.getItem('ai_chatbot_settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        aiSettings.value = { ...aiSettings.value, ...settings }
        console.log('AI settings loaded:', settings)
      } catch (error) {
        console.warn('AI 설정 로드 실패:', error)
      }
    }
    
    console.log('App initialization complete. Onboarding completed:', isOnboardingCompleted.value)
  }

  // 데이터 초기화 (개발/테스트용)
  const resetAllData = () => {
    isOnboardingCompleted.value = false
    conversations.value = []
    user.value.sessionId = generateSessionId()
    resetStats()
    
    localStorage.removeItem('ai_chatbot_onboarding_completed')
    localStorage.removeItem('ai_chatbot_settings')
    
    console.log('AI 챗봇 데이터가 초기화되었습니다.')
  }

  // 앱 시작 시 초기화 실행
  initializeApp()

  // ====== RETURN ======
  return {
    // State
    isOnboardingCompleted,
    user,
    conversations,
    aiSettings,
    stats,
    faq,
    quickResponses,
    
    // Getters
    currentSessionMessages,
    satisfactionRate,
    getQuickResponsesByCategory,
    recentConversationSummary,
    
    // Actions
    setOnboardingCompleted,
    addConversation,
    addUserFeedback,
    clearConversations,
    deleteConversation,
    generateAIResponse,
    updateAISettings,
    addQuickResponse,
    deleteQuickResponse,
    exportConversations,
    importConversations,
    resetAllData
  }
})