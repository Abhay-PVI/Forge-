import sys
import os
sys.path.insert(0, '.')
from app.supabase_service import SUPABASE_URL, SUPABASE_KEY
print("SUPABASE_URL:", SUPABASE_URL[:40])
print("SUPABASE_KEY valid:", not SUPABASE_KEY.startswith("your-"))
print("ALLOW_DEV_BYPASS_AUTH:", os.getenv("ALLOW_DEV_BYPASS_AUTH"))
print("TEST_USER_ID:", os.getenv("TEST_USER_ID", "NOT SET"))
