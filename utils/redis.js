import { redis, redisPublisher, redisSubscriber } from "../config/redis.js";

export const getRefreshTokenPayload = (data) => {
    const { sessionId, userId, token, expiresAt } = data;
    return {
        event: "TOKEN_UPDATED",
        data: {
            ...data
        }
    }
};

export const publishTokenUpdateEvent = async (channel, payload) => {
    await redisPublisher.publish(channel, JSON.stringify(payload))
    return { message: "event published successfully" }
}


redisSubscriber.subscribe("TOKEN_EVENTS", (err, count) => {
    if (err) {
        console.error("❌ Failed to subscribe:", err);
    } else {
        console.log(`📡 Listening on ${count} channel(s): TOKEN_EVENTS`);
    }
});

redisSubscriber.on("message", async (channel, message) => {
    try {
        const event = JSON.parse(message);
        console.log("📬 Received Event:", event);

        if (event.event === "TOKEN_UPDATED") {
            const { userId, sessionId, token, expiresAt } = event.data;
            const ttl = Math.floor((new Date(expiresAt) - Date.now()) / 1000);
            await redis.set(`refresh:${userId}:${sessionId}`, token, "EX", ttl)
        }

    } catch (error) {
        console.error("⚠️ Error processing event:", error);
    }
});