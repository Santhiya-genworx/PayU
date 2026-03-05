from rq import Worker
from src.data.clients.redis import redis_connection

if __name__ == "__main__":
    worker = Worker(["payu_queue"], connection=redis_connection)
    worker.work()