from pprint import pprint

from django.core.management.base import BaseCommand

from api.models import Feedback, GEOPlatform, GEOSample, SearchTerm

from django.db.models import Exists, OuterRef
from django.core.cache import cache

from django.conf import settings

def _cache_fetch(key, compute_func, timeout=settings.LONGTERM_CACHE_TIMEOUT):
    """
    Fetch a value from the cache, computing and caching it if not present.
    """
    value = compute_func()
    cache.set(key, value, timeout=timeout)
    return value

def database_statistics():
    """
    Compute and return various statistics about the database, caching results for later use.
    """

    search_term_series = SearchTerm.objects.filter(
        series_id=OuterRef("series_id")
    )

    samples = GEOSample.objects.annotate(
        has_search_term=Exists(search_term_series)
    ).filter(
        has_search_term=True
    )

    return {
        "tissues": _cache_fetch("site-stats:tissues", lambda: SearchTerm.objects.exclude(term__startswith="MONDO:").values("term").distinct().count()),
        "diseases": _cache_fetch("site-stats:diseases", lambda: SearchTerm.objects.filter(term__startswith="MONDO:").values("term").distinct().count()),
        "studies": _cache_fetch("site-stats:studies", lambda: SearchTerm.objects.values("series_id").distinct().count()),
        "samples": _cache_fetch(
            "site-stats:samples",
            samples.count,
        ),
        "species": _cache_fetch(
            "site-stats:species",
            lambda: samples.values(
                "organism_ch1"
            ).distinct().count(),
        ),
        "technologies": _cache_fetch("site-stats:technologies", lambda: GEOPlatform.objects.values("technology").distinct().count()),
        "feedback": Feedback.objects.count(),
    }

class Command(BaseCommand):
    help = "Precompute stats cache"
       
    def handle(self, *args, **options):
        pprint(database_statistics())
        self.stdout.write(self.style.SUCCESS("Stats cache precomputation completed."))
