import uuid

from django.db import models
from django.db.models import (
    Case,
    When,
    Value,
    CharField,
    IntegerField,
    FloatField,
    Count,
    OuterRef,
    Subquery,
)
from django.db.models.functions import Coalesce
from django.db.models.sql.constants import INNER
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import TrigramSimilarity, SearchVector
from django.contrib.postgres.fields import ArrayField

from django_cte import CTE, with_cte
from django_cte.raw import raw_cte_sql


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
    def with_samples_count(self, queryset=None):
        """
        Annotate each GEOSeries row with samples_ct using a Subquery so the
        queryset stays one-row-per-series.
        """
        if queryset is None:
            queryset = self.get_queryset()

        return queryset.annotate(
            samples_ct=Coalesce(
                Subquery(
                    GEOSample.objects.filter(series_id=OuterRef("gse"))
                    .values("series_id")
                    .annotate(c=Count("gsm"))
                    .values("c")[:1],
                    output_field=IntegerField(),
                ),
                Value(0),
                output_field=IntegerField(),
            )
        )

    def with_facet_buckets(self, queryset=None):
        """
        Annotate a queryset with:
          - confidence_level, derived from prob
          - study_size, derived from samples_ct
        Assumes prob and samples_ct are already present or may be null.
        """
        if queryset is None:
            queryset = self.get_queryset()

        return queryset.annotate(
            confidence_level=Case(
                When(prob__gte=0.8, then=Value("high")),
                When(prob__gte=0.5, then=Value("medium")),
                When(prob__lt=0.5, then=Value("low")),
                default=Value("unknown"),
                output_field=CharField(),
            ),
            study_size=Case(
                When(samples_ct__lt=10, then=Value("small")),
                When(samples_ct__gte=10, samples_ct__lte=50, then=Value("medium")),
                When(samples_ct__gt=50, then=Value("large")),
                default=Value("unknown"),
                output_field=CharField(),
            ),
        )

    def search_gse_with_prob(self, query: str, limit: int = 50):
        """
        Returns a queryset of GEOSeries joined to a CTE containing:
            (series_id, prob)

        'query' should be an ontology ID from api_searchterm,
        e.g. 'MONDO:0000270'.
        """
        hits = CTE(
            raw_cte_sql(
                """
                SELECT
                    st.series_id AS series_id,
                    st.confidence AS prob,
                    st.related_words AS keywords
                FROM api_searchterm st
                WHERE st.term = %s
                LIMIT %s
                """,
                [query, limit],
                {
                    "series_id": CharField(),
                    "prob": FloatField(),
                },
            ),
            name="hits",
        )

        qs = hits.join(
            self.get_queryset(),
            gse=hits.col.series_id,
            _join_type=INNER,
        ).annotate(prob=hits.col.prob)

        # we need to join against api_searchterm and retrieve related_words for each GSE
        # on the following fields:
        # - series_id=the GSE ID
        # - term=the original query term
        qs = qs.annotate(
            keywords=Subquery(
                SearchTerm.objects.filter(
                    series_id=OuterRef("gse"),
                    term=query,
                ).values("related_words")[:1]
            )
        )

        return with_cte(hits, select=qs)

    def search(self, query: str, max_results: int = 50, order_by: str = "relevance"):
        """
        Search GEOSeries and return a stable queryset annotated with:
          - prob
          - samples_ct
        """
        qs = self.search_gse_with_prob(query=query, limit=max_results)
        qs = self.with_samples_count(qs)

        if order_by == "relevance":
            qs = qs.order_by("-prob", "gse")
        elif order_by == "-relevance":
            qs = qs.order_by("prob", "gse")
        elif order_by == "date":
            qs = qs.order_by("-submission_date", "gse")
        elif order_by == "-date":
            qs = qs.order_by("submission_date", "gse")
        elif order_by == "samples":
            qs = qs.order_by("-samples_ct", "gse")
        elif order_by == "-samples":
            qs = qs.order_by("samples_ct", "gse")
        else:
            qs = qs.order_by("gse")

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

    doc = models.TextField(blank=True, null=True)

    # runtime annotations
    prob: float | None = None
    keywords: str | None = None
    samples_ct: int | None = None
    confidence_level: str | None = None
    study_size: str | None = None

    @property
    def database(self):
        series_dbs = {k: {"url": v} for (k,v) in GEOSeriesDatabase.objects.filter(series_id=self.gse).values_list(
            "database", "url"
        )}

        external_refs = {k: {"external_id": v} for (k,v) in ExternalDbRefs.objects.filter(series_id=self.gse).values_list(
            "database", "external_id"
        )}

        return {**series_dbs, **external_refs}
    
    class Meta:
        indexes = [
            models.Index(fields=["gse"]),
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
    gpl_raw = models.TextField(
        null=True, blank=True, db_column="gpl", help_text="GEOPlatform ID"
    )
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
            models.Index(fields=["gsm"]),
            models.Index(fields=["series"]),
            models.Index(fields=["gpl_raw"]),
            models.Index(fields=["organism_ch1"]),
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
            models.Index(fields=["gpl"]),
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
            models.Index(fields=["gse"]),
        ]

    def __str__(self):
        return f"GEO Series {self.gse} to platforms {self.platforms}"


