from uuid import uuid4
import uuid
from django.db import connection, models
from django.db.models import CharField, FloatField, IntegerField, OuterRef, Subquery
from django.db.models.sql.constants import INNER
from django.db.models.expressions import RawSQL
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import TrigramSimilarity, SearchVector
from django.contrib.postgres.fields import ArrayField

from django_cte import CTE, with_cte
from django_cte.raw import raw_cte_sql

from api.utils.results import dictfetchall

class TimeStampedModel(models.Model):
    """Abstract base with created/modified timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ===========================================================================
# === Reference types
# ===========================================================================


class Organism(models.Model):
    """
    Organism name or taxon identifier (free-text tolerant).
    Examples: 'Homo sapiens', 'Mus musculus', '9606'
    """
    name = models.CharField(unique=True)

    def __str__(self):
        return self.name

# ===========================================================================
# === Core entities
# === from GEOmetadb, https://gbnci.cancer.gov/geo/
# ===========================================================================

class GEOSeriesManager(models.Manager):
    @classmethod
    def search_gse_with_prob(cls, query: str, limit: int = 50):
        # CTE that yields (series_id, prob)
        hits = CTE(
            raw_cte_sql(
                """
                SELECT st.series_id AS series_id, st.prob
                FROM search_onto(%s, %s) so
                INNER JOIN api_searchterm st ON st.term = so.id
                LIMIT 100
                """,
                # params for search_onto(%s, %s)
                [query, limit],
                # tell django-cte the output column types
                {
                    "series_id": CharField(),
                    "prob": FloatField(),
                },
            ),
            name="hits",
        )

        # Join the CTE to your model on gse = series_id
        qs = hits.join(
            GEOSeries.objects.all(),
            gse=hits.col.series_id,
            _join_type=INNER,  # keeps GSE rows even if no match; use INNER if you only want matches
        ).annotate(
            prob=hits.col.prob
        )

        return with_cte(hits, select=qs)

    def search(self, query:str, max_results:int=50, order_by:str='relevance'):
        """
        Fetch GEO sample metadata by sample ID (GSM*).

        For details about the search_onto method used here, see
        /backend/src/api/migrations/0012_search_onto_func.py, the migration that
        introduces the search_onto function.
        """

        result = GEOSeriesManager.search_gse_with_prob(
            query=query, limit=max_results
        )

        # # annotate samples count
        # qs = result.annotate(
        #     samples_ct=Subquery(
        #         GEOSeriesRelations.objects
        #             .filter(series_id=OuterRef("gse"))
        #             .values("series_id")
        #             .annotate(c=models.Count("samples"))
        #             .values("c")[:1],
        #         output_field=IntegerField(),
        #     ),
        # )

        qs = result.annotate(
            samples_ct=Subquery(
                GEOSample.objects
                    .filter(series_id=OuterRef("gse"))
                    .values("series_id")
                    .annotate(c=models.Count("gsm"))
                    .values("c")[:1],
                output_field=IntegerField(),
            ),
        )

        if order_by == "relevance":
            qs = qs.order_by("-prob")
        elif order_by == "-relevance":
            qs = qs.order_by("prob")
        elif order_by == "samples":
            qs = qs.order_by("-samples_ct")

        return qs

class GEOSeries(models.Model):
    """
    the "gse" table from GEOmetadb.
    Originally fetched from https://gbnci.cancer.gov/geo/GEOmetadb.sqlite.gz
    on 2025-12-11.
    """

    objects = GEOSeriesManager()

    title = models.TextField(null=True, blank=True)
    gse = models.CharField(primary_key=True)
    status = models.CharField(null=True, blank=True)
    submission_date = models.CharField(null=True, blank=True)
    last_update_date = models.CharField(null=True, blank=True)
    pubmed_id = models.BigIntegerField(null=True, blank=True)
    summary = models.TextField(null=True, blank=True)
    type = models.CharField(null=True, blank=True)
    contributor = models.TextField(null=True, blank=True)
    web_link = models.TextField(null=True, blank=True)
    overall_design = models.TextField(null=True, blank=True)
    repeats = models.TextField(null=True, blank=True)
    repeats_sample_list = models.TextField(null=True, blank=True)
    variable = models.TextField(null=True, blank=True)
    variable_description = models.TextField(null=True, blank=True)
    contact = models.TextField(null=True, blank=True)
    supplementary_file = models.TextField(null=True, blank=True)

    # from original GEOSeries import
    doc = models.TextField(blank=True, null=True)

    # this is not actually a column, but will be annotated into
    # the model instances by the custom manager's search() method
    prob: float | None = None

    @property
    def database(self):
        inlined_db = getattr(self, "_database", None)

        if inlined_db is not None:
            return inlined_db
        else:
            return list(
                GEOSeriesDatabase.objects.filter(series_id=self.gse).values_list('database_name', flat=True)
            )

    class Meta:
        indexes = [
            models.Index(fields=['gse']),
        ]

    def __str__(self):
        return f"GEO Metadata for {self.gse}"
    
class GEOSample(models.Model):
    """
    the "gsm" table from GEOmetadb.
    Originally fetched from https://gbnci.cancer.gov/geo/GEOmetadb.sqlite.gz
    on 2025-12-11.
    """

    gsm = models.CharField(primary_key=True, help_text="GEOSample ID")
    title = models.TextField(null=True, blank=True)
    # series_id = models.TextField(null=True, blank=True)
    gpl_raw = models.TextField(null=True, blank=True, db_column="gpl", help_text="GEOPlatform ID")
    status = models.TextField(null=True, blank=True)
    submission_date = models.TextField(null=True, blank=True)
    last_update_date = models.TextField(null=True, blank=True)
    type = models.TextField(null=True, blank=True)
    source_name_ch1 = models.TextField(null=True, blank=True)
    organism_ch1 = models.TextField(null=True, blank=True)
    characteristics_ch1 = models.TextField(null=True, blank=True)
    molecule_ch1 = models.TextField(null=True, blank=True)
    label_ch1 = models.TextField(null=True, blank=True)
    treatment_protocol_ch1 = models.TextField(null=True, blank=True)
    extract_protocol_ch1 = models.TextField(null=True, blank=True)
    label_protocol_ch1 = models.TextField(null=True, blank=True)
    source_name_ch2 = models.TextField(null=True, blank=True)
    organism_ch2 = models.TextField(null=True, blank=True)
    characteristics_ch2 = models.TextField(null=True, blank=True)
    molecule_ch2 = models.TextField(null=True, blank=True)
    label_ch2 = models.TextField(null=True, blank=True)
    treatment_protocol_ch2 = models.TextField(null=True, blank=True)
    extract_protocol_ch2 = models.TextField(null=True, blank=True)
    label_protocol_ch2 = models.TextField(null=True, blank=True)
    hyb_protocol = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    data_processing = models.TextField(null=True, blank=True)
    contact = models.TextField(null=True, blank=True)
    supplementary_file = models.TextField(null=True, blank=True)
    data_row_count = models.IntegerField(null=True, blank=True)
    channel_count = models.IntegerField(null=True, blank=True)

    # from original GEOSample import
    doc = models.TextField(blank=True, null=True)

    # series_id column in the sample table contains the GSE id, e.g. "GSE12345"
    series = models.ForeignKey(
        "GEOSeries",
        to_field="gse",
        db_column="series_id",
        related_name="samples",
        on_delete=models.DO_NOTHING,
        db_constraint=False,
        null=True,
        blank=True,
    )

    # # the platform to which this sample belongs
    # platform = models.ForeignKey(
    #     "Platform",
    #     # to_field="gpl",
    #     db_column="gpl",
    #     related_name="samples",
    #     on_delete=models.DO_NOTHING,
    #     db_constraint=False,
    #     null=True,
    #     blank=True,
    # )

    class Meta:
        indexes = [
            models.Index(fields=['gsm']),
            models.Index(fields=['series']),
            models.Index(fields=['gpl_raw']),
        ]

    def __str__(self):
        return f"GEOSample Metadata for {self.gsm}"
    
class GEOPlatform(models.Model):
    """
    the "gpl" table from GEOmetadb.
    Originally fetched from https://gbnci.cancer.gov/geo/GEOmetadb.sqlite.gz
    on 2025-12-11.
    """

    gpl = models.CharField(primary_key=True)
    title = models.TextField(null=True, blank=True)
    status = models.TextField(null=True, blank=True)
    submission_date = models.TextField(null=True, blank=True)
    last_update_date = models.TextField(null=True, blank=True)
    technology = models.TextField(null=True, blank=True)
    distribution = models.TextField(null=True, blank=True)
    organism = models.TextField(null=True, blank=True)
    manufacturer = models.TextField(null=True, blank=True)
    manufacture_protocol = models.TextField(null=True, blank=True)
    coating = models.TextField(null=True, blank=True)
    catalog_number = models.TextField(null=True, blank=True)
    support = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    web_link = models.TextField(null=True, blank=True)
    contact = models.TextField(null=True, blank=True)
    data_row_count = models.IntegerField(null=True, blank=True)
    supplementary_file = models.TextField(null=True, blank=True)
    bioc_package = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['gpl']),
        ]

    def __str__(self):
        return f"GEO Platform Metadata for {self.gpl}"
    
# ----
# - lookup tables for GEO relations
# ----

class GEOSeriesToGEOPlatforms(models.Model):
    """
    Mapping from GEOSeries (GSE*) to GEOPlatforms (GPL*).

    Computed via the GEOSample table's 'gpl' column,
    grouped by 'series_id'.

    FIXME: this should eventually be a view rather than a table.
    """

    gse = models.CharField(unique=True)
    platforms = ArrayField(models.CharField(max_length=64), blank=True, default=list)

    class Meta:
        indexes = [
            models.Index(fields=['gse']),
        ]

    def __str__(self):
        return f"GEO Series {self.gse} to platforms {self.platforms}"


# ===========================================================================---------
# === Join tables / relations
# ===========================================================================---------

# class OrganismForPairing(models.Model):
#     """
#     Organism and status for a (GEOSeries, GEOSample, GEOPlatform) triplet.

