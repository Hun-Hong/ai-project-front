<template>
  <div class="chatbot-main">
    <!-- 헤더 -->
    <header class="chatbot-header">
      <div class="header-content">
        <div class="brand">
          <div class="brand-icon">🎯</div>
          <div class="brand-info">
            <h1 class="brand-title">커리어 어드바이저</h1>
            <p class="brand-subtitle">당신의 커리어 성장을 도와드립니다</p>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="header-action-btn" @click="clearConversation" title="대화 초기화">
            <span>🗑️</span>
          </button>
          <button class="header-action-btn" @click="showHelp" title="도움말">
            <span>❓</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="chatbot-content">
      <div class="chat-container">
        <!-- 커리어 어드바이저 소개 영역 (대화가 없을 때만 표시) -->
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-avatar">🎯</div>
          <div class="welcome-message">
            <h2>커리어 전문가가 도와드립니다!</h2>
            <p>취업, 이직, 승진, 커리어 전환 등 모든 커리어 고민을 상담해드려요.</p>
          </div>
          
          <!-- 커리어 관련 제안 질문들 -->
          <div class="suggested-questions">
            <h3>이런 커리어 고민들을 해결해드릴 수 있어요:</h3>
            <div class="question-grid">
              <button 
                v-for="suggestion in careerSuggestions" 
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
                <span>{{ message.isUser ? '👤' : '🎯' }}</span>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{ message.isUser ? '상담자' : '커리어 어드바이저' }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="message-text" v-html="formatMessage(message.text)"></div>
                
                <!-- RAG 소스 정보 표시 (AI 메시지에만) -->
                <div v-if="!message.isUser && message.sources" class="message-sources">
                  <div class="sources-header">📚 참고 자료:</div>
                  <div class="sources-list">
                    <div v-for="source in message.sources" :key="source.id" class="source-item">
                      <span class="source-title">{{ source.title }}</span>
                      <span class="source-relevance">관련도: {{ source.relevance }}%</span>
                    </div>
                  </div>
                </div>
                
                <!-- AI 메시지에 액션 버튼 추가 -->
                <div v-if="!message.isUser" class="message-actions">
                  <button class="action-btn small" @click="copyMessage(message.text)" title="복사">
                    📋
                  </button>
                  <button class="action-btn small" @click="likeMessage(message.id)" title="도움됨">
                    👍
                  </button>
                  <button class="action-btn small" @click="reportMessage(message.id)" title="문제 신고">
                    🚨
                  </button>
                </div>
              </div>
            </div>

            <!-- 검색 및 응답 생성 인디케이터 -->
            <div v-if="isTyping" class="message-wrapper">
              <div class="message-avatar">
                <span>🎯</span>
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <div class="typing-status">
                    <div class="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span class="typing-text">{{ typingStatus }}</span>
                  </div>
                  <div class="rag-progress">
                    <div class="progress-step" :class="{ active: ragStep >= 1 }">
                      🔍 관련 자료 검색 중...
                    </div>
                    <div class="progress-step" :class="{ active: ragStep >= 2 }">
                      📊 정보 분석 중...
                    </div>
                    <div class="progress-step" :class="{ active: ragStep >= 3 }">
                      💬 맞춤 답변 생성 중...
                    </div>
                  </div>
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
            placeholder="커리어 관련 질문을 자유롭게 해보세요... (예: 데이터 분석가로 이직하려면 어떤 준비를 해야 하나요?)"
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
          <span class="input-hint">💡 팁: 구체적인 상황과 목표를 알려주시면 더 정확한 커리어 조언을 드릴 수 있어요</span>
        </div>
      </div>
    </footer>

    <!-- 도움말 모달 -->
    <div v-if="showHelpModal" class="modal-overlay" @click="showHelpModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>커리어 어드바이저 사용 가이드</h3>
          <button class="close-btn" @click="showHelpModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="help-section">
            <h4>💼 커리어 상담</h4>
            <p>취업, 이직, 승진, 커리어 전환 등 모든 커리어 고민을 상담받으세요.</p>
          </div>
          <div class="help-section">
            <h4>🔍 전문 지식 기반</h4>
            <p>업계 동향, 채용 정보, 스킬 요구사항 등 최신 정보를 바탕으로 조언해드립니다.</p>
          </div>
          <div class="help-section">
            <h4>📊 개인 맞춤형</h4>
            <p>당신의 경험, 목표, 상황에 맞는 구체적인 액션 플랜을 제시합니다.</p>
          </div>
          <div class="help-section">
            <h4>💡 질문 예시</h4>
            <ul>
              <li>"프론트엔드 개발자로 이직하려면 어떤 포트폴리오가 필요한가요?"</li>
              <li>"마케팅 직무에서 데이터 분석가로 전환할 수 있을까요?"</li>
              <li>"스타트업과 대기업 중 어디가 커리어에 유리할까요?"</li>
              <li>"5년차 개발자의 연봉 협상 전략을 알려주세요"</li>
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
const ragStep = ref(0)
const typingStatus = ref('')
const showHelpModal = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)

