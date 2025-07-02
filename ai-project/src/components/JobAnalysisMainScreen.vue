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
          <button class="header-action-btn" @click="clearHistory" title="대화 기록 초기화">
            <span>🗑️</span>
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
          
          <!-- 예시 질문들 -->
          <div class="example-questions">
            <h3>예시 질문:</h3>
            <div class="question-list">
              <button 
                v-for="example in exampleQuestions" 
                :key="example"
                class="example-btn"
                @click="sendExample(example)"
              >
                {{ example }}
              </button>
            </div>
          </div>
        </div>

        <!-- 채팅 메시지 영역 -->
        <div v-if="messages.length > 0" class="messages-area">
          <div class="messages-container" ref="messagesContainer">
            <div 
              v-for="message in messages" 
              :key="message.id"
              class="message-wrapper"
              :class="{ 'user-message': message.isUser }"
            >
              <div class="message-avatar">
                <span>{{ message.isUser ? '👤' : '🤖' }}</span>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{ message.isUser ? '사용자' : 'Job-pt' }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="message-text">{{ message.text }}</div>
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
                  <span class="loading-text">AI가 답변을 생성하고 있습니다...</span>
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
          <textarea
            ref="messageInput"
            v-model="newMessage"
            class="message-input"
            placeholder="채용공고나 궁금한 내용을 입력해주세요..."
            rows="1"
            @keydown="handleKeydown"
            @input="handleInput"
            :disabled="isLoading"
          ></textarea>
          
          <button 
            class="send-btn"
            @click="sendMessage"
            :disabled="!newMessage.trim() || isLoading"
          >
            <span v-if="isLoading">⏳</span>
            <span v-else>➤</span>
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()

// 반응형 데이터
const newMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)

// 예시 질문들
const exampleQuestions = ref([
  'FASTAPI를 사용하는 최신 직무공고 알려주세요.',
  '신입 개발자 채용공고 추천해주세요.',
  '원격근무 가능한 직무를 찾고 있어요.',
  '마케팅 직무의 최신 트렌드는 무엇인가요?'
])

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
  
  // API 호출 (IndexedDB 저장 포함)
  await sendToAPI(userMessage)
}

const sendExample = (exampleText) => {
  newMessage.value = exampleText
  sendMessage()
}

const sendToAPI = async (message) => {
  isLoading.value = true
  
  try {
    // Store의 sendChatMessage 호출 (IndexedDB 저장 및 히스토리 전송 포함)
    const response = await appStore.sendChatMessage(message)
    
    // AI 응답 메시지를 UI에 추가
    const aiMsg = {
      id: Date.now() + 1,
      text: response,
      isUser: false,
      timestamp: new Date()
    }
    
    messages.value.push(aiMsg)
    
    await nextTick()
    scrollToBottom()
    
  } catch (error) {
    console.error('API 호출 오류:', error)
    
    // 에러 메시지 추가
    const errorMsg = {
      id: Date.now() + 1,
      text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      isUser: false,
      timestamp: new Date()
    }
    
    messages.value.push(errorMsg)
    
    await nextTick()
    scrollToBottom()
  } finally {
    isLoading.value = false
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

const clearHistory = async () => {
  if (confirm('모든 대화 기록을 삭제하시겠습니까?')) {
    try {
      // IndexedDB에서 현재 세션 삭제
      await appStore.deleteChatSession(appStore.user.sessionId)
      
      // UI 메시지 초기화
      messages.value = []
      
      // 새 세션 시작
      appStore.startNewChatSession()
      
      console.log('대화 기록이 삭제되었습니다.')
    } catch (error) {
      console.error('대화 기록 삭제 실패:', error)
      alert('대화 기록 삭제에 실패했습니다.')
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

// 생명주기
onMounted(async () => {
  if (messageInput.value) {
    messageInput.value.focus()
  }
  
  // 앱 로드 시 채팅 히스토리 복원
  await loadChatHistory()
})
</script>

<style scoped>
.job-analysis-main {
  display: flex;
  flex-direction: column;
  height: 100vh;
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
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 20px;
}

.welcome-avatar {
  font-size: 60px;
  margin-bottom: 15px;
  animation: bounce 2s ease-in-out infinite;
}

.welcome-message h2 {
  color: white;
  font-size: 24px;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.welcome-message p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  margin-bottom: 25px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}

/* 예시 질문 */
.example-questions h3 {
  color: white;
  margin-bottom: 15px;
  font-size: 18px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 500px;
}

.example-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 14px;
  color: #333;
}

.example-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 메시지 영역 */
.messages-area {
  height: 100%;
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

.user-message .message-text {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
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

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

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

/* 애니메이션 */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
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
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 스크롤바 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
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
    gap: 10px;
  }
  
  .example-btn {
    padding: 12px;
    font-size: 13px;
  }
  
  .welcome-message h2 {
    font-size: 20px;
  }
  
  .welcome-message p {
    font-size: 14px;
  }
  
  .welcome-avatar {
    font-size: 50px;
    margin-bottom: 12px;
  }
  
  .message-content {
    max-width: 85%;
  }
}

@media (max-width: 480px) {
  .welcome-avatar {
    font-size: 45px;
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
    padding: 15px;
  }
  
  .welcome-message h2 {
    font-size: 18px;
  }
  
  .welcome-message p {
    font-size: 13px;
    margin-bottom: 20px;
  }
  
  .message-input {
    font-size: 16px; /* iOS에서 줌 방지 */
  }
}
</style>