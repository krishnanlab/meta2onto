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

class GEOSeriesSerializer(serializers.ModelSerializer):
    """Serializer for GEOSeries model."""

    sample_count = serializers.SerializerMethodField(read_only=True)

    def get_sample_count(self, obj):
        """Get the number of samples associated with this series."""
        return obj.samples_ct if obj.samples_ct is not None else 0

    confidence = serializers.SerializerMethodField()

    def get_confidence(self, obj):
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

    def get_database(self, obj):
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

    def get_keywords(self, obj):
        """Extract keywords from the series summary."""
        if obj.keywords:
            return [kw.strip() for kw in obj.keywords.split(",")]
        return []
    
    feedback = serializers.SerializerMethodField()

    def get_feedback(self, obj) -> dict[str, int | float]:
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
        
        return feedback if feedback else {"avg_rating": 0, "vote_count": 0, "sum_rating": 0, "likes": 0, "dislikes": 0}
    
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
