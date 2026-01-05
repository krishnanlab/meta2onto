from django.contrib import admin

from api.models import Organism, Platform, Sample, Series, SeriesRelations

admin.site.register(Organism)
admin.site.register(Platform)
admin.site.register(Sample)
admin.site.register(Series)
admin.site.register(SeriesRelations)