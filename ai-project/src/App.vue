<template>
  <div id="app">
    <div class="app-container">
      <!-- 스플래시 화면 -->
      <SplashScreen v-if="currentScreen === 'splash'" />

      <!-- 온보딩 화면 -->
      <OnboardingScreen v-if="currentScreen === 'onboarding'" :step="onboardingStep" @next="handleOnboardingNext"
        @prev="handleOnboardingPrev" @skip="handleOnboardingSkip" @complete="handleOnboardingComplete" />

      <!-- Job-pt 메인 화면 -->
      <JobAnalysisMainScreen v-if="currentScreen === 'main'" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from './stores/app'
import SplashScreen from './components/SplashScreen.vue'
import OnboardingScreen from './components/OnboardingScreen.vue'
import JobAnalysisMainScreen from './components/JobAnalysisMainScreen.vue'

const appStore = useAppStore()
const currentScreen = ref('splash')
const onboardingStep = ref(1)

const handleOnboardingNext = (profileData) => {
  console.log('온보딩 다음 단계:', onboardingStep.value + 1, profileData)
  if (onboardingStep.value < 3) {
    onboardingStep.value++
  } else {
    // 3단계 완료 시 complete 이벤트로 처리
    handleOnboardingComplete(profileData)
  }
}

const handleOnboardingPrev = () => {
  console.log('온보딩 이전 단계:', onboardingStep.value - 1)
  if (onboardingStep.value > 1) {
    onboardingStep.value--
  }
}

const handleOnboardingComplete = async (profileData) => {
  console.log('온보딩 완료:', profileData)

  try {
    await appStore.saveUserProfile(profileData)
    await appStore.generateCustomQuestions(profileData)
    appStore.setOnboardingCompleted(true)
    currentScreen.value = 'main'
    console.log('온보딩 완료 처리 성공')
  } catch (error) {
    console.error('온보딩 완료 처리 실패:', error)
    appStore.setOnboardingCompleted(true)
    currentScreen.value = 'main'
  }
  // 여기서 isCompleting을 false로 변경하지 않음 (화면 전환되므로)
}

const handleOnboardingSkip = () => {
  console.log('온보딩 건너뛰기')
  appStore.setOnboardingCompleted(true)
  currentScreen.value = 'main'
}

onMounted(async () => {
  console.log('App 마운트됨')
  console.log('현재 화면:', currentScreen.value)

  // 앱 초기화가 완료될 때까지 대기
  await appStore.waitForInitialization()

  console.log('앱 초기화 완료, 온보딩 완료 상태:', appStore.isOnboardingCompleted)

  // 스플래시 화면을 2초 후 다음 단계로 전환
  setTimeout(() => {
    console.log('스플래시 타임아웃 발생')

    if (appStore.isOnboardingCompleted) {
      console.log('온보딩 이미 완료됨 -> 메인 화면으로')
      currentScreen.value = 'main'
    } else {
      console.log('온보딩 미완료 -> 온보딩 화면으로')
      currentScreen.value = 'onboarding'
      onboardingStep.value = 1 // 1단계부터 시작
    }

    console.log('변경된 화면:', currentScreen.value)
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
  background: #f0fdf4;
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
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
  }
}

@media (min-width: 1024px) {
  .app-container {
    max-width: 1400px;
  }
}
</style>