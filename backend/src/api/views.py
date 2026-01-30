import csv
from collections import Counter

from django.db import models, transaction
from django.db.models import CharField, F, Func
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import (Cart, CartItem, ExternalRelation, GEOPlatformMetadata,
                     GEOSampleMetadata, GEOSeriesMetadata,
                     GEOSeriesToPlatforms, OntologySearchResults, Organism,
                     OrganismForPairing, Platform, SearchTerm, Series,
                     SeriesRelations)
from .serializers import (CartSerializer, ExternalRelationSerializer,
                          GEOSampleMetadataSerializer,
                          GEOSeriesMetadataSerializer,
                          OntologySearchResultsSerializer,
                          OrganismForPairingSerializer, OrganismSerializer,
                          PlatformSerializer,
                          SearchTermSerializer, SeriesRelationsSerializer,
                          SeriesSerializer)

# ===========================================================================
# === Helpers
# ===========================================================================

class LargeEntityPagination(LimitOffsetPagination):
    """
    Reduces the size of pages for large entity listings to improve performance.
    """
    default_limit = 5


class SeriesSearchPagination(LimitOffsetPagination):
    """Limit/offset pagination that always returns facets with page metadata."""

    def get_paginated_response(self, data):  # type: ignore[override]
        return Response({
            'count': self.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'facets': getattr(self, 'facets', {}),
        })


# ===========================================================================
# === Reference Types
# ===========================================================================

class OrganismViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing Organisms.
    Accessible at /api/organisms/
    """
    queryset = Organism.objects.all()
    serializer_class = OrganismSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['id', 'name']
    ordering = ['id']

# ===========================================================================
# === Core Entities
# ===========================================================================

class PlatformViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing Platforms.
    Accessible at /api/platforms/
    """
    queryset = Platform.objects.all()
    serializer_class = PlatformSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['platform_id']
    ordering_fields = ['platform_id', 'created_at', 'updated_at']
    ordering = ['platform_id']


class SeriesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing Series.
    Accessible at /api/series/
    """
    queryset = Series.objects.all()
    serializer_class = SeriesSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    # search_fields = ['series_id', 'doc', 'search_terms__term']
    search_fields = ['search_terms__term']
    ordering_fields = ['series_id', 'created_at', 'updated_at']
    ordering = ['series_id']

    # provide a /samples action to get samples for a series
    @action(detail=True, methods=['get'], url_path='samples', permission_classes=[AllowAny])
    def samples(self, request, pk=None):
        series = self.get_object()
        # samples = series.series_relations.first().samples.all()
        samples = GEOSampleMetadata.objects.filter(
            series_id=series.series_id
        ).all()
        page = self.paginate_queryset(samples)
        if page is not None:
            serializer = GEOSampleMetadataSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = GEOSampleMetadataSerializer(samples, many=True)
        return Response(serializer.data)
    
    # provide a /lookup action to get series by a list of ids
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='lookup', permission_classes=[AllowAny])
    def lookup(self, request):
        # takes a list of series_ids in the body
        series_ids = request.data.get('ids', [])
        queryset = GEOSampleMetadata.objects.filter(series_id__in=series_ids)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SampleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing Samples.
    Accessible at /api/samples/
    """
    # queryset = Sample.objects.all()
    # serializer_class = SampleSerializer
    queryset = GEOSampleMetadata.objects.all()
    serializer_class = GEOSampleMetadataSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['sample_id', 'doc', 'search_terms__term']
    ordering_fields = ['sample_id', 'created_at', 'updated_at']
    ordering = ['sample_id']


# ===========================================================================---------
# === Join tables / relations
# ===========================================================================---------

class OrganismForPairingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing OrganismForPairing relationships.
    Accessible at /api/organism-pairings/
    """
    queryset = OrganismForPairing.objects.select_related(
        'organism', 'series', 'sample', 'platform'
    ).all()
    # queryset = OrganismForPairing.objects.all()
    serializer_class = OrganismForPairingSerializer
    pagination_class = LargeEntityPagination
    # filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # filterset_fields = ['organism', 'series', 'sample', 'platform', 'status']
    # search_fields = ['status', 'organism__name']
    # ordering_fields = ['id', 'series', 'sample', 'platform']
    # ordering = ['id']
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['status', 'organism__name']
    ordering_fields = ['id', 'series', 'sample', 'platform']
    ordering = ['id']

@method_decorator(cache_page(60 * 5), name='list')
@method_decorator(cache_page(60 * 5), name='retrieve')
class SeriesRelationsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing SeriesRelations.
    Accessible at /api/series-relations/
    Cached for 5 minutes to improve performance.
    """
    queryset = SeriesRelations.objects.prefetch_related(
        'samples', 'platforms'
    ).select_related('series').all()
    serializer_class = SeriesRelationsSerializer
    pagination_class = LargeEntityPagination
    # filter_backends = [DjangoFilterBackend, OrderingFilter]
    # filterset_fields = ['series']
    filter_backends = [OrderingFilter]
    ordering_fields = ['id', 'series']
    ordering = ['id']


class ExternalRelationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing ExternalRelations.
    Accessible at /api/external-relations/
    """
    queryset = ExternalRelation.objects.all()
    serializer_class = ExternalRelationSerializer
    pagination_class = LargeEntityPagination
    # filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # filterset_fields = ['from_entity', 'to_entity', 'relation_type']
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['from_entity', 'to_entity', 'relation_type']
    ordering_fields = ['id', 'from_entity', 'to_entity', 'relation_type']
    ordering = ['id']


# ===========================================================================
# === Search-related Entities
# ===========================================================================

class SearchTermViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing SearchTerms.
    Accessible at /api/search-terms/
    """
    queryset = SearchTerm.objects.all()
    serializer_class = SearchTermSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['term', 'related_words', 'sample_id']
    ordering_fields = ['id', 'term', 'prob', 'log2_prob_prior']
    ordering = ['id']


