from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CartViewSet,
    GEOSeriesMetadataViewSet,
    OrganismViewSet,
    PlatformViewSet,
    SearchTermViewSet,
    SeriesViewSet,
    SampleViewSet,
    OrganismForPairingViewSet,
    SeriesRelationsViewSet,
    ExternalRelationViewSet,
    ontology_search,
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'organisms', OrganismViewSet, basename='organism')
router.register(r'platforms', PlatformViewSet, basename='platform')
router.register(r'series', SeriesViewSet, basename='series')
router.register(r'samples', SampleViewSet, basename='sample')
router.register(r'organism-pairings', OrganismForPairingViewSet, basename='organism-pairing')
router.register(r'series-relations', SeriesRelationsViewSet, basename='series-relations')
router.register(r'external-relations', ExternalRelationViewSet, basename='external-relation')
router.register(r'search-terms', SearchTermViewSet, basename='search-term')
router.register(r'geo-metadata', GEOSeriesMetadataViewSet, basename='geo-metadata')
router.register(r'cart', CartViewSet, basename='cart')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('ontology-search/', ontology_search, name='ontology-search'),
    # path('cart/download/', download_cart, name='cart-download'),
]