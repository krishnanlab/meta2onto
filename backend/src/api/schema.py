"""
Contains OpenAPI schema definitions in cases where they can't be
simply inferred from the models/serializers/views.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension
from api.utils.auth import CsrfExemptSessionAuthentication


class CsrfExemptSessionAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = CsrfExemptSessionAuthentication
    name = "csrfExemptCookieAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": "sessionid",
        }