#     Originates from ids__level-sample.parquet
#     """
#     organism = models.ForeignKey(Organism, on_delete=models.CASCADE)
#     status = models.CharField(null=True, blank=True)

#     series = models.ForeignKey(
#         GEOSeries, related_name='organism_pairings',
#         null=True, blank=True,
#         on_delete=models.DO_NOTHING,
#         db_constraint=False,
#     )
#     sample = models.ForeignKey(
#         GEOSample, related_name='organism_pairings',
#         null=True, blank=True,
#         on_delete=models.DO_NOTHING,
#         db_constraint=False,
#     )
#     platform = models.ForeignKey(
#         GEOPlatform, related_name='organism_pairings',
#         null=True, blank=True,
#         on_delete=models.DO_NOTHING,
#         db_constraint=False,
#     )

#     class Meta:
#         unique_together = ('series', 'sample', 'platform')
#         indexes = [
#             models.Index(fields=['series']),
#             models.Index(fields=['sample']),
#             models.Index(fields=['platform']),
#             models.Index(fields=['series', 'sample', 'platform']),
#         ]

#     def __str__(self):
#         return f'Organism {self.organism.name} (series {self.series_id}, sample {self.sample_id} platform {self.platform_id})'

class GEOSeriesRelations(models.Model):
    """
    Relation between a single GEOSeries and multiple GEOSamples and/or GEOPlatforms.

    Originates from ids__level-series.parquet, specifically the "||"-delimited 'samples' and 'platforms' columns.
    """

    series = models.ForeignKey(
        GEOSeries, related_name='series_relations',
        null=True, blank=True,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
    )

    samples = models.ManyToManyField(GEOSample, related_name='series_relations')
    platforms = models.ManyToManyField(GEOPlatform, related_name='series_relations')

