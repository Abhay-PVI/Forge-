# supabase_service.py
import os
from typing import Dict, Any
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

# Automatically find and load .env files up the directory tree using absolute paths.
# Load order (highest-to-lowest priority):
#   .env.local  -> developer-local overrides with real credentials (not committed)
#   .env        -> shared defaults / placeholders (committed)
# In production, .env.production is preferred over .env.
def load_env_variables():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # src/backend/app -> up 3 levels to forge-react root
    root_dir = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))

    prefer_production = (
        os.getenv("APP_ENV") == "production"
        or os.getenv("ENVIRONMENT") == "production"
        or os.getenv("FORCE_PRODUCTION_ENV", "").lower() in {"1", "true", "yes"}
    )

    if prefer_production:
        ordered_files = [".env.local", ".env.production", ".env"]
    else:
        ordered_files = [".env.local", ".env", ".env.production"]

    for env_name in ordered_files:
        env_path = os.path.join(root_dir, env_name)
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        # .env.local values win — don't overwrite already-set vars
                        os.environ.setdefault(k, v)
            if env_name == ".env.local":
                # After loading .env.local continue to pick up any missing keys from base files
                continue
            else:
                break

load_env_variables()

# 1. Supabase Client Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-or-service-role-key")

# Clean/normalize URL
if "/rest/v1" in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.split("/rest/v1")[0]

# Client for General/Service actions (bypass RLS where safe, e.g. background runners)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

security = HTTPBearer()

# 2. Dependency: Validate JWT and return user authentication context
async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    token = credentials.credentials
    if token == "dev-bypass-token" and os.getenv("ALLOW_DEV_BYPASS_AUTH", "").lower() in {"1", "true", "yes"}:
        test_user_id = os.getenv("TEST_USER_ID")
        if not test_user_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Dev bypass authentication is not configured.",
            )
        role = "member"
        full_name = "Developer Bypass"
        org_id = None
        try:
            profile_response = supabase_admin.table("profiles").select("organization_id, role, full_name").eq("id", test_user_id).single().execute()
            if profile_response.data:
                org_id = profile_response.data.get("organization_id")
                role = profile_response.data.get("role") or "member"
                full_name = profile_response.data.get("full_name") or "Developer Bypass"
        except Exception:
            pass
        
        if not org_id:
            try:
                # Query first organization in the DB
                orgs = supabase_admin.table("organizations").select("id").limit(1).execute()
                if orgs.data:
                    org_id = orgs.data[0]["id"]
                else:
                    new_org = supabase_admin.table("organizations").insert({"name": "Default Dev Org"}).execute()
                    org_id = new_org.data[0]["id"]
                
                # Upsert profile for this test user
                supabase_admin.table("profiles").upsert({
                    "id": test_user_id,
                    "organization_id": org_id,
                    "role": role,
                    "full_name": full_name,
                }, on_conflict="id").execute()
            except Exception as e:
                print(f"Error establishing fallback organization for dev bypass: {e}")
        
        return {
            "id": test_user_id,
            "email": "forge-test-user@pvinsight.local",
            "organization_id": org_id,
            "role": role,
            "full_name": full_name,
        }

    try:
        # Validate JWT token with Supabase Auth server
        user_auth = supabase_admin.auth.get_user(token)
        if not user_auth or not user_auth.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token or expired session."
            )
        
        # Retrieve user profile mapping
        profile_response = supabase_admin.table("profiles").select("organization_id, role, full_name").eq("id", user_auth.user.id).single().execute()
        
        return {
            "id": user_auth.user.id,
            "email": user_auth.user.email,
            "organization_id": profile_response.data.get("organization_id") if profile_response.data else None,
            "role": profile_response.data.get("role") if profile_response.data else "member",
            "full_name": profile_response.data.get("full_name") if profile_response.data else None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

# 3. Report-Specific Data Access Service
class SupabaseReportService:
    @staticmethod
    def get_user_scoped_client(token: str) -> Client:
        """Create a client instance authenticated as the user (respecting RLS policies)."""
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        client.postgrest.auth(token)
        return client

    @classmethod
    async def fetch_complete_report(cls, report_id: str, token: str) -> Dict[str, Any]:
        """
        Retrieves the complete report details (Metadata, Projects, Clients, and Report-Specific fields)
        using a single database call executing the get_complete_report_data RPC.
        """
        user_client = cls.get_user_scoped_client(token)
        try:
            # Execute database stored procedure compiled in Migration 03
            response = user_client.rpc(
                "get_complete_report_data",
                {"target_report_id": report_id}
            ).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Report not found or permission denied.")
            
            return response.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database retrieval failure: {str(e)}")

    @classmethod
    async def create_report_specific_inputs(cls, report_id: str, report_type: str, data: Dict[str, Any], token: str) -> Dict[str, Any]:
        """
        Creates/Updates the strongly-typed report inputs table based on report category.
        """
        user_client = cls.get_user_scoped_client(token)
        table_name = f"{report_type}_reports"
        
        try:
            # Map input parameters
            payload = {"report_id": report_id, **data}
            
            response = user_client.table(table_name).upsert(payload, on_conflict="report_id").execute()
            return response.data
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to upsert report details: {str(e)}")

    @classmethod
    async def generate_signed_storage_url(cls, file_path: str, expiration_seconds: int = 3600) -> str:
        """
        Generates a secure, temporary read URL for files stored in the private report-assets bucket.
        """
        try:
            # Storage bypasses Postgrest RLS but respects Supabase Storage policies
            response = supabase_admin.storage.from_("report-assets").create_signed_url(
                path=file_path,
                expires_in=expiration_seconds
            )
            return response.get("signedURL")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Storage URL generation failed: {str(e)}")
