<template>
  <div class="job-analysis-main">
    <!-- 헤더 -->
    <header class="main-header">
      <div class="header-content">
        <div class="brand">
          <div class="brand-icon">📋</div>
          <div class="brand-info">
            <h1 class="brand-title">Job-pt</h1>
            <p class="brand-subtitle">AI 채용공고 분석 도우미</p>
          </div>
        </div>

        <div class="header-actions">
          <button class="header-action-btn" @click="clearHistory" title="대화 내용 지우기 (세션 유지)">
            <span>🗑️</span>
          </button>
          <button class="header-action-btn reset-btn" @click="resetToOnboarding" title="완전 초기화 (온보딩부터 다시 시작)">
            <span>🔄</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="chat-container">
        <!-- 환영 메시지 (대화가 없을 때만 표시) -->
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-avatar">📋</div>
          <div class="welcome-message">
            <h2>채용공고에 대해 무엇이든 물어보세요!</h2>
            <p>AI가 채용공고를 분석하고 궁금한 점을 답변해드립니다.</p>
          </div>

          <!-- 세션 정보 표시 -->
          <!-- <div class="session-info">
            <span class="session-id">세션: {{ shortSessionId }}</span>
          </div> -->

          <!-- 예시 질문들 -->
          <div class="example-questions">
            <h3>{{ questionTitle }}</h3>
            <div class="question-list">
              <button v-for="(question, index) in displayQuestions" :key="`question-${index}`" class="example-btn"
                :class="{ 'custom-question': hasCustomQuestions }" @click="sendExample(question)">
                {{ question }}
              </button>
            </div>

            <!-- 맞춤형 질문 안내 -->
            <div v-if="hasCustomQuestions" class="custom-note">
              <span class="note-icon">💡</span>
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
                <span>{{ message.isUser ? '👤' : '🤖' }}</span>
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
              </div>
            </div>

            <!-- 로딩 인디케이터 -->
            <div v-if="isLoading" class="message-wrapper">
              <div class="message-avatar">
                <span>🤖</span>
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
            <span v-if="isLoading">⏳</span>
            <span v-else>➤</span>
          </button>
        </div>

        <!-- 연결 상태 표시 -->
        <div v-if="!appStore.isApiConnected" class="connection-status">
          ⚠️ 서버 연결이 불안정합니다. 기본 기능만 사용 가능합니다.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()

// 반응형 데이터
const newMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const isLoadingQuestions = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)

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
    return '🎯 맞춤 추천 질문'
  }
  return '💬 예시 질문'
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
  startLoadingAnimation()

  try {
    let response

    if (appStore.isApiConnected) {
      response = await appStore.sendChatMessage(message)
    } else {
      await new Promise((r) => setTimeout(r, 1000))
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

  } catch (error) {
    messages.value.push({
      id: Date.now() + 1,
      text: `죄송합니다. ${error.message || '일시적인 오류가 발생했습니다.'} 잠시 후 다시 시도해주세요.`,
      isUser: false,
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    stopLoadingAnimation()
  }
}


const typeWriterEffect = (element, text, speed = 20) => {
  return new Promise((resolve) => {
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        element.innerHTML += text[i]
        i++
      } else {
        clearInterval(timer)
        resolve()
      }
    }, speed)
  })
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
  // 텍스트 영역 자동 크기 조정
  const textarea = event.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
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
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **굵은글씨**
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // *기울임*
    .replace(/`(.*?)`/g, '<code>$1</code>') // `코드`
    .replace(/^### (.*$)/gim, '<h3>$1</h3>') // ### 제목3
    .replace(/^## (.*$)/gim, '<h2>$1</h2>') // ## 제목2
    .replace(/^# (.*$)/gim, '<h1>$1</h1>') // # 제목1
    .replace(/^- (.*$)/gim, '<li>$1</li>') // - 리스트
    .replace(/\n/g, '<br>') // 줄바꿈
}


// 생명주기
onMounted(async () => {
  console.log('JobAnalysisMainScreen 마운트됨')
  console.log('사용자 ID:', appStore.user.userId)
  console.log('세션 ID:', appStore.user.sessionId)

  if (messageInput.value) {
    messageInput.value.focus()
  }

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
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

/* 헤더 */
.main-header {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  padding: 16px 30px;
  box-shadow: 0 1px 20px rgba(59, 130, 246, 0.08);
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
  font-size: 32px;
  color: #3b82f6;
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
  font-size: 16px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
}

.header-action-btn:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
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
  font-size: 50px;
  margin-bottom: 15px;
  animation: bounce 2s ease-in-out infinite;
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

.session-info {
  margin-bottom: 20px;
}

.session-id {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-family: monospace;
  backdrop-filter: blur(10px);
}

/* 예시 질문 */
.example-questions h3 {
  color: white;
  margin-bottom: 15px;
  font-size: 17px;
  font-weight: 600;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 500px;
  margin-bottom: 15px;
  max-height: 250px;
  overflow-y: auto;
}

.example-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 12px;
  padding: 12px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.example-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.example-btn.custom-question {
  background: linear-gradient(170deg, rgba(255, 255, 255, 0.95), rgba(96, 165, 250, 0.7));
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.example-btn.custom-question:hover {
  background: linear-gradient(135deg, white, rgba(96, 165, 250, 0.1));
  border-color: rgba(96, 165, 250, 0.5);
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
  font-size: 14px;
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
  font-size: 18px;
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  color: white;
  flex-shrink: 0;
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
  background: #3b82f6;
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
}

.message-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 5px 20px rgba(59, 130, 246, 0.4);
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
.question-list::-webkit-scrollbar,
.welcome-section::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track,
.question-list::-webkit-scrollbar-track,
.welcome-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb,
.question-list::-webkit-scrollbar-thumb,
.welcome-section::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.question-list::-webkit-scrollbar-thumb:hover,
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
    font-size: 28px;
  }

  .main-content {
    padding: 10px;
  }

  .input-section {
    padding: 12px 15px;
  }

  .question-list {
    gap: 8px;
    max-height: 200px;
  }

  .example-btn {
    padding: 10px 12px;
    font-size: 12px;
  }

  .welcome-message h2 {
    font-size: 20px;
  }

  .welcome-message p {
    font-size: 14px;
  }

  .welcome-avatar {
    font-size: 45px;
    margin-bottom: 12px;
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
    font-size: 40px;
  }

  .brand-icon {
    font-size: 24px;
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
    /* iOS에서 줌 방지 */
  }

  .header-actions {
    gap: 6px;
  }

  .header-action-btn {
    min-width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .question-list {
    max-height: 180px;
  }
}
</style>