<template>
  <div class="job-analysis-main">
    <!-- 헤더 -->
    <header class="main-header">
      <div class="header-content">
        <div class="brand">
          <div class="brand-icon">
            <Clipboard />
          </div>
          <div class="brand-info">
            <h1 class="brand-title">Job-pt</h1>
            <p class="brand-subtitle">AI 채용공고 분석 도우미</p>
          </div>
        </div>

        <div class="header-actions">
          <button class="header-action-btn" @click="clearHistory" title="대화 내용 지우기 (세션 유지)">
            <Trash2 />
          </button>
          <button class="header-action-btn reset-btn" @click="resetToOnboarding" title="완전 초기화 (온보딩부터 다시 시작)">
            <RotateCcw />
          </button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="chat-container">
        <!-- 환영 메시지 (대화가 없을 때만 표시) -->
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-avatar">
            <Clipboard />
          </div>
          <div class="welcome-message">
            <h2>채용공고에 대해 무엇이든 물어보세요!</h2>
            <p>AI가 채용공고를 분석하고 궁금한 점을 답변해드립니다.</p>
          </div>

          <!-- 예시 질문들 -->
          <div class="example-questions">
            <h3>
              <Sparkles v-if="hasCustomQuestions" class="title-icon" />
              <MessageSquare v-else class="title-icon" />
              {{ questionTitle }}
            </h3>
            <div class="question-grid">
              <button v-for="(question, index) in displayQuestions" :key="`question-${index}`"
                class="example-btn custom-question" @click="sendExample(question)">
                {{ question }}
              </button>
            </div>

            <!-- 맞춤형 질문 안내 -->
            <div v-if="hasCustomQuestions" class="custom-note">
              <Lightbulb class="note-icon" />
              <span>온보딩 정보를 바탕으로 생성된 맞춤형 질문입니다</span>
            </div>

            <!-- 로딩 중일 때 -->
            <div v-if="isLoadingQuestions" class="loading-questions">
              <div class="loading-spinner"></div>
              <span>맞춤형 질문을 생성하고 있습니다...</span>
            </div>
          </div>
        </div>


        <!-- 채팅 메시지 영역 -->
        <div v-if="messages.length > 0" class="messages-area">
          <div class="messages-container" ref="messagesContainer">
            <div v-for="message in messages" :key="message.id" class="message-wrapper"
              :class="{ 'user-message': message.isUser }">
              <div class="message-avatar">
                <User v-if="message.isUser" />
                <Bot v-else />
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{ message.isUser ? '사용자' : 'Job-pt' }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="message-text" :data-message-id="message.id">
                  <template v-if="message.isTyping">
                    {{ message.partialText }}
                  </template>
                  <template v-else>
                    <div v-html="formatMarkdown(message.text)"></div>
                  </template>
                </div>

                <!-- AI 메시지에만 재요청 버튼 표시 (타이핑 완료 + 최신 메시지 + 새 메시지 입력 전) -->
                <div v-if="!message.isUser && !message.isTyping && isLatestAIMessage(message.id) && !hasNewUserInput"
                  class="message-actions">
                  <button class="retry-btn" @click="retryMessage(message.id)" :disabled="isLoading" title="답변 다시 받기">
                    <RotateCcw />
                    <span>다시 요청</span>
                  </button>
                </div>


              </div>
            </div>

            <!-- 로딩 인디케이터 -->
            <div v-if="isLoading && !messages[messages.length - 1]?.isTyping" class="message-wrapper">
              <div class="message-avatar">
                <Bot />
              </div>
              <div class="message-content">
                <div class="loading-indicator">
                  <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span class="loading-text">{{ currentLoadingText }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </main>

    <!-- 입력 영역 -->
    <footer class="input-section">
      <div class="input-container">
        <div class="input-wrapper">
          <textarea ref="messageInput" v-model="newMessage" class="message-input" placeholder="채용공고나 궁금한 내용을 입력해주세요..."
            rows="1" @keydown="handleKeydown" @input="handleInput" :disabled="isLoading"></textarea>

          <button class="send-btn" @click="sendMessage" :disabled="!newMessage.trim() || isLoading">
            <Clock v-if="isLoading" />
            <Send v-else />
          </button>
        </div>

        <!-- 연결 상태 표시 -->
        <div v-if="!appStore.isApiConnected" class="connection-status">
          <AlertTriangle />
          서버 연결이 불안정합니다. 기본 기능만 사용 가능합니다.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed, watch } from 'vue'
