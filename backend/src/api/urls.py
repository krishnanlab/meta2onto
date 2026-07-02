from collections import OrderedDict

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CartViewSet,
    GEOSeriesViewSet,
    OrganismViewSet,
    GEOPlatformViewSet,
    SearchTermViewSet,
    GEOSampleViewSet,
    ontology_search,
    database_statistics,
)

class APIRouter(DefaultRouter):
    '''
    Customized Default Router to include non-viewset views on root page
    '''
    single_views:list
    def __init__(self, single_views:list, *args, **kwargs):
        self.single_views = single_views
        self.trailing_slash = '/?'
        super().__init__(*args, **kwargs)

    def get_api_root_view(self, api_urls=None):
        """
        Return a basic root view.
        """
        api_root_dict = OrderedDict()
        list_name = self.routes[0].name
        for prefix, viewset, basename in self.registry:
            api_root_dict[prefix] = list_name.format(basename=basename)
        for single_view in self.single_views:
            sanitized_route = single_view['route'].rstrip('/?').rstrip('/')
            api_root_dict[sanitized_route] = single_view['name']
        return self.APIRootView.as_view(api_root_dict=api_root_dict)

single_views = [
    {
        "route": "ontology/search",
        "view": ontology_search,
        "name": "ontology-search"
    },
    {
        "route": "stats",
        "view": database_statistics,
        "name": "database-statistics"
    },
]

router = APIRouter(single_views=single_views)

router.register(r"organisms", OrganismViewSet, basename="organism")
router.register(r"platforms", GEOPlatformViewSet, basename="platform")
router.register(r"study", GEOSeriesViewSet, basename="study")
router.register(r"samples", GEOSampleViewSet, basename="sample")
router.register(r"search-terms", SearchTermViewSet, basename="search-term")
router.register(r"cart", CartViewSet, basename="cart")

urlpatterns = [
    path("", include(router.urls)),
    path("ontology/search/", ontology_search, name="ontology-search"),
    path("stats/", database_statistics, name="database-statistics"),
    # path('cart/download/', download_cart, name='cart-download'),
]
