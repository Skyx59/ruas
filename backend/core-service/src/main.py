import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from src.config.settings import Settings
from src.middleware.errors import ErrorResponse, register_error_handlers
from src.modules.road_conditions.repository import ReportRepository
from src.modules.road_conditions.router import router as reports_router
from src.routes.health import router as health_router

logger = logging.getLogger("ruas")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_environment()
    repository = ReportRepository(settings.db_path)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        logging.basicConfig(
            level=settings.log_level,
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )
        logger.setLevel(settings.log_level)
        repository.initialize()
        logger.info("RUAS core service ready")
        yield

    app = FastAPI(
        title="RUAS Core Service",
        version="0.1.0",
        description="RUAS health and provisional road reports API.",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
        swagger_ui_oauth2_redirect_url=None,
        redirect_slashes=False,
        lifespan=lifespan,
    )
    app.state.report_repository = repository
    register_error_handlers(app)

    api = APIRouter(prefix="/api", responses={500: {"model": ErrorResponse}})
    api.include_router(health_router)
    api.include_router(reports_router, responses={422: {"model": ErrorResponse}})
    app.include_router(api)
    return app
