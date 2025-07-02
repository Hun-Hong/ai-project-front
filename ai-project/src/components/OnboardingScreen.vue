<template>
  <div class="onboarding-screen">
    <div class="onboarding-content">
      <!-- 진행 표시바 -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (step / 3) * 100 + '%' }"></div>
      </div>
      <div class="step-indicator">{{ step }} / 3</div>

      <!-- 1단계: 기본 정보 -->
      <div v-if="step === 1" class="step-content">
        <div class="step-icon">👋</div>
        <h2 class="step-title">안녕하세요!<br>간단한 정보를 알려주세요</h2>
        <p class="step-description">맞춤형 채용정보를 제공하기 위해 몇 가지 질문드릴게요</p>
        
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">현재 상태</label>
            <div class="option-grid">
              <button 
                v-for="status in statusOptions" 
                :key="status.value"
                class="option-btn"
                :class="{ active: userProfile.status === status.value }"
                @click="userProfile.status = status.value"
              >
                <span class="option-icon">{{ status.icon }}</span>
                <span class="option-text">{{ status.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">경력 수준</label>
            <div class="option-grid">
              <button 
                v-for="exp in experienceOptions" 
                :key="exp.value"
                class="option-btn"
                :class="{ active: userProfile.experience === exp.value }"
                @click="userProfile.experience = exp.value"
              >
                <span class="option-icon">{{ exp.icon }}</span>
                <span class="option-text">{{ exp.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">희망 직무</label>
            <div class="option-grid single-column">
              <button 
                v-for="pos in positionOptions" 
                :key="pos.value"
                class="option-btn"
                :class="{ active: userProfile.position === pos.value }"
                @click="userProfile.position = pos.value"
              >
                <span class="option-icon">{{ pos.icon }}</span>
                <span class="option-text">{{ pos.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2단계: 선호도 -->
      <div v-if="step === 2" class="step-content">
        <div class="step-icon">⚙️</div>
        <h2 class="step-title">선호하는 근무환경을<br>알려주세요</h2>
        <p class="step-description">더 정확한 맞춤 정보를 위해 필요해요</p>
        
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">선호 회사 규모</label>
            <div class="option-grid">
              <button 
                v-for="size in companySizeOptions" 
                :key="size.value"
                class="option-btn"
                :class="{ active: userProfile.companySize === size.value }"
                @click="userProfile.companySize = size.value"
              >
                <span class="option-icon">{{ size.icon }}</span>
                <span class="option-text">{{ size.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">선호 근무 형태</label>
            <div class="option-grid">
              <button 
                v-for="work in workTypeOptions" 
                :key="work.value"
                class="option-btn"
                :class="{ active: userProfile.workType === work.value }"
                @click="userProfile.workType = work.value"
              >
                <span class="option-icon">{{ work.icon }}</span>
                <span class="option-text">{{ work.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group" v-if="getTechStackOptions().length > 0">
            <label class="form-label">관심 기술 스택 (중복 선택 가능)</label>
            <div class="option-grid tech-grid">
              <button 
                v-for="tech in getTechStackOptions()" 
                :key="tech.value"
                class="option-btn tech-btn"
                :class="{ active: userProfile.techStack.includes(tech.value) }"
                @click="toggleTechStack(tech.value)"
              >
                <span class="option-text">{{ tech.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3단계: 목표 및 우선순위 -->
      <div v-if="step === 3" class="step-content">
        <div class="step-icon">🎯</div>
        <h2 class="step-title">목표와 우선순위를<br>설정해주세요</h2>
        <p class="step-description">맞춤형 조언을 위해 마지막 질문이에요</p>
        
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">이직/취업 목표 시기</label>
            <div class="option-grid">
              <button 
                v-for="time in timelineOptions" 
                :key="time.value"
                class="option-btn"
                :class="{ active: userProfile.timeline === time.value }"
                @click="userProfile.timeline = time.value"
              >
                <span class="option-icon">{{ time.icon }}</span>
                <span class="option-text">{{ time.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">중요하게 생각하는 요소 (2개까지 선택)</label>
            <div class="option-grid">
              <button 
                v-for="priority in priorityOptions" 
                :key="priority.value"
                class="option-btn"
                :class="{ active: userProfile.priorities.includes(priority.value) }"
                @click="togglePriority(priority.value)"
                :disabled="!userProfile.priorities.includes(priority.value) && userProfile.priorities.length >= 2"
              >
                <span class="option-icon">{{ priority.icon }}</span>
                <span class="option-text">{{ priority.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">현재 가장 궁금한 것</label>
            <div class="option-grid">
              <button 
                v-for="interest in interestOptions" 
                :key="interest.value"
                class="option-btn"
                :class="{ active: userProfile.mainInterest === interest.value }"
                @click="userProfile.mainInterest = interest.value"
              >
                <span class="option-icon">{{ interest.icon }}</span>
                <span class="option-text">{{ interest.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="onboarding-actions">
      <button 
        v-if="step > 1"
        class="btn btn-secondary" 
        @click="handlePrev"
      >
        이전
      </button>
      
      <button 
        class="btn btn-primary" 
        @click="handleNext"
        :disabled="!isStepValid()"
      >
        {{ step === 3 ? '맞춤 설정 완료' : '다음' }}
      </button>
      
      <button 
        class="btn btn-text" 
        @click="handleSkip"
      >
        건너뛰기
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  step: {
    type: Number,
    required: true,
    default: 1
  }
})

const emit = defineEmits(['next', 'prev', 'skip', 'complete'])

// 사용자 프로필 데이터
const userProfile = reactive({
  status: '',
  experience: '',
  position: '',
  companySize: '',
  workType: '',
  techStack: [],
  timeline: '',
  priorities: [],
  mainInterest: ''
})

// 옵션 데이터들
const statusOptions = [
  { value: 'job_seeking', label: '구직중', icon: '🔍' },
  { value: 'job_changing', label: '이직준비중', icon: '🔄' },
  { value: 'exploring', label: '정보수집 단계', icon: '📚' }
]

const experienceOptions = [
  { value: 'entry', label: '신입', icon: '🌱' },
  { value: '1-3years', label: '1-3년차', icon: '📈' },
  { value: '4-7years', label: '4-7년차', icon: '⭐' },
  { value: '8plus', label: '8년차 이상', icon: '👑' }
]

const positionOptions = [
  { value: 'frontend_developer', label: '프론트엔드 개발자', icon: '🎨' },
  { value: 'backend_developer', label: '백엔드 개발자', icon: '⚙️' },
  { value: 'fullstack_developer', label: '풀스택 개발자', icon: '🔧' },
  { value: 'mobile_developer', label: '모바일 개발자', icon: '📱' },
  { value: 'data_analyst', label: '데이터 분석가', icon: '📊' },
  { value: 'devops_engineer', label: 'DevOps 엔지니어', icon: '🔧' },
  { value: 'product_manager', label: '프로덕트 매니저', icon: '📋' },
  { value: 'designer', label: 'UI/UX 디자이너', icon: '🎨' },
  { value: 'marketer', label: '마케터', icon: '📢' },
  { value: 'other', label: '기타', icon: '💼' }
]

const companySizeOptions = [
  { value: 'startup', label: '스타트업 (1-50명)', icon: '🚀' },
  { value: 'small', label: '중소기업 (51-300명)', icon: '🏢' },
  { value: 'medium', label: '중견기업 (301-1000명)', icon: '🏬' },
  { value: 'large', label: '대기업 (1000명 이상)', icon: '🏛️' },
  { value: 'any', label: '상관없음', icon: '🤷' }
]

const workTypeOptions = [
  { value: 'onsite', label: '출근 근무', icon: '🏢' },
  { value: 'remote', label: '재택 근무', icon: '🏠' },
  { value: 'hybrid', label: '하이브리드', icon: '🔄' },
  { value: 'any', label: '상관없음', icon: '🤷' }
]

const timelineOptions = [
  { value: 'immediate', label: '즉시', icon: '⚡' },
  { value: '3months', label: '3개월 내', icon: '📅' },
  { value: '6months', label: '6개월 내', icon: '📆' },
  { value: '1year', label: '1년 내', icon: '🗓️' }
]

const priorityOptions = [
  { value: 'salary', label: '연봉', icon: '💰' },
  { value: 'growth', label: '성장기회', icon: '📈' },
  { value: 'work_life_balance', label: '워라밸', icon: '⚖️' },
  { value: 'benefits', label: '복리후생', icon: '🎁' },
  { value: 'culture', label: '회사문화', icon: '🤝' },
  { value: 'stability', label: '안정성', icon: '🛡️' }
]

const interestOptions = [
  { value: 'market_trends', label: '시장 동향', icon: '📊' },
  { value: 'salary_info', label: '연봉 정보', icon: '💵' },
  { value: 'required_skills', label: '필요 스킬', icon: '🎯' },
  { value: 'interview_prep', label: '면접 준비', icon: '🎤' }
]

// 직무별 기술스택 옵션
const techStackByPosition = {
  frontend_developer: [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'angular', label: 'Angular' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'nextjs', label: 'Next.js' },
    { value: 'css', label: 'CSS/SCSS' }
  ],
  backend_developer: [
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'spring', label: 'Spring' },
    { value: 'django', label: 'Django' },
    { value: 'fastapi', label: 'FastAPI' },
    { value: 'go', label: 'Go' }
  ],
  fullstack_developer: [
    { value: 'react', label: 'React' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'mongodb', label: 'MongoDB' },
    { value: 'postgresql', label: 'PostgreSQL' }
  ],
  mobile_developer: [
    { value: 'react_native', label: 'React Native' },
    { value: 'flutter', label: 'Flutter' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'ionic', label: 'Ionic' }
  ],
  data_analyst: [
    { value: 'python', label: 'Python' },
    { value: 'r', label: 'R' },
    { value: 'sql', label: 'SQL' },
    { value: 'tableau', label: 'Tableau' },
    { value: 'powerbi', label: 'Power BI' },
    { value: 'pandas', label: 'Pandas' }
  ]
}

// 메서드들
const getTechStackOptions = () => {
  return techStackByPosition[userProfile.position] || []
}

const toggleTechStack = (tech) => {
  const index = userProfile.techStack.indexOf(tech)
  if (index === -1) {
    if (userProfile.techStack.length < 5) { // 최대 5개까지
      userProfile.techStack.push(tech)
    }
  } else {
    userProfile.techStack.splice(index, 1)
  }
}

const togglePriority = (priority) => {
  const index = userProfile.priorities.indexOf(priority)
  if (index === -1) {
    if (userProfile.priorities.length < 2) {
      userProfile.priorities.push(priority)
    }
  } else {
    userProfile.priorities.splice(index, 1)
  }
}

const isStepValid = () => {
  switch (props.step) {
    case 1:
      return userProfile.status && userProfile.experience && userProfile.position
    case 2:
      return userProfile.companySize && userProfile.workType
    case 3:
      return userProfile.timeline && userProfile.priorities.length > 0 && userProfile.mainInterest
    default:
      return false
  }
}

const handleNext = () => {
  if (props.step === 3) {
    emit('complete', userProfile)
  } else {
    emit('next', userProfile)
  }
}

const handlePrev = () => {
  emit('prev')
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  color: white;
  overflow-y: auto;
}

/* 진행 표시 */
.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.step-indicator {
  text-align: center;
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 30px;
}

/* 메인 콘텐츠 */
.onboarding-content {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.step-content {
  text-align: center;
  animation: fadeInUp 0.5s ease-out;
}

.step-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.step-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 12px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.step-description {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 30px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}

/* 폼 섹션 */
.form-section {
  text-align: left;
}

.form-group {
  margin-bottom: 25px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: white;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.option-grid.single-column {
  grid-template-columns: 1fr;
}

.option-grid.tech-grid {
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.option-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 15px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.option-btn.active {
  background: rgba(255, 255, 255, 0.9);
  border-color: white;
  color: #3b82f6;
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.option-btn.tech-btn {
  flex-direction: row;
  justify-content: center;
  padding: 10px 15px;
}

.option-icon {
  font-size: 20px;
}

.option-text {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
}

/* 액션 버튼 */
.onboarding-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  margin: 20px auto 0;
  width: 100%;
}

.btn {
  padding: 14px 24px;
  border-radius: 25px;
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
}

.btn-primary:hover:not(:disabled) {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(255, 255, 255, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-text {
  background: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 12px 24px;
}

.btn-text:hover {
  color: white;
}

/* 애니메이션 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .onboarding-screen {
    padding: 15px;
  }
  
  .step-icon {
    font-size: 40px;
    margin-bottom: 15px;
  }
  
  .step-title {
    font-size: 20px;
  }
  
  .step-description {
    font-size: 14px;
  }
  
  .option-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .option-grid.tech-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
  
  .option-btn {
    padding: 12px 10px;
  }
  
  .option-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .step-title {
    font-size: 18px;
  }
  
  .option-btn {
    padding: 10px 8px;
  }
  
  .option-icon {
    font-size: 18px;
  }
  
  .btn {
    padding: 12px 20px;
    font-size: 15px;
  }
}
</style>