# ===========================================================================---------
# === Join tables / relations
# ===========================================================================---------


class GEOSeriesRelations(models.Model):
    """
    Relation between a single GEOSeries and multiple GEOSamples and/or GEOPlatforms.

    Originates from ids__level-series.parquet, specifically the "||"-delimited 'samples' and 'platforms' columns.
    """

    series = models.ForeignKey(
        GEOSeries,
        related_name="series_relations",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
    )

    samples = models.ManyToManyField(GEOSample, related_name="series_relations")
    platforms = models.ManyToManyField(GEOPlatform, related_name="series_relations")


class GEOSeriesDatabase(models.Model):
    """
    Database source for a GEOSeries, e.g., GEO, ArrayExpress, SRA.

    This model is populated by the management command import_series_databases
    which takes ids__level-series.parquet as an input, specifically its
    "relations" column.
    """

    series = models.ForeignKey(
        GEOSeries,
        related_name="databases",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
    )
    database = models.CharField()
    url = models.CharField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["series"]),
            models.Index(fields=["database"]),
            models.Index(fields=["database", "series_id"]),
        ]

    def __str__(self):
        return f"{self.series.series_id} in {self.database}"
    

class ExternalDbRefs(models.Model):
    """
    External database references for a GEOSeries, e.g., ARCHS4, Recount3, refine.bio.

    This model is populated by the management command import_external_db_refs
    which takes the following files as input:
        - data/expression_db_references/archs4_studies_*.txt
        - data/expression_db_references/recount3_studies_*.parquet
        - data/expression_db_references/refinebio_studies_*.parquet
    """

    series = models.ForeignKey(
        GEOSeries,
        related_name="external_db_refs",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
    )
    database = models.CharField()
    external_id = models.CharField(null=True, blank=True, help_text="ID of the series in the external database, if available")

    class Meta:
        indexes = [
            models.Index(fields=["series"]),
            models.Index(fields=["database"]),
            models.Index(fields=["database", "series_id"]),
        ]
        # make (series, database) unique together to avoid duplicates
        unique_together = ("series", "database")

    def __str__(self):
        return f"{self.series.series_id} in {self.database} {' (ID: ' + self.external_id + ')' if self.external_id else ''}"


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

    Originates from disease_predictions.parquet and tissue_predictions.parquet
    """

    objects = SearchTermManager()

    term = models.CharField(max_length=256)  # ontology term
    series = models.ForeignKey(
        GEOSeries,
        related_name="search_terms",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
    )
    confidence = models.FloatField()
    related_words = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [
            # index term for exact matches
            models.Index(fields=["term"]),
            # composite index for the term-to-series lookup in search_gse_with_prob
            models.Index(fields=["term", "series"], name="searchterm_term_series_idx"),
            GinIndex(
                name="term_related_words_trgm_gin",
                fields=["related_words"],
                opclasses=["gin_trgm_ops"],
            ),
        ]

    def __str__(self):
        return self.term

class OntologyTermRating(models.Model):
    """
    Qualifications of the performance of our model for each ontology term.

    (Note that, while not required, as of 2026-06-05, SearchTerm has as many
    unique values of 'term' as there rows in this table.)

    Loaded from the following files:
    - data/search_tables/disease_predictions.parquet
    - data/search_tables/eval.parquet
    - data/search_tables/tissue_predictions.parquet
    """
    term = models.CharField(max_length=256, db_index=True)
    performance = models.CharField(max_length=64)
    type = models.CharField(max_length=64)

class FacetEntry(models.Model):
    """
    Individual facet value for a categorical facet.

    This is used to store the individual values and counts for a categorical facet,
    e.g. "Platform" or "Technology".
    """

    facet = models.ForeignKey(
        "Facet",
        related_name="entries",
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=256)
    count = models.IntegerField()

    class Meta:
        indexes = [
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return f"{self.name}: {self.count}"

class Facet(models.Model):
    """
    Global facet values for the entire dataset, used to populate the sidebar filters.

    If the facet has min and max defined, that's passed verbatim to the frontend.
    Otherwise, we return the values of FacetEntry associated with this facet.

    (On why global facets were introduced: normally, facets are computed on the
    current query results and updated as the user selects additional filtering
    options. Unfotunately, running these queries on the fly for the current
    search is too slow, and caching, the natural choice for speeding up slow
    queries, is complicated by the introduction of user-supplied feedback to the
    series response.)
    """

    name = models.CharField(max_length=256, unique=True)
    min = models.IntegerField(null=True, blank=True)
    max = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.name}: {self.value}"


# ===========================================================================
# === Ontology search terms from meta-hq
# ===========================================================================


class OntologySearchResultsManager(models.Manager):
    def search(self, query: str, max_results: int = 5000):
        """
        Perform a search for the given query string across ontology terms + synonyms.

        Returns api_ontologyterms left-joined w/api_ontologysynonyms, filtered to
        only terms present in api_searchterm (handled inside the SQL function).
        """
        qs = self.get_queryset().raw(
            """
            SELECT so.*, otr.performance FROM search_onto(%(query)s, %(max_results)s) AS so
            LEFT JOIN api_ontologytermrating AS otr ON otr.term = so.id
            """,
            {"query": query, "max_results": max_results},
        )
        return qs

    def search_series(self, query: str, max_results: int = 5000):
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
            """,
            {"query": query, "max_results": max_results},
        )
        return qs


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

    # joined in from the api_ontologytermrating table
    performance = models.CharField(max_length=64, null=True, blank=True)

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
    type = models.CharField(max_length=128, db_column="type")
    name = models.CharField(max_length=512)
    syn_exact = models.JSONField(null=True, blank=True)
    syn_narrow = models.JSONField(null=True, blank=True)
    syn_broad = models.JSONField(null=True, blank=True)
    syn_related = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["term_id"]),
            models.Index(fields=["ontology"]),
        ]

    def __str__(self):
        return f"{self.term_id} ({self.ontology})"