# class ExternalRelation(models.Model):
#     """
#     Relation to external entities, e.g. URLs.

#     Originates from ids__level-series.parquet, specifically the 'relations' column,
#     which contains entries like the following:
    
#     BioProject: <URL>
#     SRA: <URL>
#     NA: <URL> (not sure if this is a literal NA)
#     ArrayExpress: <URL>
#     Peptidome: <URL>
#     SuperGEOSeries of: <series ID>
#     SubGEOSeries of:  <series ID>
#     Reanalyzed by: <series ID>
#     Superseded by: <series ID>
#     Alternative to: <series ID>
#     Reanalysis of: <sample ID>
#     Affiliated with: <series ID> | <sample ID>
#     Supersedes: <series ID> | <sample ID>
#     """

#     series = models.ForeignKey(
#         GEOSeries, related_name='external_relations',
#         null=True, blank=True,
#         on_delete=models.DO_NOTHING,
#         db_constraint=False,
#     )

#     relation_type = models.CharField(max_length=128)

  
#     to_url= models.CharField(null=True, blank=True, max_length=512)
#     to_sample = models.ForeignKey(
#         GEOSample, related_name='external_sample_relations',
#         null=True, blank=True,
#         on_delete=models.DO_NOTHING,
#         db_constraint=False,
#     )
#     to_series = models.ForeignKey(
#         GEOSample, related_name='external_series_relations',
#         null=True, blank=True,
#         on_delete=models.DO_NOTHING,
#         db_constraint=False,
#     )

