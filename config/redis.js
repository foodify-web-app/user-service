import Redis from "ioredis";

const redis = new Redis({
    host: 'localhost',   // or service name if using Docker Compose
    port: 6379,
});

if (redis) {
    console.log("✅ connected to redis server on PORT 6379 ");
} else {
    console.log("❌ error to connect redis server on PORT 6379 ");
}


export default redis;
