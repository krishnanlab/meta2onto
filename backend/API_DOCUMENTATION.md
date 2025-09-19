# Meta2Onto API Documentation

This document describes the Django REST Framework API endpoints created for the Meta2Onto project.

## Base URL

All API endpoints are accessible under the `/api/` prefix:
- Development: `http://localhost:8000/api/`
- Production: `https://meta2onto.org/api/`

## Authentication & Permissions

- Read-only access is available to anonymous users
- Write operations require Django model permissions
- The API supports Django's built-in authentication system

## Available Endpoints

### Core Entities

#### 1. Organisms (`/api/organisms/`)
Manage organism information (e.g., 'Homo sapiens', 'Mus musculus').

**Endpoints:**
- `GET /api/organisms/` - List all organisms
- `GET /api/organisms/{id}/` - Get specific organism details

**Query Parameters:**
- `search` - Search in organism names
- `ordering` - Order by `name` or `id`

#### 2. Platforms (`/api/platforms/`)
Manage GEO platform (instrument) information.

**Endpoints:**
- `GET /api/platforms/` - List all platforms
- `GET /api/platforms/{platform_id}/` - Get specific platform details
- `GET /api/platforms/{platform_id}/series/` - Get all series using this platform
- `GET /api/platforms/{platform_id}/samples/` - Get all samples using this platform

**Query Parameters:**
- `search` - Search in platform IDs and titles
- `ordering` - Order by `platform_id` or `title`

#### 3. Series (`/api/series/`)
Manage GEO series (dataset) information.

**Endpoints:**
- `GET /api/series/` - List all series
- `GET /api/series/{series_id}/` - Get specific series details
- `GET /api/series/{series_id}/samples/` - Get all samples in this series
- `GET /api/series/{series_id}/platforms/` - Get all platforms used in this series
- `GET /api/series/{series_id}/corpus/` - Get corpus text for this series
- `GET /api/series/{series_id}/with_corpus/` - Get series with corpus included
- `GET /api/series/{series_id}/relations/` - Get all series relations
- `GET /api/series/{series_id}/external_links/` - Get external database links

**Query Parameters:**
- `search` - Search in series IDs and types
- `ordering` - Order by `series_id`, `added_at`, `created_at`, or `n_samples_cached`

#### 4. Samples (`/api/samples/`)
Manage sample-level information.

**Endpoints:**
- `GET /api/samples/` - List all samples
- `GET /api/samples/{sample_id}/` - Get specific sample details
- `GET /api/samples/{sample_id}/series/` - Get all series containing this sample
- `GET /api/samples/{sample_id}/corpus/` - Get corpus text for this sample
- `GET /api/samples/{sample_id}/with_corpus/` - Get sample with corpus included

**Query Parameters:**
- `search` - Search in sample IDs
- `ordering` - Order by `sample_id`, `added_at`, or `created_at`

### Relationship Endpoints

#### 5. Series-Platform Relationships (`/api/series-platforms/`)
Many-to-many relationships between series and platforms.

**Endpoints:**
- `GET /api/series-platforms/` - List all series-platform relationships

#### 6. Sample-Series Memberships (`/api/sample-series-memberships/`)
Many-to-many relationships between samples and series.

**Endpoints:**
- `GET /api/sample-series-memberships/` - List all sample-series memberships

#### 7. Series Relations (`/api/series-relations/`)
Inter-series relationships (subseries, superseries, etc.).

**Endpoints:**
- `GET /api/series-relations/` - List all series-to-series relations

#### 8. External Links (`/api/series-external-links/`)
External database references for series.

**Endpoints:**
- `GET /api/series-external-links/` - List all external links

**Query Parameters:**
- `search` - Search in accessions and database names

### Corpus Data

#### 9. Sample Corpus (`/api/sample-corpus/`)
Free-text descriptions for samples.

**Endpoints:**
- `GET /api/sample-corpus/` - List all sample corpus entries