class OntologySynonyms(models.Model):
    """
    Ontology term synonyms with scope.
    """

    term_id = models.CharField(max_length=256)
    synonym = models.CharField(max_length=512)
    scope = models.CharField(max_length=64, db_column="scope")

    class Meta:
        indexes = [
            models.Index(fields=["term_id"]),
            models.Index(fields=["synonym"]),
            # Full-text GIN index on synonym (to_tsvector('simple', synonym))
            GinIndex(
                SearchVector("synonym", config="simple"),
                name="api_ontosyn_syn_tsv_idx",
            ),
            # Trigram GIN index on synonym (synonym gin_trgm_ops)
            GinIndex(
                fields=["synonym"],
                name="api_ontosyn_syn_trgm_idx",
                opclasses=["gin_trgm_ops"],
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
    type = models.CharField(max_length=128, db_column="type")

    class Meta:
        indexes = [
            models.Index(fields=["id"]),
            models.Index(fields=["ontology"]),
            models.Index(fields=["type"]),
            # Full-text GIN index on name (to_tsvector('simple', name))
            GinIndex(
                SearchVector("name", config="simple"),
                name="api_ontoterms_name_tsv_idx",
            ),
            # Trigram GIN index on name (name gin_trgm_ops)
            GinIndex(
                fields=["name"],
                name="api_ontoterms_name_trgm_idx",
                opclasses=["gin_trgm_ops"],
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
        "Cart", null=True, blank=True, on_delete=models.CASCADE, related_name="items"
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


# ===========================================================================
# === Feedback
# ===========================================================================

class Feedback(TimeStampedModel):
    """
    User feedback on search results or the platform in general.
    """

    # series entity for which feedback is provided
    series_id = models.ForeignKey(
        GEOSeries, null=True, blank=True, on_delete=models.SET_NULL, related_name="feedback"
    )

    # optional info from the submitter
    user_id = models.CharField(max_length=256, null=True, blank=True)
    name = models.CharField(max_length=256, null=True, blank=True)
    email = models.CharField(max_length=256, null=True, blank=True)

    # the actual feedback content
    rating = models.IntegerField(
        null=True, blank=True,
        help_text="Rating from -1 (negative) to 1 (positive)",
        validators=[MinValueValidator(-1), MaxValueValidator(1)],
    )
    qualities = ArrayField(models.CharField(max_length=256), blank=True, default=list)
    keywords = models.JSONField(null=True, blank=True)
    elaborate = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ("series_id", "user_id")

    def __str__(self):
        return f"Feedback from {self.name or 'anonymous'} ({self.email or 'no email'}) at {self.created_at}"
