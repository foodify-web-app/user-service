import Redis from "ioredis";
import dotenv from 'dotenv';
dotenv.config();
const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost", // "redis" inside Docker, "localhost" locally
    port: process.env.REDIS_PORT || 6379,
});

if (redis) {
    console.log("✅ connected to redis server on PORT 6379 ");
} else {
    console.log("❌ error to connect redis server on PORT 6379 ");
}

const redisPublisher = new Redis({
    host: process.env.REDIS_HOST || "localhost", // "redis" inside Docker, "localhost" locally
    port: process.env.REDIS_PORT || 6379,
});

const redisSubscriber = new Redis({
    host: process.env.REDIS_HOST || "localhost", // "redis" inside Docker, "localhost" locally
    port: process.env.REDIS_PORT || 6379,
});

redisPublisher.on("connect", () => console.log("✅ Redis Publisher Connected"));
redisSubscriber.on("connect", () => console.log("✅ Redis Subscriber Connected"));


export { redis, redisPublisher, redisSubscriber };