#     def to_entity(self):
#         """
#         Return the target entity of the relation, whether GEOSample, GEOSeries, or URL.
#         """
#         if self.to_sample:
#             return self.to_sample.sample_id
#         elif self.to_series:
#             return self.to_series.series_id
#         else:
#             return self.to_url
        
#     def to_entity_by_type(self):
#         """
#         Return the target entity of the relation, based on relation_type.
#         """
#         if self.relation_type in ['SuperGEOSeries of', 'SubGEOSeries of', 'Reanalyzed by', 'Superseded by', 'Alternative to']:
#             return self.to_series.series_id if self.to_series else None
#         elif self.relation_type in ['Reanalysis of']:
#             return self.to_sample.sample_id if self.to_sample else None
#         elif self.relation_type in ['Reanalysis of']:
#             return self.to_sample.sample_id if self.to_sample else None
#         else:
#             return self.to_url

#     def __str__(self):
#         return f"{self.from_entity} --{self.relation_type}--> {self.to_entity}"
    

class GEOSeriesDatabase(models.Model):
    """
    Database source for a GEOSeries, e.g., GEO, ArrayExpress, SRA.

    We'll eventually use ExternalRelation for this, but for now it's faster to
    have a dedicated table that just lists databases.

    This model is populated by the management command import_series_databases
    which takes ids__level-series.parquet as an input, specifically its
    "relations" column.
    """

    series = models.ForeignKey(
        GEOSeries, related_name='databases',
        null=True, blank=True,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
    )
    database_name = models.CharField()
    url = models.CharField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['series']),
            models.Index(fields=['database_name']),
        ]

    def __str__(self):
        return f"{self.series.series_id} in {self.database_name}"

# ===========================================================================
# === Search-related Entities
# ===========================================================================

class SearchTermManager(models.Manager):
    def search(self, query):
        """
        Perform a search for the given query string across term and related_words.
        """
        qs = (
            self.get_queryset()
            .annotate(similarity=TrigramSimilarity("related_words", query))
            .filter(similarity__gt=0.3) 
            .order_by("-similarity")[:10]
        )
        # reduce queryset to only what rows will match in 
        return qs

class SearchTerm(models.Model):
    """
    Searchable terms extracted from the corpus for indexing and search.

    This is used to populate the autocomplete search box; see 
    backend.src.api.views.ontology_search for how the actual fetching
    of matching GEOSeries is performed.

    Originates from meta2onto_example_predictions.parquet
    """

    objects = SearchTermManager()

    term = models.CharField(max_length=256) # ontology term
    series = models.ForeignKey(
        GEOSeries, related_name='search_terms', 
        null=True, blank=True,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
    )
    prob = models.FloatField()
    log2_prob_prior = models.FloatField()
    related_words = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [
            # index term for exact matches
            models.Index(fields=['term']),
            GinIndex(
                name="term_related_words_trgm_gin",
                fields=["related_words"],
                opclasses=["gin_trgm_ops"],
            ),
        ]

    def __str__(self):
        return self.term


# ===========================================================================
# === Ontology search terms from meta-hq
# ===========================================================================

class OntologySearchResultsManager(models.Manager):
    def search(self, query:str, max_results:int=50):
        """
        Perform a search for the given query string across ontology terms + synonyms.

        Returns api_ontologyterms left-joined w/api_ontologysynonyms.
        """
        qs = self.get_queryset().raw(
            """
            SELECT * FROM search_onto(%(query)s, %(max_results)s)
            LIMIT %(max_results)s
            """, {'query': query, 'max_results': max_results}
        )
        return qs

    def search_series(self, query:str, max_results:int=50):
        """
        Perform a search for the given query string across ontology terms;
        joins the ontology terms against api_searchterm to get associated GEOSeries.
        Returns api_series entries matching the ontology search.
        Brings in metadata about each series from api_GEOSeries.
        """
        qs = self.get_queryset().raw(
            """
            SELECT so.id, gse.title, gse.summary
            FROM search_onto(%(query)s, %(max_results)s) AS so
            INNER JOIN api_searchterm AS st ON st.term = so.id
            INNER JOIN api_series AS sx ON sx.series_id = st.series_id
            INNER JOIN api_GEOSeries AS gse ON gse.gse = sx.series_id
            LIMIT %(max_results)s
            """, {'query': query, 'max_results': max_results}
        )
        return qs

