"""
Populates the Facet model using the currenty-loaded GEOSeries, GEOPlatforms,
and GEOSamples models. These facets are returned by the study search endpoint
instead of being dynamically computed at query time.

See the Facet model for more details on the structure of the facet data and
the rationale for precomputing it.
"""

from django.core.management.base import BaseCommand

from django.db import models, connection, transaction

from api.models import Facet, FacetEntry, GEOSeries, GEOPlatform, GEOSeriesToGEOPlatforms, GEOSample
from api.utils.timing import timed

def populate_study_size():
    # find the minimum and maximum number of samples
    # associated with any series in the database
    min_size = (
        GEOSeries.objects.annotate(sample_count=models.Count("samples"))
            .aggregate(min_size=models.Min("sample_count"))
            .get("min_size", 0)
    )
    max_size = (
        GEOSeries.objects.annotate(sample_count=models.Count("samples"))
            .aggregate(max_size=models.Max("sample_count"))
            .get("max_size", 0)
    )

    Facet.objects.create(
        name="Study Size",
        min=min_size,
        max=max_size
    )

def populate_confidence():
    # hardcoded to 0-100, but we might change it to the min/max confidence
    # over the dataset at some point
    Facet.objects.create(
        name="Confidence",
        min=0,
        max=100
    )

def populate_platforms():
    # populates the Plaforms facet with each unique platform
    # and the number of studies overall associated with that platform
    facet = Facet.objects.create(
        name="Platforms"
    )

    qs = GEOPlatform.objects.raw("""
        SELECT
            PL.gpl,
            SUM(array_length(GEPL.platforms, 1)) AS total
        FROM api_geoplatform AS PL
        INNER JOIN api_geoseriestogeoplatforms GEPL
            ON PL.gpl = ANY(GEPL.platforms)
        GROUP BY PL.gpl
    """)

    for platform in qs:
        FacetEntry.objects.create(
            facet=facet,
            name=platform.gpl,
            count=platform.total
        )

def populate_technologies():
    """
    Populates the Technologies facet with each unique technology and the number
    of studies overall associated with that technology.

    Note that we can't query via GEOPlatform as we do in populate_platforms(),
    since we're not returning GEOPlatform primary keys. Instead we opt for a
    regular raw query.
    """
    with transaction.atomic():
        facet = Facet.objects.create(name="Technologies")

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    PL.technology,
                    SUM(array_length(GEPL.platforms, 1)) AS total
                FROM api_geoplatform AS PL
                INNER JOIN api_geoseriestogeoplatforms GEPL
                    ON PL.gpl = ANY(GEPL.platforms)
                GROUP BY PL.technology
            """)

            rows = cursor.fetchall()

        FacetEntry.objects.bulk_create([
            FacetEntry(
                facet=facet,
                name=technology,
                count=total,
            )
            for technology, total in rows
        ])

def populate_databases():
    """
    Populates the Databases facet with each unique database and the number of
    studies overall associated with that database.

    Note that we can't query via GEOPlatform as we do in populate_platforms(),
    since we're not returning GEOPlatform primary keys. Instead we opt for a
    regular raw query.
    """
    with transaction.atomic():
        facet = Facet.objects.create(name="Databases")

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    database,
                    COUNT(DISTINCT series_id) AS total
                FROM (
                    SELECT
                        database,
                        series_id
                    FROM api_externaldbrefs
                    WHERE database IS NOT NULL AND database <> ''

                    UNION

                    SELECT
                        database,
                        series_id
                    FROM api_geoseriesdatabase
                    WHERE database IS NOT NULL AND database <> ''
                ) AS combined
                GROUP BY database
            """)

            rows = cursor.fetchall()

        FacetEntry.objects.bulk_create([
            FacetEntry(
                facet=facet,
                name=database,
                count=total,
            )
            for database, total in rows
        ])

# definitions of which facets we want to compute
# - the key in this dict is the name of the facet, the type
#   (minmax or categorical) determines which attributes of the Facet
#   model are populated.
# - 'method' is a function that computes the facet values and yields dicts for
#   each facet value
FACETS = [
    ("Study Size", "minmax", populate_study_size),
    ("Confidence", "minmax", populate_confidence),
    ("Platforms", "categorical", populate_platforms),
    ("Technologies", "categorical", populate_technologies),
    ("Databases", "categorical", populate_databases),
]

class Command(BaseCommand):
    help = "Compute Facet model contents based on GEOSeries, Samples, and Platforms models."

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **opts):
        # drop all the entries in the Facet table before recomputing
        # (this implicitly drops all the associated FacetEntry rows via a
        # cascade delete)
        Facet.objects.all().delete()

        for facet_name, facet_type, method in FACETS:
            with timed(label="- Elapsed", print_method=self.stdout.write):
                self.stdout.write(f"Computing facet: {facet_name} ({facet_type})")
                method()
