import os
from redis import Redis
from rq import Worker, Queue, Connection
from dotenv import load_dotenv

load_dotenv()

redis_conn = Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))

if __name__ == '__main__':
    with Connection(redis_conn):
        worker = Worker(['default'])
        worker.work()
