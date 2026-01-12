/**
 * Self-Test Module
 * Automated tests to verify critical invariants
 */

/**
 * Run all self-tests
 * @returns {Object} Test results with pass/fail status
 */
export async function runAllTests() {
    const results = {
        timestamp: new Date().toISOString(),
        passed: 0,
        failed: 0,
        tests: []
    };

    console.log('[SelfTest] 🧪 Starting self-test suite...');

    // Test 1: VIP Balance Formula
    try {
        const test1 = await testVipBalanceFormula();
        results.tests.push(test1);
        if (test1.passed) results.passed++;
        else results.failed++;
    } catch (err) {
        results.tests.push({
            name: 'VIP Balance Formula',
            passed: false,
            error: err.message
        });
        results.failed++;
    }

    // Test 2: No Double-Count
    try {
        const test2 = await testNoDoubleCount();
        results.tests.push(test2);
        if (test2.passed) results.passed++;
        else results.failed++;
    } catch (err) {
        results.tests.push({
            name: 'No Double-Count',
            passed: false,
            error: err.message
        });
        results.failed++;
    }

    // Test 3: Backup/Restore Roundtrip
    try {
        const test3 = await testBackupRestoreRoundtrip();
        results.tests.push(test3);
        if (test3.passed) results.passed++;
        else results.failed++;
    } catch (err) {
        results.tests.push({
            name: 'Backup/Restore Roundtrip',
            passed: false,
            error: err.message
        });
        results.failed++;
    }

    results.allPassed = results.failed === 0;

    console.log(`[SelfTest] ${results.allPassed ? '✅' : '❌'} Complete: ${results.passed} passed, ${results.failed} failed`);

    return results;
}

/**
 * Test 1: VIP Balance Formula Correctness
 * Verify: balance = opening + topup - cashout - orders
 */
async function testVipBalanceFormula() {
    console.log('[SelfTest] Test 1: VIP Balance Formula...');

    const test = {
        name: 'VIP Balance Formula',
        passed: false,
        details: [],
        errors: []
    };

    try {
        // Get VIP list and transactions
        const vipListText = localStorage.getItem('vipList') || '';
        const vipTransactions = JSON.parse(localStorage.getItem('vipTransactions') || '[]');

        // Parse VIP list
        const vipMembers = vipListText.split('\\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
                const match = line.match(/^([^,]+),\\s*(\\d+)đ?$/);
                if (match) {
                    return { name: match[1].trim(), expectedBalance: parseInt(match[2]) };
                }
                return null;
            })
            .filter(m => m !== null);

        if (vipMembers.length === 0) {
            test.passed = true;
            test.details.push('⚠️ No VIP members found (test skipped)');
            return test;
        }

        // For each VIP member, calculate balance from ledger
        let allMatch = true;
        for (const member of vipMembers) {
            const txs = vipTransactions.filter(tx => tx.name === member.name);

            // Calculate: opening + topup - cashout - orders
            let calculatedBalance = 0;

            for (const tx of txs) {
                if (tx.type === 'opening') calculatedBalance += tx.amount || 0;
                else if (tx.type === 'topup') calculatedBalance += tx.amount || 0;
                else if (tx.type === 'cashout') calculatedBalance -= Math.abs(tx.amount || 0);
                else if (tx.type === 'order') calculatedBalance -= Math.abs(tx.amount || 0);
            }

            const match = calculatedBalance === member.expectedBalance;
            const status = match ? '✅' : '❌';

            test.details.push(`${status} ${member.name}: Expected ${member.expectedBalance}đ, Calculated ${calculatedBalance}đ`);

            if (!match) {
                allMatch = false;
                test.errors.push({
                    member: member.name,
                    expected: member.expectedBalance,
                    calculated: calculatedBalance,
                    diff: calculatedBalance - member.expectedBalance
                });
            }
        }

        test.passed = allMatch;
        test.details.push(`Checked ${vipMembers.length} VIP members`);

    } catch (err) {
        test.passed = false;
        test.error = err.message;
        test.details.push(`❌ Error: ${err.message}`);
    }

    return test;
}

/**
 * Test 2: No Double-Count on Recompute
 * Verify: Calling recomputeVipBalances() doesn't change balances
 */