import { useAppStore } from '../stores/app'
import {
  Clipboard,
  Trash2,
  RotateCcw,
  User,
  Bot,
  Lightbulb,
  Send,
  Clock,
  AlertTriangle,
  Sparkles,      // 추가
  MessageSquare  // 추가

} from 'lucide-vue-next'

const appStore = useAppStore()



// 반응형 데이터
const newMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const isLoadingQuestions = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)
const hasNewUserInput = ref(false)

// 로딩 메시지들
const loadingMessages = ref([
  'AI가 답변을 생성하고 있습니다...',
  '채용공고를 분석하고 있습니다...',
  '최신 정보를 검색하고 있습니다...',
  '맞춤형 조언을 준비하고 있습니다...'
])
const currentLoadingIndex = ref(0)
const currentLoadingText = ref(loadingMessages.value[0])

// 기본 예시 질문들
const defaultQuestions = ref([
  'IT 분야 최신 채용 트렌드를 알려주세요',
  '신입 개발자 채용공고 추천해주세요',
  '원격근무 가능한 직무를 찾고 있어요',
  '연봉 협상은 어떻게 하는 것이 좋을까요?'
])

// Computed 속성들
watch(
  () => messages.value.some(m => m.isTyping),
  (isTyping) => {
    if (isTyping) {
      const interval = setInterval(() => {
        scrollToBottom()
        const stillTyping = messages.value.some(m => m.isTyping)
        if (!stillTyping) clearInterval(interval)
      }, 100)
    }
  }
)

const hasCustomQuestions = computed(() => {
  return appStore.customQuestions && appStore.customQuestions.length > 0
})

const displayQuestions = computed(() => {
  if (hasCustomQuestions.value) {
    return appStore.customQuestions
  }
  return defaultQuestions.value
})

const questionTitle = computed(() => {
  if (hasCustomQuestions.value) {
    return '맞춤 추천 질문'
  }
  return '예시 질문'
})

const shortSessionId = computed(() => {
  const sessionId = appStore.user.sessionId
  return sessionId.split('_').pop().substring(0, 6) + '...'
})

// 메서드들
const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return

  const userMessage = newMessage.value.trim()

  // 사용자 메시지를 UI에 즉시 추가
  const userMsg = {
    id: Date.now(),
    text: userMessage,
    isUser: true,
    timestamp: new Date()
  }

  messages.value.push(userMsg)
  newMessage.value = ''

  // 스크롤을 맨 아래로
  await nextTick()
  scrollToBottom()

  // API 호출
  await sendToAPI(userMessage)
}

const sendExample = (exampleText) => {
  newMessage.value = exampleText
  sendMessage()
}

const sendToAPI = async (message) => {
  isLoading.value = true
  hasNewUserInput.value = true
  startLoadingAnimation()

  try {
    let response

    if (appStore.isApiConnected) {
      response = await appStore.sendChatMessage(message)
    } else {
      await new Promise((r) => setTimeout(r, 20000))
      response = '현재 서버에 연결할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.'
    }

    const aiMsg = {
      id: Date.now() + 1,
      text: response,
      partialText: '', // 실제 출력 텍스트
      isUser: false,
      isTyping: true,
      timestamp: new Date()
    }

    messages.value.push(aiMsg)
    await nextTick()
    scrollToBottom()

    // 타이핑 효과 직접 적용 (HTML 태그 없이)
    for (let i = 0; i <= response.length; i++) {
      messages.value[messages.value.length - 1].partialText = response.slice(0, i)
      await new Promise(resolve => setTimeout(resolve, 15)) // 속도 조절
    }

    // 완료 처리
    messages.value[messages.value.length - 1].isTyping = false

    // AI 응답 완료 후 재요청 버튼 표시 가능 상태로 변경
    hasNewUserInput.value = false

  } catch (error) {
    // ... 에러 처리 ...

    // 에러 시에도 재요청 버튼 표시 가능 상태로 변경
    hasNewUserInput.value = false
  } finally {
    isLoading.value = false
    stopLoadingAnimation()
  }
}



