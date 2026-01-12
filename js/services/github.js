/**
 * GitHub Backup Service
 * Handles GitHub API integration and automated backups
 */

import { STORAGE_KEYS, BUILD_TAG } from '../config.js';
import { formatDraftTime } from '../utils/formatters.js';

/**
 * Add message to backup log
 * @param {string} message - Log message
 */
export function addBackupLog(message) {
  const logDiv = document.getElementById('backupLog');
  if (!logDiv) return;
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  const line = `[${timestamp}] ${message}`;
  if (logDiv.textContent === 'Chưa có log...') {
    logDiv.textContent = line;
  } else {
    logDiv.textContent = line + '\n' + logDiv.textContent;
  }
  // Keep only last 50 lines
  const lines = logDiv.textContent.split('\n');
  if (lines.length > 50) {
    logDiv.textContent = lines.slice(0, 50).join('\n');
  }
}

/**
 * Show backup status message
 * @param {string} message - Status message
 * @param {string} type - Status type (info, success, error, warning)
 */
export function showBackupStatus(message, type = 'info') {
  const statusDiv = document.getElementById('githubBackupStatus');
  const textDiv = document.getElementById('githubBackupStatusText');
  if (!statusDiv || !textDiv) return;

  textDiv.textContent = message;
  statusDiv.style.display = 'flex';
  statusDiv.className = `alert alert-${type}`;

  // Auto-hide after 5 seconds for success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

/**
 * Make GitHub API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} body - Request body
 * @returns {Promise<Object>} Response data
 */
export async function githubApiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
  if (!token) {
    throw new Error('GitHub token không tìm thấy. Vui lòng cài đặt token trong tab Backup.');
  }

  const url = `https://api.github.com${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`GitHub API Error: ${error.message || response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

/**
 * Get file from GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} branch - Branch name
 * @returns {Promise<Object|null>} File content and SHA
 */
export async function getGithubFile(owner, repo, path, branch = 'main') {
  try {
    const data = await githubApiRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    if (data && data.content) {
      // Decode base64 content with UTF-8 support
      const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
      return {
        content,
        sha: data.sha
      };
    }
    return null;
  } catch (err) {
    // File not found is not an error in this case
    if (err.message.includes('Not Found') || err.message.includes('404')) {
      return null;
    }
    throw err;
  }
}

/**
 * Create or update file in GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} content - File content
 * @param {string} message - Commit message
 * @param {string} sha - File SHA (required for updates)
 * @returns {Promise<Object>} Response data
 */
export async function createOrUpdateGithubFile(owner, repo, path, content, message, sha = null) {
  // Proper UTF-8 to base64 encoding for Vietnamese characters
  const utf8Bytes = new TextEncoder().encode(content);
  const base64 = btoa(String.fromCharCode(...utf8Bytes));

  const body = {
    message,
    content: base64,
    branch: localStorage.getItem(STORAGE_KEYS.GITHUB_BRANCH) || 'master'
  };

  if (sha) {
    body.sha = sha; // Required when updating existing file
  }

  return await githubApiRequest(`/repos/${owner}/${repo}/contents/${path}`, 'PUT', body);
}

/**
 * Backup data to GitHub
 * @returns {Promise<void>}
 */
export async function backupToGithub() {
  console.log(`[${BUILD_TAG}] Starting GitHub backup...`);
  addBackupLog('Bắt đầu backup...');

  try {
    // Get settings
    const token = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
    const repo = localStorage.getItem(STORAGE_KEYS.GITHUB_REPO);
    const branch = localStorage.getItem(STORAGE_KEYS.GITHUB_BRANCH) || 'master';
    const folder = localStorage.getItem(STORAGE_KEYS.GITHUB_BACKUP_FOLDER) || 'DB';

    if (!token || !repo) {
      throw new Error('Vui lòng cài đặt GitHub token và repository');
    }

    // Parse owner/repo
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Repository format phải là: owner/repo-name');
    }

    // Prepare backup data
    const backupData = {
      orderHistory: JSON.parse(localStorage.getItem('orderHistory') || '[]'),
      vipList: localStorage.getItem('vipList') || '',
      vipUpdatedAt: localStorage.getItem('vipUpdatedAt') || '',
      vipTransactions: JSON.parse(localStorage.getItem(STORAGE_KEYS.VIP_TRANSACTIONS) || '[]'),
      timestamp: new Date().toISOString(),
      version: BUILD_TAG
    };

    // Generate filename
    const now = new Date();
    const dateStr = [
      String(now.getDate()).padStart(2, '0'),
      String(now.getMonth() + 1).padStart(2, '0'),
      now.getFullYear()
    ].join('-');
    const timeStr = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('');
    const filename = `backup-${dateStr}-${timeStr}.json`;
    const filePath = `${folder}/${filename}`;

    addBackupLog(`Đang upload ${filename}...`);

    // Check if file exists (shouldn't, but just in case)
    const existing = await getGithubFile(owner, repoName, filePath, branch);

    // Create or update file
    const result = await createOrUpdateGithubFile(
      owner,
      repoName,
      filePath,
      JSON.stringify(backupData, null, 2),
      `Auto backup - ${now.toLocaleString('vi-VN')}`,
      existing?.sha
    );

    // Save metadata
    localStorage.setItem(STORAGE_KEYS.GITHUB_LAST_BACKUP, now.toISOString());
    localStorage.setItem(STORAGE_KEYS.GITHUB_LAST_COMMIT_SHA, result.content?.sha || result.commit?.sha || '');

    addBackupLog(`✅ Backup thành công: ${filename}`);
    showBackupStatus('Backup thành công!', 'success');
    updateBackupStatusDisplay();

    console.log(`[${BUILD_TAG}] GitHub backup completed successfully`);
  } catch (error) {
    console.error(`[${BUILD_TAG}] GitHub backup failed:`, error);
    addBackupLog(`❌ Lỗi: ${error.message}`);
    showBackupStatus(`Backup thất bại: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Save GitHub settings to localStorage
 */
export function saveGithubSettings() {
  const token = document.getElementById('githubToken')?.value?.trim();
  const repo = document.getElementById('githubRepo')?.value?.trim();
  const branch = document.getElementById('githubBranch')?.value?.trim() || 'master';
  const folder = document.getElementById('githubBackupFolder')?.value?.trim() || 'DB';
  const autoBackupEnabled = document.getElementById('githubAutoBackupEnabled')?.checked || false;
  const backupInterval = parseInt(document.getElementById('githubBackupInterval')?.value) || 60;

  if (token) localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
  if (repo) localStorage.setItem(STORAGE_KEYS.GITHUB_REPO, repo);
  localStorage.setItem(STORAGE_KEYS.GITHUB_BRANCH, branch);
  localStorage.setItem(STORAGE_KEYS.GITHUB_BACKUP_FOLDER, folder);
  localStorage.setItem(STORAGE_KEYS.GITHUB_AUTO_BACKUP_ENABLED, autoBackupEnabled.toString());
  localStorage.setItem(STORAGE_KEYS.GITHUB_BACKUP_INTERVAL, backupInterval.toString());

  alert('✅ Đã lưu cài đặt GitHub');

  // Restart auto backup if enabled
  initGithubAutoBackup();
  updateBackupStatusDisplay();
}

/**
 * Load GitHub settings from localStorage
 */
export function loadGithubSettings() {
  const tokenInput = document.getElementById('githubToken');
  const repoInput = document.getElementById('githubRepo');
  const branchInput = document.getElementById('githubBranch');
  const folderInput = document.getElementById('githubBackupFolder');
  const autoBackupCheckbox = document.getElementById('githubAutoBackupEnabled');
  const intervalInput = document.getElementById('githubBackupInterval');

  if (tokenInput) tokenInput.value = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN) || '';
  if (repoInput) repoInput.value = localStorage.getItem(STORAGE_KEYS.GITHUB_REPO) || '';
  if (branchInput) branchInput.value = localStorage.getItem(STORAGE_KEYS.GITHUB_BRANCH) || 'master';
  if (folderInput) folderInput.value = localStorage.getItem(STORAGE_KEYS.GITHUB_BACKUP_FOLDER) || 'DB';
  if (autoBackupCheckbox) {
    autoBackupCheckbox.checked = localStorage.getItem(STORAGE_KEYS.GITHUB_AUTO_BACKUP_ENABLED) === 'true';
  }
  if (intervalInput) {
    intervalInput.value = localStorage.getItem(STORAGE_KEYS.GITHUB_BACKUP_INTERVAL) || '60';
  }

  updateBackupStatusDisplay();
}

/**
 * Update backup status display
 */
export function updateBackupStatusDisplay() {
  const statusDiv = document.getElementById('githubBackupLastStatus');
  if (!statusDiv) return;

  const lastBackup = localStorage.getItem(STORAGE_KEYS.GITHUB_LAST_BACKUP);
  if (lastBackup) {
    const date = new Date(lastBackup);
    statusDiv.textContent = `Lần backup cuối: ${formatDraftTime(date.getTime())}`;
  } else {
    statusDiv.textContent = 'Chưa có backup nào';
  }
}

/**
 * Initialize GitHub auto backup
 * @param {Object} intervalRef - Object to store interval ID
 */
export function initGithubAutoBackup(intervalRef = {}) {
  // Clear existing interval
  if (intervalRef.id) {
    clearInterval(intervalRef.id);
    intervalRef.id = null;
  }

  const enabled = localStorage.getItem(STORAGE_KEYS.GITHUB_AUTO_BACKUP_ENABLED) === 'true';
  if (!enabled) {
    console.log(`[${BUILD_TAG}] GitHub auto backup disabled`);
    return;
  }

  const intervalMinutes = parseInt(localStorage.getItem(STORAGE_KEYS.GITHUB_BACKUP_INTERVAL)) || 60;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[${BUILD_TAG}] GitHub auto backup enabled: every ${intervalMinutes} minutes`);

  intervalRef.id = setInterval(async () => {
    console.log(`[${BUILD_TAG}] Running scheduled GitHub backup...`);
    try {
      await backupToGithub();
    } catch (error) {
      console.error(`[${BUILD_TAG}] Scheduled backup failed:`, error);
    }
  }, intervalMs);
}

// Export all as default
export default {
  addBackupLog,
  showBackupStatus,
  githubApiRequest,
  getGithubFile,
  createOrUpdateGithubFile,
  backupToGithub,
  saveGithubSettings,
  loadGithubSettings,
  updateBackupStatusDisplay,
  initGithubAutoBackup,
};
