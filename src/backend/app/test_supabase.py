# test_supabase.py
import os
from supabase import create_client, Client

# Automatically find and load .env files up the directory tree using absolute paths
def load_env_variables():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Climb up to the root folder (forge-react)
    # src/backend/app -> up 3 levels
    root_dir = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))

    prefer_production = (
        os.getenv("APP_ENV") == "production"
        or os.getenv("ENVIRONMENT") == "production"
        or os.getenv("FORCE_PRODUCTION_ENV", "").lower() in {"1", "true", "yes"}
    )
    env_files = [".env.production", ".env"] if prefer_production else [".env", ".env.production"]

    loaded = False
    for env_name in env_files:
        env_path = os.path.join(root_dir, env_name)
        print(f"Checking for env file at: {env_path}")
        if os.path.exists(env_path):
            print(f"Found env file: {env_path}")
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        os.environ[k] = v
            loaded = True
            break
            
    if not loaded:
        print("⚠️ Could not find .env.production or .env file at the project root!")

load_env_variables()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project-id.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key")

# Clean/normalize URL
if "/rest/v1" in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.split("/rest/v1")[0]

# Print key safety
key_preview = SUPABASE_KEY[:10] + "..." if SUPABASE_KEY else "None"
print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {key_preview}")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_test():
    print("🚀 Connecting to Supabase...")
    try:
        # 1. Create a mock Organization
        org = supabase.table("organizations").insert({"name": "Test Engineering Corp"}).execute()
        org_id = org.data[0]["id"]
        print(f"✅ Created Org ID: {org_id}")
        
        # 2. Create a Client
        client = supabase.table("clients").insert({
            "organization_id": org_id,
            "name": "Aurora Energy Storage LLC"
        }).execute()
        client_id = client.data[0]["id"]
        print(f"✅ Created Client ID: {client_id}")
        
        # 3. Create a Project
        project = supabase.table("projects").insert({
            "client_id": client_id,
            "organization_id": org_id,
            "name": "Sunbelt BESS — Phase I",
            "county": "Maricopa",
            "state": "AZ",
            "country": "USA"
        }).execute()
        project_id = project.data[0]["id"]
        print(f"✅ Created Project ID: {project_id}")
        
        # 4. Create a Master Report Row
        report = supabase.table("reports").insert({
            "project_id": project_id,
            "organization_id": org_id,
            "report_type": "grounding",
            "document_no": "PVI-BESS-GRN-001",
            "revision": "A",
            "report_title": "Grounding Design Basis Report"
        }).execute()
        report_id = report.data[0]["id"]
        print(f"✅ Created Report ID: {report_id}")
        
        # 5. Insert Grounding specific parameters
        grounding = supabase.table("grounding_reports").insert({
            "report_id": report_id,
            "grounding_software": "WinIGS",
            "ground_conductor_bess": "500 KCMil Bare Stranded Cu",
            "ground_conductor_pcs": "600 KCMil Bare Stranded Cu"
        }).execute()
        print("✅ Inserted Grounding Specific inputs")
        
        # 6. Execute RPC to retrieve unified template-ready dataset in one query
        print("⚡ Compiling Report Data via Stored Procedure...")
        compiled_data = supabase.rpc("get_complete_report_data", {"target_report_id": report_id}).execute()
        
        print("\n🎉 SUCCESS! Unified report object compiled from Database:")
        import json
        print(json.dumps(compiled_data.data, indent=2))
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        print("\n💡 NOTE: Please make sure your SUPABASE_URL and SUPABASE_KEY environment variables are set correctly in your environment before running this test.")

if __name__ == "__main__":
    run_test()