# ===========================================================================
# === Ontology search terms from meta-hq
# ===========================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def ontology_search(request):
    """
    API endpoint for searching ontology terms.
    Accessible at /api/ontology-search/
    
    Query parameters:
    - query (required): The search query string
    - max_results (optional): Maximum number of results to return (default: 50)
    """
    query = request.query_params.get('query')
    max_results = request.query_params.get('max_results', 50)
    
    if not query:
        # return an empty list if no query is provided
        return Response([])
    
    try:
        max_results = int(max_results)
    except ValueError:
        return Response(
            {'error': 'max_results must be an integer'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    results = OntologySearchResults.objects.search(query, max_results)
    serializer = OntologySearchResultsSerializer(results, many=True)
    return Response(serializer.data)

# ===========================================================================
# === GEO Series Metadata
# ===========================================================================

class GEOSeriesMetadataViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing GEO Series Metadata.
    Accessible at /api/geo-metadata/
    """
    queryset = GEOSeriesMetadata.objects.all()
    serializer_class = GEOSeriesMetadataSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['gse', 'title', 'summary']
    ordering_fields = ['gse', 'title']
    ordering = ['gse']
    pagination_class = SeriesSearchPagination

    def _build_facets(self, queryset):
        """Compute facets for the search result set."""

        # annotate with confidence levels
        annotated_qs = queryset.annotate(
            confidence_level=models.Case(
                models.When(prob__gte=0.8, then=models.Value('high')),
                models.When(prob__gte=0.5, then=models.Value('medium')),
                models.When(prob__lt=0.5, then=models.Value('low')),
                default=models.Value('unknown'),
                output_field=models.CharField(),
            )
        )

        # join the 'gpl' field from GEOSampleMetadata to this queryset
        annotated_qs = annotated_qs.annotate(
            samples_ct=models.Count('samples', distinct=True)
        )

        # annotate with study size buckets
        # (small: <10, medium: 10-50, large: >50)
        annotated_qs = annotated_qs.annotate(
            study_size=models.Case(
                models.When(samples_ct__lt=10, then=models.Value('small')),
                models.When(samples_ct__gte=10, samples_ct__lte=50, then=models.Value('medium')),
                models.When(samples_ct__gt=50, then=models.Value('large')),
                default=models.Value('unknown'),
                output_field=models.CharField(),
            )
        )

        # 1) Get the GSEs as a plain Python list (break out of django-cte's Query object)
        gse_list = list(queryset.values_list("gse", flat=True))

        # 2) Flatten platforms arrays into one stream of GPLs
        platform_gpls = (
            GEOSeriesToPlatforms.objects
            .filter(gse__in=gse_list)
            .annotate(
                gpl=Func(F("platforms"), function="unnest", output_field=CharField())
            )
            .values_list("gpl", flat=True)
        )

        # 3) Join to platform metadata + count titles
        platforms_qs = GEOPlatformMetadata.objects.filter(gpl__in=platform_gpls)
        platforms_dict = Counter(platforms_qs.values_list("technology", flat=True))

        # compute counts for each confidence level
        confidence_counts = annotated_qs.values('confidence_level').annotate(
            count=models.Count('gse')
        )

        # compute counts for each study size
        study_size_counts = annotated_qs.values('study_size').annotate(
            count=models.Count('gse')
        )
        
        return {
            'study_size': {
                entry['study_size']: entry['count']
                for entry in study_size_counts
            },
            'confidence': {
                entry['confidence_level']: entry['count']
                for entry in confidence_counts
            },
            'platforms': dict(platforms_dict)
        }

    # allow searching through an action
    @action(detail=False, methods=['get'], url_path='search', permission_classes=[AllowAny])
    def search(self, request):
        query = request.query_params.get('query')
        ordering = request.query_params.get('ordering')
        offset = request.query_params.get('offset')
        limit = request.query_params.get('limit')
        if not query:
            # return an empty response
            return Response({
                'count': 0,
                'next': None,
                'previous': None,
                'results': [],
                'facets': {}
            })
        
            # return Response(
            #     {'error': 'query parameter is required'},
            #     status=status.HTTP_400_BAD_REQUEST
            # )
        
        results = GEOSeriesMetadata.objects.search(query, order_by=ordering)
        facets = self._build_facets(results)

        # paginate the response
        # use limit, offset params if provided
        self.pagination_class.limit = limit or self.pagination_class.default_limit
        self.pagination_class.offset = offset or 0

        facets = self._build_facets(results)

        if self.paginator is not None:
            self.paginator.facets = facets

        # if confidence is provided, filter to confidence=high
        confidence = request.query_params.get('confidence')
        if confidence in ['high', 'medium', 'low', 'unknown']:
            if confidence == 'high':
                results = results.filter(prob__gte=0.8)
            elif confidence == 'medium':
                results = results.filter(prob__gte=0.5, prob__lt=0.8)
            elif confidence == 'low':
                results = results.filter(prob__lt=0.5)
            elif confidence == 'unknown':
                results = results.filter(prob__isnull=True)

        # if study_size is provided, filter results by large, medium, small
        study_size = request.query_params.get('study_size')
        if study_size in ['small', 'medium', 'large']:
            if study_size == 'small':
                results = results.filter(samples_ct__lt=10)
            elif study_size == 'medium':
                results = results.filter(samples_ct__gte=10, samples_ct__lte=50)
            elif study_size == 'large':
                results = results.filter(samples_ct__gt=50)

        # if platforms is provided, do the following:
        # 1. query GEOSeriesToPlatforms to get the gpl values with 'technology' equal to the passed platforms
        # 2. use GEOSeriesToPlatforms to get the gse values for gpl values that occur in the 'platforms' ArrayField
        # 3. filter results to only those gse values
        platforms = request.query_params.getlist('platforms')
        if platforms:
            gpls = GEOPlatformMetadata.objects.filter(
                technology__in=platforms
            ).values_list('gpl', flat=True)

            gse_values = GEOSeriesToPlatforms.objects.filter(
                platforms__overlap=list(gpls)
            ).values_list('gse', flat=True).distinct()

            results = results.filter(gse__in=list(gse_values))

        serializer = self.get_serializer(results, many=True)
        page = self.paginate_queryset(results)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(results, many=True)
        return Response({
            'count': len(serializer.data),
            'next': None,
            'previous': None,
            'results': serializer.data,
            'facets': facets
        })

    # provide a /lookup action to get series by a list of ids
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='lookup', permission_classes=[AllowAny])
    def lookup(self, request):
        # takes a list of series_ids in the body
        series_ids = request.data.get('ids', [])
        queryset = self.get_queryset().filter(gse__in=series_ids)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# ===========================================================================
# === Cart share, download views
# ===========================================================================

from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # no-op

@method_decorator(csrf_exempt, name='dispatch')
class CartViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and managing Carts.
    Accessible at /api/cart/
    """
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['id', 'name', 'created_at']
    ordering = ['id']
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]

    # allow user to POST to create a new cart
    def create(self, request, *args, **kwargs):
        """
        Create a new cart with the given name.
        
        Expects a JSON body with the following structure:
        {
            "studies": [
                {
                "id": "GSE35357",
                "added": "2025-12-12T11:21:35.895Z"
                },
                {
                "id": "GSE149008",
                "added": "2025-12-12T11:21:36.627Z"
                },
                {
                "id": "GSE45968",
                "added": "2025-12-12T11:21:37.293Z"
                }
            ],
            "name": "yowza"
        }
        """
        
        with transaction.atomic():
            # create a Cart object
            series_list = request.data.get('studies', [])
            cart_name = request.data['name']
            cart = Cart.objects.create(
                name=cart_name
            )

            # create CartItem objects for each series
            for series_data in series_list:
                series_id = series_data['id']
                added_at = series_data.get('added')
                try:
                    series = Series.objects.get(series_id=series_id)
                    CartItem.objects.create(
                        series=series,
                        added_at=added_at,
                        cart=cart
                    )
                except Series.DoesNotExist:
                    continue  # skip invalid series ids

            serializer = self.get_serializer(cart)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED
            )

    # provide a /download action to download cart contents
    @action(detail=False, methods=['post'], url_path='download', permission_classes=[AllowAny])
    def download(self, request):
        """
        API endpoint for downloading cart contents.
        
        Expects a JSON body with the following structure:
        {
            "ids": [
                "GSE35357",
                "GSE149008",
                "GSE45968"
            ]
        }
        
        Query parameters:
        - type (optional): 'json' or 'csv' (default: 'json')
        - filename (optional): desired filename (default: 'cart_download')
        """
        series_ids = request.data.get('ids', [])
        download_type = request.query_params.get('type', 'json')
        filename = request.query_params.get('filename', 'cart_download')
        
        series_qs = GEOSeriesMetadata.objects.filter(gse__in=series_ids)
        
        if download_type == 'json':
            # prepare JSON response
            data = {
                'studies': [
                    {
                        'id': series.gse,
                        'title': series.title,
                        'summary': series.summary,
                    }
                    for series in series_qs
                ]
            }
            response = Response(data, content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{filename}.json"'
            return response
        
        elif download_type == 'csv':
            # prepare CSV response
            response = HttpResponse(content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'

            # Helps Excel correctly detect UTF-8
            response.write('\ufeff')

            writer = csv.writer(response)
            writer.writerow(['Series ID', 'Title', 'Summary'])
            for series in series_qs:
                writer.writerow([series.gse, series.title, series.summary])

            return response
        
        else:
            return Response(
                {'error': 'Unsupported download type'},
                status=status.HTTP_400_BAD_REQUEST
            )
