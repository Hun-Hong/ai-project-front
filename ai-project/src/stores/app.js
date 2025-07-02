import { defineStore } from 'pinia'
import { ref } from 'vue'
import dbService from '../services/indexedDB.js'

export const useAppStore = defineStore('jobAnalyzer', () => {
  // ====== STATE ======
  
  // 앱 기본 상태
  const isOnboardingCompleted = ref(false)
  
  // 사용자 정보
  const user = ref({
    id: 1,
    name: '사용자',
    sessionId: generateSessionId(),
    profile: null // 온보딩에서 수집한 프로필 정보
  })

  // 채팅 관련 상태
  const isApiConnected = ref(true)
  const apiBaseUrl = 'https://job-pt.fly.dev'
  const customQuestions = ref([]) // 맞춤형 예시 질문들

  // ====== ACTIONS ======

  // 온보딩 완료 상태 설정
  const setOnboardingCompleted = (completed) => {
    isOnboardingCompleted.value = completed
    localStorage.setItem('job_analyzer_onboarding_completed', completed.toString())
  }

  // 사용자 프로필 저장
  const saveUserProfile = async (profile) => {
    try {
      user.value.profile = profile
      
      // IndexedDB에 프로필 저장
      await dbService.saveUserProfile(user.value.sessionId, profile)
      
      console.log('사용자 프로필 저장 완료:', profile)
    } catch (error) {
      console.error('사용자 프로필 저장 실패:', error)
      throw error
    }
  }

  // 맞춤형 예시 질문 생성
  const generateCustomQuestions = async (profile) => {
    try {
      console.log('맞춤형 질문 생성 시작...')
      
      // 프로필 기반 시스템 프롬프트 생성
      const systemPrompt = createSystemPrompt(profile)
      
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: systemPrompt 
            },
            { 
              role: 'user', 
              content: '위 프로필에 맞는 채용공고 관련 질문 5개를 간단하고 명확하게 생성해주세요. 각 질문은 한 줄로 작성하고, 번호나 특수문자 없이 순수한 질문 문장만 제공해주세요.' 
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const questionsText = data.reply || ''
      
      // 응답에서 질문들 파싱
      const questions = parseQuestionsFromResponse(questionsText)
      
      if (questions.length > 0) {
        customQuestions.value = questions
        
        // IndexedDB에 저장
        await dbService.saveCustomQuestions(user.value.sessionId, questions)
        
        console.log('맞춤형 질문 생성 완료:', questions)
      } else {
        // 생성 실패 시 기본 질문 사용
        setDefaultQuestions(profile)
      }
      
    } catch (error) {
      console.error('맞춤형 질문 생성 실패:', error)
      // 에러 시 기본 질문 사용
      setDefaultQuestions(profile)
    }
  }

  // 시스템 프롬프트 생성
  const createSystemPrompt = (profile) => {
    const profileText = `
당신은 전문 채용 컨설턴트입니다. 사용자는 다음과 같은 프로필을 가지고 있습니다:

- 현재 상태: ${getStatusLabel(profile.status)}
- 경력 수준: ${getExperienceLabel(profile.experience)}  
- 희망 직무: ${getPositionLabel(profile.position)}
- 관심 기술: ${profile.techStack?.join(', ') || '미설정'}
- 선호 회사규모: ${getCompanySizeLabel(profile.companySize)}
- 근무형태: ${getWorkTypeLabel(profile.workType)}
- 중요 요소: ${profile.priorities?.map(p => getPriorityLabel(p)).join(', ') || '미설정'}
- 목표시기: ${getTimelineLabel(profile.timeline)}
- 관심사: ${getInterestLabel(profile.mainInterest)}

이 프로필을 바탕으로 사용자에게 맞춤형 채용공고 정보와 조언을 제공해주세요. 
사용자의 관심사와 목표에 맞는 구체적이고 실용적인 정보를 우선적으로 제공하고,
현재 상태와 경력 수준에 적합한 수준의 조언을 해주세요.
    `.trim()
    
    return profileText
  }

  // 응답에서 질문 파싱
  const parseQuestionsFromResponse = (responseText) => {
    const questions = []
    
    // 줄바꿈으로 분리
    const lines = responseText.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // 빈 줄 제외
      if (!trimmed) continue
      
      // 번호나 특수문자 제거
      let cleaned = trimmed
        .replace(/^\d+\.\s*/, '') // "1. " 형태 제거
        .replace(/^-\s*/, '') // "- " 형태 제거
        .replace(/^•\s*/, '') // "• " 형태 제거
        .replace(/^[*]\s*/, '') // "* " 형태 제거
        .trim()
      
      // 질문으로 보이는 문장만 추가 (물음표나 질문 키워드 포함)
      if (cleaned && (cleaned.includes('?') || cleaned.includes('어떤') || cleaned.includes('무엇') || cleaned.includes('어디'))) {
        questions.push(cleaned)
      }
    }
    
    return questions.slice(0, 5) // 최대 5개
  }

  // 기본 질문 설정 (프로필 기반)
  const setDefaultQuestions = (profile) => {
    const defaultByPosition = {
      frontend_developer: [
        '프론트엔드 개발자 신입 채용공고 추천해주세요',
        'React를 사용하는 회사들의 최신 채용 동향은 어떤가요?',
        '프론트엔드 개발자의 평균 연봉은 얼마나 되나요?',
        '스타트업과 대기업 중 프론트엔드 개발자에게 더 유리한 곳은?',
        '원격근무 가능한 프론트엔드 개발자 채용공고가 있나요?'
      ],
      backend_developer: [
        '백엔드 개발자 채용공고에서 가장 많이 요구하는 기술은?',
        'Python과 Java 중 어떤 언어가 더 수요가 많나요?',
        '백엔드 개발자 연봉 협상 팁을 알려주세요',
        'MSA 경험이 있는 백엔드 개발자 채용공고 찾아주세요',
        '클라우드 경험을 요구하는 백엔드 채용공고가 많나요?'
      ],
      data_analyst: [
        '데이터 분석가 신입 채용에서 요구하는 필수 스킬은?',
        'SQL과 Python 외에 배워야 할 기술이 있나요?',
        '데이터 분석가 포트폴리오는 어떻게 준비해야 하나요?',
        '금융권과 IT기업 중 데이터 분석가에게 더 좋은 곳은?',
        '빅데이터 관련 자격증이 취업에 도움이 될까요?'
      ]
    }
    
    const positionQuestions = defaultByPosition[profile.position] || [
      'IT 분야 최신 채용 트렌드를 알려주세요',
      '내 경력에 맞는 채용공고를 추천해주세요',
      '이직할 때 가장 중요하게 봐야 할 요소는?',
      '면접에서 자주 나오는 질문들을 알려주세요',
      '연봉 협상은 어떻게 하는 것이 좋을까요?'
    ]
    
    customQuestions.value = positionQuestions
  }

  // 라벨 변환 함수들
  const getStatusLabel = (status) => {
    const labels = {
      job_seeking: '구직중',
      job_changing: '이직준비중', 
      exploring: '정보수집 단계'
    }
    return labels[status] || status
  }

  const getExperienceLabel = (experience) => {
    const labels = {
      entry: '신입',
      '1-3years': '1-3년차',
      '4-7years': '4-7년차',
      '8plus': '8년차 이상'
    }
    return labels[experience] || experience
  }

  const getPositionLabel = (position) => {
    const labels = {
      frontend_developer: '프론트엔드 개발자',
      backend_developer: '백엔드 개발자',
      fullstack_developer: '풀스택 개발자',
      mobile_developer: '모바일 개발자',
      data_analyst: '데이터 분석가',
      devops_engineer: 'DevOps 엔지니어',
      product_manager: '프로덕트 매니저',
      designer: 'UI/UX 디자이너',
      marketer: '마케터',
      other: '기타'
    }
    return labels[position] || position
  }

  const getCompanySizeLabel = (size) => {
    const labels = {
      startup: '스타트업',
      small: '중소기업',
      medium: '중견기업', 
      large: '대기업',
      any: '상관없음'
    }
    return labels[size] || size
  }

  const getWorkTypeLabel = (type) => {
    const labels = {
      onsite: '출근근무',
      remote: '재택근무',
      hybrid: '하이브리드',
      any: '상관없음'
    }
    return labels[type] || type
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      salary: '연봉',
      growth: '성장기회',
      work_life_balance: '워라밸',
      benefits: '복리후생',
      culture: '회사문화',
      stability: '안정성'
    }
    return labels[priority] || priority
  }

  const getTimelineLabel = (timeline) => {
    const labels = {
      immediate: '즉시',
      '3months': '3개월 내',
      '6months': '6개월 내', 
      '1year': '1년 내'
    }
    return labels[timeline] || timeline
  }

  const getInterestLabel = (interest) => {
    const labels = {
      market_trends: '시장 동향',
      salary_info: '연봉 정보',
      required_skills: '필요 스킬',
      interview_prep: '면접 준비'
    }
    return labels[interest] || interest
  }
  // 채팅 메시지 전송 (히스토리 포함)
  const sendChatMessage = async (message) => {
    try {
      console.log('API 호출 시작:', message)
      
      // 1. 사용자 메시지를 IndexedDB에 저장
      await dbService.saveMessage(user.value.sessionId, 'user', message)
      
      // 2. 현재 세션의 모든 메시지 히스토리 가져오기
      const messageHistory = await dbService.getMessagesForAPI(user.value.sessionId)
      console.log('메시지 히스토리:', messageHistory)
      
      // 3. 시스템 프롬프트 추가 (프로필이 있는 경우)
      const messages = []
      
      if (user.value.profile) {
        messages.push({
          role: 'system',
          content: createSystemPrompt(user.value.profile)
        })
      }
      
      messages.push(...messageHistory)
      
      // 4. API 호출 (시스템 프롬프트 + 히스토리 포함)
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages: messages
        })
      })

      console.log('API 응답 상태:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API 응답 데이터:', data)

      // 5. AI 응답을 추출
      const aiReply = data.reply || data.message || '응답을 받지 못했습니다.'
      
      // 6. AI 응답을 IndexedDB에 저장
      await dbService.saveMessage(user.value.sessionId, 'assistant', aiReply)
      
      // 7. 세션 정보 업데이트
      await dbService.updateSession(user.value.sessionId)
      
      return aiReply

    } catch (error) {
      console.error('API 호출 오류:', error)
      
      // 네트워크 오류 시 더 자세한 에러 메시지
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      } else if (error.message.includes('500')) {
        throw new Error('서버에 일시적인 문제가 발생했습니다.')
      } else if (error.message.includes('404')) {
        throw new Error('API 엔드포인트를 찾을 수 없습니다.')
      } else {
        throw new Error('API 호출 중 오류가 발생했습니다.')
      }
    }
  }

  // 현재 세션의 메시지 히스토리 로드
  const loadChatHistory = async () => {
    try {
      const messages = await dbService.getMessagesBySession(user.value.sessionId)
      console.log('채팅 히스토리 로드:', messages)
      return messages
    } catch (error) {
      console.error('채팅 히스토리 로드 실패:', error)
      return []
    }
  }

  // 새 채팅 세션 시작
  const startNewChatSession = () => {
    user.value.sessionId = generateSessionId()
    console.log('새 채팅 세션 시작:', user.value.sessionId)
  }

  // 특정 세션 삭제
  const deleteChatSession = async (sessionId) => {
    try {
      await dbService.deleteSession(sessionId)
      console.log('채팅 세션 삭제 완료:', sessionId)
    } catch (error) {
      console.error('채팅 세션 삭제 실패:', error)
      throw error
    }
  }

  // 모든 채팅 데이터 삭제
  const clearAllChatData = async () => {
    try {
      await dbService.clearAllData()
      console.log('모든 채팅 데이터 삭제 완료')
    } catch (error) {
      console.error('채팅 데이터 삭제 실패:', error)
      throw error
    }
  }

  // API 연결 상태 확인
  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'connection test' }
          ]
        })
      })
      
      isApiConnected.value = response.ok
      return response.ok
    } catch (error) {
      console.error('API 연결 확인 실패:', error)
      isApiConnected.value = false
      return false
    }
  }

  // ====== UTILITY FUNCTIONS ======

  // 세션 ID 생성
  function generateSessionId() {
    return 'chat_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 앱 초기화
  const initializeApp = async () => {
    console.log('Initializing Job-pt app...')
    
    // IndexedDB 초기화
    try {
      await dbService.init()
      console.log('IndexedDB 초기화 완료')
    } catch (error) {
      console.error('IndexedDB 초기화 실패:', error)
    }
    
    // localStorage에서 온보딩 상태 확인
    const completed = localStorage.getItem('job_analyzer_onboarding_completed')
    if (completed === 'true') {
      isOnboardingCompleted.value = true
    }

    // API 연결 상태 확인
    checkApiConnection()
    
    console.log('Job-pt initialization complete')
  }

  // 데이터 초기화 (개발/테스트용)
  const resetAllData = async () => {
    try {
      // IndexedDB 데이터 삭제
      await clearAllChatData()
      
      // 상태 초기화
      isOnboardingCompleted.value = false
      user.value = {
        id: 1,
        name: '사용자',
        sessionId: generateSessionId()
      }
      
      localStorage.removeItem('job_analyzer_onboarding_completed')
      
      console.log('Job-pt 데이터가 초기화되었습니다.')
    } catch (error) {
      console.error('데이터 초기화 실패:', error)
    }
  }

  // 앱 시작 시 초기화 실행
  initializeApp()

  // ====== RETURN ======
  return {
    // State
    isOnboardingCompleted,
    user,
    isApiConnected,
    customQuestions,
    
    // Actions
    setOnboardingCompleted,
    saveUserProfile,
    generateCustomQuestions,
    sendChatMessage,
    loadChatHistory,
    startNewChatSession,
    deleteChatSession,
    clearAllChatData,
    checkApiConnection,
    resetAllData
  }
})