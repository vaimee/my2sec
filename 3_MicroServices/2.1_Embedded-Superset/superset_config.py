SESSION_COOKIE_SAMESITE = None
ENABLE_PROXY_FIX = True
PUBLIC_ROLE_LIKE_GAMMA = True
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True
}

GUEST_ROLE_NAME= "Admin"

CORS_OPTIONS = {
  'supports_credentials': True,
  'allow_headers': ['*'],
  'resources':['*'],
  'origins': ['*']
}