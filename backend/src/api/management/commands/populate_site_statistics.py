from pprint import pprint

from django.db.models import (
    OuterRef,
    F,
    Exists,
)

from django.core.management.base import BaseCommand

from api.utils.query import ArrayAnyEquals

from api.models import GEOPlatform, GEOSample, SearchTerm, SiteStatistic
from api.utils.timing import timed

class Command(BaseCommand):
    help = "Populate the SiteStatistic table with precomputed stats for the database."

    def handle(self, *args, **options):
        with timed("Populating SiteStatistic table"):
            search_term_series = SearchTerm.objects.filter(
                ArrayAnyEquals(
                    F("series_id"),
                    OuterRef("series_set"),
                )
            )

            samples = GEOSample.objects.filter(
                Exists(search_term_series)
            )

            stats = {
                "tissues": SearchTerm.objects.exclude(term__startswith="MONDO:").values("term").distinct().count(),
                "diseases": SearchTerm.objects.filter(term__startswith="MONDO:").values("term").distinct().count(),
                "studies": SearchTerm.objects.values("series_id").distinct().count(),
                "samples": samples.count,
                "species": samples.values("organism_ch1" ).distinct().count(),
                "technologies": GEOPlatform.objects.values("technology").distinct().count(),
            }

            pprint(stats)

            for name, value in stats.items():
                SiteStatistic.objects.update_or_create(
                    name=name,
                    defaults={"value": value},
                )

        self.stdout.write(self.style.SUCCESS("Stats table populate completed."))
