#!/usr/bin/env python3
"""
Script to update payment methods for specific users in backup JSON file
"""

import json
import sys
from datetime import datetime

def update_payment_methods(file_path):
    """Update payment methods for Kudo, Tùng, a Dave, a Duck"""
    
    print(f"Reading file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Counter for updates
    updates = {
        'Kudo': 0,
        'Tùng': 0,
        'a Dave': 0,
        'a Duck': 0
    }
    
    # Kudo's excluded orders (don't add VIP)
    kudo_excluded_orders = [
        'Phở bò',  # 3/12
        'Bánh ướt gà xé',
        'Bún thịt nướng'
    ]
    
    # Process order history
    for order in data.get('data', {}).get('orderHistory', []):
        order_date = order.get('date', '')
        order_name = order.get('itemName', '')
        
        # Check if this is one of Kudo's excluded orders
        is_kudo_excluded = False
        if order_name in kudo_excluded_orders:
            # For "Phở bò", also check date (3/12 = December 3rd)
            if order_name == 'Phở bò':
                order_datetime = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
                if order_datetime.month == 12 and order_datetime.day == 3:
                    is_kudo_excluded = True
            else:
                is_kudo_excluded = True
        
        # Update details
        for detail in order.get('details', []):
            name = detail.get('name', '')
            
            # Kudo: all VIP except excluded orders
            if name == 'Kudo':
                if not is_kudo_excluded and detail.get('paid') == True:
                    if detail.get('paymentMethod') != 'vip':
                        detail['paymentMethod'] = 'vip'
                        updates['Kudo'] += 1
                        print(f"  ✓ Updated Kudo in: {order_name} ({order_date[:10]})")
            
            # Tùng: all VIP
            elif name == 'Tùng':
                if detail.get('paid') == True:
                    if detail.get('paymentMethod') != 'vip':
                        detail['paymentMethod'] = 'vip'
                        updates['Tùng'] += 1
                        print(f"  ✓ Updated Tùng in: {order_name} ({order_date[:10]})")
            
            # a Dave: all VIP
            elif name == 'a Dave':
                if detail.get('paid') == True:
                    if detail.get('paymentMethod') != 'vip':
                        detail['paymentMethod'] = 'vip'
                        updates['a Dave'] += 1
                        print(f"  ✓ Updated a Dave in: {order_name} ({order_date[:10]})")
            
            # a Duck: all VIP
            elif name == 'a Duck':
                if detail.get('paid') == True:
                    if detail.get('paymentMethod') != 'vip':
                        detail['paymentMethod'] = 'vip'
                        updates['a Duck'] += 1
                        print(f"  ✓ Updated a Duck in: {order_name} ({order_date[:10]})")
    
    # Write back to file
    print(f"\nWriting updated data to: {file_path}")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("UPDATE SUMMARY:")
    print("="*60)
    for name, count in updates.items():
        print(f"  {name}: {count} transactions updated to VIP")
    print(f"\nTotal: {sum(updates.values())} transactions updated")
    print("="*60)

if __name__ == '__main__':
    file_path = '/Users/alvin/Desktop/OrderHelper 2/OrderHelper/DB/backup-19-12-2025-123301.json'
    
    try:
        update_payment_methods(file_path)
        print("\n✅ Update completed successfully!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
