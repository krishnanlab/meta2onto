# Meta2Onto Stack

This repo contains the implementation of the Meta2Onto stack including
the backend API, web frontend, and definitions for supporting services (e.g.,
the db).

## Repository Structure

- `backend/`: FastAPI backend code
- `frontend/`: React frontend code
- `data/`: Staging location for 
- `services/`: Dockerfiles and configurations for supporting services
- `compose-envs/`: docker-compose configurations for various environments (dev,
  prod, etc.)

## Getting Started

### Prerequisites

You should have Docker and Docker Compose installed on your machine. See
[Docker's official installation guide](https://docs.docker.com/get-docker/) for
instructions.

### Running the Application

After cloning the repository, navigate to the root directory and run:

```bash
./run_stack.sh
```

This will create a `.env` file from `.env.TEMPLATE` if it doesn't exist,
populate it with the necessary secrets for the app to run, and then start the
application using Docker Compose.

The backend API will be accessible at `http://localhost:8050` and the frontend
at `http://localhost:3050`.

## Deprecated Repos

This repo replaces a few other repositories where prototype implementations of
the Meta2Onto stack were being stored, specifically:
- [meta2onto_scripts](https://github.com/krishnanlab/meta2onto_scripts)
- [meta2onto_webserver](https://github.com/krishnanlab/meta2onto_webserver)
- [meta2onto_api](https://github.com/krishnanlab/meta2onto_api)
