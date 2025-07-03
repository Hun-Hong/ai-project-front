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
        <div class="step-icon">
          <Hand />
        </div>
        <h2 class="step-title">안녕하세요!<br>간단한 정보를 알려주세요</h2>
        <p class="step-description">맞춤형 채용정보를 제공하기 위해 몇 가지 질문드릴게요</p>

        <div class="form-section">
          <div class="form-group">
            <label class="form-label">현재 상태</label>
            <div class="option-grid">
              <button v-for="status in statusOptions" :key="status.value" class="option-btn"
                :class="{ active: userProfile.status === status.value }" @click="selectOption('status', status.value)">
                <component :is="getIconComponent(status.icon)" class="option-icon" />
                <span class="option-text">{{ status.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">경력 수준</label>
            <div class="option-grid">
              <button v-for="exp in experienceOptions" :key="exp.value" class="option-btn"
                :class="{ active: userProfile.experience === exp.value }"
                @click="selectOption('experience', exp.value)">
                <component :is="getIconComponent(exp.icon)" class="option-icon" />
                <span class="option-text">{{ exp.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">희망 직무</label>
            <div class="option-grid single-column">
              <button v-for="pos in positionOptions" :key="pos.value" class="option-btn"
                :class="{ active: userProfile.position === pos.value }" @click="selectOption('position', pos.value)">
                <component :is="getIconComponent(pos.icon)" class="option-icon" />
                <span class="option-text">{{ pos.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2단계: 선호도 -->
      <div v-if="step === 2" class="step-content">
        <div class="step-icon">
          <Settings />
        </div>
        <h2 class="step-title">선호하는 근무환경을<br>알려주세요</h2>
        <p class="step-description">더 정확한 맞춤 정보를 위해 필요해요</p>

        <div class="form-section">
          <div class="form-group">
            <label class="form-label">선호 회사 규모 (중복 선택 가능)</label>
            <div class="option-grid">
              <button v-for="size in companySizeOptions" :key="size.value" class="option-btn"
                :class="{ active: userProfile.companySize.includes(size.value) }"
                @click="toggleCompanySize(size.value)">
                <component :is="getIconComponent(size.icon)" class="option-icon" />
                <span class="option-text">{{ size.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">선호 근무 형태</label>
            <div class="option-grid">
              <button v-for="work in workTypeOptions" :key="work.value" class="option-btn"
                :class="{ active: userProfile.workType === work.value }" @click="selectOption('workType', work.value)">
                <component :is="getIconComponent(work.icon)" class="option-icon" />
                <span class="option-text">{{ work.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group" v-if="currentTechStackOptions.length > 0">
            <label class="form-label">관심 기술 스택 (중복 선택 가능)</label>
            <div class="option-grid tech-grid">
              <button v-for="tech in currentTechStackOptions" :key="tech.value" class="option-btn tech-btn"
                :class="{ active: userProfile.techStack.includes(tech.value) }" @click="toggleTechStack(tech.value)">
                <span class="option-text">{{ tech.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3단계: 목표 및 우선순위 -->
      <div v-if="step === 3" class="step-content">
        <div class="step-icon">
          <Target />
        </div>
        <h2 class="step-title">목표와 우선순위를<br>설정해주세요</h2>
        <p class="step-description">맞춤형 조언을 위해 마지막 질문이에요</p>

        <div class="form-section">
          <div class="form-group">
            <label class="form-label">중요하게 생각하는 요소 (2개까지 선택)</label>
            <div class="option-grid">
              <button v-for="priority in priorityOptions" :key="priority.value" class="option-btn"
                :class="{ active: userProfile.priorities.includes(priority.value) }"
                @click="togglePriority(priority.value)"
                :disabled="!userProfile.priorities.includes(priority.value) && userProfile.priorities.length >= 2">
                <component :is="getIconComponent(priority.icon)" class="option-icon" />
                <span class="option-text">{{ priority.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">현재 가장 궁금한 것</label>
            <div class="option-grid">
              <button v-for="interest in interestOptions" :key="interest.value" class="option-btn"
                :class="{ active: userProfile.mainInterest === interest.value }"
                @click="selectOption('mainInterest', interest.value)">
                <component :is="getIconComponent(interest.icon)" class="option-icon" />
                <span class="option-text">{{ interest.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="onboarding-actions">
      <button v-if="step > 1" class="btn btn-secondary" @click="handlePrev">
        이전
      </button>

      <button class="btn btn-primary" @click="handleNext" :disabled="!isStepValid() || isCompleting">
        <span v-if="isCompleting && step === 3" class="loading-content">
          <span class="btn-spinner"></span>
          설정 저장 중...
        </span>
        <span v-else>
          {{ step === 3 ? '맞춤 설정 완료' : '다음' }}
        </span>
      </button>

      <button class="btn btn-text" @click="handleSkip">
        건너뛰기
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import {
  Hand, Settings, Target, Search, RotateCcw, BookOpen,
  Sprout, TrendingUp, Star, Crown, Rocket, Building,
  Building2, Landmark, HelpCircle, Palette, Cog,
  Smartphone, BarChart3, Wrench, Clipboard,
  Home, Repeat, DollarSign, Gift, Handshake,
  Shield, PieChart, Banknote, Mic
} from 'lucide-vue-next'

const props = defineProps({
  step: {
    type: Number,
    required: true,
    default: 1
  }
})

const isCompleting = ref(false)
const emit = defineEmits(['next', 'prev', 'skip', 'complete'])

// 사용자 프로필 데이터
const userProfile = reactive({
  status: '',
  experience: '',
  position: '',
  companySize: [],
  workType: '',
  techStack: [],
  priorities: [],
  mainInterest: ''
})

// 옵션 데이터들
const statusOptions = [
  { value: 'job_seeking', label: '구직중', icon: 'Search' },
  { value: 'job_changing', label: '이직준비중', icon: 'RotateCcw' },
  { value: 'exploring', label: '정보수집 단계', icon: 'BookOpen' }
]

const experienceOptions = [
  { value: 'entry', label: '신입', icon: 'Sprout' },
  { value: '1-3years', label: '1-3년차', icon: 'TrendingUp' },
  { value: '4-7years', label: '4-7년차', icon: 'Star' },
  { value: '8plus', label: '8년차 이상', icon: 'Crown' }
]

const positionOptions = [
  { value: 'frontend_developer', label: '프론트엔드 개발자', icon: 'Palette' },
  { value: 'backend_developer', label: '백엔드 개발자', icon: 'Cog' },
  { value: 'fullstack_developer', label: '풀스택 개발자', icon: 'Wrench' },
  { value: 'mobile_developer', label: '모바일 개발자', icon: 'Smartphone' },
  { value: 'data_analyst', label: '데이터 분석가', icon: 'BarChart3' },
  { value: 'devops_engineer', label: 'DevOps 엔지니어', icon: 'Wrench' },
  { value: 'product_manager', label: '프로덕트 매니저', icon: 'Clipboard' },
  { value: 'designer', label: 'UI/UX 디자이너', icon: 'Palette' },
  { value: 'marketer', label: '마케터', icon: 'TrendingUp' },
  { value: 'other', label: '기타', icon: 'HelpCircle' }
]

const companySizeOptions = [
  { value: 'startup', label: '스타트업 (1-50명)', icon: 'Rocket' },
  { value: 'small', label: '중소기업 (51-300명)', icon: 'Building' },
  { value: 'medium', label: '중견기업 (301-1000명)', icon: 'Building2' },
  { value: 'large', label: '대기업 (1000명 이상)', icon: 'Landmark' },
  { value: 'any', label: '상관없음', icon: 'HelpCircle' }
]

const workTypeOptions = [
  { value: 'onsite', label: '출근 근무', icon: 'Building' },
  { value: 'remote', label: '재택 근무', icon: 'Home' },
  { value: 'hybrid', label: '하이브리드', icon: 'Repeat' },
  { value: 'any', label: '상관없음', icon: 'HelpCircle' }
]

const priorityOptions = [
  { value: 'salary', label: '연봉', icon: 'DollarSign' },
  { value: 'growth', label: '성장기회', icon: 'TrendingUp' },
  { value: 'work_life_balance', label: '워라밸', icon: 'Shield' },
  { value: 'benefits', label: '복리후생', icon: 'Gift' },
  { value: 'culture', label: '회사문화', icon: 'Handshake' },
  { value: 'stability', label: '안정성', icon: 'Shield' }
]

const interestOptions = [
  { value: 'market_trends', label: '시장 동향', icon: 'PieChart' },
  { value: 'salary_info', label: '연봉 정보', icon: 'Banknote' },
  { value: 'required_skills', label: '필요 스킬', icon: 'Target' },
  { value: 'interview_prep', label: '면접 준비', icon: 'Mic' }
]

// 아이콘 컴포넌트 매핑
const iconComponents = {
  Search, RotateCcw, BookOpen, Sprout, TrendingUp, Star, Crown,
  Palette, Cog, Wrench, Smartphone, BarChart3, Clipboard, HelpCircle,
  Rocket, Building, Building2, Landmark, Home, Repeat,
  DollarSign, Gift, Handshake, Shield, PieChart, Banknote, Target, Mic
}

// 아이콘 컴포넌트 반환 함수
const getIconComponent = (iconName) => {
  return iconComponents[iconName] || HelpCircle
}

// 나머지 메서드들 (동일)...
const selectOption = (field, value) => {
  userProfile[field] = value
  console.log(`${field} 선택됨:`, value)
}

const toggleCompanySize = (size) => {
  const index = userProfile.companySize.indexOf(size)
  if (index === -1) {
    if (userProfile.companySize.length < 3) {
      userProfile.companySize.push(size)
    }
  } else {
    userProfile.companySize.splice(index, 1)
  }
  console.log('회사 규모 업데이트:', userProfile.companySize)
}

const toggleTechStack = (tech) => {
  const index = userProfile.techStack.indexOf(tech)
  if (index === -1) {
    if (userProfile.techStack.length < 5) {
      userProfile.techStack.push(tech)
    }
  } else {
    userProfile.techStack.splice(index, 1)
  }
  console.log('기술스택 업데이트:', userProfile.techStack)
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
  console.log('우선순위 업데이트:', userProfile.priorities)
}

const isStepValid = () => {
  switch (props.step) {
    case 1:
      return userProfile.status && userProfile.experience && userProfile.position
    case 2:
      return userProfile.companySize.length > 0 && userProfile.workType
    case 3:
      return userProfile.priorities.length > 0 && userProfile.mainInterest
    default:
      return false
  }
}

const handleNext = async () => {
  console.log('다음 버튼 클릭, 현재 단계:', props.step)
  console.log('현재 프로필 데이터:', userProfile)

  if (props.step === 3) {
    isCompleting.value = true

    try {
      const profileData = {
        status: userProfile.status,
        experience: userProfile.experience,
        position: userProfile.position,
        companySize: [...userProfile.companySize],
        workType: userProfile.workType,
        techStack: [...userProfile.techStack],
        priorities: [...userProfile.priorities],
        mainInterest: userProfile.mainInterest
      }

      emit('complete', profileData)
    } catch (error) {
      console.error('완료 처리 중 오류:', error)
      isCompleting.value = false
    }
  } else {
    emit('next', { ...userProfile })
  }
}

const handlePrev = () => {
  console.log('이전 버튼 클릭')
  emit('prev')
}

const handleSkip = () => {
  console.log('건너뛰기 버튼 클릭')
  emit('skip')
}

// 기술스택 옵션
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

const currentTechStackOptions = computed(() => {
  return techStackByPosition[userProfile.position] || []
})
</script>

<style scoped>
.onboarding-screen {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #ecfdf5 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  color: #1f2937;
  overflow-y: auto;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
  border-radius: 3px;
}

.step-indicator {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 30px;
  font-weight: 500;
}

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
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
}

.step-icon svg {
  width: 40px;
  height: 40px;
  color: white;
}

.step-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 12px;
  color: #1f2937;
}

.step-description {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 30px;
}

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
  color: #374151;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.option-grid.single-column {
  grid-template-columns: 1fr;
}

.option-grid.tech-grid {
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.option-btn {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 15px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  color: #374151;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.option-btn:hover {
  background: #f9fafb;
  border-color: #10b981;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.option-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #059669;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  background: #f3f4f6;
  border-color: #d1d5db;
}

.option-btn.tech-btn {
  flex-direction: row;
  justify-content: center;
  padding: 10px 15px;
}

.option-icon {
  width: 24px;
  height: 24px;
}

.option-text {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
}

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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #10b981;
  color: #10b981;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
}

.btn-text {
  background: none;
  color: #6b7280;
  padding: 12px 24px;
}

.btn-text:hover {
  color: #374151;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

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
    width: 70px;
    height: 70px;
    margin-bottom: 15px;
  }

  .step-icon svg {
    width: 35px;
    height: 35px;
  }

  .step-title {
    font-size: 20px;
  }

  .step-description {
    font-size: 14px;
  }

  .option-grid {
    grid-template-columns: 1fr;
    gap: 10px;
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

  .option-icon {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 480px) {
  .step-icon {
    width: 60px;
    height: 60px;
  }

  .step-icon svg {
    width: 30px;
    height: 30px;
  }

  .step-title {
    font-size: 18px;
  }

  .step-description {
    font-size: 13px;
  }

  .option-btn {
    padding: 10px 8px;
  }

  .option-icon {
    width: 18px;
    height: 18px;
  }

  .option-text {
    font-size: 11px;
  }

  .btn {
    font-size: 14px;
    padding: 12px 20px;
  }
}
</style>