# note that this table doesn't actually exist; it's intended to conform to the results of the
# search_onto postgres function, which returns the following columns:
# id varchar, name varchar, ontology varchar, type varchar,
# synonym varchar, scope varchar,
# sim real, scope_weight real, overall_rank real
class OntologySearchResults(models.Model):
    """
    Ontology search results with term details and similarity scores.

    Note that this is a virtual model representing the output of the search_onto function,
    accessed via the OntologySearchResultsManager's search() method.
    """

    objects = OntologySearchResultsManager()

    id = models.CharField(primary_key=True)
    name = models.CharField()
    ontology = models.CharField()
    type = models.CharField()
    synonym = models.CharField()
    scope = models.CharField()
    sim = models.FloatField()
    scope_weight = models.FloatField()
    overall_rank = models.FloatField()
    is_exact = models.BooleanField()

    def __str__(self):
        return f"{self.id} ({self.ontology}): {self.name} [{self.synonym}], rank: {self.overall_rank}"

    class Meta:
        managed = False

class OntologySearchDocs(models.Model):
    """
    Ontology search documents with term details and synonyms.
    """
    term_id = models.CharField(max_length=256)
    ontology = models.CharField(max_length=128)
    type = models.CharField(max_length=128, db_column='type')
    name = models.CharField(max_length=512)
    syn_exact = models.JSONField(null=True, blank=True)
    syn_narrow = models.JSONField(null=True, blank=True)
    syn_broad = models.JSONField(null=True, blank=True)
    syn_related = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['term_id']),
            models.Index(fields=['ontology']),
        ]

    def __str__(self):
        return f"{self.term_id} ({self.ontology})"


class OntologySynonyms(models.Model):
    """
    Ontology term synonyms with scope.
    """
    term_id = models.CharField(max_length=256)
    synonym = models.CharField(max_length=512)
    scope = models.CharField(max_length=64, db_column='scope')

    class Meta:
        indexes = [
            models.Index(fields=['term_id']),
            models.Index(fields=['synonym']),

            # Full-text GIN index on synonym (to_tsvector('simple', synonym))
            GinIndex(
                SearchVector('synonym', config='simple'),
                name='api_ontosyn_syn_tsv_idx',
            ),

            # Trigram GIN index on synonym (synonym gin_trgm_ops)
            GinIndex(
                fields=['synonym'],
                name='api_ontosyn_syn_trgm_idx',
                opclasses=['gin_trgm_ops'],
            ),
        ]

    def __str__(self):
        return f"{self.synonym} ({self.term_id})"


class OntologyTerms(models.Model):
    """
    Ontology terms with basic metadata.
    """
    id = models.CharField(max_length=256, primary_key=True)
    name = models.CharField(max_length=512)
    ontology = models.CharField(max_length=128)
    type = models.CharField(max_length=128, db_column='type')

    class Meta:
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['ontology']),
            models.Index(fields=['type']),

            # Full-text GIN index on name (to_tsvector('simple', name))
            GinIndex(
                SearchVector('name', config='simple'),
                name='api_ontoterms_name_tsv_idx',
            ),

            # Trigram GIN index on name (name gin_trgm_ops)
            GinIndex(
                fields=['name'],
                name='api_ontoterms_name_trgm_idx',
                opclasses=['gin_trgm_ops'],
            ),
        ]

    def __str__(self):
        return f"{self.id}: {self.name}"


# ===========================================================================
# === Cart server-side state
# ===========================================================================

class CartItem(models.Model):
    """
    An item in a user's cart.
    """

    series = models.ForeignKey(GEOSeries, on_delete=models.CASCADE)
    added_at = models.DateTimeField(null=True, blank=True)
    cart = models.ForeignKey(
        'Cart', null=True, blank=True, on_delete=models.CASCADE, related_name='items'
    )

    def __str__(self):
        return f"Cart item series {self.series.series_id}"
    
class Cart(models.Model):
    """
    A cart, identified by a unique ID.
    """

    # id = models.CharField(primary_key=True, default=lambda: uuid4().hex)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Shared cart {self.name} w/ID {self.id}"
