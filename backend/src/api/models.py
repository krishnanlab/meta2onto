from uuid import uuid4
import uuid
from django.db import connection, models
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import TrigramSimilarity, SearchVector

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
# ===========================================================================

class Platform(TimeStampedModel):
    """
    GEO 'platform' (instrument) ID, e.g., 'GPL17021'.
    """
    platform_id = models.CharField(max_length=64, primary_key=True)
  

    def __str__(self):
        return self.platform_id


class Series(TimeStampedModel):
    """
    GEO 'series' (dataset) ID, e.g., 'GSE12345'.
    Mirrors ids__level-series.parquet (sans denormalized arrays).
    """
  
    series_id = models.CharField(max_length=64, primary_key=True)
    doc = models.TextField()

    def __str__(self):
        return self.series_id


class Sample(TimeStampedModel):
    """
    Sample-level ID (GSM* typically).
    Mirrors ids__level-sample.parquet per-row sample metadata (normalized).
    """
  
    sample_id = models.CharField(max_length=64, primary_key=True)
    doc = models.TextField()

    def __str__(self):
        return self.sample_id


# ===========================================================================---------
# === Join tables / relations
# ===========================================================================---------

class OrganismForPairing(models.Model):
    """
    Organism and status for a (Series, Sample, Platform) triplet.

    Originates from ids__level-sample.parquet
    """
    organism = models.ForeignKey(Organism, on_delete=models.CASCADE)
    status = models.CharField(null=True, blank=True)

    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name='organism_pairings')
    sample = models.ForeignKey(Sample, on_delete=models.CASCADE, related_name='organism_pairings')
    platform = models.ForeignKey(Platform, on_delete=models.CASCADE, related_name='organism_pairings')

    class Meta:
        unique_together = ('series', 'sample', 'platform')
        indexes = [
            models.Index(fields=['series']),
            models.Index(fields=['sample']),
            models.Index(fields=['platform']),
            models.Index(fields=['series', 'sample', 'platform']),
        ]

    def __str__(self):
        return f'Organism {self.organism.name} (series {self.series_id}, sample {self.sample_id} platform {self.platform_id})'

class SeriesRelations(models.Model):
    """
    Relation between a single Series and multiple Samples and/or Platforms.

    Originates from ids__level-series.parquet, specifically the "||"-delimited 'samples' and 'platforms' columns.
    """

    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name='series_relations')

    samples = models.ManyToManyField(Sample, related_name='series_relations')
    platforms = models.ManyToManyField(Platform, related_name='series_relations')

class ExternalRelation(models.Model):
    """
    Relation to external entities, e.g. URLs.

    Originates from ids__level-series.parquet, specifically the 'relations' column,
    which contains entries like the following:
    
    BioProject: <URL>
    SRA: <URL>
    NA: <URL> (not sure if this is a literal NA)
    ArrayExpress: <URL>
    Peptidome: <URL>
    SuperSeries of: <series ID>
    SubSeries of:  <series ID>
    Reanalyzed by: <series ID>
    Superseded by: <series ID>
    Alternative to: <series ID>
    Reanalysis of: <sample ID>
    Affiliated with: <series ID> | <sample ID>
    Supersedes: <series ID> | <sample ID>
    """

    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name='external_relations', null=True, blank=True)

    relation_type = models.CharField(max_length=128)

  
    to_url= models.CharField(null=True, blank=True, max_length=512)
    to_sample = models.ForeignKey(Sample, null=True, blank=True, on_delete=models.SET_NULL, related_name='external_sample_relations')
    to_series = models.ForeignKey(Sample, null=True, blank=True, on_delete=models.SET_NULL, related_name='external_series_relations')

    def to_entity(self):
        """
        Return the target entity of the relation, whether Sample, Series, or URL.
        """
        if self.to_sample:
            return self.to_sample.sample_id
        elif self.to_series:
            return self.to_series.series_id
        else:
            return self.to_url
        
    def to_entity_by_type(self):
        """
        Return the target entity of the relation, based on relation_type.
        """
        if self.relation_type in ['SuperSeries of', 'SubSeries of', 'Reanalyzed by', 'Superseded by', 'Alternative to']:
            return self.to_series.series_id if self.to_series else None
        elif self.relation_type in ['Reanalysis of']:
            return self.to_sample.sample_id if self.to_sample else None
        elif self.relation_type in ['Reanalysis of']:
            return self.to_sample.sample_id if self.to_sample else None
        else:
            return self.to_url

    def __str__(self):
        return f"{self.from_entity} --{self.relation_type}--> {self.to_entity}"
    