// 로딩 애니메이션 관리
let loadingInterval = null

const startLoadingAnimation = () => {
  currentLoadingIndex.value = 0
  currentLoadingText.value = loadingMessages.value[0]

  loadingInterval = setInterval(() => {
    currentLoadingIndex.value = (currentLoadingIndex.value + 1) % loadingMessages.value.length
    currentLoadingText.value = loadingMessages.value[currentLoadingIndex.value]
  }, 2000)
}

const stopLoadingAnimation = () => {
  if (loadingInterval) {
    clearInterval(loadingInterval)
    loadingInterval = null
  }
}

// 맞춤형 질문 로드
const loadCustomQuestions = async () => {
  if (hasCustomQuestions.value) {
    console.log('이미 맞춤형 질문이 있습니다:', appStore.customQuestions)
    return
  }

  if (!appStore.user.profile) {
    console.log('사용자 프로필이 없어서 기본 질문을 사용합니다')
    return
  }

  try {
    isLoadingQuestions.value = true
    console.log('맞춤형 질문 생성 시도...')

    await appStore.generateCustomQuestions(appStore.user.profile)

    console.log('맞춤형 질문 로드 완료:', appStore.customQuestions)
  } catch (error) {
    console.error('맞춤형 질문 로드 실패:', error)
  } finally {
    isLoadingQuestions.value = false
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleInput = (event) => {
  const textarea = event.target

  // 높이 초기화
  textarea.style.height = 'auto'

  // 최대 높이 제한 (5줄 정도)
  const maxHeight = 120
  const newHeight = Math.min(textarea.scrollHeight, maxHeight)

  textarea.style.height = newHeight + 'px'

  // 스크롤이 생기지 않도록 추가 처리
  if (textarea.scrollHeight > maxHeight) {
    textarea.style.overflowY = 'auto'
  } else {
    textarea.style.overflowY = 'hidden'
  }
}

const autoScrollEnabled = ref(true)

const scrollToBottom = async () => {
  const container = messagesContainer.value
  if (!container || !autoScrollEnabled.value) return

  await nextTick()

  const maxAttempts = 10
  let attempts = 0

  const tryScroll = () => {
    const indicator = container.querySelector('.loading-indicator')
    if (indicator) {
      indicator.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (attempts < maxAttempts) {
      attempts++
      setTimeout(tryScroll, 50)
    } else {
      // fallback: 그냥 아래로 스크롤
      container.scrollTop = container.scrollHeight
    }
  }

  tryScroll()
}

const formatTime = (timestamp) => {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(timestamp))
}

// 대화 내용만 지우기 (세션 유지)
const clearHistory = async () => {
  if (confirm('현재 세션의 대화 내용을 삭제하시겠습니까?\n\n세션은 유지되고 대화 내용만 삭제됩니다.')) {
    try {
      // IndexedDB에서 현재 세션의 메시지만 삭제
      await appStore.clearCurrentChatHistory()

      // UI 메시지 초기화
      messages.value = []

      console.log('대화 내용이 삭제되었습니다.')
    } catch (error) {
      console.error('대화 내용 삭제 실패:', error)
      alert('대화 내용 삭제에 실패했습니다.')
    }
  }
}

// 완전 초기화 - 온보딩부터 다시 시작
const resetToOnboarding = async () => {
  if (confirm('모든 데이터를 삭제하고 온보딩부터 다시 시작하시겠습니까?\n\n프로필, 맞춤형 질문, 모든 대화 내용이 삭제됩니다.')) {
    try {
      console.log('완전 초기화 시작...')

      // Store의 완전 초기화 호출
      await appStore.resetAllData()

      console.log('완전 초기화 완료, 페이지 새로고침')

      // 페이지 새로고침으로 온보딩 화면으로 이동
      window.location.reload()

    } catch (error) {
      console.error('완전 초기화 실패:', error)
      alert('초기화에 실패했습니다.')
    }
  }
}



// 채팅 히스토리 로드
const loadChatHistory = async () => {
  try {
    const history = await appStore.loadChatHistory()

    // IndexedDB의 메시지를 UI 형태로 변환
    messages.value = history.map(msg => ({
      id: msg.id,
      text: msg.content,
      isUser: msg.role === 'user',
      timestamp: new Date(msg.timestamp)
    }))

    await nextTick()
    scrollToBottom()

    console.log('채팅 히스토리 로드 완료:', messages.value.length, '개 메시지')
  } catch (error) {
    console.error('채팅 히스토리 로드 실패:', error)
  }
}

const formatMarkdown = (text) => {
  // 1. 테이블 변환 먼저 처리
  let formatted = text
  
  // 마크다운 테이블을 HTML 테이블로 변환
  formatted = formatted.replace(/\|(.+)\|\n\|[-:\s\|]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
    // 헤더 처리
    const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell)
    const headerHtml = headerCells.map(cell => `<th>${cell}</th>`).join('')
    
    // 행 처리
    const rowsArray = rows.trim().split('\n').filter(row => row.trim())
    const rowsHtml = rowsArray.map(row => {
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell)
      return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    }).join('')
    
    return `<table class="markdown-table"><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`
  })

  // 2. 마크다운 링크 변환 [텍스트](URL)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>')

  // 3. 일반 URL을 링크로 변환 (http, https로 시작하는 URL)
  const urlRegex = /(?<!href="|src=")https?:\/\/[^\s<>"{}|\\^`[\]]+/g
  formatted = formatted.replace(urlRegex, (url) => {
    // URL에서 마지막 문장부호 제거 (마침표, 쉼표, 느낌표, 물음표)
    const cleanUrl = url.replace(/[.,!?]+$/, '')
    const punctuation = url.slice(cleanUrl.length)
    
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="markdown-link">${cleanUrl}</a>${punctuation}`
  })

  // 4. 나머지 마크다운 요소들 처리
  return formatted
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **굵은글씨**
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // *기울임*
    .replace(/`(.*?)`/g, '<code>$1</code>') // `코드`
    .replace(/^### (.*$)/gim, '<h3>$1</h3>') // ### 제목3
    .replace(/^## (.*$)/gim, '<h2>$1</h2>') // ## 제목2
    .replace(/^# (.*$)/gim, '<h1>$1</h1>') // # 제목1
    .replace(/^- (.*$)/gim, '<li>$1</li>') // - 리스트
    .replace(/\n/g, '<br>') // 줄바꿈
}

// 메시지 재요청 함수
const retryMessage = async (messageId) => {
  if (isLoading.value) return

  // 재요청 시작 시 버튼 숨김
  hasNewUserInput.value = true

  // 재요청할 메시지의 인덱스 찾기
  const messageIndex = messages.value.findIndex(msg => msg.id === messageId)
  if (messageIndex === -1) return

  // 해당 메시지 이전의 마지막 사용자 메시지 찾기
  let userMessage = ''
  for (let i = messageIndex - 1; i >= 0; i--) {
    if (messages.value[i].isUser) {
      userMessage = messages.value[i].text
      break
    }
  }

  if (!userMessage) {
    hasNewUserInput.value = false
    return
  }

  // 기존 AI 응답 메시지 제거
  messages.value.splice(messageIndex, 1)

  // 스크롤을 맨 아래로
  await nextTick()
  scrollToBottom()

  // API 재호출
  await sendToAPI(userMessage)
}

const isLatestAIMessage = (messageId) => {
  // 메시지 배열을 역순으로 순회하여 첫 번째 AI 메시지 찾기
  for (let i = messages.value.length - 1; i >= 0; i--) {
    const message = messages.value[i]
    if (!message.isUser && !message.isTyping) {
      return message.id === messageId
    }
  }
  return false
}


// 생명주기
onMounted(async () => {
  console.log('JobAnalysisMainScreen 마운트됨')
  console.log('사용자 ID:', appStore.user.userId)
  console.log('세션 ID:', appStore.user.sessionId)

  if (messageInput.value) {
    messageInput.value.focus()
  }

  const container = messagesContainer.value
  if (!container) return

  container.addEventListener('scroll', () => {
    const scrollPos = Math.floor(container.scrollTop + container.clientHeight)
    const scrollHeight = container.scrollHeight

    const nearBottom = scrollHeight - scrollPos < 20

    autoScrollEnabled.value = nearBottom
  })

  // 1. 채팅 히스토리 복원
  await loadChatHistory()

  // 2. 맞춤형 질문 로드
  await loadCustomQuestions()

  console.log('메인 화면 초기화 완료')
  console.log('맞춤형 질문 상태:', hasCustomQuestions.value)
  console.log('표시할 질문들:', displayQuestions.value)
})
</script>

<style scoped>
.job-analysis-main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: auto;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* 헤더 */
.main-header {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(16, 185, 129, 0.1);
  padding: 16px 30px;
  box-shadow: 0 1px 20px rgba(16, 185, 129, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 15px;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(45deg, #10b981, #059669);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.brand-icon svg {
  width: 24px;
  height: 24px;
}

.brand-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.brand-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-action-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
}

.header-action-btn svg {
  width: 18px;
  height: 18px;
}

.header-action-btn:hover {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.header-action-btn.reset-btn:hover {
  background: #dc2626;
  border-color: #dc2626;
}

/* 메인 콘텐츠 */
.main-content {
  flex: 1;
  overflow: hidden;
  padding: 15px;
  display: flex;
  justify-content: center;
}

.chat-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 환영 섹션 */
.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  min-height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
  padding: 20px;
  overflow-y: auto;
}

.welcome-avatar {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: bounce 2s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.welcome-avatar svg {
  width: 40px;
  height: 40px;
  color: white;
}

.welcome-message h2 {
  color: white;
  font-size: 22px;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.welcome-message p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  margin-bottom: 15px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}

/* 예시 질문 */
.example-questions {
  width: 100%;
  max-width: 500px;
}

.example-questions h3 {
  color: white;
  margin-bottom: 15px;
  font-size: 17px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.title-icon {
  width: 20px;
  height: 20px;
}

.question-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-width: 500px;
  margin-bottom: 15px;
}

.example-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 16px;
  padding: 18px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  min-height: 80px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.example-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.example-btn:hover::before {
  left: 100%;
}

.example-btn:hover {
  background: white;
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border-radius: 18px;
}

.example-btn.custom-question {
  background: linear-gradient(135deg, #ffffff 0%, #b1ffc9 100%);
  border: 2px solid rgba(16, 185, 129, 0.4);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
}

.example-btn.custom-question:hover {
  background: linear-gradient(135deg, #ffffff 0%, #b1ffc9 100%);
  border-color: rgba(16, 185, 129, 0.6);
  box-shadow: 0 12px 35px rgba(16, 185, 129, 0.25);
  transform: translateY(-4px);
}

.custom-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-style: italic;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.note-icon {
  width: 16px;
  height: 16px;
}

.loading-questions {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  padding: 15px;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 메시지 영역 */
.messages-area {
  min-height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  margin-bottom: 15px;
  backdrop-filter: blur(10px);
}

.message-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-wrapper.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  flex-shrink: 0;
}

.message-avatar svg {
  width: 20px;
  height: 20px;
}

.user-message .message-avatar {
  background: linear-gradient(45deg, #10b981, #059669);
}

.message-content {
  flex: 1;
  max-width: 75%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.message-sender {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-text {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 15px;
  line-height: 1.5;
  color: #333;
  word-wrap: break-word;
  font-size: 14px;
  white-space: pre-wrap;
}

.message-text.typing {
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  border-right: 2px solid #ccc;
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {

  0%,
  100% {
    border-color: transparent;
  }

  50% {
    border-color: #ccc;
  }
}

.user-message .message-text {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
}

/* 마크다운 스타일 */
.message-text h1,
.message-text h2,
.message-text h3 {
  margin: 10px 0 5px 0;
  font-weight: 600;
}

.message-text code {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 13px;
}

.message-text li {
  margin-left: 20px;
  list-style: disc;
}

.message-text strong {
  font-weight: 600;
}

.message-text em {
  font-style: italic;
}

/* 로딩 인디케이터 */
.loading-indicator {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-text {
  color: #666;
  font-style: italic;
  font-size: 14px;
}

/* 입력 영역 */
.input-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 15px 20px;
}

.input-container {
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  transition: border-color 0.3s ease;
  min-height: 44px;
  max-height: 120px;
  /* 최대 높이 제한 */
  overflow-y: hidden;
  /* 스크롤바 숨김 */
  overflow-x: hidden;
  /* 가로 스크롤도 숨김 */
}

/* 포커스 시에도 스크롤 숨김 */
.message-input:focus {
  outline: none;
  border-color: #10b981;
  overflow-y: hidden;
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: linear-gradient(45deg, #10b981, #059669);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 5px 20px rgba(16, 185, 129, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 연결 상태 */
.connection-status {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  color: #856404;
  font-size: 12px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.connection-status svg {
  width: 16px;
  height: 16px;
}

/* 애니메이션 */
@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-8px);
  }

  60% {
    transform: translateY(-4px);
  }
}

@keyframes typing {

  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 스크롤바 */
.messages-container::-webkit-scrollbar,
.question-grid::-webkit-scrollbar,
.welcome-section::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track,
.question-grid::-webkit-scrollbar-track,
.welcome-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb,
.question-grid::-webkit-scrollbar-thumb,
.welcome-section::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.question-grid::-webkit-scrollbar-thumb:hover,
.welcome-section::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-header {
    padding: 12px 20px;
  }

  .brand-title {
    font-size: 18px;
  }

  .brand-subtitle {
    font-size: 12px;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
  }

  .brand-icon svg {
    width: 20px;
    height: 20px;
  }

  .main-content {
    padding: 10px;
  }

  .input-section {
    padding: 12px 15px;
  }

  .question-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .example-btn {
    padding: 12px 10px;
    font-size: 12px;
    min-height: auto;
  }

  .welcome-message h2 {
    font-size: 20px;
  }

  .welcome-message p {
    font-size: 14px;
  }

  .welcome-avatar {
    width: 70px;
    height: 70px;
    margin-bottom: 12px;
  }

  .welcome-avatar svg {
    width: 35px;
    height: 35px;
  }

  .message-content {
    max-width: 85%;
  }

  .welcome-section {
    min-height: calc(100vh - 180px);
    max-height: calc(100vh - 180px);
    padding: 15px;
  }

  .messages-area {
    min-height: calc(100vh - 180px);
    max-height: calc(100vh - 180px);
  }
}

@media (max-width: 480px) {
  .welcome-avatar {
    width: 60px;
    height: 60px;
  }

  .welcome-avatar svg {
    width: 30px;
    height: 30px;
  }

  .brand-icon {
    width: 32px;
    height: 32px;
  }

  .brand-icon svg {
    width: 18px;
    height: 18px;
  }

  .brand-title {
    font-size: 16px;
  }

  .brand-subtitle {
    font-size: 11px;
  }

  .welcome-section {
    padding: 12px;
    min-height: calc(100vh - 160px);
    max-height: calc(100vh - 160px);
  }

  .messages-area {
    min-height: calc(100vh - 160px);
    max-height: calc(100vh - 160px);
  }

  .welcome-message h2 {
    font-size: 18px;
  }

  .welcome-message p {
    font-size: 13px;
    margin-bottom: 15px;
  }

  .message-input {
    font-size: 16px;
  }

  .header-actions {
    gap: 6px;
  }

  .header-action-btn {
    min-width: 32px;
    height: 32px;
  }

  .header-action-btn svg {
    width: 16px;
    height: 16px;
  }

  .question-grid {
    grid-template-columns: 1fr;
  }
}

/* 마크다운 테이블 스타일 */
.message-text .markdown-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 13px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-text .markdown-table th {
  background: #f8f9fa;
  color: #374151;
  font-weight: 600;
  padding: 12px 8px;
  text-align: left;
  border-bottom: 2px solid rgba(16, 185, 129, 0.3);
}

.message-text .markdown-table td {
  padding: 10px 8px;
  border-bottom: 1px solid rgba(16, 185, 129, 0.1);
  color: #374151;
}

.message-text .markdown-table tr:last-child td {
  border-bottom: none;
}

.message-text .markdown-table tr:nth-child(even) {
  background: #f9fafb;
}

.message-text .markdown-table tr:hover {
  background: #f0fdf4;
}

.user-message .message-text .markdown-table {
  background: rgba(255, 255, 255, 0.95);
}

.user-message .message-text .markdown-table th {
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
}

/* 메시지 액션 버튼 */
.message-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.retry-btn {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #10b981;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.retry-btn svg {
  width: 14px;
  height: 14px;
}

.retry-btn:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.5);
  transform: translateY(-1px);
}

.retry-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 사용자 메시지에는 액션 버튼 숨김 */
.user-message .message-actions {
  display: none;
}
</style>