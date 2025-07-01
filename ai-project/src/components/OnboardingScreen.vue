<template>
  <div class="onboarding-screen">
    <div class="onboarding-content">
      <div class="onboarding-image">
        {{ onboardingData[step - 1].icon }}
      </div>
      <h2 class="onboarding-title">
        {{ onboardingData[step - 1].title }}
      </h2>
      <p class="onboarding-description">
        {{ onboardingData[step - 1].description }}
      </p>
    </div>
    
    <div class="onboarding-indicators">
      <div 
        v-for="i in 3" 
        :key="i"
        class="indicator"
        :class="{ active: i === step }"
      />
    </div>
    
    <div class="onboarding-actions">
      <button 
        class="btn btn-primary" 
        @click="handleNext"
      >
        {{ step === 3 ? '채용 공고 분석 시작하기' : '다음' }}
      </button>
      <button 
        class="btn btn-secondary" 
        @click="handleSkip"
      >
        건너뛰기
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  step: {
    type: Number,
    required: true,
    default: 1
  }
})

const emit = defineEmits(['next', 'skip'])

// Job-pt 온보딩 데이터
const onboardingData = [
  {
    icon: '📋',
    title: '복잡한 채용 공고를\n간단하게 요약해드려요',
    description: '길고 복잡한 채용 공고의 핵심 정보만 추출하여 직무, 자격요건, 우대사항, 복지 등을 한눈에 파악할 수 있습니다.'
  },
  {
    icon: '💬',
    title: '자연어로 질문하면\n정확한 답변을 받아보세요',
    description: '"경력 2년도 지원 가능한가요?", "하이브리드 근무인가요?" 같은 질문에 채용공고 내용을 기반으로 정확하게 답변해드립니다.'
  },
  {
    icon: '⚖️',
    title: '여러 채용공고를\n쉽게 비교해보세요',
    description: '관심있는 여러 포지션의 조건, 복지, 요구사항을 한번에 비교하여 최적의 선택을 할 수 있도록 도와드립니다.'
  }
]

const handleNext = () => {
  emit('next')
}

const handleSkip = () => {
  emit('skip')
}
</script>

<style scoped>
.onboarding-screen {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}

.onboarding-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.onboarding-image {
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: float 3s ease-in-out infinite;
}

.onboarding-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  line-height: 1.3;
  margin-bottom: 20px;
  white-space: pre-line;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.onboarding-description {
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  max-width: 400px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}

.onboarding-indicators {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 40px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.indicator.active {
  background: white;
  transform: scale(1.3);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
}

.onboarding-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.btn {
  padding: 16px 32px;
  border-radius: 30px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-primary {
  background: white;
  color: #3b82f6;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(255, 255, 255, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

/* 애니메이션 */
@keyframes float {
  0%, 100% { 
    transform: translateY(0px);
  }
  50% { 
    transform: translateY(-15px);
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .onboarding-screen {
    padding: 30px 20px;
  }
  
  .onboarding-image {
    width: 160px;
    height: 160px;
    font-size: 64px;
    margin-bottom: 30px;
  }
  
  .onboarding-title {
    font-size: 24px;
    margin-bottom: 16px;
  }
  
  .onboarding-description {
    font-size: 15px;
  }
  
  .onboarding-actions {
    margin-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .onboarding-screen {
    padding: 20px 15px;
  }
  
  .onboarding-image {
    width: 140px;
    height: 140px;
    font-size: 56px;
    margin-bottom: 25px;
  }
  
  .onboarding-title {
    font-size: 22px;
  }
  
  .onboarding-description {
    font-size: 14px;
  }
  
  .btn {
    padding: 14px 28px;
    font-size: 15px;
  }
}
</style>