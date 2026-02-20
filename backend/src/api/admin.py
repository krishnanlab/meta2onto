from django.contrib import admin

from api.models import Organism, GEOPlatform, GEOSample, GEOSeries, GEOSeriesRelations

admin.site.register(Organism)
admin.site.register(GEOPlatform)
admin.site.register(GEOSample)
admin.site.register(GEOSeries)
admin.site.register(GEOSeriesRelations)
