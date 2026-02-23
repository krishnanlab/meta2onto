from rest_framework import serializers
from .models import (
    GEOSample,
    GEOSeries,
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

    class Meta:
        model = OntologySearchResults
        fields = [
            "id",
            "name",
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

    samples_ct = serializers.IntegerField(read_only=True)

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

    class Meta:
        model = GEOSeries
        fields = [
            "title",
            "gse",
            "status",
            "submission_date",
            "last_update_date",
            "pubmed_id",
            "summary",
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
            "samples_ct",
            # from joining with api_seriesdatabase
            "database",
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
