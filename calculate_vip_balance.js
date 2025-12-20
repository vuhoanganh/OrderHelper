const fs = require('fs');

try {
    const rawData = fs.readFileSync('/Users/alvin/Desktop/OrderHelper/DB/backup-15-12-2025-171543.json');
    const backup = JSON.parse(rawData);

    const orderHistory = backup.data.orderHistory;
    const vipTransactions = backup.data.vipTransactions || [];
    const vipListStr = backup.data.vipList || "";

    // Parse vipList string to object for comparison
    const currentVipBalances = {};
    if (vipListStr) {
        vipListStr.split('\n').forEach(line => {
            const [name, balanceStr] = line.split('=');
            if (name && balanceStr) {
                currentVipBalances[name.trim()] = parseInt(balanceStr.replace('đ', '').trim());
            }
        });
    }

    // 1. Calculate Total Topups per User
    const userTopups = {};
    const processedTransactionIds = new Set();

    vipTransactions.forEach(tx => {
        if (!processedTransactionIds.has(tx.id)) {
            processedTransactionIds.add(tx.id);
             if (tx.type === 'topup') {
                userTopups[tx.name] = (userTopups[tx.name] || 0) + tx.amount;
            }
            // Note: We might also need to consider manual adjustments or 'order' types in transactions
            // if they are NOT covered by orderHistory. But usually orderHistory is the source of truth for orders.
            // Let's stick to orderHistory for spending first.
        }
    });

    // 2. Calculate Total Spending per User from Order History
    const userSpending = {};
    
    // We only care about users who are in the current VIP list (or have topped up)
    const vipUsers = new Set([...Object.keys(currentVipBalances), ...Object.keys(userTopups)]);

    orderHistory.forEach(order => {
        if (order.details) {
            order.details.forEach(detail => {
                // Check if user is a VIP user
                if (vipUsers.has(detail.name)) {
                    // Logic: If paid is true, we deduce from balance.
                    // IMPORTANT: We need to know if this specific entry was paid via VIP or Cash.
                    // The 'isVIP' flag exists in some newer orders, but not all.
                    // Assumption: If user is in VIP list and paid=true, it's a VIP payment.
                    
                    if (detail.paid) {
                         // Check strictly if 'due' is valid
                         const amount = detail.due || 0;
                         userSpending[detail.name] = (userSpending[detail.name] || 0) + amount;
                    }
                }
            });
        }
    });

    // 3. Print Results
    console.log("--- VIP Balance Calculation ---");
    console.log(JSON.stringify({
        userTopups,
        userSpending,
        currentFileBalances: currentVipBalances
    }, null, 2));

    console.log("\n--- Discrepancy Check ---");
    vipUsers.forEach(user => {
        const topup = userTopups[user] || 0;
        const spent = userSpending[user] || 0;
        const calculatedBalance = topup - spent;
        const fileBalance = currentVipBalances[user] || 0;
        
        console.log(`User: ${user}`);
        console.log(`  Topup: ${topup}`);
        console.log(`  Spent: ${spent}`);
        console.log(`  Calculated Balance: ${calculatedBalance}`);
        console.log(`  File Balance:       ${fileBalance}`);
        console.log(`  Diff:               ${calculatedBalance - fileBalance}`);
        console.log("---------------------------");
    });

} catch (error) {
    console.error("Error:", error);
}
