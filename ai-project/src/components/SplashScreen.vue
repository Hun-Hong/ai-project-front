<template>
  <div class="splash-screen">
    <div class="splash-content">
      <div class="splash-icon">🤖</div>
      <h1 class="splash-title">AI 챗봇</h1>
      <p class="splash-subtitle">Intelligent Assistant</p>
    </div>
    <div class="splash-loader">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
// script setup에서는 별도 로직이 필요 없음
// 순수 UI 컴포넌트
</script>

<style scoped>
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
  letter-spacing: -0.5px;
}

.splash-subtitle {
  font-size: 16px;
  opacity: 0.8;
  font-weight: 300;
  letter-spacing: 2px;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
</style>