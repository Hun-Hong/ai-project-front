<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>설정</h2>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      
      <div class="settings-content">
        <div class="profile-section">
          <div class="profile-info">
            <div class="profile-avatar">{{ appStore.user.avatar }}</div>
            <div class="profile-details">
              <h3>{{ appStore.user.name }}</h3>
              <p>사용자 프로필</p>
            </div>
          </div>
        </div>

        <div class="settings-menu">
          <div class="settings-item" @click="editProfile">
            <div class="settings-icon">✏️</div>
            <div class="settings-text">프로필 편집</div>
            <div class="settings-arrow">→</div>
          </div>
          <div class="settings-item" @click="showNotificationSettings">
            <div class="settings-icon">🔔</div>
            <div class="settings-text">알림 설정</div>
            <div class="settings-arrow">→</div>
          </div>
          <div class="settings-item" @click="showThemeSettings">
            <div class="settings-icon">🎨</div>
            <div class="settings-text">테마 설정</div>
            <div class="settings-arrow">→</div>
          </div>
          <div class="settings-item" @click="showPrivacyPolicy">
            <div class="settings-icon">🔒</div>
            <div class="settings-text">개인정보처리방침</div>
            <div class="settings-arrow">→</div>
          </div>
          <div class="settings-item" @click="showTerms">
            <div class="settings-icon">📋</div>
            <div class="settings-text">이용약관</div>
            <div class="settings-arrow">→</div>
          </div>
          <div class="settings-item" @click="showAbout">
            <div class="settings-icon">ℹ️</div>
            <div class="settings-text">앱 정보</div>
            <div class="settings-arrow">→</div>
          </div>
        </div>

        <div class="app-info">
          <p>채팅봇 v1.0.0</p>
          <p>© 2024 ChatBot Inc.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'

const emit = defineEmits(['close'])

const appStore = useAppStore()

const closeModal = () => {
  emit('close')
}

const editProfile = () => {
  alert('프로필 편집 기능은 준비 중입니다.')
}

const showNotificationSettings = () => {
  alert('알림 설정 기능은 준비 중입니다.')
}

const showThemeSettings = () => {
  alert('테마 설정 기능은 준비 중입니다.')
}

const showPrivacyPolicy = () => {
  alert('개인정보처리방침을 확인합니다.')
}

const showTerms = () => {
  alert('이용약관을 확인합니다.')
}

const showAbout = () => {
  alert('채팅봇 앱 v1.0.0\n개발: Vue3 + Pinia\n문의: support@chatbot.com')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 350px;
  max-height: 80vh;
  overflow: hidden;
  animation: modalSlideUp 0.3s ease-out;
}

.modal-header {
  background: #20b2aa;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.settings-content {
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.profile-section {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #20b2aa, #17a2b8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.profile-details h3 {
  color: #343a40;
  margin: 0 0 5px 0;
  font-size: 18px;
}

.profile-details p {
  color: #6c757d;
  font-size: 14px;
  margin: 0;
}

.settings-menu {
  padding: 10px 0;
}

.settings-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.settings-item:hover {
  background: #f8f9fa;
}

.settings-icon {
  width: 24px;
  margin-right: 15px;
  font-size: 18px;
}

.settings-text {
  flex: 1;
  color: #343a40;
  font-weight: 500;
}

.settings-arrow {
  color: #adb5bd;
  font-size: 18px;
}

.app-info {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  text-align: center;
  background: #f8f9fa;
}

.app-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #6c757d;
}

@keyframes modalSlideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>