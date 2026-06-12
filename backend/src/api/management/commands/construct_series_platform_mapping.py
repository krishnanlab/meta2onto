"""
Docstring for backend.src.api.management.commands.construct_series_platform_mapping
"""

from django.core.management.base import BaseCommand

from django.db import connection, transaction

from api.models import GEOSeriesToGEOPlatforms


class Command(BaseCommand):
    help = "Construct mapping between GEOSeries and their GEOPlatforms"

    def handle(self, *args, **options):
        self.stdout.write(
            "Starting construction of GEOSeries to GEOPlatform mapping..."
        )

        # Clear existing mappings
        GEOSeriesToGEOPlatforms.objects.all().delete()

        # run the following SQL:
        # insert into api_geoseriestoplatforms
        # select series.gse, array_agg(distinct platforms.gpl) from api_geoseries AS series
        # inner join api_geosample samples on samples.series_id = series.gse
        # inner join api_geoplatform as platforms on samples.gpl = platforms.gpl
        # group by series.gse;

        copy_sql = """
        INSERT INTO api_geoseriestogeoplatforms (gse, platforms)
        SELECT series.gse, array_agg(distinct platforms.gpl) from api_geoseries AS series
        INNER JOIN api_geosample AS samples on samples.series_id = series.gse
        INNER JOIN api_geoplatform AS platforms on samples.gpl = platforms.gpl
        GROUP by series.gse;
        """

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(copy_sql)

        self.stdout.write(
            self.style.SUCCESS(
                "Successfully constructed GEOSeries to GEOPlatform mapping."
            )
        )