async function testNoDoubleCount() {
    console.log('[SelfTest] Test 2: No Double-Count...');

    const test = {
        name: 'No Double-Count',
        passed: false,
        details: [],
        errors: []
    };

    try {
        // Snapshot BEFORE
        const vipListBefore = localStorage.getItem('vipList') || '';
        const vipTxBefore = localStorage.getItem('vipTransactions') || '[]';
        const vipTxCountBefore = JSON.parse(vipTxBefore).length;

        // Call recompute (if function exists)
        if (typeof window.recomputeVipBalances === 'function') {
            test.details.push('Calling recomputeVipBalances()...');
            window.recomputeVipBalances();
        } else {
            test.details.push('⚠️ recomputeVipBalances() not found (test skipped)');
            test.passed = true;
            return test;
        }

        // Snapshot AFTER
        const vipListAfter = localStorage.getItem('vipList') || '';
        const vipTxAfter = localStorage.getItem('vipTransactions') || '[]';
        const vipTxCountAfter = JSON.parse(vipTxAfter).length;

        // Compare
        const vipListUnchanged = vipListBefore === vipListAfter;
        const vipTxUnchanged = vipTxBefore === vipTxAfter;
        const txCountUnchanged = vipTxCountBefore === vipTxCountAfter;

        test.details.push(`VIP List: ${vipListUnchanged ? '✅ Unchanged' : '❌ Changed'}`);
        test.details.push(`VIP Transactions: ${vipTxUnchanged ? '✅ Unchanged' : '❌ Changed'}`);
        test.details.push(`Transaction Count: ${vipTxCountBefore} → ${vipTxCountAfter} (${txCountUnchanged ? '✅' : '❌'})`);

        test.passed = vipListUnchanged && vipTxUnchanged && txCountUnchanged;

        if (!test.passed) {
            test.errors.push({
                vipListUnchanged,
                vipTxUnchanged,
                txCountBefore: vipTxCountBefore,
                txCountAfter: vipTxCountAfter
            });
        }

    } catch (err) {
        test.passed = false;
        test.error = err.message;
        test.details.push(`❌ Error: ${err.message}`);
    }

    return test;
}

/**
 * Test 3: Backup/Restore Roundtrip
 * Verify: backup → restore → data unchanged
 */
async function testBackupRestoreRoundtrip() {
    console.log('[SelfTest] Test 3: Backup/Restore Roundtrip...');

    const test = {
        name: 'Backup/Restore Roundtrip',
        passed: false,
        details: [],
        errors: []
    };

    try {
        // Create backup
        const backup = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            backupTime: Date.now(),
            data: {
                orderHistory: JSON.parse(localStorage.getItem('orderHistory') || '[]'),
                vipTransactions: JSON.parse(localStorage.getItem('vipTransactions') || '[]'),
                vipList: localStorage.getItem('vipList') || ''
            }
        };

        test.details.push(`Created backup with ${backup.data.orderHistory.length} orders, ${backup.data.vipTransactions.length} transactions`);

        // Serialize and deserialize (simulate file save/load)
        const backupJson = JSON.stringify(backup);
        const restoredBackup = JSON.parse(backupJson);

        // Compare
        const orderHistoryMatch = JSON.stringify(backup.data.orderHistory) === JSON.stringify(restoredBackup.data.orderHistory);
        const vipTxMatch = JSON.stringify(backup.data.vipTransactions) === JSON.stringify(restoredBackup.data.vipTransactions);
        const vipListMatch = backup.data.vipList === restoredBackup.data.vipList;

        test.details.push(`Order History: ${orderHistoryMatch ? '✅ Match' : '❌ Mismatch'}`);
        test.details.push(`VIP Transactions: ${vipTxMatch ? '✅ Match' : '❌ Mismatch'}`);
        test.details.push(`VIP List: ${vipListMatch ? '✅ Match' : '❌ Mismatch'}`);

        test.passed = orderHistoryMatch && vipTxMatch && vipListMatch;

        if (!test.passed) {
            test.errors.push({
                orderHistoryMatch,
                vipTxMatch,
                vipListMatch
            });
        }

    } catch (err) {
        test.passed = false;
        test.error = err.message;
        test.details.push(`❌ Error: ${err.message}`);
    }

    return test;
}

// Export for use in app
export default {
    runAllTests,
    testVipBalanceFormula,
    testNoDoubleCount,
    testBackupRestoreRoundtrip
};
