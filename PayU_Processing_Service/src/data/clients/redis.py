from src.core.config.settings import settings
from redis import Redis
from rq import Queue

redis_connection = Redis(
    host=settings.redis_localhost,
    port=settings.redis_port,
    db=settings.redis_db
)

queue = Queue("payu_queue", connection=redis_connection)