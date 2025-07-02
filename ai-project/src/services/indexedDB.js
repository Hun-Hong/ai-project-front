// IndexedDB 서비스 클래스
class IndexedDBService {
  constructor() {
    this.dbName = 'JobPtChatDB'
    this.version = 1
    this.db = null
  }

  // 데이터베이스 초기화
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

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
        
        // messages 스토어 생성
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { 
            keyPath: 'id',
            autoIncrement: true 
          })
          
          // 인덱스 생성
          messagesStore.createIndex('sessionId', 'sessionId', { unique: false })
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false })
          messagesStore.createIndex('role', 'role', { unique: false })
        }

        // sessions 스토어 생성 (세션 관리용)
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { 
            keyPath: 'sessionId' 
          })
          sessionsStore.createIndex('createdAt', 'createdAt', { unique: false })
          sessionsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        console.log('IndexedDB 스키마 업그레이드 완료')
      }
    })
  }

  // 메시지 저장
  async saveMessage(sessionId, role, content) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite')
      const store = transaction.objectStore('messages')

      const message = {
        sessionId,
        role, // 'user' 또는 'assistant'
        content,
        timestamp: new Date().toISOString(),
        createdAt: Date.now()
      }

      const request = store.add(message)

      request.onsuccess = () => {
        console.log('메시지 저장 성공:', message)
        resolve({ ...message, id: request.result })
      }

      request.onerror = () => {
        console.error('메시지 저장 실패:', request.error)
        reject(request.error)
      }
    })
  }

  // 특정 세션의 모든 메시지 조회
  async getMessagesBySession(sessionId) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readonly')
      const store = transaction.objectStore('messages')
      const index = store.index('sessionId')

      const request = index.getAll(sessionId)

      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => a.createdAt - b.createdAt)
        console.log('메시지 조회 성공:', messages)
        resolve(messages)
      }

      request.onerror = () => {
        console.error('메시지 조회 실패:', request.error)
        reject(request.error)
      }
    })
  }

  // API 요청용 메시지 형태로 변환
  async getMessagesForAPI(sessionId) {
    const messages = await this.getMessagesBySession(sessionId)
    
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }

  // 세션 생성/업데이트
  async updateSession(sessionId, title = null) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readwrite')
      const store = transaction.objectStore('sessions')

      const session = {
        sessionId,
        title: title || `대화 ${new Date().toLocaleDateString()}`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }

      // 기존 세션이 있으면 업데이트, 없으면 생성
      const getRequest = store.get(sessionId)
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          // 기존 세션 업데이트
          session.createdAt = getRequest.result.createdAt
          session.title = title || getRequest.result.title
        }

        const putRequest = store.put(session)
        
        putRequest.onsuccess = () => {
          console.log('세션 업데이트 성공:', session)
          resolve(session)
        }

        putRequest.onerror = () => {
          console.error('세션 업데이트 실패:', putRequest.error)
          reject(putRequest.error)
        }
      }

      getRequest.onerror = () => {
        console.error('세션 조회 실패:', getRequest.error)
        reject(getRequest.error)
      }
    })
  }

  // 모든 세션 조회
  async getAllSessions() {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readonly')
      const store = transaction.objectStore('sessions')
      const index = store.index('updatedAt')

      const request = index.getAll()

      request.onsuccess = () => {
        const sessions = request.result
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        resolve(sessions)
      }

      request.onerror = () => {
        console.error('세션 목록 조회 실패:', request.error)
        reject(request.error)
      }
    })
  }

  // 특정 세션 삭제
  async deleteSession(sessionId) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages', 'sessions'], 'readwrite')
      
      // 세션의 모든 메시지 삭제
      const messagesStore = transaction.objectStore('messages')
      const messagesIndex = messagesStore.index('sessionId')
      const messagesRequest = messagesIndex.getAllKeys(sessionId)

      messagesRequest.onsuccess = () => {
        const messageKeys = messagesRequest.result
        messageKeys.forEach(key => {
          messagesStore.delete(key)
        })

        // 세션 삭제
        const sessionsStore = transaction.objectStore('sessions')
        sessionsStore.delete(sessionId)
      }

      transaction.oncomplete = () => {
        console.log('세션 삭제 완료:', sessionId)
        resolve()
      }

      transaction.onerror = () => {
        console.error('세션 삭제 실패:', transaction.error)
        reject(transaction.error)
      }
    })
  }

  // 전체 데이터 삭제 (개발/테스트용)
  async clearAllData() {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages', 'sessions'], 'readwrite')
      
      const messagesStore = transaction.objectStore('messages')
      const sessionsStore = transaction.objectStore('sessions')
      
      messagesStore.clear()
      sessionsStore.clear()

      transaction.oncomplete = () => {
        console.log('모든 데이터 삭제 완료')
        resolve()
      }

      transaction.onerror = () => {
        console.error('데이터 삭제 실패:', transaction.error)
        reject(transaction.error)
      }
    })
  }

  // 데이터베이스 연결 종료
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
      console.log('IndexedDB 연결 종료')
    }
  }
}

// 싱글톤 인스턴스 생성
const dbService = new IndexedDBService()

export default dbService