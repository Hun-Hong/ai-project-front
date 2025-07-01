<template>
  <div id="app">
    <div class="app-container">
      <!-- 디버깅용 정보 표시 -->
      <div class="debug-info" style="position: fixed; top: 10px; left: 10px; background: black; color: white; padding: 10px; z-index: 9999; font-size: 12px;">
        <div>Current Screen: {{ currentScreen }}</div>
        <div>Onboarding Step: {{ onboardingStep }}</div>
        <div>Onboarding Completed: {{ appStore.isOnboardingCompleted }}</div>
      </div>

      <!-- 스플래시 화면 -->
      <div v-if="currentScreen === 'splash'" class="splash-screen">
        <div class="splash-content">
          <div class="splash-icon">🤖</div>
          <h1 class="splash-title">AI 챗봇</h1>
          <p class="splash-subtitle">Intelligent Assistant</p>
        </div>
        <div class="splash-loader">
          <div class="spinner"></div>
        </div>
      </div>
      
      <!-- 온보딩 화면 -->
      <div v-if="currentScreen === 'onboarding'" class="onboarding-screen">
        <div class="onboarding-content">
          <div class="onboarding-image">
            {{ onboardingData[onboardingStep - 1].icon }}
          </div>
          <h2 class="onboarding-title">
            {{ onboardingData[onboardingStep - 1].title }}
          </h2>
        </div>
        
        <div class="onboarding-indicators">
          <div 
            v-for="i in 3" 
            :key="i"
            class="indicator"
            :class="{ active: i === onboardingStep }"
          />
        </div>
        
        <div class="onboarding-actions">
          <button 
            class="btn btn-primary" 
            @click="handleOnboardingNext"
          >
            {{ onboardingStep === 3 ? 'AI와 대화 시작하기' : '다음' }}
          </button>
          <button 
            class="btn btn-secondary" 
            @click="handleOnboardingSkip"
          >
            건너뛰기
          </button>
        </div>
      </div>
      
      <!-- AI 챗봇 메인 화면 -->
      <div v-if="currentScreen === 'chatbot'" class="chatbot-main">
        <h1>AI 챗봇 메인 화면</h1>
        <p>성공적으로 로드되었습니다!</p>
        <button @click="resetApp">앱 리셋 (테스트용)</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const currentScreen = ref('splash')
const onboardingStep = ref(1)

// 온보딩 데이터
const onboardingData = [
  {
    icon: '🤖',
    title: 'AI 챗봇에 오신 것을 환영합니다!\n궁금한 것이 있으면 언제든 물어보세요'
  },
  {
    icon: '💬',
    title: '자연스러운 대화로\n정보를 찾고 업무를 처리하세요'
  },
  {
    icon: '⚡',
    title: 'AI가 24시간 대기하며\n빠르고 정확한 답변을 제공합니다'
  }
]

const handleOnboardingNext = () => {
  console.log('Next clicked, current step:', onboardingStep.value)
  if (onboardingStep.value < 3) {
    onboardingStep.value++
  } else {
    currentScreen.value = 'chatbot'
    appStore.setOnboardingCompleted(true)
    console.log('Moving to chatbot screen')
  }
}

const handleOnboardingSkip = () => {
  console.log('Skip clicked')
  currentScreen.value = 'chatbot'
  appStore.setOnboardingCompleted(true)
}

const resetApp = () => {
  appStore.resetAllData()
  currentScreen.value = 'splash'
  onboardingStep.value = 1
  
  setTimeout(() => {
    if (appStore.isOnboardingCompleted) {
      currentScreen.value = 'chatbot'
    } else {
      currentScreen.value = 'onboarding'
    }
  }, 2000)
}

onMounted(() => {
  console.log('App mounted')
  console.log('Current screen:', currentScreen.value)
  console.log('Onboarding completed:', appStore.isOnboardingCompleted)
  
  // 스플래시 화면을 2초 후 전환
  setTimeout(() => {
    console.log('Timeout triggered')
    if (appStore.isOnboardingCompleted) {
      console.log('Going to chatbot')
      currentScreen.value = 'chatbot'
    } else {
      console.log('Going to onboarding')
      currentScreen.value = 'onboarding'
    }
    console.log('New screen:', currentScreen.value)
  }, 2000)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans KR', sans-serif;
  background: #f5f7fa;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background: white;
  position: relative;
}

/* 스플래시 화면 */
.splash-screen {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #20b2aa, #17a2b8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  position: relative;
}

.splash-content {
  text-align: center;
  margin-bottom: 100px;
}

.splash-icon {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  margin: 0 auto 30px;
  backdrop-filter: blur(10px);
  animation: float 3s ease-in-out infinite;
}

.splash-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
}

.splash-subtitle {
  font-size: 16px;
  opacity: 0.8;
}

.splash-loader {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 온보딩 화면 */
.onboarding-screen {
  width: 100%;
  height: 100vh;
  background: #f8f9fa;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.onboarding-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.onboarding-image {
  width: 200px;
  height: 200px;
  background: #e9ecef;
  border-radius: 20px;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  animation: bounce 2s ease-in-out infinite;
}

.onboarding-title {
  font-size: 24px;
  font-weight: 700;
  color: #343a40;
  line-height: 1.4;
  margin-bottom: 40px;
  white-space: pre-line;
}

.onboarding-indicators {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dee2e6;
  transition: all 0.3s ease;
}

.indicator.active {
  background: #20b2aa;
  transform: scale(1.2);
}

.onboarding-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.btn {
  padding: 15px 30px;
  border-radius: 30px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-primary {
  background: #20b2aa;
  color: white;
}

.btn-primary:hover {
  background: #1a9d96;
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(32, 178, 170, 0.1);
  color: #20b2aa;
  border: 1px solid rgba(32, 178, 170, 0.3);
}

.btn-secondary:hover {
  background: rgba(32, 178, 170, 0.2);
}

/* 챗봇 메인 */
.chatbot-main {
  padding: 40px;
  text-align: center;
}

.chatbot-main h1 {
  color: #333;
  margin-bottom: 20px;
}

.chatbot-main button {
  background: #20b2aa;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
}

/* 애니메이션 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

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
</style>