**Query Parameters:**
- `search` - Full-text search in corpus documents

#### 10. Series Corpus (`/api/series-corpus/`)
Free-text descriptions for series.

**Endpoints:**
- `GET /api/series-corpus/` - List all series corpus entries

**Query Parameters:**
- `search` - Full-text search in corpus documents

## Pagination

All list endpoints support pagination with the following parameters:
- `page` - Page number (starts at 1)
- `page_size` - Number of results per page (default: 100, max: 1000)

Example: `/api/series/?page=2&page_size=50`

## Response Format

### List Response
```json
{
    "count": 1000,
    "next": "http://localhost:8000/api/series/?page=3",
    "previous": "http://localhost:8000/api/series/?page=1",
    "results": [
        // Array of objects
    ]
}
```

### Detail Response
Direct object without pagination wrapper.

## Example Usage

### Get all series with search and pagination
```bash
curl "http://localhost:8000/api/series/?search=GSE&page=1&page_size=20"
```

### Get specific series with all related data
```bash
curl "http://localhost:8000/api/series/GSE12345/"
```

### Get series with corpus text
```bash
curl "http://localhost:8000/api/series/GSE12345/with_corpus/"
```

### Get samples for a specific platform
```bash
curl "http://localhost:8000/api/platforms/GPL570/samples/"
```

### Search in corpus data
```bash
curl "http://localhost:8000/api/series-corpus/?search=cancer"
```

## Data Models

### Series Response Example
```json
{
    "series_id": "GSE12345",
    "series_type": "Expression profiling by array",
    "added_at": "2023-01-15T10:30:00Z",
    "n_samples_cached": 24,
    "platforms": [
        {
            "platform_id": "GPL570",
            "title": "[HG-U133_Plus_2] Affymetrix Human Genome U133 Plus 2.0 Array"
        }
    ],
    "samples_count": 24,
    "external_links": [
        {
            "series_id": "GSE12345",
            "db_name": "BioProject",
            "accession": "PRJNA123456",
            "url": "https://www.ncbi.nlm.nih.gov/bioproject/PRJNA123456"
        }
    ],
    "outgoing_relations": [],
    "incoming_relations": [],
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2023-01-15T10:30:00Z"
}
```

### Sample Response Example
```json
{
    "sample_id": "GSM123456",
    "organism": {
        "id": 1,
        "name": "Homo sapiens"
    },
    "platform": {
        "platform_id": "GPL570",
        "title": "[HG-U133_Plus_2] Affymetrix Human Genome U133 Plus 2.0 Array"
    },
    "added_at": "2023-01-15T10:30:00Z",
    "series": [
        {
            "series_id": "GSE12345",
            "series_type": "Expression profiling by array",
            "added_at": "2023-01-15T10:30:00Z",
            "n_samples_cached": 24,
            "platforms_count": 1,
            "samples_count": 24,
            "created_at": "2023-01-15T10:30:00Z",
            "updated_at": "2023-01-15T10:30:00Z"
        }
    ],
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2023-01-15T10:30:00Z"
}
```

## API Browser

Django REST Framework provides a browsable API interface accessible at:
- `http://localhost:8000/api/` (when DEBUG=True)

This interface allows you to explore all endpoints, view documentation, and test API calls directly in the browser.

## Performance Considerations

1. **Queryset Optimization**: All viewsets include optimized querysets with `select_related()` and `prefetch_related()`
2. **Pagination**: Large datasets are paginated to prevent memory issues
3. **Serializer Selection**: Different serializers for list vs. detail views to optimize response size
4. **Database Indexes**: Ensure proper indexes exist on frequently queried fields

## Error Handling

The API returns standard HTTP status codes:
- `200 OK` - Successful request
- `404 Not Found` - Resource not found
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - Server error

Error responses include descriptive messages:
```json
{
    "detail": "Not found."
}
```

## Rate Limiting

Currently no rate limiting is implemented, but it can be added using packages like `django-ratelimit` if needed.