class SeriesDatabase(models.Model):
    """
    Database source for a Series, e.g., GEO, ArrayExpress, SRA.

    We'll eventually use ExternalRelation for this, but for now it's faster to
    have a dedicated table that just lists databases.

    This model is populated by the management command import_series_databases
    which takes ids__level-series.parquet as an input, specifically its
    "relations" column.
    """

    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name='databases')
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
        return qs

class SearchTerm(models.Model):
    """
    Searchable terms extracted from the corpus for indexing and search.

    Originates from meta2onto_example_predictions.parquet
    """

    objects = SearchTermManager()

    term = models.CharField(max_length=256) # ontology term
    series = models.ForeignKey(Series, on_delete=models.SET_NULL, null=True, blank=True, related_name='search_terms')
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
        joins the ontology terms against api_searchterm to get associated Series.
        Returns api_series entries matching the ontology search.
        Brings in metadata about each series from api_geoseriesmetadata.
        """
        qs = self.get_queryset().raw(
            """
            SELECT so.id, gse.title, gse.summary
            FROM search_onto(%(query)s, %(max_results)s) AS so
            INNER JOIN api_searchterm AS st ON st.term = so.id
            INNER JOIN api_series AS sx ON sx.series_id = st.series_id
            INNER JOIN api_geoseriesmetadata AS gse ON gse.gse = sx.series_id
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
# === GEO metadata subset, from GEOmetadb, https://gbnci.cancer.gov/geo/
# ===========================================================================

def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]

class GEOSeriesMetadataManager(models.Manager):
    def search(self, query:str, max_results:int=50, order_by:str='relevance'):
        """
        Fetch GEO sample metadata by sample ID (GSM*).
        """

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                st.series_id AS gse,
                st.prob AS prob,
                (
                    SELECT count(*) FROM api_seriesrelations_samples AS samp_rels
                    INNER JOIN api_seriesrelations AS sr ON sr.series_id = st.series_id
                    WHERE samp_rels.seriesrelations_id = sr.id
                ) AS samples,
                (
                    SELECT
                        COALESCE(array_agg(db.database_name ORDER BY db.database_name), '{}'::text[])
                    FROM api_seriesdatabase AS db
                    WHERE db.series_id = st.series_id
                ) AS database
                FROM search_onto(%(query)s, %(max_results)s) AS so
                INNER JOIN api_searchterm AS st ON st.term = so.id
                LIMIT %(max_results)s
                """, {
                    'query': query,
                    'max_results': max_results,
                }
            )
            rows = dictfetchall(cursor)

        # materialize result set
        raw_results = list(rows)

        gse_set = set(r['gse'] for r in raw_results)

        query = self.get_queryset().filter(gse__in=gse_set)
        results = list(query)

        # add in the 'prob' field from the raw results
        prob_map = {r['gse']: r for r in raw_results}
        for r in results:
            r._prob = prob_map.get(r.gse, None).get('prob', None)
            r._samples = prob_map.get(r.gse, None).get('samples', None)
            r._database = prob_map.get(r.gse, None).get('database', None)

        # sort the results according to the original ordering
        sort_ascending = order_by.startswith('-')

        if order_by.lstrip('-') == 'relevance':
            results.sort(key=lambda r: (r._prob is None, r._prob), reverse=not sort_ascending)
        elif order_by.lstrip('-') == 'date':
            results.sort(key=lambda r: (r.submission_date is None, r.submission_date), reverse=not sort_ascending)
        elif order_by.lstrip('-') == 'samples':
            results.sort(key=lambda r: (r._samples is None, r._samples), reverse=not sort_ascending)
        
        return results

class GEOSeriesMetadata(models.Model):
    """
    the "gse" table from GEOmetadb.
    Originally fetched from https://gbnci.cancer.gov/geo/GEOmetadb.sqlite.gz
    on 2025-12-11.
    """

    objects = GEOSeriesMetadataManager()

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

    @property
    def prob(self):
        return getattr(self, "_prob", None)

    @property
    def samples(self):
        inlined_samples = getattr(self, "_samples", None)

        if inlined_samples is not None:
            return inlined_samples
        else:
            return SeriesRelations.objects.filter(series_id=self.gse).aggregate(
                count=models.Count('samples')
            )['count']

    @property
    def database(self):
        inlined_db = getattr(self, "_database", None)

        if inlined_db is not None:
            return inlined_db
        else:
            return list(
                SeriesDatabase.objects.filter(series_id=self.gse).values_list('database_name', flat=True)
            )

    class Meta:
        indexes = [
            models.Index(fields=['gse']),
        ]

    def __str__(self):
        return f"GEO Metadata for {self.gse}"

# ===========================================================================
# === Cart server-side state
# ===========================================================================

class CartItem(models.Model):
    """
    An item in a user's cart.
    """

    series = models.ForeignKey(Series, on_delete=models.CASCADE)
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
