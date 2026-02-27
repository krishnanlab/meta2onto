from rest_framework import serializers
from .models import (
    GEOSample,
    GEOSeries,
    GEOSeriesToGEOPlatforms,
    Organism,
    GEOPlatform,
    SearchTerm,
    GEOSeries,
    GEOSample,
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


class GEOPlatformSerializer(serializers.ModelSerializer):
    """Serializer for GEOPlatform model."""

    class Meta:
        model = GEOPlatform
        fields = ["platform_id", "created_at", "updated_at"]


class GEOSeriesSerializer(serializers.ModelSerializer):
    """Serializer for GEOSeries model."""

    class Meta:
        model = GEOSeries
        fields = ["series_id", "doc", "created_at", "updated_at"]


class GEOSampleSerializer(serializers.ModelSerializer):
    """Serializer for GEOSample model."""

    id = serializers.CharField(source="gsm", read_only=True)
    # description = serializers.CharField(source='doc', read_only=True)

    class Meta:
        model = GEOSample
        # fields = ['sample_id', 'doc', 'created_at', 'updated_at']
        fields = ["id", "description", "data_processing"]


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


class GEOSampleSerializer(serializers.ModelSerializer):
    """Serializer for GEOSample model."""

    id = serializers.CharField(source="gsm", read_only=True)
    # description = serializers.CharField(source='doc', read_only=True)

    class Meta:
        model = GEOSample
        # fields = ['sample_id', 'doc', 'created_at', 'updated_at']
        fields = ["id", "description", "data_processing"]


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

    database = serializers.ListField(child=serializers.CharField(), read_only=True)

    # FIXME: renames to support frontend changes; i'm probably going to
    # keep the db layer the same to ease imports and just rename fields at the
    # serializer layer.
    id = serializers.CharField(source="gse", read_only=True)
    name = serializers.CharField(source="title", read_only=True)
    submitted_at = serializers.DateTimeField(source="submission_date", read_only=True)
    description = serializers.CharField(source="summary", read_only=True)
    # platform = serializers.CharField(source="database", read_only=True)

    platform = serializers.SerializerMethodField()

    def get_platform(self, obj):
        """Get the platform name associated with this series."""
        gse_obj = GEOSeriesToGEOPlatforms.objects.filter(gse=obj.gse).first()
        return str(gse_obj.platforms) if gse_obj else ""

    keywords = serializers.SerializerMethodField()

    def get_keywords(self, obj):
        """Extract keywords from the series summary."""
        if obj.summary:
            # This is a very naive keyword extraction based on splitting the summary into words.
            # In a real application, you might want to use a more sophisticated method.
            keywords = set(obj.summary.split())
            return list(keywords)[:10]  # Return top 10 keywords
        return []
    
    classification = serializers.SerializerMethodField()

    def get_classification(self, obj):
        """Returns values Positive or Negative; supposed to represent 'Classification of study in model training'?"""
        # FIXME: figure out how to actually determine this
        return "Positive"

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
            "database", # FIXME: review if still used
            "platform",

            "keywords",
            "classification",
        ]


# ===========================================================================
# === Cart server-side state
# ===========================================================================


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for CartItem model."""

    id = serializers.CharField(source="series.series_id", read_only=True)
    added = serializers.DateTimeField(source="added_at", read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "added"]


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
