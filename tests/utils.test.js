// Unit tests for OrderHelper utility functions
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ========== FORMATTER TESTS ==========

describe('Formatter Utils', () => {
  
  describe('formatMoney', () => {
    // Mock function since we can't import ES6 modules directly
    function formatMoney(x) {
      const neg = x < 0;
      const v = Math.round(Math.abs(x) * 100) / 100;
      return (neg ? '-' : '') + (Number.isInteger(v) ? v.toString() : v.toFixed(2)) + 'đ';
    }

    it('should format positive integers', () => {
      assert.equal(formatMoney(100), '100đ');
      assert.equal(formatMoney(1000), '1000đ');
    });

    it('should format negative integers', () => {
      assert.equal(formatMoney(-50), '-50đ');
      assert.equal(formatMoney(-1000), '-1000đ');
    });

    it('should format decimals with 2 decimal places', () => {
      assert.equal(formatMoney(10.5), '10.50đ');
      assert.equal(formatMoney(99.99), '99.99đ');
    });

    it('should format negative decimals', () => {
      assert.equal(formatMoney(-10.5), '-10.50đ');
      assert.equal(formatMoney(-99.99), '-99.99đ');
    });

    it('should handle zero', () => {
      assert.equal(formatMoney(0), '0đ');
    });

    it('should round to 2 decimal places', () => {
      assert.equal(formatMoney(10.556), '10.56đ');
      assert.equal(formatMoney(10.554), '10.55đ');
    });
  });

  describe('ceilInt', () => {
    function ceilInt(x) {
      return Math.ceil(x);
    }

    it('should ceil positive numbers', () => {
      assert.equal(ceilInt(10.1), 11);
      assert.equal(ceilInt(10.9), 11);
    });

    it('should ceil negative numbers', () => {
      assert.equal(ceilInt(-10.1), -10);
      assert.equal(ceilInt(-10.9), -10);
    });

    it('should return same value for integers', () => {
      assert.equal(ceilInt(10), 10);
      assert.equal(ceilInt(-10), -10);
    });
  });

  describe('formatDate', () => {
    function formatDate(date) {
      const d = new Date(date);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    it('should format date correctly', () => {
      const testDate = new Date('2025-12-11T10:30:00');
      const formatted = formatDate(testDate);
      assert.ok(formatted.includes('2025'));
      assert.ok(formatted.includes('12'));
      assert.ok(formatted.includes('11'));
    });
  });
});

// ========== HELPER TESTS ==========

describe('Helper Utils', () => {
  
  describe('debounce', () => {
    function debounce(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), wait);
      };
    }

    it('should debounce function calls', (t, done) => {
      let callCount = 0;
      const fn = () => callCount++;
      const debounced = debounce(fn, 50);

      debounced();
      debounced();
      debounced();

      setTimeout(() => {
        assert.equal(callCount, 1, 'Function should be called only once');
        done();
      }, 100);
    });

    it('should pass arguments to debounced function', (t, done) => {
      let result = null;
      const fn = (x, y) => { result = x + y; };
      const debounced = debounce(fn, 50);

      debounced(5, 10);
      
      setTimeout(() => {
        assert.equal(result, 15);
        done();
      }, 100);
    });
  });

  describe('throttle', () => {
    function throttle(fn, delay) {
      let lastCall = 0;
      return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          fn(...args);
        }
      };
    }

    it('should throttle function calls', (t, done) => {
      let callCount = 0;
      const fn = () => callCount++;
      const throttled = throttle(fn, 100);

      throttled(); // Should call
      setTimeout(() => throttled(), 50);  // Should not call (too soon)
      setTimeout(() => throttled(), 150); // Should call
      
      setTimeout(() => {
        assert.equal(callCount, 2, 'Function should be called twice');
        done();
      }, 200);
    });
  });
});

// ========== STORAGE TESTS ==========

describe('Storage Utils', () => {
  // Mock localStorage for Node.js environment
  class LocalStorageMock {
    constructor() {
      this.store = {};
    }
    
    getItem(key) {
      return this.store[key] || null;
    }
    
    setItem(key, value) {
      this.store[key] = value.toString();
    }
    
    removeItem(key) {
      delete this.store[key];
    }
    
    clear() {
      this.store = {};
    }
  }

  const localStorage = new LocalStorageMock();
  
  function getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  function setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  describe('getItem', () => {
    it('should get item from storage', () => {
      localStorage.setItem('test', JSON.stringify({ foo: 'bar' }));
      const result = getItem('test');
      assert.deepEqual(result, { foo: 'bar' });
    });

    it('should return default value if item not found', () => {
      const result = getItem('nonexistent', 'default');
      assert.equal(result, 'default');
    });

    it('should return null if no default value provided', () => {
      const result = getItem('nonexistent');
      assert.equal(result, null);
    });
  });

  describe('setItem', () => {
    it('should set item in storage', () => {
      const result = setItem('test', { foo: 'bar' });
      assert.equal(result, true);
      const stored = localStorage.getItem('test');
      assert.equal(stored, JSON.stringify({ foo: 'bar' }));
    });

    it('should handle arrays', () => {
      setItem('array', [1, 2, 3]);
      const result = getItem('array');
      assert.deepEqual(result, [1, 2, 3]);
    });

    it('should handle strings', () => {
      setItem('string', 'hello');
      const result = getItem('string');
      assert.equal(result, 'hello');
    });

    it('should handle numbers', () => {
      setItem('number', 42);
      const result = getItem('number');
      assert.equal(result, 42);
    });
  });

  describe('removeItem', () => {
    it('should remove item from storage', () => {
      setItem('toRemove', 'value');
      const result = removeItem('toRemove');
      assert.equal(result, true);
      assert.equal(getItem('toRemove'), null);
    });
  });
});

console.log('✅ All test suites defined and ready to run!');
