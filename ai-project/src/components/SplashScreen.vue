<template>
  <div class="splash-screen">
    <div class="splash-content">
      <div class="splash-icon">
        <Clipboard />
      </div>
      <h1 class="splash-title">Job-pt</h1>
      <p class="splash-subtitle">잡피티</p>
      <div class="splash-tagline">
        <span class="highlight">채용 공고 분석과 요약을</span>
        <span>AI가 도와드립니다</span>
      </div>
    </div>
    <div class="splash-loader">
      <div class="spinner"></div>
      <p class="loading-text">채용 공고 분석 엔진 로딩 중...</p>
    </div>
  </div>
</template>


<script setup>
import { Clipboard } from 'lucide-vue-next'
</script>


<style scoped>
.splash-screen {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #ecfdf5 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #1f2937;
  position: relative;
  overflow: hidden;
}

/* 배경 애니메이션 효과 */
.splash-screen::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: moveBackground 20s linear infinite;
  opacity: 0.6;
}

.splash-content {
  text-align: center;
  margin-bottom: 80px;
  z-index: 2;
}

.splash-icon {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  animation: iconFloat 3s ease-in-out infinite;
  box-shadow: 0 15px 35px rgba(16, 185, 129, 0.3);
}

.splash-icon svg {
  width: 60px;
  height: 60px;
  color: white;
}

.splash-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
  color: #1f2937;
  animation: fadeInUp 1s ease-out 0.5s both;
}

.splash-subtitle {
  font-size: 18px;
  color: #6b7280;
  font-weight: 300;
  letter-spacing: 3px;
  margin-bottom: 20px;
  animation: fadeInUp 1s ease-out 0.7s both;
}

.splash-tagline {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 16px;
  line-height: 1.4;
  animation: fadeInUp 1s ease-out 0.9s both;
}

.highlight {
  color: #10b981;
  font-weight: 600;
}

.splash-tagline span:not(.highlight) {
  color: #6b7280;
}

.splash-loader {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  z-index: 2;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
  animation: pulse 2s ease-in-out infinite;
}

/* 애니메이션 정의 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes iconFloat {
  0%, 100% { 
    transform: translateY(0px);
    box-shadow: 0 15px 35px rgba(16, 185, 129, 0.3);
  }
  50% { 
    transform: translateY(-15px);
    box-shadow: 0 25px 45px rgba(16, 185, 129, 0.4);
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

@keyframes pulse {
  0%, 100% { 
    opacity: 0.8; 
  }
  50% { 
    opacity: 0.4; 
  }
}

@keyframes moveBackground {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .splash-icon {
    width: 100px;
    height: 100px;
    margin-bottom: 25px;
  }
  
  .splash-icon svg {
    width: 50px;
    height: 50px;
  }
  
  .splash-title {
    font-size: 28px;
  }
  
  .splash-subtitle {
    font-size: 16px;
    letter-spacing: 2px;
  }
  
  .splash-tagline {
    font-size: 14px;
  }
  
  .loading-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .splash-icon {
    width: 80px;
    height: 80px;
  }
  
  .splash-icon svg {
    width: 40px;
    height: 40px;
  }
  
  .splash-title {
    font-size: 24px;
  }
  
  .splash-subtitle {
    font-size: 14px;
  }
  
  .splash-content {
    margin-bottom: 60px;
  }
  
  .splash-loader {
    bottom: 60px;
  }
}
</style>