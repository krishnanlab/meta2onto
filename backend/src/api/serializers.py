from typing import TypedDict

from rest_framework import serializers
from django.db.models import Avg, Count, Sum, Q

from .models import (
    Feedback,
    GEOSample,
    GEOSeries,
    Organism,
    GEOPlatform,
    SearchTerm,
    OntologySearchResults,
    OntologySearchDocs,
    OntologySynonyms,
    OntologyTerms,
    Cart,
    CartItem,
)

# ===========================================================================
# === Reference, Core Entities
# ===========================================================================


class OrganismSerializer(serializers.ModelSerializer):
    """Serializer for Organism model."""

    class Meta:
        model = Organism
        fields = ["id", "name"]


# ===========================================================================
# === Search-related Entities
# ===========================================================================


class SearchTermSerializer(serializers.ModelSerializer):
    """Serializer for SearchTerm model."""

    class Meta:
        model = SearchTerm
        fields = ["id", "term", "series_id", "prob", "log2_prob_prior", "related_words"]


# ===========================================================================
# === Ontology search terms from meta-hq
# ===========================================================================


class OntologySearchResultsSerializer(serializers.ModelSerializer):
    """Serializer for OntologySearchResults model."""

    # FIXME: these are dummy values to satisfy frontend typechecking, but
    # i need to check w/VR to see what he actually wanted it to return
    description = serializers.CharField(source="name", read_only=True)
    series = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = OntologySearchResults
        fields = [
            "id",
            "name",
            "description",
            "series",
            "ontology",
            "type",
            "synonym",
            "scope",
            "sim",
            "scope_weight",
            "overall_rank",
            "is_exact",

            # joined in from the api_ontologytermrating table
            "performance",
        ]


class OntologySearchDocsSerializer(serializers.ModelSerializer):
    """Serializer for OntologySearchDocs model."""

    class Meta:
        model = OntologySearchDocs
        fields = [
            "id",
            "term_id",
            "ontology",
            "type",
            "name",
            "syn_exact",
            "syn_narrow",
            "syn_broad",
            "syn_related",
        ]


class OntologySynonymsSerializer(serializers.ModelSerializer):
    """Serializer for OntologySynonyms model."""

    class Meta:
        model = OntologySynonyms
        fields = [
            "id",
            "term_id",
            "synonym",
            "scope",
        ]


class OntologyTermsSerializer(serializers.ModelSerializer):
    """Serializer for OntologyTerms model."""

    class Meta:
        model = OntologyTerms
        fields = [
            "id",
            "name",
            "ontology",
            "type",
        ]


# ===========================================================================
# === GEO Metadata
# ===========================================================================

class GEOPlatformSerializer(serializers.ModelSerializer):
    """Serializer for GEOPlatform model."""

    class Meta:
        model = GEOPlatform
        fields = "__all__"


class ConfidenceInfo(TypedDict):
    """Confidence bucket label and the underlying probability score it's derived from."""

    name: str
    value: float | None


class DatabaseInfo(TypedDict, total=False):
    """Info about where a study is hosted in a particular external database."""

    url: str | None
    external_id: str | None


class FeedbackStats(TypedDict):
    """Aggregate user feedback counts for a study."""

    vote_count: int
    likes: int
    dislikes: int


