"""
Functions that extend Django's ORM to support, e.g., postgres-specific operations.
"""

from django.db.models import (
    BooleanField,
    Count,
    F,
    Func,
    IntegerField,
    OuterRef,
    Subquery,
    Value,
    CharField,
)

from django.db.models.functions import Coalesce
from django.conf import settings

from django.core.cache import cache

from api.utils.timing import timed

class ArrayAnyEquals(Func):
    """
    Compile:

        lhs = ANY(rhs)

    Example:

        OuterRef("gse") = ANY(GEOSample.series_set)
    """

    output_field = BooleanField()

    def __init__(self, lhs, rhs, **extra):
        super().__init__(lhs, rhs, **extra)

    def as_sql(self, compiler, connection, **extra_context):
        lhs_sql, lhs_params = compiler.compile(self.source_expressions[0])
        rhs_sql, rhs_params = compiler.compile(self.source_expressions[1])

        sql = f"{lhs_sql} = ANY({rhs_sql})"
        params = [*lhs_params, *rhs_params]

        return sql, params


class Array(Func):
    """
    Compile:

        ARRAY[expr]

    Example:

        ARRAY[api_geoseries.gse]::varchar[]
    """

    template = "ARRAY[%(expressions)s]::varchar[]"
    output_field = CharField()
