// Configuration & Constants
export const CONFIG = {
    // Draft autosave
    DRAFT_STORAGE_KEY: 'draftOrder',
    DRAFT_META_KEY: 'draftBackupMeta',
    DRAFT_DIR: '/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen/drafts',
    DRAFT_BACKUP_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
    DRAFT_RETRY_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes

    // VIP
    VIP_TX_KEY: 'vipTransactions',

    // GitHub Backup
    GITHUB_TOKEN_KEY: 'github_token',
    GITHUB_REPO_KEY: 'github_repo',
    GITHUB_BRANCH_KEY: 'github_branch',
    GITHUB_AUTO_BACKUP_ENABLED_KEY: 'github_auto_backup_enabled',
    GITHUB_BACKUP_INTERVAL_KEY: 'github_backup_interval',
    GITHUB_LAST_BACKUP_KEY: 'github_last_backup',
    GITHUB_LAST_COMMIT_SHA_KEY: 'github_last_commit_sha',

    // Other
    AUTO_BACKUP_MODE: new URLSearchParams(window.location.search).get('autobackup') === 'true'
};

export default CONFIG;