class GEOSeriesSerializer(serializers.ModelSerializer):
    """Serializer for GEOSeries model."""

    # populated via GEOSeriesManager.search_gse_with_prob(); not a real model field
    classification = serializers.CharField(read_only=True)

    sample_count = serializers.SerializerMethodField(read_only=True)

    def get_sample_count(self, obj) -> int:
        """Get the number of samples associated with this series."""
        return obj.samples_ct if obj.samples_ct is not None else 0

    confidence = serializers.SerializerMethodField()

    def get_confidence(self, obj) -> ConfidenceInfo:
        """Compute confidence level based on prob."""
        if obj.prob is None:
            label = "unknown"
        elif obj.prob >= 0.8:
            label = "high"
        elif obj.prob >= 0.5:
            label = "medium"
        else:
            label = "low"
        return {"name": label, "value": obj.prob}

    database = serializers.SerializerMethodField()

    def get_database(self, obj) -> dict[str, DatabaseInfo]:
        series_dbs = {
            item.database: {
                "url": item.url.strip() if item.url else item.url,
            }
            for item in obj.databases.all()
        }

        external_refs = {
            item.database: {
                "external_id": (
                    item.external_id.strip()
                    if item.external_id else item.external_id
                ),
            }
            for item in obj.external_db_refs.all()
        }

        return {**series_dbs, **external_refs}

    # FIXME: renames to support frontend changes; i'm probably going to
    # keep the db layer the same to ease imports and just rename fields at the
    # serializer layer.
    id = serializers.CharField(source="gse", read_only=True)
    name = serializers.CharField(source="title", read_only=True)
    submitted_at = serializers.DateField(source="submission_date", read_only=True)
    description = serializers.CharField(source="summary", read_only=True)
    # platform = serializers.CharField(source="database", read_only=True)

    platform = serializers.SerializerMethodField()

    def get_platform(self, obj) -> list[str] | None:
        """Get the platform name associated with this series."""
        platforms = getattr(obj, "prefetched_platforms", [])
        return [x.platform for x in platforms] if platforms else []

    keywords = serializers.SerializerMethodField()

    def get_keywords(self, obj) -> list[str]:
        """Extract keywords from the series summary."""
        if obj.keywords:
            return [kw.strip() for kw in obj.keywords.split(",")]
        return []
    
    feedback = serializers.SerializerMethodField()

    def get_feedback(self, obj) -> FeedbackStats:
        """Returns aggregate rating and number of votes for this series.
        
        In the Feedback model, "likes" have a rating of 1 and "dislikes" have a rating of -1.

        """
        feedback = (
            Feedback.objects.filter(series_id=obj)
                .aggregate(
                    vote_count=Count('id'),
                    likes=Count('id', filter=Q(rating=1)),
                    dislikes=Count('id', filter=Q(rating=-1)),
                )
        )
        
        return feedback if feedback else {"vote_count": 0, "likes": 0, "dislikes": 0}
    
    organisms = serializers.SerializerMethodField()

    def get_organisms(self, obj) -> list[str]:
        sentinel = object()
        annotated_organisms = getattr(obj, "organism_names", sentinel)

        if annotated_organisms is not sentinel:
            return annotated_organisms or []

        return [
            organism.organism
            for organism in obj.organisms.all()
        ]
    
    # technologies = serializers.SlugRelatedField(
    #     many=True,
    #     read_only=True,
    #     slug_field="technology",
    # )

    class Meta:
        model = GEOSeries
        fields = [
            # "title",
            "name",
            # "gse",
            "id",
            "status",
            # "submission_date",
            "submitted_at",
            "last_update_date",
            "pubmed_id",
            "summary", # FIXME: review if still used
            "description",
            "type",
            "contributor",
            "web_link",
            "overall_design",
            "repeats",
            "repeats_sample_list",
            "variable",
            "variable_description",
            "contact",
            "supplementary_file",
            # from joining with api_searchterm
            "confidence",
            # from joining with api_sample count
            "sample_count", # FIXME: review if samples_ct can be remapped to this
            # from joining with api_seriesdatabase
            "database",
            "platform",
            "organisms",
            # "technologies",

            "keywords",
            "classification",
            "feedback"
        ]

class GEOSampleSerializer(serializers.ModelSerializer):
    """Serializer for GEOSample model."""

    id = serializers.CharField(source="gsm", read_only=True)
    # description = serializers.CharField(source='doc', read_only=True)

    class Meta:
        model = GEOSample
        # fields = ['sample_id', 'doc', 'created_at', 'updated_at']
        fields = "__all__"


