<template>
  <div class="splash-screen">
    <div class="splash-content">
      <div class="splash-icon">📋</div>
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
// 순수 UI 컴포넌트
</script>

<style scoped>
.splash-screen {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
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
  background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: moveBackground 20s linear infinite;
  opacity: 0.3;
}

.splash-content {
  text-align: center;
  margin-bottom: 80px;
  z-index: 2;
}

.splash-icon {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  margin: 0 auto 30px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: iconFloat 3s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.splash-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 1s ease-out 0.5s both;
}

.splash-subtitle {
  font-size: 18px;
  opacity: 0.9;
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
  color: #60a5fa;
  font-weight: 600;
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
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  opacity: 0.8;
  font-weight: 300;
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
  }
  50% { 
    transform: translateY(-15px);
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
    font-size: 50px;
    margin-bottom: 25px;
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
    font-size: 40px;
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