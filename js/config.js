/**
 * Application Configuration & Constants
 * All localStorage keys, feature flags, and constants
 */

// Feature Flags
export const FEATURES = {
  DEBUG_STORAGE: false, // Enable to log all storage operations
  VIP_PATCH_ENABLED: false,
};

// Build Information
export const BUILD_TAG = 'vip-fix-v1.1';

// localStorage Keys
export const STORAGE_KEYS = {
  ORDER_HISTORY: 'orderHistory',
  VIP_LIST: 'vipList',
  VIP_UPDATED_AT: 'vipUpdatedAt',
  VIP_TRANSACTIONS: 'vipTransactions',
  DRAFT_ORDER: 'draftOrder',
  DRAFT_META: 'draftBackupMeta',
  GITHUB_TOKEN: 'github_token',
  GITHUB_REPO: 'github_repo',
  GITHUB_BRANCH: 'github_branch',
  GITHUB_BACKUP_FOLDER: 'github_backup_folder',
  GITHUB_AUTO_BACKUP_ENABLED: 'github_auto_backup_enabled',
  GITHUB_BACKUP_INTERVAL: 'github_backup_interval',
  GITHUB_LAST_BACKUP: 'github_last_backup',
  GITHUB_LAST_COMMIT_SHA: 'github_last_commit_sha',
};

// Transaction IDs confirmed for deletion (duplicates)
export const CONFIRMED_DELETE_TXN_IDS = [
  '9310deae-d8f0-48c4-8dd0-b8031e44886d', // a Duck topup 1000đ duplicate on 2025-12-15
];

// Draft Configuration
export const DRAFT_CONFIG = {
  DIR: '/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen/drafts',
  BACKUP_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
  RETRY_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
};

// Export for backward compatibility
export default {
  FEATURES,
  BUILD_TAG,
  STORAGE_KEYS,
  CONFIRMED_DELETE_TXN_IDS,
  DRAFT_CONFIG,
};
