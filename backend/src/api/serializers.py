from rest_framework import serializers
from .models import (
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
        fields = ['id', 'name']


class PlatformSerializer(serializers.ModelSerializer):
    """Serializer for Platform model."""
    
    class Meta:
        model = Platform
        fields = ['platform_id', 'created_at', 'updated_at']


class SeriesSerializer(serializers.ModelSerializer):
    """Serializer for Series model."""
    
    class Meta:
        model = Series
        fields = ['series_id', 'doc', 'created_at', 'updated_at']


class SampleSerializer(serializers.ModelSerializer):
    """Serializer for Sample model."""
    
    class Meta:
        model = Sample
        fields = ['sample_id', 'doc', 'created_at', 'updated_at']


# ===========================================================================
# === Join tables / relations
# ===========================================================================

class OrganismForPairingSerializer(serializers.ModelSerializer):
    """Serializer for OrganismForPairing model."""
    organism_name = serializers.CharField(source='organism.name', read_only=True)

    class Meta:
        model = OrganismForPairing
        fields = [
            'id',
            'organism',
            'organism_name',
            'status',
            'series',
            'sample',
            'platform',
        ]


class SeriesRelationsSerializer(serializers.ModelSerializer):
    """Serializer for SeriesRelations model."""
    series_id = serializers.CharField(source='series.series_id', read_only=True)
    sample_ids = serializers.SerializerMethodField()
    platform_ids = serializers.SerializerMethodField()
    
    class Meta:
        model = SeriesRelations
        fields = [
            'id',
            'series',
            'series_id',
            'samples',
            'sample_ids',
            'platforms',
            'platform_ids',
        ]
    
    def get_sample_ids(self, obj):
        """Return list of sample IDs."""
        return [sample.sample_id for sample in obj.samples.all()]
    
    def get_platform_ids(self, obj):
        """Return list of platform IDs."""
        return [platform.platform_id for platform in obj.platforms.all()]


class ExternalRelationSerializer(serializers.ModelSerializer):
    """Serializer for ExternalRelation model."""
    
    class Meta:
        model = ExternalRelation
        fields = ['id', 'from_entity', 'to_entity', 'relation_type']


# ===========================================================================
# === Search-related Entities
# ===========================================================================

class SearchTermSerializer(serializers.ModelSerializer):
    """Serializer for SearchTerm model."""
    
    class Meta:
        model = SearchTerm
        fields = ['id', 'term', 'series_id', 'prob', 'log2_prob_prior', 'related_words']


# ===========================================================================
# === Ontology search terms from meta-hq
# ===========================================================================

class OntologySearchResultsSerializer(serializers.ModelSerializer):
    """Serializer for OntologySearchResults model."""
    
    class Meta:
        model = OntologySearchResults
        fields = [
            'id',
            'name',
            'ontology',
            'type',
            'synonym',
            'scope',
            'sim',
            'scope_weight',
            'overall_rank',
            'is_exact',
        ]

class OntologySearchDocsSerializer(serializers.ModelSerializer):
    """Serializer for OntologySearchDocs model."""
    
    class Meta:
        model = OntologySearchDocs
        fields = [
            'id',
            'term_id',
            'ontology',
            'type',
            'name',
            'syn_exact',
            'syn_narrow',
            'syn_broad',
            'syn_related',
        ]

class OntologySynonymsSerializer(serializers.ModelSerializer):
    """Serializer for OntologySynonyms model."""
    
    class Meta:
        model = OntologySynonyms
        fields = [
            'id',
            'term_id',
            'synonym',
            'scope',
        ]

class OntologyTermsSerializer(serializers.ModelSerializer):
    """Serializer for OntologyTerms model."""
    
    class Meta:
        model = OntologyTerms
        fields = [
            'id',
            'name',
            'ontology',
            'type',
        ]

# ===========================================================================
# === GEO Series Metadata
# ===========================================================================

class GEOSeriesMetadataSerializer(serializers.ModelSerializer):
    """Serializer for GEOSeriesMetadata model."""

    samples = serializers.IntegerField(read_only=True)

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
    
    database = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    
    class Meta:
        model = GEOSeriesMetadata
        fields = [
            'title',
            'gse',
            'status',
            'submission_date',
            'last_update_date',
            'pubmed_id',
            'summary',
            'type',
            'contributor',
            'web_link',
            'overall_design',
            'repeats',
            'repeats_sample_list',
            'variable',
            'variable_description',
            'contact',
            'supplementary_file',

            # from joining with api_searchterm
            'confidence',

            # from joining with api_sample count
            'samples',

            # from joining with api_seriesdatabase
            'database',
        ]

# ===========================================================================
# === Cart server-side state
# ===========================================================================

class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for CartItem model."""
    id = serializers.CharField(source='series.series_id', read_only=True)
    added = serializers.DateTimeField(source='added_at', read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id',
            'added'
        ]

class CartSerializer(serializers.ModelSerializer):
    """Serializer for Cart model."""
    studies = CartItemSerializer(source='items', many=True, read_only=True)

    class Meta:
        model = Cart
        fields = [
            'id',
            'name',
            'studies',
        ]
