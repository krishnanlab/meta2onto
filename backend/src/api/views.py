import csv
import re

from django.conf import settings
from django.db import models, transaction
from django.db.models import (
    Case,
    When,
    Value,
    Count,
    OuterRef,
    Subquery,
    IntegerField,
    CharField,
    F,
    Q,
    Func,
    Exists,
)
from django.db.models.expressions import RawSQL
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import (
    Cart,
    CartItem,
    GEOPlatform,
    GEOSample,
    GEOSeries,
    GEOSeriesToGEOPlatforms,
    GEOSeriesDatabase,
    ExternalDbRefs,
    OntologySearchResults,
    Organism,
    GEOPlatform,
    SearchTerm,
    OntologyTerms,
    OntologyTermRating,
    GEOSeries,
    Feedback,
    Facet,
)
from .serializers import (
    CartSerializer,
    GEOSampleSerializer,
    GEOSeriesSerializer,
    OntologySearchResultsSerializer,
    OrganismSerializer,
    GEOPlatformSerializer,
    SearchTermSerializer,
    GEOSeriesSerializer,
    DatabaseStatsSerializer,
)
from .utils.auth import CsrfExemptSessionAuthentication

# ===========================================================================
# === Helpers
# ===========================================================================


class LargeEntityPagination(LimitOffsetPagination):
    """
    Reduces the size of pages for large entity listings to improve performance.
    """

    default_limit = 5


class GEOSeriesSearchPagination(LimitOffsetPagination):
    """Limit/offset pagination that always returns facets with page metadata."""

    def get_paginated_response(self, data):  # type: ignore[override]
        return Response(
            {
                "count": self.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
                "facets": getattr(self, "facets", {}),
                "meta": getattr(self, "meta", {}),
            }
        )


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
    search_fields = ["name"]
    ordering_fields = ["id", "name"]
    ordering = ["id"]


# ===========================================================================
# === Core Entities
# ===========================================================================


class GEOPlatformViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing GEOPlatforms.
    Accessible at /api/platforms/
    """

    queryset = GEOPlatform.objects.all()
    serializer_class = GEOPlatformSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["gpl"]
    ordering_fields = ["gpl"]
    ordering = ["gpl"]


class GEOSeriesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing GEOSeries.
    Accessible at /api/series/
    """

    queryset = GEOSeries.objects.all()
    serializer_class = GEOSeriesSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["gse", "title", "summary"]
    ordering_fields = ["gse", "title"]
    ordering = ["gse"]
    pagination_class = GEOSeriesSearchPagination

    def _with_samples_count(self, queryset):
        """
        Keep queryset at one row per GEOSeries while annotating sample counts.
        """
        return GEOSeries.objects.with_samples_count(queryset)

    def _with_facet_buckets(self, queryset):
        """
        Add stable bucket annotations used by facets and filters.
        Assumes prob may or may not be present, and samples_ct is present.
        """
        return GEOSeries.objects.with_facet_buckets(queryset, confidence_levels=True, study_sizes=False)

    def _build_facets(self, queryset):
        """Compute facets for the search result set."""

        if settings.COMPUTE_FACETS_DYNAMICALLY:
            annotated_qs = self._with_samples_count(queryset)
            annotated_qs = self._with_facet_buckets(annotated_qs).order_by()

            # # confidence facet
            # removed b/c we now hardcode the response
            # confidence_counts = annotated_qs.values("confidence_level").annotate(
            #     count=Count("gse")
            # )

            # study size facet
            study_size_counts = annotated_qs.values("study_size").annotate(
                count=Count("gse")
            )

            # platform facet
            gse_list = list(queryset.values_list("gse", flat=True))

            platform_counts_qs = (
                GEOSeriesToGEOPlatforms.objects
                .filter(gse__in=gse_list)
                .annotate(
                    gpl=Func(F("platforms"), function="unnest", output_field=CharField())
                )
                .values("gse", "gpl")
                .distinct()
            )

            # platform facets are a little different; we need to return the ID
            # for display, but we use the gpl field as the key for searches
            platform_counts = (
                GEOPlatform.objects
                .filter(gpl__in=platform_counts_qs.values("gpl"))
                .values("gpl")
                .annotate(count=Count("gpl", distinct=True))
            )

            # also facet by technology
            technology_counts = (
                GEOPlatform.objects
                .filter(gpl__in=platform_counts_qs.values("gpl"))
                .values("technology")
                .annotate(count=Count("gpl", distinct=True))
            )

            # final facet results
            return {
                "Study Size": {
                    entry["study_size"]: entry["count"] for entry in study_size_counts
                },
                "Confidence": {
                    # entry["confidence_level"]: entry["count"] for entry in confidence_counts
                    "label": "Confidence",
                    "min": 0,
                    "max": 100,
                },
                "Platforms": {
                    (row["gpl"] or "unknown"): row["count"] for row in platform_counts
                },
                "Technologies": {
                    (row["technology"] or "unknown"): row["count"] for row in technology_counts
                },
            }
        else:
            # query Facet and FacetEntry tables for precomputed facet values
            facets = {}

            for facet in Facet.objects.prefetch_related("entries").all():
                if facet.min is not None and facet.max is not None:
                    # min/max facet
                    facets[facet.name] = {
                        "label": facet.name,
                        "min": facet.min,
                        "max": facet.max,
                    }
                else:
                    # categorical facet
                    facets[facet.name] = {
                        entry.name: entry.count
                        for entry in (
                            facet.entries
                                .filter(count__gte=1)
                                .order_by("-count")
                        )[:20]
                    }
            
            return facets


    # search by ontology ID (e.g., MONDO:0000270), which consults SearchTerm for
    # series matching the term
    # @method_decorator(cache_page(settings.LONGTERM_CACHE_TIMEOUT))
    @action(
        detail=False, methods=["get"], url_path="search", permission_classes=[AllowAny]
    )
    def search(self, request):
        query = request.query_params.get("query")
        ordering = request.query_params.get("ordering") or "relevance"
        offset = request.query_params.get("offset")
        limit = request.query_params.get("limit")

        if not query:
            return Response(
                {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "results": [],
                    "facets": {},
                    "meta": {
                        "term": query,
                        "performance": "unknown",
                    },
                }
            )

        max_results = settings.SEARCH_MAX_RESULTS

        # produce initial queryset based on search, which may include relevance annotations but is not yet filtered by facets
        results = GEOSeries.objects.search(query, max_results=max_results, order_by=ordering)

        # adds annotations used for building facets
        results = self._with_samples_count(results)
        results = self._with_facet_buckets(results)

        # Build facets BEFORE applying facet filters, so facets describe the full
        # searched result set
        facets = self._build_facets(results)

        # ---------------------------------------------------------------
        # --- apply faceting filter options from request
        # ---------------------------------------------------------------

        # if confidence is provided, filter by confidence bucket
        confidence = request.query_params.get("Confidence")
        if confidence in ["high", "medium", "low", "unknown"]:
            if confidence == "high":
                results = results.filter(prob__gte=0.8)
            elif confidence == "medium":
                results = results.filter(prob__gte=0.5, prob__lt=0.8)
            elif confidence == "low":
                results = results.filter(prob__lt=0.5)
            elif confidence == "unknown":
                results = results.filter(prob__isnull=True)
        elif re.match(r"^[0-9]+-[0-9]+$", confidence or ""):
            # check if confidence can be interpreted as a range like "70-90" and filter accordingly
            try:
                low, high = tuple(int(x) for x in confidence.split("-"))
                if 0 <= low <= 100:
                    results = results.filter(prob__gte=low / 100)
                if 0 <= high <= 100:
                    results = results.filter(prob__lte=high / 100)
            except ValueError:
                pass  # ignore invalid confidence values

        # if study size is provided, filter by samples_ct bucket
        study_size = request.query_params.get("Study Size")
        if study_size in ["small", "medium", "large"]:
            if study_size == "small":
                results = results.filter(samples_ct__lt=10)
            elif study_size == "medium":
                results = results.filter(samples_ct__gte=10, samples_ct__lte=50)
            elif study_size == "large":
                results = results.filter(samples_ct__gt=50)
        elif re.match(r"^[0-9]+-[0-9]+$", study_size or ""):
            # check if study size can be interpreted as a range like "10-50" and filter accordingly
            try:
                low, high = tuple(int(x) for x in study_size.split("-"))
                if low >= 0:
                    results = results.filter(samples_ct__gte=low)
                if high >= 0:
                    results = results.filter(samples_ct__lte=high)
            except ValueError:
                pass  # ignore invalid study size values

        # if platforms is provided:
        # 1. get GPLs whose technology is in requested platform technologies
        # 2. find GSEs whose platforms array overlaps those GPLs
        # 3. filter results to those GSEs
        platforms = request.query_params.getlist("Platforms")
        if platforms:
            # gpls = list(
            #     GEOPlatform.objects.filter(technology__in=platforms).values_list(
            #         "gpl", flat=True
            #     )
            # )

            gpls = list(platforms)

            gse_values = (
                GEOSeriesToGEOPlatforms.objects.filter(platforms__overlap=gpls)
                .values_list("gse", flat=True)
                .distinct()
            )

            results = results.filter(gse__in=Subquery(gse_values))

        # if Technologies is provided, do the following:
        # 1. find GPLs whose technology is in requested technologies
        # 2. find GSEs whose platforms array overlaps those GPLs
        # 3. filter results to those GSEs
        technologies = request.query_params.getlist("Technologies")
        if technologies:
            tech_gpls = list(
                GEOPlatform.objects.filter(technology__in=technologies).values_list(
                    "gpl", flat=True
                )
            )

            tech_gse_values = (
                GEOSeriesToGEOPlatforms.objects.filter(platforms__overlap=tech_gpls)
                .values_list("gse", flat=True)
                .distinct()
            )

            results = results.filter(gse__in=Subquery(tech_gse_values))

        # if Databases is provided, filter results to those GSEs whose database
        # field matches the requested databases in either of our two tables for
        # databases, GEOSeriesDatabase or ExternalDbRefs
        # (which, on writing this out, i realized we should probably merge)
        databases = request.query_params.getlist("Databases")
        if databases:
            for db in databases:
                if db in GEOSeriesDatabase.objects.values_list("database", flat=True):
                    in_geo_series_database = GEOSeriesDatabase.objects.filter(
                        series_id=OuterRef("gse"),
                        database=db,
                    )
                else:
                    in_geo_series_database = GEOSeriesDatabase.objects.none()

                if db in ExternalDbRefs.objects.values_list("database", flat=True):
                    in_external_refs = ExternalDbRefs.objects.filter(
                        series_id=OuterRef("gse"),
                        database=db,
                    )
                else:
                    in_external_refs = ExternalDbRefs.objects.none()

                results = results.filter(
                    Exists(in_geo_series_database) | Exists(in_external_refs)
                )

        # ---------------------------------------------------------------
        # --- apply ordering, limit options from request
        # ---------------------------------------------------------------

        # apply ordering again after facet filters if needed
        if ordering == "relevance":
            results = results.order_by("-prob", "gse")
        elif ordering == "-relevance":
            results = results.order_by("prob", "gse")
        elif ordering == "date":
            results = results.order_by("-submission_date", "gse")
        elif ordering == "-date":
            results = results.order_by("submission_date", "gse")
        elif ordering == "samples":
            results = results.order_by("-samples_ct", "gse")
        elif ordering == "-samples":
            results = results.order_by("samples_ct", "gse")

        # paginate the response
        if limit is not None:
            self.pagination_class.limit = limit
        else:
            self.pagination_class.limit = self.pagination_class.default_limit

        self.pagination_class.offset = offset or 0

        # ---------------------------------------------------------------
        # --- build final result set, either paginated or not
        # ---------------------------------------------------------------


        try:
            rec_type, rec_name = OntologyTerms.objects.filter(id=query).values_list("type", "name").first()
        except TypeError:
            rec_type, rec_name = "", ""
    
        performance_row = (
            OntologyTermRating.objects
                .filter(term=query).values("performance").first()
        )
        meta = {
            "term": query,
            "name": rec_name,
            "type": rec_type,
            "performance": (
                performance_row.get("performance", "unknown")
                if performance_row else
                "unknown"
            )
        }

        if self.paginator is not None:
            self.paginator.facets = facets
            self.paginator.meta = meta

        page = self.paginate_queryset(results)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(results, many=True)
        return Response(
            {
                "count": results.count(),
                "next": None,
                "previous": None,
                "results": serializer.data,
                "facets": facets,
                "meta": meta,
            }
        )

    # provide a /lookup action to get series by a list of ids
    @method_decorator(csrf_exempt)
    @action(
        detail=False, methods=["post"], url_path="lookup", permission_classes=[AllowAny]
    )
    def lookup(self, request):
        # takes a list of series_ids in the body
        series_ids = request.data.get("ids", [])
        queryset = self.get_queryset().filter(gse__in=series_ids)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # nest /samples to find related samples for a series
    @action(
        detail=True, methods=["get"], url_path="samples", permission_classes=[AllowAny]
    )
    def samples(self, request, pk=None):
        series = self.get_object()
        samples = GEOSample.objects.filter(series_set__contains=series.gse).all()

        # if query was provided, search within the samples for that series
        query = request.query_params.get("query")
        if query:
            samples = samples.filter(
                models.Q(gsm__icontains=query)
                | models.Q(title__icontains=query)
                | models.Q(data_processing__icontains=query)
                | models.Q(description__icontains=query)
            ).distinct()

        page = self.paginate_queryset(samples)
        if page is not None:
            serializer = GEOSampleSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = GEOSampleSerializer(samples, many=True)
        return Response(serializer.data)

    # allow users to post feedback to a study
    @method_decorator(csrf_exempt)
    @action(
        detail=False, methods=["post"], url_path="feedback", permission_classes=[AllowAny]
    )
    def feedback(self, request):
        try:
            Feedback.objects.update_or_create(
                series_id=GEOSeries.objects.get(gse=request.data.get("id")),
                user_id=request.headers.get("X-User-UUID", ""),
                defaults={
                    "name": request.data.get("user", {}).get("name", ""),
                    "email": request.data.get("user", {}).get("email", ""),
                    "rating": request.data.get("rating"),
                    "qualities": request.data.get("qualities", []),
                    "keywords": request.data.get("keywords", {}),
                    "elaborate": request.data.get("elaborate", ""),
                }
            )

            return Response({"status": "success"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
            )


class GEOSampleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for viewing GEOSamples.
    Accessible at /api/samples/
    """

    queryset = GEOSample.objects.all()
    serializer_class = GEOSampleSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["gsm", "doc", "search_terms__term"]
    ordering_fields = ["gsm", "created_at", "updated_at"]
    ordering = ["gsm"]


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
    search_fields = ["term", "related_words", "sample_id"]
    ordering_fields = ["id", "term", "prob", "log2_prob_prior"]
    ordering = ["id"]


# ===========================================================================
# === Ontology search terms from meta-hq
# ===========================================================================


@api_view(["GET"])
@permission_classes([AllowAny])
def ontology_search(request):
    """
    API endpoint for searching ontology terms.
    Accessible at /api/ontology-search/

    Query parameters:
    - query (required): The search query string
    - max_results (optional): Maximum number of results to return (default: 50)
    """
    query = request.query_params.get("query")
    max_results = request.query_params.get("max_results", 50)

    if not query:
        # return an empty list if no query is provided
        return Response([])

    try:
        max_results = int(max_results)
    except ValueError:
        return Response(
            {"error": "max_results must be an integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    results = OntologySearchResults.objects.search(query, max_results)
    serializer = OntologySearchResultsSerializer(results, many=True)
    return Response(serializer.data)

# ===========================================================================
# === Database-wide statistics
# ===========================================================================

def _cache_fetch(key, compute_func, timeout=settings.LONGTERM_CACHE_TIMEOUT):
    """
    Fetch a value from the cache, computing and caching it if not present.
    """
    value = cache.get(key)
    if value is None:
        value = compute_func()
        cache.set(key, value, timeout=timeout)
    return value

@api_view(["GET"])
@permission_classes([AllowAny])
def database_statistics(request):
    """
    API endpoint for getting statistics about the database.
    Accessible at /api/stats/
    """
    serializer = DatabaseStatsSerializer({
        "tissues": _cache_fetch("site-stats:tissues", lambda: OntologyTerms.objects.filter(type="tissue").count()),
        "diseases": _cache_fetch("site-stats:diseases", lambda: OntologyTerms.objects.filter(type="disease").count()),
        "studies": _cache_fetch("site-stats:studies", lambda: GEOSeries.objects.count()),
        "samples": _cache_fetch("site-stats:samples", lambda: GEOSample.objects.count()),
        "species": _cache_fetch("site-stats:species", lambda: GEOSample.objects.values("organism_ch1").distinct().count()),
        "technologies": _cache_fetch("site-stats:technologies", lambda: GEOPlatform.objects.values("technology").distinct().count()),
        "feedback": Feedback.objects.count(),
    }, many=False)
    return Response(serializer.data)


# ===========================================================================
# === Cart share, download views
# ===========================================================================

@method_decorator(csrf_exempt, name="dispatch")
class CartViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and managing Carts.
    Accessible at /api/cart/
    """

    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["id", "name", "created_at"]
    ordering = ["id"]
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
            series_list = request.data.get("studies", [])
            cart_name = request.data["name"]
            cart = Cart.objects.create(name=cart_name)

            # create CartItem objects for each series
            for series_data in series_list:
                series_id = series_data["id"]
                added_at = series_data.get("added")
                try:
                    series = GEOSeries.objects.get(series_id=series_id)
                    CartItem.objects.create(series=series, added_at=added_at, cart=cart)
                except GEOSeries.DoesNotExist:
                    continue  # skip invalid series ids

            serializer = self.get_serializer(cart)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    # provide a /download action to download cart contents
    @action(
        detail=False,
        methods=["post"],
        url_path="download",
        permission_classes=[AllowAny],
    )
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
        series_ids = request.data.get("ids", [])
        download_type = request.query_params.get("type", "json")
        filename = request.query_params.get("filename", "cart_download")

        series_qs = GEOSeries.objects.filter(gse__in=series_ids)

        if download_type == "json":
            # prepare JSON response
            data = {
                "studies": [
                    {
                        "id": series.gse,
                        "title": series.title,
                        "summary": series.summary,
                    }
                    for series in series_qs
                ]
            }
            response = Response(data, content_type="application/json")
            response["Content-Disposition"] = f'attachment; filename="{filename}.json"'
            return response

        elif download_type == "csv":
            # prepare CSV response
            response = HttpResponse(content_type="text/csv; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'

            # Helps Excel correctly detect UTF-8
            response.write("\ufeff")

            writer = csv.writer(response)
            writer.writerow(["GEOSeries ID", "Title", "Summary"])
            for series in series_qs:
                writer.writerow([series.gse, series.title, series.summary])

            return response

        else:
            return Response(
                {"error": "Unsupported download type"},
                status=status.HTTP_400_BAD_REQUEST,
            )
