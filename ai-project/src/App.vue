<template>
  <div id="app">
    <div class="app-container">
      <!-- 스플래시 화면 -->
      <SplashScreen v-if="currentScreen === 'splash'" />
      
      <!-- 온보딩 화면 -->
      <OnboardingScreen 
        v-if="currentScreen === 'onboarding'"
        :step="onboardingStep"
        @next="handleOnboardingNext"
        @skip="handleOnboardingSkip"
      />
      
      <!-- AI 챗봇 메인 화면 -->
      <ChatbotMainScreen v-if="currentScreen === 'chatbot'" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from './stores/app'
import SplashScreen from './components/SplashScreen.vue'
import OnboardingScreen from './components/OnboardingScreen.vue'
import ChatbotMainScreen from './components/ChatbotMainScreen.vue'

const appStore = useAppStore()
const currentScreen = ref('splash')
const onboardingStep = ref(1)

const handleOnboardingNext = () => {
  if (onboardingStep.value < 3) {
    onboardingStep.value++
  } else {
    currentScreen.value = 'chatbot'
    appStore.setOnboardingCompleted(true)
  }
}

const handleOnboardingSkip = () => {
  currentScreen.value = 'chatbot'
  appStore.setOnboardingCompleted(true)
}

onMounted(() => {
  console.log('App mounted, current screen:', currentScreen.value)
  console.log('Onboarding completed:', appStore.isOnboardingCompleted)
  
  // 스플래시 화면을 2초 후 온보딩으로 전환
  setTimeout(() => {
    console.log('Timeout triggered, checking onboarding status...')
    if (appStore.isOnboardingCompleted) {
      console.log('Onboarding completed, going to chatbot')
      currentScreen.value = 'chatbot'
    } else {
      console.log('Onboarding not completed, going to onboarding')
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
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f7fa;
  overflow-x: hidden;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background: white;
  position: relative;
}

/* 웹 반응형 디자인 */
@media (min-width: 768px) {
  .app-container {
    max-width: 1200px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
  }
}

@media (min-width: 1024px) {
  .app-container {
    max-width: 1400px;
  }
}
</style>