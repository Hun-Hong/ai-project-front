// src/services/indexedDB.js

class IndexedDBService {
  constructor() {
    this.dbName = 'JobPtDB'
    this.dbVersion = 2 // 버전을 올려서 스키마 재생성
    this.db = null
  }

  // DB 초기화
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('IndexedDB 열기 실패:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB 연결 성공')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('IndexedDB 스키마 업그레이드 중... 버전:', this.dbVersion)

        // 기존 테이블들 삭제 (스키마 변경 시)
        const existingStores = ['sessions', 'messages', 'profiles', 'customQuestions']
        existingStores.forEach(storeName => {
          if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName)
            console.log(`기존 ${storeName} 테이블 삭제`)
          }
        })

        // 채팅 세션 테이블
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
        sessionStore.createIndex('createdAt', 'createdAt', { unique: false })

        // 채팅 메시지 테이블
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
        messageStore.createIndex('sessionId', 'sessionId', { unique: false })
        messageStore.createIndex('timestamp', 'timestamp', { unique: false })

        // 사용자 프로필 테이블 (키 경로와 저장 구조 일치)
        const profileStore = db.createObjectStore('profiles', { keyPath: 'userId' })

        // 맞춤형 질문 테이블 (키 경로와 저장 구조 일치)
        const questionStore = db.createObjectStore('customQuestions', { keyPath: 'userId' })

        console.log('IndexedDB 스키마 업그레이드 완료')
      }
    })
  }

  // 트랜잭션 헬퍼
  getTransaction(storeNames, mode = 'readonly') {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.')
    }
    return this.db.transaction(storeNames, mode)
  }

  // 배열을 안전하게 저장하기 위한 데이터 변환
  prepareDataForStorage(data) {
    return JSON.parse(JSON.stringify(data))
  }

  // ====== 사용자 프로필 관련 (userId 기반) ======

  // 사용자 프로필 저장 (키 경로 일치하도록 수정)
  async saveUserProfile(userId, profile) {
    const transaction = this.getTransaction(['profiles'], 'readwrite')
    const store = transaction.objectStore('profiles')
    
    const safeProfile = this.prepareDataForStorage(profile)
    
    // 키 경로와 일치하도록 userId를 최상위에 배치
    const profileData = {
      userId: userId,  // 키 경로와 일치
      profile: safeProfile,
      savedAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const request = store.put(profileData)
      request.onsuccess = () => {
        console.log('프로필 저장 완료:', profileData)
        resolve(profileData)
      }
      request.onerror = () => {
        console.error('프로필 저장 실패:', request.error)
        reject(request.error)
      }
    })
  }

  // 사용자 프로필 조회
  async getUserProfile(userId) {
    const transaction = this.getTransaction(['profiles'], 'readonly')
    const store = transaction.objectStore('profiles')
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.profile : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 맞춤형 질문 저장 (키 경로 일치하도록 수정)
  async saveCustomQuestions(userId, questions) {
    const transaction = this.getTransaction(['customQuestions'], 'readwrite')
    const store = transaction.objectStore('customQuestions')
    
    // 키 경로와 일치하도록 userId를 최상위에 배치
    const questionData = {
      userId: userId,  // 키 경로와 일치
      questions: this.prepareDataForStorage(questions),
      savedAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const request = store.put(questionData)
      request.onsuccess = () => {
        console.log('맞춤형 질문 저장 완료:', questionData)
        resolve(questionData)
      }
      request.onerror = () => {
        console.error('맞춤형 질문 저장 실패:', request.error)
        reject(request.error)
      }
    })
  }

  // 맞춤형 질문 조회
  async getCustomQuestions(userId) {
    const transaction = this.getTransaction(['customQuestions'], 'readonly')
    const store = transaction.objectStore('customQuestions')
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.questions : [])
      }
      request.onerror = () => reject(request.error)
    })
  }

  // ====== 세션 관련 (sessionId 기반) ======

  // 세션 저장
  async saveSession(sessionId) {
    const transaction = this.getTransaction(['sessions'], 'readwrite')
    const store = transaction.objectStore('sessions')
    
    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const request = store.put(session)
      request.onsuccess = () => resolve(session)
      request.onerror = () => reject(request.error)
    })
  }

  // 세션 업데이트
  async updateSession(sessionId) {
    const transaction = this.getTransaction(['sessions'], 'readwrite')
    const store = transaction.objectStore('sessions')
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(sessionId)
      
      getRequest.onsuccess = () => {
        const session = getRequest.result
        if (session) {
          session.updatedAt = new Date().toISOString()
          const putRequest = store.put(session)
          putRequest.onsuccess = () => resolve(session)
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve(null)
        }
      }
      
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // ====== 메시지 관련 (sessionId 기반) ======

  // 메시지 저장
  async saveMessage(sessionId, role, content) {
    const transaction = this.getTransaction(['messages'], 'readwrite')
    const store = transaction.objectStore('messages')
    
    const message = {
      id: Date.now() + Math.random(),
      sessionId,
      role, // 'user' | 'assistant' | 'system'
      content,
      timestamp: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const request = store.add(message)
      request.onsuccess = () => {
        console.log('메시지 저장 완료:', message)
        resolve(message)
      }
      request.onerror = () => {
        console.error('메시지 저장 실패:', request.error)
        reject(request.error)
      }
    })
  }

  // 세션별 메시지 조회
  async getMessagesBySession(sessionId) {
    const transaction = this.getTransaction(['messages'], 'readonly')
    const store = transaction.objectStore('messages')
    const index = store.index('sessionId')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(sessionId)
      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        )
        resolve(messages)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // API 호출용 메시지 형태로 변환
  async getMessagesForAPI(sessionId) {
    const messages = await this.getMessagesBySession(sessionId)
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))
  }

  // 특정 세션의 메시지만 삭제 (세션은 유지)
  async clearSessionMessages(sessionId) {
    const transaction = this.getTransaction(['messages'], 'readwrite')
    const store = transaction.objectStore('messages')
    const index = store.index('sessionId')
    
    return new Promise((resolve, reject) => {
      const request = index.getAllKeys(sessionId)
      request.onsuccess = () => {
        const keys = request.result
        const deletePromises = keys.map(key => {
          return new Promise((res, rej) => {
            const deleteRequest = store.delete(key)
            deleteRequest.onsuccess = () => res()
            deleteRequest.onerror = () => rej(deleteRequest.error)
          })
        })
        
        Promise.all(deletePromises)
          .then(() => {
            console.log('세션 메시지 삭제 완료:', sessionId)
            resolve()
          })
          .catch(reject)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // ====== 삭제 관련 ======

  // 특정 세션 완전 삭제 (메시지 + 세션)
  async deleteSession(sessionId) {
    const transaction = this.getTransaction(['sessions', 'messages'], 'readwrite')
    
    try {
      // 세션 삭제
      const sessionStore = transaction.objectStore('sessions')
      await this.deleteFromStore(sessionStore, sessionId)
      
      // 관련 메시지들 삭제
      const messageStore = transaction.objectStore('messages')
      const messageIndex = messageStore.index('sessionId')
      await this.deleteByIndex(messageIndex, sessionId)
      
      console.log('세션 완전 삭제 완료:', sessionId)
    } catch (error) {
      console.error('세션 삭제 실패:', error)
      throw error
    }
  }

  // 모든 세션 삭제
  async clearAllSessions() {
    const transaction = this.getTransaction(['sessions'], 'readwrite')
    const store = transaction.objectStore('sessions')
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => {
        console.log('모든 세션 삭제 완료')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 모든 메시지 삭제
  async clearAllMessages() {
    const transaction = this.getTransaction(['messages'], 'readwrite')
    const store = transaction.objectStore('messages')
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => {
        console.log('모든 메시지 삭제 완료')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 모든 데이터 삭제 (프로필, 질문 포함)
  async clearAllData() {
    const transaction = this.getTransaction(['sessions', 'messages', 'profiles', 'customQuestions'], 'readwrite')
    
    const stores = ['sessions', 'messages', 'profiles', 'customQuestions']
    const clearPromises = stores.map(storeName => {
      const store = transaction.objectStore(storeName)
      return new Promise((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })

    return Promise.all(clearPromises)
  }

  // ====== 헬퍼 메서드 ======

  // 스토어에서 단일 아이템 삭제
  deleteFromStore(store, key) {
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 인덱스를 통한 다중 아이템 삭제
  deleteByIndex(index, key) {
    return new Promise((resolve, reject) => {
      const request = index.getAllKeys(key)
      request.onsuccess = () => {
        const keys = request.result
        const deletePromises = keys.map(k => 
          this.deleteFromStore(index.objectStore, k)
        )
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // DB 연결 종료
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
      console.log('IndexedDB 연결 종료')
    }
  }
}

// 싱글톤 인스턴스 export
const dbService = new IndexedDBService()
export default dbService