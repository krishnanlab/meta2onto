# Meta2Onto Backend

A FastAPI backend service for the Meta2Onto project.

## Development

### Prerequisites
- Python 3.10+
- [uv](https://docs.astral.sh/uv/) package manager

### Setup
1. Install dependencies:
   ```bash
   uv sync
   ```

2. Run the development server:
   ```bash
   uv run python src/main.py
   ```

The API will be available at http://localhost:8000

### Docker

Build the Docker image:
```bash
docker build -t meta2onto-backend .
```

Run the container:
```bash
docker run -p 8000:8000 meta2onto-backend
```

### API Documentation

Once the server is running, visit:
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health
