from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns the Supabase client initialized with the service-role key.
    Returns None if credentials are not configured.
    """
    global _supabase_client
    if not settings.is_supabase_configured:
        return None

    if _supabase_client is None:
        try:
            _supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
        except Exception as e:
            # Never log the secret key
            raise RuntimeError(f"Failed to initialize Supabase client: {str(e)}") from e

    return _supabase_client