// 커리어 관련 제안 질문들
const careerSuggestions = ref([
  { id: 1, icon: '💼', text: '취업 준비 전략을 알려주세요' },
  { id: 2, icon: '🔄', text: '이직 시기와 방법에 대해 조언해주세요' },
  { id: 3, icon: '📈', text: '승진을 위한 역량 개발 방법은?' },
  { id: 4, icon: '🎯', text: '커리어 목표 설정과 로드맵 작성법' },
  { id: 5, icon: '💰', text: '연봉 협상 전략을 알려주세요' },
  { id: 6, icon: '🚀', text: '스타트업 vs 대기업 선택 기준' }
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
  
  // RAG 기반 AI 응답 생성
  generateCareerAdvice(userMessage)
}

const sendSuggestion = (suggestionText) => {
  newMessage.value = suggestionText
  sendMessage()
}

const generateCareerAdvice = async (userMessage) => {
  isTyping.value = true
  ragStep.value = 0
  
  // 1단계: 관련 자료 검색
  ragStep.value = 1
  typingStatus.value = '커리어 데이터베이스에서 관련 정보를 검색하고 있어요...'
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // 2단계: 정보 분석
  ragStep.value = 2
  typingStatus.value = '찾은 정보를 분석하고 있어요...'
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 3단계: 답변 생성
  ragStep.value = 3
  typingStatus.value = '맞춤형 커리어 조언을 생성하고 있어요...'
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // AI 응답 생성
  const { response, sources } = getCareerAdviceResponse(userMessage)
  
  const aiMsg = {
    id: Date.now(),
    text: response,
    isUser: false,
    timestamp: new Date(),
    sources: sources
  }
  
  messages.value.push(aiMsg)
  isTyping.value = false
  ragStep.value = 0
  
  await nextTick()
  scrollToBottom()
}

const getCareerAdviceResponse = (userMessage) => {
  // 커리어 관련 키워드 매칭 및 응답 생성
  const careerResponses = {
    '취업': {
      response: `**취업 준비 전략 가이드** 📋

🎯 **1단계: 목표 설정**
• 관심 분야와 직무 명확화
• 목표 회사 및 포지션 리스트업
• 현재 역량과 부족한 스킬 파악

📚 **2단계: 역량 강화**
• 직무 관련 필수 스킬 학습
• 포트폴리오 및 프로젝트 경험 쌓기
• 자격증 취득 (필요시)

📄 **3단계: 지원 서류 준비**
• 맞춤형 이력서 작성
• 자기소개서 스토리텔링
• 포트폴리오 정리

🤝 **4단계: 네트워킹**
• 업계 선배들과의 네트워킹
• 관련 커뮤니티 참여
• 멘토링 프로그램 활용

구체적인 직무나 업계가 있으시다면 더 세부적인 조언을 드릴 수 있어요!`,
      sources: [
        { id: 1, title: '2024 신입사원 채용 트렌드 보고서', relevance: 92 },
        { id: 2, title: '성공적인 취업 준비 가이드', relevance: 88 },
        { id: 3, title: '업계별 필수 역량 분석', relevance: 85 }
      ]
    },
    '이직': {
      response: `**이직 성공 전략** 🚀

⏰ **이직 타이밍**
• 현재 회사에서 최소 1년 이상 근무 후
• 업계 채용 시즌 고려 (주로 상반기)
• 개인 커리어 목표와 시장 상황 매칭

💼 **이직 준비 체크리스트**
• 이직 사유와 목표 명확화
• 현재 연봉 대비 희망 연봉 설정
• 업무 성과와 경험 정리
• 포트폴리오 및 경력기술서 업데이트

🔍 **회사 리서치**
• 목표 회사의 문화와 비전 파악
• 해당 포지션의 업무 내용과 요구사항 분석
• 연봉 수준과 복리후생 조사

📞 **면접 준비**
• 이직 사유 논리적 설명 준비
• 지원 회사에 기여할 수 있는 가치 어필
• 질문 리스트 준비

현재 어떤 직무에서 어떤 분야로 이직을 고려하고 계신가요?`,
      sources: [
        { id: 1, title: '이직 성공사례 분석 리포트', relevance: 94 },
        { id: 2, title: '업계별 이직 트렌드 2024', relevance: 89 },
        { id: 3, title: '연봉 협상 가이드라인', relevance: 82 }
      ]
    }
  }
  
  // 키워드 매칭
  for (const [keyword, data] of Object.entries(careerResponses)) {
    if (userMessage.includes(keyword)) {
      return data
    }
  }
  
  // 기본 커리어 조언 응답
  return {
    response: `커리어 상담에 오신 것을 환영합니다! 🎯

질문을 더 구체적으로 해주시면 정확한 조언을 드릴 수 있어요.

**예시 질문들:**
• "5년차 마케터인데 데이터 분석가로 전환하고 싶어요"
• "IT 스타트업과 대기업 중 어디가 좋을까요?"
• "프로덕트 매니저가 되려면 어떤 준비를 해야 하나요?"
• "현재 연봉이 적정한지 확인하고 싶어요"

**더 나은 조언을 위해 이런 정보를 알려주세요:**
📋 현재 직무와 경력
🎯 목표하는 직무나 방향
💭 구체적인 고민이나 상황
📍 희망하는 회사 규모나 업계

어떤 커리어 고민이 있으신지 자세히 말씀해주세요!`,
    sources: [
      { id: 1, title: '커리어 상담 가이드라인', relevance: 78 },
      { id: 2, title: '직무별 커리어 패스 분석', relevance: 75 },
      { id: 3, title: '커리어 전환 성공 사례', relevance: 72 }
    ]
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

const formatMessage = (text) => {
  // 마크다운 형식 지원
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/•/g, '&bull;')
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
  alert('피드백 감사합니다! 더 나은 커리어 조언을 위해 활용하겠습니다. 👍')
}

const reportMessage = (messageId) => {
  if (confirm('이 답변에 문제가 있나요? 피드백을 보내주시면 개선하겠습니다.')) {
    alert('신고가 접수되었습니다. 검토 후 개선하겠습니다.')
  }
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
  background: linear-gradient(135deg, #20b2aa 0%, #17a2b8 100%);
}

/* 헤더 */
.chatbot-header {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(32, 178, 170, 0.1);
  padding: 16px 30px;
  box-shadow: 0 1px 20px rgba(32, 178, 170, 0.08);
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
  color: #20b2aa;
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
  background: #20b2aa;
  color: white;
  border-color: #20b2aa;
}

.action-btn {
  background: rgba(106, 90, 205, 0.1);
  border: none;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.action-btn:hover {
  background: rgba(106, 90, 205, 0.2);
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

/* 제안 질문 */
.suggested-questions h3 {
  color: white;
  margin-bottom: 15px;
  font-size: 18px;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  max-width: 600px;
}

.suggestion-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
}

.suggestion-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.suggestion-icon {
  font-size: 18px;
}

.suggestion-text {
  font-weight: 500;
  color: #333;
  font-size: 14px;
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
  padding: 15px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  margin-bottom: 15px;
  backdrop-filter: blur(10px);
}

.message-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
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
  background: linear-gradient(45deg, #20b2aa, #17a2b8);
  color: white;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: linear-gradient(45deg, #ffa726, #ff7043);
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
}

.user-message .message-text {
  background: linear-gradient(45deg, #20b2aa, #17a2b8);
  color: white;
}

/* RAG 소스 정보 */
.message-sources {
  margin-top: 10px;
  background: #e8f4fd;
  border: 1px solid #bee5eb;
  border-radius: 10px;
  padding: 12px;
}

.sources-header {
  font-weight: 600;
  color: #0c5460;
  margin-bottom: 8px;
  font-size: 13px;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.source-title {
  color: #0c5460;
  font-weight: 500;
  flex: 1;
}

.source-relevance {
  color: #6c757d;
  font-size: 11px;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
}

.message-actions {
  display: flex;
  gap: 5px;
  margin-top: 8px;
}

/* 타이핑 인디케이터와 RAG 진행상황 */
.typing-indicator {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.typing-status {
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
  background: #20b2aa;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

.typing-text {
  color: #666;
  font-style: italic;
  font-weight: 500;
}

.rag-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #e9ecef;
  border-radius: 8px;
  color: #6c757d;
  font-size: 13px;
  transition: all 0.3s ease;
}

.progress-step.active {
  background: #d1ecf1;
  color: #0c5460;
  font-weight: 500;
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
  border: 2px solid #e9ecef;
  border-radius: 20px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  transition: border-color 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: #20b2aa;
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: linear-gradient(45deg, #20b2aa, #17a2b8);
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
  box-shadow: 0 5px 20px rgba(32, 178, 170, 0.4);
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
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: modalSlideUp 0.3s ease-out;
}

.modal-header {
  background: linear-gradient(45deg, #20b2aa, #17a2b8);
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
  margin-bottom: 8px;
  line-height: 1.5;
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
  
  .header-action-btn {
    padding: 6px;
    font-size: 14px;
    min-width: 32px;
    height: 32px;
  }
  
  .chatbot-content {
    padding: 10px;
  }
  
  .input-section {
    padding: 12px 15px;
  }
  
  .question-grid {
    grid-template-columns: 1fr;
    gap: 10px;
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
  
  .suggestion-btn {
    padding: 12px;
  }
  
  .suggestion-text {
    font-size: 13px;
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
  
  .header-action-btn {
    padding: 6px;
    font-size: 14px;
    min-width: 32px;
    height: 32px;
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
  
  .suggested-questions h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .message-input {
    font-size: 16px; /* iOS에서 줌 방지 */
  }
}
</style>