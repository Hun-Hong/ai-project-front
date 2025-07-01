<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>연락처</h2>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      
      <div class="search-section">
        <input 
          type="text" 
          class="search-input" 
          placeholder="연락처 검색..."
          v-model="searchQuery"
        >
      </div>
      
      <div class="contacts-list">
        <div 
          v-for="contact in filteredContacts" 
          :key="contact.id"
          class="contact-item"
          @click="selectContact(contact)"
        >
          <div class="contact-avatar">{{ contact.avatar }}</div>
          <div class="contact-info">
            <div class="contact-name">{{ contact.name }}</div>
            <div class="contact-phone">{{ contact.phone }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'

const emit = defineEmits(['close', 'select'])

const appStore = useAppStore()
const searchQuery = ref('')

const filteredContacts = computed(() => {
  if (!searchQuery.value) {
    return appStore.contacts
  }
  return appStore.contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    contact.phone.includes(searchQuery.value)
  )
})

const closeModal = () => {
  emit('close')
}

const selectContact = (contact) => {
  emit('select', contact)
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

.search-section {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.search-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #dee2e6;
  border-radius: 25px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #20b2aa;
}

.contacts-list {
  max-height: 400px;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f8f9fa;
  cursor: pointer;
  transition: background 0.3s ease;
}

.contact-item:hover {
  background: #f8f9fa;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 15px;
  background: linear-gradient(45deg, #20b2aa, #17a2b8);
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-weight: 600;
  color: #343a40;
  margin-bottom: 3px;
}

.contact-phone {
  font-size: 14px;
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