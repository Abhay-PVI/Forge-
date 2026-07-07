import secrets

from app.supabase_service import supabase_admin

TEST_USER_EMAIL = "forge-test-user@pvinsight.local"


def create_test_user():
    password = secrets.token_urlsafe(24)

    res = supabase_admin.auth.admin.create_user({
        "email": TEST_USER_EMAIL,
        "password": password,
        "email_confirm": True,
    })

    user_id = res.user.id
    print(f"Created auth user: {TEST_USER_EMAIL}")
    print(f"  id:       {user_id}")
    print(f"  password: {password}")
    print()
    print("Add this to .env and .env.production:")
    print(f"  TEST_USER_ID={user_id}")
    print(f"  VITE_TEST_USER_ID={user_id}")

    profile = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
    if profile.data:
        print()
        print(f"Confirmed profiles row created (organization_id={profile.data.get('organization_id')}, role={profile.data.get('role')}).")
    else:
        print()
        print("WARNING: no matching profiles row found — check the handle_new_user trigger.")


if __name__ == "__main__":
    create_test_user()