# ===========================================================================
# === Database statistics
# ===========================================================================

class DatabaseStatsSerializer(serializers.Serializer):
    """Serializer for database statistics returned from /api/stats/ endpoint."""

    tissues = serializers.IntegerField()
    diseases = serializers.IntegerField()
    studies = serializers.IntegerField()
    samples = serializers.IntegerField()
    species = serializers.IntegerField()
    technologies = serializers.IntegerField()
    feedback = serializers.IntegerField()



# ===========================================================================
# === Cart server-side state
# ===========================================================================


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for CartItem model."""

    id = serializers.CharField(source="series.gse", read_only=True)
    search = serializers.CharField(read_only=True)
    term = serializers.CharField(read_only=True)
    added = serializers.DateTimeField(source="added_at", read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "search",
            "term",
            "added"
        ]


class CartSerializer(serializers.ModelSerializer):
    """Serializer for Cart model."""

    studies = CartItemSerializer(source="items", many=True, read_only=True)

    class Meta:
        model = Cart
        fields = [
            "id",
            "name",
            "studies",
        ]


class CartItemCreateRequestSerializer(serializers.Serializer):
    """A single study entry provided when creating a shared cart."""

    id = serializers.CharField(help_text="GSE id of the study")
    search = serializers.CharField(required=False, allow_blank=True)
    term = serializers.CharField(required=False, allow_blank=True)
    added = serializers.DateTimeField(required=False, allow_null=True)


class CartCreateRequestSerializer(serializers.Serializer):
    """Request body for POST /api/cart/."""

    name = serializers.CharField()
    studies = CartItemCreateRequestSerializer(many=True, required=False)


# ===========================================================================
# === Study search/lookup/samples/feedback request & response shapes
# ===========================================================================


class NumericFacet(TypedDict):
    """A facet whose values form a continuous numeric range (e.g. a slider)."""

    label: str
    min: int
    max: int


class SearchMeta(TypedDict):
    """Metadata about the ontology term a study search was performed for."""

    term: str
    name: str
    type: str
    performance: str


class GEOSeriesSearchResponseSerializer(serializers.Serializer):
    """
    Response shape produced by GEOSeriesSearchPagination, used by
    GEOSeriesViewSet's list/search/lookup actions.
    """

    count = serializers.IntegerField()
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = GEOSeriesSerializer(many=True)
    facets = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()

    def get_facets(self, obj) -> dict[str, dict[str, int] | NumericFacet]:
        return obj.get("facets", {})

    def get_meta(self, obj) -> SearchMeta:
        return obj.get("meta", {})


class GEOSampleSearchResponseSerializer(serializers.Serializer):
    """Response shape for GET /api/study/{gse}/samples/."""

    count = serializers.IntegerField()
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = GEOSampleSerializer(many=True)


class StudyLookupRequestSerializer(serializers.Serializer):
    """Request body for POST /api/study/lookup/."""

    ids = serializers.ListField(
        child=serializers.CharField(), help_text="GSE ids to look up"
    )


class StudyFeedbackUserSerializer(serializers.Serializer):
    """Optional self-identification info submitted alongside study feedback."""

    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)


class StudyFeedbackRequestSerializer(serializers.Serializer):
    """Request body for POST /api/study/feedback/."""

    id = serializers.CharField(help_text="GSE id of the study being rated")
    user = StudyFeedbackUserSerializer(required=False)
    rating = serializers.IntegerField(
        min_value=-1, max_value=1, required=False, allow_null=True
    )
    qualities = serializers.ListField(child=serializers.CharField(), required=False)
    keywords = serializers.DictField(child=serializers.CharField(), required=False)
    elaborate = serializers.CharField(required=False, allow_blank=True)


class StatusResponseSerializer(serializers.Serializer):
    """Simple status response, e.g. from POST /api/study/feedback/."""

    status = serializers.CharField()
    message = serializers.CharField(required=False)
