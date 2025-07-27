#!/usr/bin/env python3
"""
PulseChain API Server - Persistent Transaction Counter with Retries
Stores last successful count and increments from there, with retry logic
"""

import requests
import json
import time
import os
from datetime import datetime, timedelta

# Configuration
PULSECHAIN_API_BASE = "https://api.scan.pulsechain.com/api/v2"
FORK_BLOCK = 17233000
STARTING_BLOCK = 24080721
STARTING_TRANSACTIONS = 301259930
STATE_FILE = "/tmp/pulsechain_state.json"
OUTPUT_FILE = "/var/www/html/totaltxns.json"
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

class PulseChainCounter:
    def __init__(self):
        self.state_file = STATE_FILE
        self.ensure_output_dir()
    
    def ensure_output_dir(self):
        """Ensure output directory exists"""
        output_dir = os.path.dirname(OUTPUT_FILE)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
    
    def load_state(self):
        """Load persistent state from file"""
        try:
            if os.path.exists(self.state_file):
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                print(f"Loaded state: block {state['current_block']}, {state['total_transactions']:,} transactions")
                return state
        except Exception as e:
            print(f"State load error: {e}")
        
        # Default state
        return {
            "current_block": STARTING_BLOCK,
            "total_transactions": STARTING_TRANSACTIONS,
            "last_update": datetime.now().isoformat()
        }
    
    def save_state(self, state):
        """Save persistent state to file"""
        try:
            with open(self.state_file, 'w') as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            print(f"State save error: {e}")
    
    def fetch_with_retry(self, url, retries=MAX_RETRIES):
        """Fetch URL with retries"""
        for attempt in range(retries):
            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Attempt {attempt + 1} failed for {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(RETRY_DELAY)
                else:
                    raise
        return None
    
    def fetch_current_block(self):
        """Fetch current block number with retries"""
        data = self.fetch_with_retry(f"{PULSECHAIN_API_BASE}/stats")
        if data and 'total_blocks' in data:
            return int(data['total_blocks'])
        return None
    
    def fetch_block_transactions(self, block_number):
        """Fetch transaction count for a specific block with retries"""
        data = self.fetch_with_retry(f"{PULSECHAIN_API_BASE}/blocks/{block_number}")
        if data and 'tx_count' in data:
            return int(data['tx_count'])
        return 0
    
    def update_transaction_count(self):
        """Update transaction count from last known state with retries"""
        state = self.load_state()
        
        try:
            current_block = self.fetch_current_block()
            if current_block is None:
                print("Could not fetch current block, using last known state")
                return state
            
            last_processed = state["current_block"]
            
            if current_block > last_processed:
                print(f"Processing blocks {last_processed + 1} to {current_block}")
                
                total_new_txns = 0
                for block_num in range(last_processed + 1, current_block + 1):
                    try:
                        tx_count = self.fetch_block_transactions(block_num)
                        total_new_txns += tx_count
                        
                        if block_num % 100 == 0:
                            print(f"Processed up to block {block_num}")
                            
                    except Exception as e:
                        print(f"Error processing block {block_num}: {e}")
                        continue
                
                # Update state
                state["current_block"] = current_block
                state["total_transactions"] += total_new_txns
                state["last_update"] = datetime.now().isoformat()
                
                print(f"Added {total_new_txns} transactions from {current_block - last_processed} blocks")
            else:
                print(f"No new blocks (current: {current_block}, last: {last_processed})")
                
        except Exception as e:
            print(f"Error in update: {e}")
            # Keep existing state on error
            
        finally:
            self.save_state(state)
        
        return state
    
    def generate_api_response(self):
        """Generate the API response JSON"""
        try:
            state = self.update_transaction_count()
            
            # Always return last known good state, even on fetch errors
            api_response = {
                "status": "success",
                "data": {
                    "total_transactions": state["total_transactions"],
                    "current_block": state["current_block"],
                    "blocks_since_fork": state["current_block"] - FORK_BLOCK,
                    "last_update": state["last_update"]
                },
                "timestamp": datetime.now().isoformat()
            }
            
            return api_response
            
        except Exception as e:
            # On any error, return last known good data
            state = self.load_state()
            return {
                "status": "success",
                "data": {
                    "total_transactions": state["total_transactions"],
                    "current_block": state["current_block"],
                    "blocks_since_fork": state["current_block"] - FORK_BLOCK,
                    "last_update": state["last_update"]
                },
                "timestamp": datetime.now().isoformat(),
                "warning": f"Using cached data due to: {str(e)}"
            }
    
    def update_json_file(self):
        """Update the JSON file with current data"""
        try:
            response = self.generate_api_response()
            
            with open(OUTPUT_FILE, 'w') as f:
                json.dump(response, f, indent=2)
            
            print(f"Updated {OUTPUT_FILE} at {datetime.now()}")
            return True
            
        except Exception as e:
            print(f"Error updating JSON file: {e}")
            # Never return error to API file, always return last known good data
            state = self.load_state()
            fallback_response = {
                "status": "success",
                "data": {
                    "total_transactions": state["total_transactions"],
                    "current_block": state["current_block"],
                    "blocks_since_fork": state["current_block"] - FORK_BLOCK,
                    "last_update": state["last_update"]
                },
                "timestamp": datetime.now().isoformat(),
                "warning": str(e)
            }
            
            try:
                with open(OUTPUT_FILE, 'w') as f:
                    json.dump(fallback_response, f, indent=2)
            except:
                pass
            return False

def main():
    """Main function to run the counter"""
    counter = PulseChainCounter()
    
    print("Starting PulseChain Transaction Counter...")
    print(f"Output file: {OUTPUT_FILE}")
    print(f"Starting from block: {STARTING_BLOCK}")
    print(f"Starting transactions: {STARTING_TRANSACTIONS}")
    print(f"State file: {STATE_FILE}")
    
    # Initial update
    counter.update_json_file()
    
    # Update every 5 minutes
    while True:
        time.sleep(300)  # 5 minutes
        counter.update_json_file()

if __name__ == "__main__":
    main()