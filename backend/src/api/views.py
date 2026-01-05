import csv
from uuid import uuid4
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import LimitOffsetPagination
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from django.views.decorators.csrf import csrf_exempt

from .models import (
    Cart,
    CartItem,
    GEOSeriesMetadata,
    Organism,
    Platform,
    SearchTerm,
    Series,
    Sample,
    OrganismForPairing,
    SeriesRelations,
    ExternalRelation,
    OntologySearchResults,
)
from .serializers import (
    CartSerializer,
    GEOSeriesMetadataSerializer,
    OrganismSerializer,
    PlatformSerializer,
    SearchTermSerializer,
    SeriesSerializer,
    SampleSerializer,
    OrganismForPairingSerializer,
    SeriesRelationsSerializer,
    ExternalRelationSerializer,
    OntologySearchResultsSerializer,
)


# ===========================================================================
# === Helpers
# ===========================================================================

class LargeEntityPagination(LimitOffsetPagination):
    """
    Reduces the size of pages for large entity listings to improve performance.
    """
    default_limit = 5


# ===========================================================================
# === Reference Types
# ===========================================================================

class OrganismViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing Organisms.
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
        samples = series.series_relations.first().samples.all()
        page = self.paginate_queryset(samples)
        if page is not None:
            serializer = SampleSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = SampleSerializer(samples, many=True)
        return Response(serializer.data)
    
    # provide a /lookup action to get series by a list of ids
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='lookup', permission_classes=[AllowAny])
    def lookup(self, request):
        # takes a list of series_ids in the body
        series_ids = request.data.get('ids', [])
        queryset = self.get_queryset().filter(series_id__in=series_ids)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SampleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing Samples.
    """
    queryset = Sample.objects.all()
    serializer_class = SampleSerializer
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
    
    Query parameters:
    - query (required): The search query string
    - max_results (optional): Maximum number of results to return (default: 50)
    """
    query = request.query_params.get('query')
    max_results = request.query_params.get('max_results', 50)
    
    if not query:
        # return an empty list if no query is provided
        return Response([])

        # return Response(
        #     {'error': 'query parameter is required'},
        #     status=status.HTTP_400_BAD_REQUEST
        # )
    
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

@api_view(['GET'])
@permission_classes([AllowAny])
def ontology_search_series(request):
    """
    API endpoint for searching ontology terms, but returns Series'
    rather than ontology terms.
    
    Query parameters:
    - query (required): The search query string
    - max_results (optional): Maximum number of results to return (default: 50)
    """
    query = request.query_params.get('query')
    max_results = request.query_params.get('max_results', 50)
    
    if not query:
        return Response(
            {'error': 'query parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
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
    """
    queryset = GEOSeriesMetadata.objects.all()
    serializer_class = GEOSeriesMetadataSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['gse', 'title', 'summary']
    ordering_fields = ['gse', 'title']
    ordering = ['gse']

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
                'results': []
            })
        
            # return Response(
            #     {'error': 'query parameter is required'},
            #     status=status.HTTP_400_BAD_REQUEST
            # )
        
        results = GEOSeriesMetadata.objects.search(query, order_by=ordering)
        serializer = self.get_serializer(results, many=True)

        # paginate the response
        # use limit, offset params if provided
        
        self.pagination_class.limit = limit or self.pagination_class.default_limit
        self.pagination_class.offset = offset or 0

        page = self.paginate_queryset(results)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        return Response(serializer.data)

        # return Response(serializer.data)

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
    ReadOnly API endpoint for viewing Carts.
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


# # a POST method /cart/download that takes the following body:
# # {ids: [
# #   "GSE35357",
# #   "GSE149008",
# #   "GSE45968"
# # ]}
# # and takes the following query params:
# # - type: json or csv
# # - filename: desired filename
# @api_view(['POST'])
# @permission_classes([AllowAny])
# @csrf_exempt
# def download_cart(request):
#     """
#     API endpoint for downloading cart contents.
    
#     Expects a JSON body with the following structure:
#     {
#         "ids": [
#             "GSE35357",
#             "GSE149008",
#             "GSE45968"
#         ]
#     }
    
#     Query parameters:
#     - type (optional): 'json' or 'csv' (default: 'json')
#     - filename (optional): desired filename (default: 'cart_download')
#     """
#     series_ids = request.data.get('ids', [])
#     download_type = request.query_params.get('type', 'json')
#     filename = request.query_params.get('filename', 'cart_download')
    
#     series_qs = Series.objects.filter(series_id__in=series_ids)
    
#     if download_type == 'json':
#         # prepare JSON response
#         data = {
#             'studies': [
#                 {
#                     'id': series.series_id,
#                     'title': series.title,
#                     'summary': series.summary,
#                 }
#                 for series in series_qs
#             ]
#         }
#         response = Response(data, content_type='application/json')
#         response['Content-Disposition'] = f'attachment; filename="{filename}.json"'
#         return response
    
#     elif download_type == 'csv':
#         # prepare CSV response
#         import csv
#         from io import StringIO

#         csv_file = StringIO()
#         csv_writer = csv.writer(csv_file)
#         csv_writer.writerow(['Series ID', 'Title', 'Summary'])
#         for series in series_qs:
#             csv_writer.writerow([series.series_id, series.title, series.summary])
#         response = Response(csv_file.getvalue(), content_type='text/csv')
#         response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
#         return response
    
#     else:
#         return Response(
#             {'error': 'Unsupported download type'},
#             status=status.HTTP_400_BAD_REQUEST
#         )