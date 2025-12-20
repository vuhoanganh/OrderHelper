import json

file_path = '/Users/alvin/Desktop/OrderHelper/DB/backup-15-12-2025-171543.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    order_history = data['data'].get('orderHistory', [])
    vip_transactions = data['data'].get('vipTransactions', [])
    vip_list_str = data['data'].get('vipList', "")

    # Parse current VIP balances from string
    current_vip_balances = {}
    if vip_list_str:
        for line in vip_list_str.split('\n'):
            if '=' in line:
                name, balance_str = line.split('=')
                current_vip_balances[name.strip()] = int(balance_str.replace('đ', '').strip())

    # 1. Calculate Total Topups and specific corrections
    user_topups = {}
    processed_tx_ids = set()

    for tx in vip_transactions:
        if tx['id'] not in processed_tx_ids:
            processed_tx_ids.add(tx['id'])
            # Only count 'topup' type for recharging
            if tx.get('type') == 'topup':
                name = tx.get('name')
                amount = tx.get('amount', 0)
                user_topups[name] = user_topups.get(name, 0) + amount

    # 2. Calculate Total Spending from Order History
    user_spending = {}
    
    # Identify VIP users: those in the list OR those who have topped up
    vip_users = set(current_vip_balances.keys()) | set(user_topups.keys())

    for order in order_history:
        details = order.get('details', [])
        for detail in details:
            name = detail.get('name')
            if name in vip_users:
                # Assume if paid is true, it is deducted from VIP balance
                # Note: This is an assumption. In reality, a VIP could pay cash.
                # However, usually the system defaults to VIP balance if available.
                if detail.get('paid') is True:
                    amount = detail.get('due', 0)
                    user_spending[name] = user_spending.get(name, 0) + amount

    # 3. Print Results
    print("--- VIP Balance Calculation Report ---")
    
    for user in vip_users:
        topup = user_topups.get(user, 0)
        spent = user_spending.get(user, 0)
        calculated_balance = topup - spent
        file_balance = current_vip_balances.get(user, 0)
        diff = calculated_balance - file_balance

        print(f"User: {user}")
        print(f"  Total Topup: {topup}")
        print(f"  Total Spent: {spent}")
        print(f"  Calculated:  {calculated_balance}")
        print(f"  File Balance:{file_balance}")
        print(f"  Difference:  {diff}")
        print("-" * 30)

except Exception as e:
    print(f"Error: {e}")
