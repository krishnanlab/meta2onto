from pprint import pprint

from django.core.management.base import BaseCommand

from api.views import database_stats

class Command(BaseCommand):
    help = "Precompute stats cache"
       
    def handle(self, *args, **options):
        # cache with force_write=True to ensure that the cache is updated
        # also set the timeout to 0 to make the eviction time infinite
        pprint(database_stats(force_write=True))
        self.stdout.write(self.style.SUCCESS("Stats cache precomputation completed."))
