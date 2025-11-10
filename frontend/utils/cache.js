// Frontend cache utility using localStorage
class FrontendCache {
  constructor() {
    this.prefix = 'pos_cache_';
  }

  // Set cache with TTL (in milliseconds)
  set(key, value, ttl = 1800000) { // Default 30 minutes
    try {
      const cacheData = {
        value,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(cacheData)
      );
      
      console.log(`✅ Frontend Cache SET: ${key} (TTL: ${ttl / 1000}s)`);
      return true;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  // Get cache if not expired
  get(key) {
    try {
      const cached = localStorage.getItem(`${this.prefix}${key}`);
      
      if (!cached) {
        console.log(`❌ Frontend Cache MISS: ${key}`);
        return null;
      }

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > cacheData.ttl) {
        console.log(`⏰ Frontend Cache EXPIRED: ${key} (age: ${Math.round(age / 1000)}s)`);
        this.delete(key);
        return null;
      }

      console.log(`✅ Frontend Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`);
      return cacheData.value;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  // Check if cache exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Delete cache entry
  delete(key) {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
      console.log(`🗑️  Frontend Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      console.error('Error deleting cache:', error);
      return false;
    }
  }

  // Clear all cache with our prefix
  clear() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }

      keys.forEach(key => localStorage.removeItem(key));
      console.log(`🗑️  Frontend Cache CLEARED: ${keys.length} items`);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Get cache stats
  getStats() {
    const stats = {
      size: 0,
      keys: [],
      totalSize: 0
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          stats.size++;
          stats.keys.push(key.replace(this.prefix, ''));
          stats.totalSize += value.length;
        }
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return stats;
  }
}

// Export singleton instance
const frontendCache = new FrontendCache();
export default frontendCache;

