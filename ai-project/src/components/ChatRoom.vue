<template>
  <div class="chat-room">
    <!-- 채팅방 헤더 -->
    <div class="chat-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <div class="chat-info">
          <div class="chat-avatar">{{ chatData.avatar }}</div>
          <div class="chat-details">
            <h3 class="chat-name">{{ chatData.name }}</h3>
            <p class="chat-status">{{ isTyping ? '입력 중...' : '온라인' }}</p>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="makeCall">
          <span class="action-icon">📞</span>
        </button>
        <button class="action-btn" @click="showMenu">
          <span class="action-icon">⋮</span>
        </button>
      </div>
    </div>

    <!-- 메시지 목록 -->
    <div class="messages-container" ref="messagesContainer">
      <div class="messages-list">
        <!-- 날짜 구분선 -->
        <div class="date-divider">
          <span class="date-text">{{ formatDate(new Date()) }}</span>
        </div>

        <!-- 메시지들 -->
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-wrapper"
          :class="{ 'own-message': message.isOwn }"
        >
          <div class="message-bubble" :class="{ 'own': message.isOwn }">
            <div class="message-content">
              <p class="message-text">{{ message.text }}</p>
              <div v-if="message.image" class="message-image">
                <img :src="message.image" :alt="message.text" />
              </div>
            </div>
            <div class="message-meta">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <span v-if="message.isOwn" class="message-status" :class="message.status">
                {{ getStatusIcon(message.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 타이핑 인디케이터 -->
        <div v-if="isTyping" class="typing-indicator">
          <div class="typing-avatar">{{ chatData.avatar }}</div>
          <div class="typing-bubble">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 메시지 입력 영역 -->
    <div class="message-input-container">
      <div class="input-wrapper">
        <button class="attachment-btn" @click="showAttachmentMenu">
          <span class="attachment-icon">📎</span>
        </button>
        
        <div class="text-input-wrapper">
          <textarea
            ref="messageInput"
            v-model="newMessage"
            class="message-input"
            placeholder="메시지를 입력하세요..."
            rows="1"
            @keydown="handleKeydown"
            @input="handleInput"
            @focus="scrollToBottom"
          ></textarea>
          
          <button 
            v-if="newMessage.trim()" 
            class="send-btn"
            @click="sendMessage"
          >
            <span class="send-icon">📤</span>
          </button>
          
          <button 
            v-else 
            class="voice-btn"
            @click="recordVoice"
          >
            <span class="voice-icon">🎤</span>
          </button>
        </div>
      </div>
      
      <!-- 첨부파일 메뉴 -->
      <div v-if="showAttachments" class="attachment-menu">
        <button class="attachment-option" @click="selectPhoto">
          <span class="option-icon">📷</span>
          <span class="option-text">사진</span>
        </button>
        <button class="attachment-option" @click="selectFile">
          <span class="option-icon">📄</span>
          <span class="option-text">파일</span>
        </button>
        <button class="attachment-option" @click="selectLocation">
          <span class="option-icon">📍</span>
          <span class="option-text">위치</span>
        </button>
      </div>
    </div>

    <!-- 채팅방 메뉴 -->
    <div v-if="showChatMenu" class="chat-menu-overlay" @click="showChatMenu = false">
      <div class="chat-menu" @click.stop>
        <div class="menu-item" @click="viewProfile">
          <span class="menu-icon">👤</span>
          <span class="menu-text">프로필 보기</span>
        </div>
        <div class="menu-item" @click="searchMessages">
          <span class="menu-icon">🔍</span>
          <span class="menu-text">메시지 검색</span>
        </div>
        <div class="menu-item" @click="muteChat">
          <span class="menu-icon">🔕</span>
          <span class="menu-text">알림 끄기</span>
        </div>
        <div class="menu-item danger" @click="blockUser">
          <span class="menu-icon">🚫</span>
          <span class="menu-text">사용자 차단</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAppStore } from '../stores/app'

const props = defineProps({
  chatId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close'])

const appStore = useAppStore()

// 반응형 데이터
const newMessage = ref('')
const messages = ref([])
const isTyping = ref(false)
const showAttachments = ref(false)
const showChatMenu = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)

// 채팅 데이터
const chatData = computed(() => {
  return appStore.chatList.find(chat => chat.id === props.chatId) || {}
})

// 샘플 메시지 데이터
const initializeMessages = () => {
  const sampleMessages = [
    {
      id: 1,
      text: '안녕하세요! 잘 지내세요?',
      isOwn: false,
      timestamp: new Date(Date.now() - 3600000),
      status: 'read'
    },
    {
      id: 2,
      text: '네, 안녕하세요! 저도 잘 지내고 있어요. 오늘 날씨가 정말 좋네요 😊',
      isOwn: true,
      timestamp: new Date(Date.now() - 3300000),
      status: 'read'
    },
    {
      id: 3,
      text: '맞아요! 산책하기 딱 좋은 날씨예요',
      isOwn: false,
      timestamp: new Date(Date.now() - 3000000),
      status: 'read'
    },
    {
      id: 4,
      text: '혹시 이번 주말에 시간 있으시면 같이 카페 가실래요?',
      isOwn: true,
      timestamp: new Date(Date.now() - 2700000),
      status: 'delivered'
    },
    {
      id: 5,
      text: '좋아요! 어디로 갈까요?',
      isOwn: false,
      timestamp: new Date(Date.now() - 300000),
      status: 'read'
    }
  ]
  
  // Pinia 스토어에 메시지 초기화
  appStore.initializeChatMessages(props.chatId, sampleMessages)
  messages.value = sampleMessages
}

// 메서드들
const goBack = () => {
  emit('close')
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  const messageText = newMessage.value.trim()
  
  // Pinia 스토어에 메시지 추가
  const newMsg = appStore.addMessage(props.chatId, {
    text: messageText,
    isOwn: true,
    status: 'sending'
  })

  messages.value.push(newMsg)
  newMessage.value = ''
  
  // 스크롤을 맨 아래로
  await nextTick()
  scrollToBottom()

  // 메시지 상태 업데이트 시뮬레이션
  setTimeout(() => {
    appStore.updateMessageStatus(props.chatId, newMsg.id, 'sent')
    const msg = messages.value.find(m => m.id === newMsg.id)
    if (msg) msg.status = 'sent'
  }, 500)

  setTimeout(() => {
    appStore.updateMessageStatus(props.chatId, newMsg.id, 'delivered')
    const msg = messages.value.find(m => m.id === newMsg.id)
    if (msg) msg.status = 'delivered'
  }, 1000)

  setTimeout(() => {
    appStore.updateMessageStatus(props.chatId, newMsg.id, 'read')
    const msg = messages.value.find(m => m.id === newMsg.id)
    if (msg) msg.status = 'read'
  }, 2000)

  // 상대방 답장 시뮬레이션
  simulateReply()
}

const simulateReply = () => {
  const replies = [
    '네, 알겠습니다!',
    '좋은 생각이네요 👍',
    '그렇게 하죠!',
    '감사합니다 😊',
    '잘 알겠어요',
    '좋아요!',
    '그런가요? 흥미롭네요',
    '맞아요, 저도 그렇게 생각해요'
  ]

  // 타이핑 인디케이터 표시
  isTyping.value = true
  
  setTimeout(() => {
    isTyping.value = false
    
    const replyText = replies[Math.floor(Math.random() * replies.length)]
    
    // Pinia 스토어에 답장 메시지 추가
    const replyMsg = appStore.addMessage(props.chatId, {
      text: replyText,
      isOwn: false,
      status: 'read'
    })
    
    messages.value.push(replyMsg)
    nextTick(() => scrollToBottom())
  }, 1000 + Math.random() * 2000)
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
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
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

const formatDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(date)
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'sending': return '⏳'
    case 'sent': return '✓'
    case 'delivered': return '✓✓'
    case 'read': return '👁️'
    default: return ''
  }
}

const showAttachmentMenu = () => {
  showAttachments.value = !showAttachments.value
}

const showMenu = () => {
  showChatMenu.value = true
}

const makeCall = () => {
  alert(`${chatData.value.name}에게 전화를 겁니다.`)
}

const selectPhoto = () => {
  alert('사진을 선택합니다.')
  showAttachments.value = false
}

const selectFile = () => {
  alert('파일을 선택합니다.')
  showAttachments.value = false
}

const selectLocation = () => {
  alert('위치를 공유합니다.')
  showAttachments.value = false
}

const recordVoice = () => {
  alert('음성 메시지를 녹음합니다.')
}

const viewProfile = () => {
  alert(`${chatData.value.name}의 프로필을 봅니다.`)
  showChatMenu.value = false
}

const searchMessages = () => {
  alert('메시지를 검색합니다.')
  showChatMenu.value = false
}

const muteChat = () => {
  alert('채팅 알림을 끕니다.')
  showChatMenu.value = false
}

const blockUser = () => {
  if (confirm(`${chatData.value.name}을(를) 차단하시겠습니까?`)) {
    alert('사용자를 차단했습니다.')
    showChatMenu.value = false
  }
}

// 생명주기 훅
onMounted(() => {
  initializeMessages()
  nextTick(() => {
    scrollToBottom()
    if (messageInput.value) {
      messageInput.value.focus()
    }
  })
})

// 메시지가 추가될 때마다 스크롤
watch(messages, () => {
  nextTick(() => scrollToBottom())
}, { deep: true })
</script>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

/* 채팅방 헤더 */
.chat-header {
  background: #20b2aa;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.chat-details h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.chat-details p {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 메시지 컨테이너 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(to bottom, #e8f4f8, #f0f2f5);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-divider {
  text-align: center;
  margin: 20px 0;
}

.date-text {
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 12px;
}

/* 메시지 */
.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.message-wrapper.own-message {
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 70%;
  background: white;
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.message-bubble.own {
  background: #20b2aa;
  color: white;
}

.message-content {
  margin-bottom: 4px;
}

.message-text {
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-image img {
  max-width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  opacity: 0.7;
  margin-top: 4px;
}

.message-time {
  color: inherit;
}

.message-status {
  margin-left: 5px;
}

.message-status.read {
  color: #4fc3f7;
}

/* 타이핑 인디케이터 */
.typing-indicator {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin: 10px 0;
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: linear-gradient(45deg, #20b2aa, #17a2b8);
}

.typing-bubble {
  background: white;
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

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

/* 메시지 입력 영역 */
.message-input-container {
  background: white;
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  position: relative;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.attachment-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.3s ease;
  color: #666;
}

.attachment-btn:hover {
  background: #f0f0f0;
}

.text-input-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 8px 12px;
}

.message-input {
  flex: 1;
  border: none;
  background: none;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  max-height: 120px;
  min-height: 20px;
}

.send-btn,
.voice-btn {
  background: #20b2aa;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.send-btn:hover,
.voice-btn:hover {
  background: #1a9d96;
}

/* 첨부파일 메뉴 */
.attachment-menu {
  position: absolute;
  bottom: 100%;
  left: 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  padding: 10px;
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.attachment-option {
  background: none;
  border: none;
  cursor: pointer;
  padding: 15px;
  border-radius: 10px;
  transition: background 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 60px;
}

.attachment-option:hover {
  background: #f0f0f0;
}

.option-icon {
  font-size: 24px;
}

.option-text {
  font-size: 12px;
  color: #666;
}

/* 채팅방 메뉴 */
.chat-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-menu {
  background: white;
  border-radius: 15px;
  padding: 10px 0;
  min-width: 200px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  cursor: pointer;
  transition: background 0.3s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.menu-item:hover {
  background: #f0f0f0;
}

.menu-item.danger {
  color: #dc3545;
}

.menu-icon {
  font-size: 18px;
}

.menu-text {
  font-size: 14px;
}

/* 스크롤바 스타일 */
.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
</style>