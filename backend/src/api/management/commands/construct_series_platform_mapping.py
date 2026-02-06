"""
Docstring for backend.src.api.management.commands.construct_series_platform_mapping
"""

from django.core.management.base import BaseCommand

from django.db import connection, transaction

from api.models import GEOPlatform, GEOSeries, GEOSeriesToGEOPlatforms

class Command(BaseCommand):
    help = 'Construct mapping between GEOSeries and their GEOPlatforms'

    def handle(self, *args, **options):
        self.stdout.write('Starting construction of GEOSeries to GEOPlatform mapping...')

        # Clear existing mappings
        GEOSeriesToGEOPlatforms.objects.all().delete()

        # run the following SQL:
        # insert into api_geoseriestoplatforms
        # select series.gse, array_agg(distinct platforms.gpl) from api_geoseriesmetadata AS series
        # inner join api_geosamplemetadata samples on samples.series_id = series.gse
        # inner join api_geoplatformmetadata as platforms on samples.gpl = platforms.gpl
        # group by series.gse;

        copy_sql = """
        INSERT INTO api_geoseriestoplatforms (gse, platforms)
        SELECT series.gse, array_agg(distinct platforms.gpl) from api_geoseriesmetadata AS series
        INNER JOIN api_geosamplemetadata AS samples on samples.series_id = series.gse
        INNER JOIN api_geoplatformmetadata AS platforms on samples.gpl = platforms.gpl
        GROUP by series.gse;
        """

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(copy_sql)

        self.stdout.write(self.style.SUCCESS('Successfully constructed GEOSeries to GEOPlatform mapping.'))
