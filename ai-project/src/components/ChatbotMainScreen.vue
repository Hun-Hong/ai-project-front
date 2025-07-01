<template>
  <div class="chatbot-main">
    <!-- 헤더 -->
    <header class="chatbot-header">
      <div class="header-content">
        <div class="brand">
          <div class="brand-icon">🤖</div>
          <div class="brand-info">
            <h1 class="brand-title">AI 챗봇</h1>
            <p class="brand-subtitle">무엇이든 물어보세요!</p>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="action-btn" @click="clearConversation" title="대화 초기화">
            <span>🗑️</span>
          </button>
          <button class="action-btn" @click="showHelp" title="도움말">
            <span>❓</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="chatbot-content">
      <div class="chat-container">
        <!-- AI 소개 영역 (대화가 없을 때만 표시) -->
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-avatar">🤖</div>
          <div class="welcome-message">
            <h2>AI 어시스턴트입니다!</h2>
            <p>궁금한 점이나 도움이 필요한 일이 있으시면 언제든 말씀해주세요.</p>
          </div>
          
          <!-- 제안 질문들 -->
          <div class="suggested-questions">
            <h3>이런 것들을 도와드릴 수 있어요:</h3>
            <div class="question-grid">
              <button 
                v-for="suggestion in suggestions" 
                :key="suggestion.id"
                class="suggestion-btn"
                @click="sendSuggestion(suggestion.text)"
              >
                <span class="suggestion-icon">{{ suggestion.icon }}</span>
                <span class="suggestion-text">{{ suggestion.text }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 대화 영역 -->
        <div v-if="messages.length > 0" class="conversation-area">
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
                  <span class="message-sender">{{ message.isUser ? '사용자' : 'AI 어시스턴트' }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="message-text" v-html="formatMessage(message.text)"></div>
                
                <!-- AI 메시지에 액션 버튼 추가 -->
                <div v-if="!message.isUser" class="message-actions">
                  <button class="action-btn small" @click="copyMessage(message.text)" title="복사">
                    📋
                  </button>
                  <button class="action-btn small" @click="likeMessage(message.id)" title="좋아요">
                    👍
                  </button>
                </div>
              </div>
            </div>

            <!-- 타이핑 인디케이터 -->
            <div v-if="isTyping" class="message-wrapper">
              <div class="message-avatar">
                <span>🤖</span>
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span class="typing-text">AI가 답변을 생각하고 있어요...</span>
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
            placeholder="AI에게 질문하세요... (Shift + Enter로 줄바꿈)"
            rows="1"
            @keydown="handleKeydown"
            @input="handleInput"
            :disabled="isTyping"
          ></textarea>
          
          <button 
            class="send-btn"
            @click="sendMessage"
            :disabled="!newMessage.trim() || isTyping"
          >
            <span v-if="isTyping">⏳</span>
            <span v-else>➤</span>
          </button>
        </div>
        
        <div class="input-footer">
          <span class="input-hint">💡 팁: AI는 다양한 주제에 대해 도움을 드릴 수 있습니다</span>
        </div>
      </div>
    </footer>

    <!-- 도움말 모달 -->
    <div v-if="showHelpModal" class="modal-overlay" @click="showHelpModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>AI 챗봇 사용 가이드</h3>
          <button class="close-btn" @click="showHelpModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="help-section">
            <h4>💬 대화하기</h4>
            <p>자연스럽게 질문하시면 AI가 답변해드립니다.</p>
          </div>
          <div class="help-section">
            <h4>⌨️ 단축키</h4>
            <ul>
              <li><kbd>Enter</kbd>: 메시지 전송</li>
              <li><kbd>Shift + Enter</kbd>: 줄바꿈</li>
            </ul>
          </div>
          <div class="help-section">
            <h4>🎯 이런 질문이 가능해요</h4>
            <ul>
              <li>정보 검색 및 설명</li>
              <li>텍스트 작성 도움</li>
              <li>문제 해결 방법</li>
              <li>일반적인 질문과 답변</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()

// 반응형 데이터
const newMessage = ref('')
const messages = ref([])
const isTyping = ref(false)
const showHelpModal = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)

// 제안 질문들
const suggestions = ref([
  { id: 1, icon: '📊', text: '데이터 분석에 대해 알려주세요' },
  { id: 2, icon: '💡', text: '창의적인 아이디어가 필요해요' },
  { id: 3, icon: '📝', text: '글 작성을 도와주세요' },
  { id: 4, icon: '🔍', text: '정보를 찾아주세요' },
  { id: 5, icon: '🛠️', text: '문제 해결 방법을 알려주세요' },
  { id: 6, icon: '📚', text: '학습 자료를 추천해주세요' }
])

// 메서드들
const sendMessage = async () => {
  if (!newMessage.value.trim() || isTyping.value) return

  const userMessage = newMessage.value.trim()
  
  // 사용자 메시지 추가
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
  
  // AI 응답 시뮬레이션
  generateAIResponse(userMessage)
}

const sendSuggestion = (suggestionText) => {
  newMessage.value = suggestionText
  sendMessage()
}

const generateAIResponse = async (userMessage) => {
  isTyping.value = true
  
  // 1-3초 후 응답 생성
  setTimeout(async () => {
    const aiResponse = getAIResponse(userMessage)
    
    const aiMsg = {
      id: Date.now(),
      text: aiResponse,
      isUser: false,
      timestamp: new Date()
    }
    
    messages.value.push(aiMsg)
    isTyping.value = false
    
    await nextTick()
    scrollToBottom()
  }, 1000 + Math.random() * 2000)
}

const getAIResponse = (userMessage) => {
  // 간단한 AI 응답 시뮬레이션
  const responses = {
    '안녕': '안녕하세요! 저는 AI 어시스턴트입니다. 무엇을 도와드릴까요?',
    '데이터': '데이터 분석에 대해 궁금하시군요! 어떤 종류의 데이터 분석에 대해 알고 싶으신가요? 통계 분석, 시각화, 머신러닝 등 다양한 방법이 있습니다.',
    '아이디어': '창의적인 아이디어를 찾고 계시는군요! 구체적으로 어떤 분야의 아이디어가 필요하신지 알려주시면 더 맞춤형 제안을 드릴 수 있습니다.',
    '글': '글 작성을 도와드리겠습니다! 어떤 종류의 글을 작성하시려고 하나요? 보고서, 이메일, 블로그 포스트 등 목적에 맞는 조언을 드릴 수 있습니다.',
    '정보': '정보 검색을 도와드리겠습니다! 어떤 주제에 대한 정보가 필요하신가요? 구체적으로 알려주시면 더 정확한 정보를 제공할 수 있습니다.',
    '문제': '문제 해결을 도와드리겠습니다! 어떤 문제에 직면하고 계신지 구체적으로 설명해주시면 단계별 해결 방법을 제안해드릴게요.',
    '학습': '학습 자료 추천을 도와드리겠습니다! 어떤 분야를 공부하시려고 하나요? 프로그래밍, 디자인, 비즈니스 등 분야별로 적합한 자료를 추천해드릴 수 있습니다.'
  }
  
  // 키워드 매칭으로 응답 생성
  for (const [keyword, response] of Object.entries(responses)) {
    if (userMessage.includes(keyword)) {
      return response
    }
  }
  
  // 기본 응답
  const defaultResponses = [
    '흥미로운 질문이네요! 더 구체적으로 설명해주시면 더 도움이 될 답변을 드릴 수 있습니다.',
    '좋은 질문입니다. 이 주제에 대해 더 자세히 알아보시겠어요?',
    '네, 이해했습니다. 어떤 부분을 더 깊이 다뤄보면 좋을까요?',
    '도움이 되는 정보를 제공하고 싶습니다. 조금 더 구체적인 상황을 알려주실 수 있나요?'
  ]
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
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

const formatMessage = (text) => {
  // 간단한 마크다운 형식 지원
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

const clearConversation = () => {
  if (confirm('대화 내용을 모두 삭제하시겠습니까?')) {
    messages.value = []
  }
}

const showHelp = () => {
  showHelpModal.value = true
}

const copyMessage = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('메시지가 복사되었습니다!')
  } catch (err) {
    console.error('복사 실패:', err)
  }
}

const likeMessage = (messageId) => {
  // 좋아요 기능 (향후 확장 가능)
  alert('피드백 감사합니다! 👍')
}

// 생명주기
onMounted(() => {
  if (messageInput.value) {
    messageInput.value.focus()
  }
})
</script>

<style scoped>
.chatbot-main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 헤더 */
.chatbot-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 15px 30px;
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
  font-size: 40px;
  animation: float 3s ease-in-out infinite;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.brand-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  background: rgba(102, 126, 234, 0.1);
  border: none;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.action-btn.small {
  padding: 5px 8px;
  font-size: 14px;
}

/* 메인 콘텐츠 */
.chatbot-content {
  flex: 1;
  overflow: hidden;
  padding: 20px;
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
  padding: 40px;
}

.welcome-avatar {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 2s ease-in-out infinite;
}

.welcome-message h2 {
  color: white;
  font-size: 32px;
  margin-bottom: 10px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.welcome-message p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  margin-bottom: 40px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}

/* 제안 질문 */
.suggested-questions h3 {
  color: white;
  margin-bottom: 20px;
  font-size: 20px;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  max-width: 600px;
}

.suggestion-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.suggestion-btn:hover {
  background: white;
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.suggestion-icon {
  font-size: 20px;
}

.suggestion-text {
  font-weight: 500;
  color: #333;
}

/* 대화 영역 */
.conversation-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.message-wrapper {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.message-wrapper.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: linear-gradient(45deg, #ffeaa7, #fdcb6e);
}

.message-content {
  flex: 1;
  max-width: 70%;
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
  padding: 15px 20px;
  border-radius: 18px;
  line-height: 1.6;
  color: #333;
}

.user-message .message-text {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.message-actions {
  display: flex;
  gap: 5px;
  margin-top: 8px;
}

/* 타이핑 인디케이터 */
.typing-indicator {
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 18px;
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
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

.typing-text {
  color: #666;
  font-style: italic;
}

/* 입력 영역 */
.input-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
}

.input-container {
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  padding: 15px 20px;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.4;
  resize: none;
  transition: border-color 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-footer {
  margin-top: 10px;
  text-align: center;
}

.input-hint {
  color: #666;
  font-size: 14px;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: modalSlideUp 0.3s ease-out;
}

.modal-header {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.help-section {
  margin-bottom: 20px;
}

.help-section h4 {
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-section p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.help-section ul {
  color: #666;
  padding-left: 20px;
}

.help-section li {
  margin-bottom: 5px;
}

kbd {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
}

/* 애니메이션 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
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

@keyframes modalSlideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
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
  .chatbot-header {
    padding: 10px 20px;
  }
  
  .brand-title {
    font-size: 20px;
  }
  
  .chatbot-content {
    padding: 10px;
  }
  
  .input-section {
    padding: 15px 20px;
  }
  
  .question-grid {
    grid-template-columns: 1fr;
  }
  
  .welcome-message h2 {
    font-size: 24px;
  }
  
  .welcome-message p {
    font-size: 16px;
  }
  
  .message-content {
    max-width: 85%;
  }
}

@media (max-width: 480px) {
  .welcome-avatar {
    font-size: 60px;
  }
  
  .brand-icon {
    font-size: 30px;
  }
  
  .suggestion-btn {
    padding: 15px;
  }
}
</style>