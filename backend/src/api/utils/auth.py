from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Skips CSRF validation for API views that use session authentication. This is
    necessary for our frontend, which is served from a different origin than the
    backend API, and thus cannot use CSRF tokens in the traditional way.
    """
    def enforce_csrf(self, request):
        return  # no-op
