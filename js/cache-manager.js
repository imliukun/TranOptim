// TranOptim 缓存管理模块
class CacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.maxMemoryItems = 100;
        this.maxItemAge = 30 * 60 * 1000; // 30分钟
        this.dbName = 'TranOptimCache';
        this.dbVersion = 1;
        this.initIndexedDB();
        
        // 定期清理过期缓存
        setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000); // 5分钟检查一次
    }

    // 初始化IndexedDB
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.warn('IndexedDB初始化失败，仅使用内存缓存');
                this.db = null;
                resolve();
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB缓存已初始化');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建翻译缓存表
                if (!db.objectStoreNames.contains('translations')) {
                    const store = db.createObjectStore('translations', { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('service', 'service', { unique: false });
                }
            };
        });
    }

    // 生成缓存键
    generateKey(text, service, fromLang, toLang, operation = 'translate') {
        const content = `${operation}:${service}:${fromLang}:${toLang}:${text}`;
        return this.hashString(content);
    }

    // 简单的字符串哈希函数
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        return Math.abs(hash).toString(36);
    }

    // 从缓存获取翻译结果
    async getTranslation(text, service, fromLang, toLang, operation = 'translate') {
        const key = this.generateKey(text, service, fromLang, toLang, operation);
        
        // 先检查内存缓存
        const memoryResult = this.getFromMemoryCache(key);
        if (memoryResult) {
            console.log('从内存缓存命中:', key);
            return memoryResult;
        }
        
        // 再检查IndexedDB缓存
        const dbResult = await this.getFromIndexedDB(key);
        if (dbResult) {
            console.log('从IndexedDB缓存命中:', key);
            // 将结果添加到内存缓存
            this.setToMemoryCache(key, dbResult);
            return dbResult;
        }
        
        return null;
    }

    // 从内存缓存获取
    getFromMemoryCache(key) {
        const item = this.memoryCache.get(key);
        if (!item) return null;
        
        // 检查是否过期
        if (Date.now() - item.timestamp > this.maxItemAge) {
            this.memoryCache.delete(key);
            return null;
        }
        
        return item.data;
    }

    // 设置到内存缓存
    setToMemoryCache(key, data) {
        // 如果缓存已满，删除最旧的项
        if (this.memoryCache.size >= this.maxMemoryItems) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
        
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // 从IndexedDB获取
    async getFromIndexedDB(key) {
        if (!this.db) return null;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['translations'], 'readonly');
            const store = transaction.objectStore('translations');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const item = request.result;
                if (!item) {
                    resolve(null);
                    return;
                }
                
                // 检查是否过期
                if (Date.now() - item.timestamp > this.maxItemAge) {
                    // 异步删除过期项
                    this.deleteFromIndexedDB(key);
                    resolve(null);
                    return;
                }
                
                resolve(item.data);
            };
            
            request.onerror = () => {
                console.warn('从IndexedDB读取缓存失败');
                resolve(null);
            };
        });
    }

    // 保存翻译结果到缓存
    async saveTranslation(text, service, fromLang, toLang, result, operation = 'translate') {
        const key = this.generateKey(text, service, fromLang, toLang, operation);
        const timestamp = Date.now();
        
        const cacheItem = {
            key,
            data: result,
            timestamp,
            service,
            operation,
            textLength: text.length
        };
        
        // 保存到内存缓存
        this.setToMemoryCache(key, result);
        
        // 保存到IndexedDB
        await this.saveToIndexedDB(cacheItem);
        
        console.log('翻译结果已缓存:', key);
    }

    // 保存到IndexedDB
    async saveToIndexedDB(item) {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['translations'], 'readwrite');
            const store = transaction.objectStore('translations');
            const request = store.put(item);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                console.warn('保存到IndexedDB失败');
                resolve(false);
            };
        });
    }

    // 从IndexedDB删除
    async deleteFromIndexedDB(key) {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['translations'], 'readwrite');
            const store = transaction.objectStore('translations');
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    }

    // 清理过期缓存
    async cleanupExpiredCache() {
        console.log('开始清理过期缓存...');
        
        // 清理内存缓存
        const now = Date.now();
        for (const [key, item] of this.memoryCache.entries()) {
            if (now - item.timestamp > this.maxItemAge) {
                this.memoryCache.delete(key);
            }
        }
        
        // 清理IndexedDB缓存
        await this.cleanupIndexedDBCache();
        
        console.log('缓存清理完成');
    }

    // 清理IndexedDB中的过期缓存
    async cleanupIndexedDBCache() {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['translations'], 'readwrite');
            const store = transaction.objectStore('translations');
            const index = store.index('timestamp');
            const cutoffTime = Date.now() - this.maxItemAge;
            
            const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            
            request.onerror = () => resolve();
        });
    }

    // 获取缓存统计信息
    async getCacheStats() {
        const memoryStats = {
            size: this.memoryCache.size,
            maxSize: this.maxMemoryItems
        };
        
        const dbStats = await this.getIndexedDBStats();
        
        return {
            memory: memoryStats,
            indexedDB: dbStats,
            maxAge: this.maxItemAge / 1000 / 60 // 分钟
        };
    }

    // 获取IndexedDB统计信息
    async getIndexedDBStats() {
        if (!this.db) return { size: 0, totalSize: '0 KB' };
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['translations'], 'readonly');
            const store = transaction.objectStore('translations');
            const countRequest = store.count();
            
            countRequest.onsuccess = () => {
                // 估算大小（粗略计算）
                navigator.storage.estimate().then(estimate => {
                    resolve({
                        size: countRequest.result,
                        totalSize: this.formatBytes(estimate.usage || 0)
                    });
                }).catch(() => {
                    resolve({
                        size: countRequest.result,
                        totalSize: '未知'
                    });
                });
            };
            
            countRequest.onerror = () => {
                resolve({ size: 0, totalSize: '0 KB' });
            };
        });
    }

    // 格式化字节大小
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 清空所有缓存
    async clearAllCache() {
        // 清空内存缓存
        this.memoryCache.clear();
        
        // 清空IndexedDB缓存
        if (this.db) {
            return new Promise((resolve) => {
                const transaction = this.db.transaction(['translations'], 'readwrite');
                const store = transaction.objectStore('translations');
                const request = store.clear();
                
                request.onsuccess = () => {
                    console.log('所有缓存已清空');
                    resolve(true);
                };
                
                request.onerror = () => {
                    console.warn('清空IndexedDB缓存失败');
                    resolve(false);
                };
            });
        }
        
        console.log('所有缓存已清空');
        return true;
    }

    // 预热缓存 - 预加载常用翻译
    async warmupCache() {
        const commonPhrases = [
            { text: 'Hello', from: 'en', to: 'zh' },
            { text: 'Thank you', from: 'en', to: 'zh' },
            { text: '你好', from: 'zh', to: 'en' },
            { text: '谢谢', from: 'zh', to: 'en' }
        ];
        
        console.log('开始预热缓存...');
        
        // 这里可以添加预热逻辑
        // 暂时只记录日志
        console.log('缓存预热完成');
    }
}

// 创建全局缓存管理器实例
window.TranOptimCacheManager = new CacheManager();

// 导出缓存管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
} 