/**
 * Frontend Unit Tests for utils.js
 * Tests utility functions used across frontend pages
 */

// Mock DOM environment
global.document = {
  createElement: (tag) => {
    const element = {
      tagName: tag.toUpperCase(),
      textContent: '',
      innerHTML: '',
      className: '',
      style: {},
      appendChild: jest.fn(),
      name: '',
      value: '',
      type: 'text'
    };
    return element;
  }
};

// Load and evaluate utils.js
const fs = require('fs');
const path = require('path');
const utilsPath = path.join(__dirname, '../../public/js/utils.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');

// Execute utils.js code
eval(utilsContent);

describe('Frontend Utils', () => {
  describe('escapeHtml', () => {
    beforeEach(() => {
      // Reset document.createElement for each test
      global.document.createElement = (tag) => ({
        tagName: tag.toUpperCase(),
        textContent: '',
        innerHTML: '',
        set textContent(value) {
          this._textContent = value;
          // Simulate browser behavior of escaping HTML
          this.innerHTML = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        },
        get textContent() {
          return this._textContent || '';
        }
      });
    });

    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape angle brackets', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
      expect(escapeHtml('a < b')).toBe('a &lt; b');
      expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('"Hello"')).toBe('&quot;Hello&quot;');
    });

    it('should return empty string for null or undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('showMessage', () => {
    let messageDiv;

    beforeEach(() => {
      messageDiv = {
        textContent: '',
        className: '',
        style: { display: '' }
      };
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should display a success message', () => {
      showMessage(messageDiv, 'success', 'Operation successful');

      expect(messageDiv.textContent).toBe('Operation successful');
      expect(messageDiv.className).toBe('message success');
      expect(messageDiv.style.display).toBe('block');
    });

    it('should display an error message', () => {
      showMessage(messageDiv, 'error', 'Operation failed');

      expect(messageDiv.textContent).toBe('Operation failed');
      expect(messageDiv.className).toBe('message error');
      expect(messageDiv.style.display).toBe('block');
    });

    it('should hide message after default duration', () => {
      showMessage(messageDiv, 'success', 'Test message');

      expect(messageDiv.style.display).toBe('block');

      jest.advanceTimersByTime(5000);

      expect(messageDiv.style.display).toBe('none');
    });

    it('should respect custom duration', () => {
      showMessage(messageDiv, 'error', 'Custom duration', 200);

      expect(messageDiv.style.display).toBe('block');

      jest.advanceTimersByTime(200);

      expect(messageDiv.style.display).toBe('none');
    });

    it('should handle null messageDiv gracefully', () => {
      expect(() => {
        showMessage(null, 'success', 'Test');
      }).not.toThrow();
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const dateString = '2025-12-13T10:30:00.000Z';
      const formatted = formatDate(dateString);

      // The format should include month, day, year, and time
      expect(formatted).toMatch(/Dec/);
      expect(formatted).toMatch(/13/);
      expect(formatted).toMatch(/2025/);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Time format
    });

    it('should handle different date formats', () => {
      const dates = [
        '2025-01-01T00:00:00.000Z',
        '2025-06-15T12:30:45.000Z',
        '2025-12-31T23:59:59.000Z'
      ];

      dates.forEach(dateString => {
        const formatted = formatDate(dateString);
        expect(formatted).toBeTruthy();
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });
  });

  describe('formatTimestamp', () => {
    it('should return "Just now" for very recent dates', () => {
      const now = new Date().toISOString();
      const formatted = formatTimestamp(now);
      expect(formatted).toContain('Just now');
    });

    it('should format minutes ago correctly', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const formatted = formatTimestamp(fiveMinutesAgo);
      expect(formatted).toMatch(/5 mins ago/);
    });

    it('should format hours ago correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const formatted = formatTimestamp(twoHoursAgo);
      expect(formatted).toMatch(/2 hours ago/);
    });

    it('should format days ago correctly', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const formatted = formatTimestamp(threeDaysAgo);
      expect(formatted).toMatch(/3 days ago/);
    });

    it('should include full timestamp with relative time', () => {
      const date = new Date(Date.now() - 60 * 1000).toISOString();
      const formatted = formatTimestamp(date);
      expect(formatted).toContain('<br>');
      expect(formatted).toContain('ago');
    });
  });

  describe('getFormData', () => {
    it('should extract form data as object', () => {
      // Mock FormData
      const mockFormData = new Map([
        ['name', 'John Doe'],
        ['email', 'john@example.com']
      ]);

      global.FormData = class {
        constructor(form) {
          this.data = mockFormData;
        }
        entries() {
          return this.data.entries();
        }
      };

      const form = { name: 'testForm' };
      const data = getFormData(form);

      expect(data).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should handle empty form', () => {
      global.FormData = class {
        constructor() {
          this.data = new Map();
        }
        entries() {
          return this.data.entries();
        }
      };

      const form = {};
      const data = getFormData(form);
      expect(data).toEqual({});
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
        'a@b.c'
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
        'user@@example.com',
        'user@.com'
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(' ')).toBe(false);
    });
  });
});
