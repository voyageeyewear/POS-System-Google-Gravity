// Simple in-memory cache with TTL (Time To Live)
class Cache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Set cache with TTL (in milliseconds)
  set(key, value, ttl = 3600000) { // Default 1 hour
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the cache
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);

    console.log(`✅ Cache SET: ${key} (TTL: ${ttl / 1000}s)`);
  }

  // Get cache if not expired
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    const age = Date.now() - cached.timestamp;
    
    if (age > cached.ttl) {
      console.log(`⏰ Cache EXPIRED: ${key} (age: ${Math.round(age / 1000)}s)`);
      this.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`);
    return cached.value;
  }

  // Check if cache exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Delete cache entry
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
    console.log(`🗑️  Cache DELETE: ${key}`);
  }

  // Clear all cache
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
    console.log('🗑️  Cache CLEARED ALL');
  }

  // Get cache stats
  getStats() {
    const stats = {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries: []
    };

    for (const [key, data] of this.cache.entries()) {
      const age = Date.now() - data.timestamp;
      const remaining = data.ttl - age;
      
      stats.entries.push({
        key,
        age: Math.round(age / 1000),
        remaining: Math.round(remaining / 1000),
        size: JSON.stringify(data.value).length
      });
    }

    return stats;
  }
}

// Singleton instance
const cache = new Cache();

module.exports = cache;

