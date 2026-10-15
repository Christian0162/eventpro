const express = require("express");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const axios = require("axios");
const cors = require('cors')
const admin = require('firebase-admin')
require('dotenv').config();

const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

dotenv.config();

const app = express();

const corsOptions = {
    origin: ["http://localhost:5173", "https://unite-eventpro.netlify.app", "https://unite-eventpro.site"], // allow your frontend
    methods: ["*"], // allow all needed methods
    allowedHeaders: ["*"], // your custom headers
};

app.use(cors(corsOptions))

app.use(express.json());

const apiKey = process.env.LALAMOVE_API_KEY;
const secret = process.env.LALAMOVE_SECRET;
const baseUrl = process.env.LALAMOVE_BASE_URL;
const market = process.env.LALAMOVE_MARKET;

function generateAuthHeader(method, path, body = "") {
    const bodyStr = typeof body === 'object' && body !== null ? JSON.stringify(body) : body;

    const timestamp = Date.now().toString();
    const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${bodyStr}`;
    const signature = crypto.createHmac("sha256", secret).update(rawSignature).digest("hex");
    return `hmac ${apiKey}:${timestamp}:${signature}`;
}

app.post("/delivery-quotation", async (req, res) => {
    const { serviceType, stops } = req.body;
    if (!serviceType || !stops || stops.length < 2) {
        return res.status(400).json({ error: "serviceType and at least 2 stops are required." });
    }

    try {
        // 1️⃣ Create quotation - Try the exact format from Lalamove docs
        const quotationPath = "/v3/quotations";
        const quotationBody = {
            data: {
                serviceType: serviceType,
                language: "en_PH",
                stops: stops.map(s => ({
                    coordinates: {
                        lat: s.coordinates.lat,
                        lng: s.coordinates.lng
                    },
                    address: s.address
                }))
            }
        };

        console.log("📤 Quotation Request:", JSON.stringify(quotationBody, null, 2));

        const quotationHeaders = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": generateAuthHeader("POST", quotationPath, quotationBody),
            "Market": market,
            "Request-ID": uuidv4()
        };

        console.log("📤 Quotation Headers:", quotationHeaders);

        const quotationRes = await axios.post(baseUrl + quotationPath, quotationBody, {
            headers: quotationHeaders,
            validateStatus: () => true // Don't throw on non-2xx
        });

        console.log("📥 Quotation Response Status:", quotationRes.status);
        console.log("📥 Quotation Response:", JSON.stringify(quotationRes.data, null, 2));

        return res.status(quotationRes.status).json(quotationRes.data);

    } catch (err) {
        console.error("❌ Error:", err.response?.data || err.message);
        res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
    }
})

// Main endpoint: create delivery
app.post("/create-delivery", async (req, res) => {
    const { sender, recipients, remarks, quotationId, stopId, quotationData } = req.body;

    try {
        const orderPath = "/v3/orders";
        const orderBody = {
            data: {
                quotationId: quotationId,
                sender: {
                    stopId: stopId,
                    name: sender?.name || "Default Sender",
                    phone: sender?.phone || "+639000000000"
                },
                recipients: quotationData.stops.slice(1).map((stop, index) => ({
                    stopId: stop.stopId,
                    name: recipients?.name || `Recipient ${index + 1}`,
                    phone: recipients?.phone || `+63900000000${index + 1}`
                })),
                isPODEnabled: true
            }
        };

        if (remarks) {
            orderBody.remarks = remarks;
        }

        console.log("📤 Order Request:", JSON.stringify(orderBody, null, 2));

        const orderHeaders = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": generateAuthHeader("POST", orderPath, orderBody),
            "Market": market,
            "Request-ID": uuidv4()
        };

        const orderRes = await axios.post(baseUrl + orderPath, orderBody, {
            headers: orderHeaders,
            validateStatus: () => true
        });

        console.log("📥 Order Response Status:", orderRes.status);
        console.log("📥 Order Response:", JSON.stringify(orderRes.data, null, 2));

        if (orderRes.status !== 200 && orderRes.status !== 201) {
            return res.status(orderRes.status).json(orderRes.data);
        }

        res.json(orderRes.data);

    } catch (err) {
        console.error("❌ Error:", err.response?.data || err.message);
        res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
    }
});

app.get("/delivery-status", async (req, res) => {
    const { orderId } = req.query;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });
    const orderPath = `/v3/orders/${orderId}`;

    const orderHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": generateAuthHeader("GET", orderPath, ""), // empty body for GET
        "Market": market,
        "Request-ID": uuidv4()
    };

    try {
        const orderRes = await axios.get(baseUrl + orderPath, {
            headers: orderHeaders,
            validateStatus: () => true
        });

        res.status(orderRes.status).json(orderRes.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
    }
});

app.get("/driver-status", async (req, res) => {
    const { orderId, driverId } = req.query;
    if (!orderId && !driverId) return res.status(400).json({ error: "orderId is required" });
    const orderPath = `/v3/orders/${orderId}/drivers/${driverId}`;

    const orderHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": generateAuthHeader("GET", orderPath, ""), // empty body for GET
        "Market": market,
        "Request-ID": uuidv4()
    };

    try {
        const orderRes = await axios.get(baseUrl + orderPath, {
            headers: orderHeaders,
            validateStatus: () => true
        });

        res.status(orderRes.status).json(orderRes.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
    }
});

app.post("/lalamove-webhook", async (req, res) => {
    console.log("Webhook received:", req.body);

    const eventType = req.body?.data?.order?.status;
    const orderId = req.body?.data?.order?.orderId;
    const driver = req.body?.data?.driver || null;

    if (!orderId) {
        console.log("Missing orderId");
        return res.status(200).send("OK");
    }

    // Map Lalamove event types to your internal statuses
    const statusMap = {
        DRIVER_ASSIGNED: "Driver Assigned",
        PICKED_UP: "Picked Up",
        ON_GOING: "On Going",
        DELIVERED: "Delivered",
        CANCELED: "Canceled",
        COMPLETED: "Delivered",
    };

    const status = statusMap[eventType] || "Assigning Driver";

    try {
        const deliveryDoc = await db.collection("deliveries").doc(orderId).get();
        const deliveryData = { id: deliveryDoc.id, ...deliveryDoc.data() };

        const contractDoc = await db.collection("contracts").doc(deliveryData.contract_id).get()
        const contractData = { id: contractDoc.id, ...contractDoc.data() }

        const eventDoc = await db.collection("events").doc(contractData.event_id).get()
        const eventData = { id: eventDoc.id, ...eventDoc.data() }

        const supplier_id = deliveryData?.supplier_id;

        const updateData = {
            status,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (driver) {
            updateData.courier = driver
            await db.collection("notifications").add({
                avatar: "D",
                message: `A driver has been assigned for your delivery (Order ID: ${orderId}).`,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                referenced_type: "contract",
                referenced_id: contractData?.id || null,
                title: "Driver Assigned",
                unread: true,
                receiver_id: supplier_id || null,
            });
        };
        if (eventType === "COMPLETED") {
            updateData.delivered_at = admin.firestore.FieldValue.serverTimestamp();

            await db.collection("notifications").add({
                avatar: "D",
                message: `The item for the event "${eventData?.event_name}" has been successfully delivered. Contract ID: "${contractData?.id}".`, createdAt: admin.firestore.FieldValue.serverTimestamp(),
                referenced_type: "contract",
                sender_id: eventData?.id || null,
                referenced_id: contractData?.id || null,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                title: "Driver Delivered",
                unread: true,
                receiver_id: supplier_id || null,
            });

            await db.collection("notifications").add({
                avatar: "D",
                message: `The delivery has arrived and is now on-site. Please check your records for Contract ID: "${contractData?.id}".`,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                referenced_type: "contract",
                sender_id: eventData?.id || null,
                referenced_id: contractData?.id || null,
                title: "Delivery Arrived",
                unread: true,
                receiver_id: eventData.user_id || null,
            });
        }

        await db.collection("deliveries").doc(orderId).update(updateData);

        if (!deliveryData) {
            console.log("No delivery data found for order:", orderId);
            return res.status(200).send("OK");
        }

        if (!contractData) {
            console.log("No delivery data found for order:", orderId);
            return res.status(200).send("OK");
        }

    } catch (err) {
        console.error("Firestore update or notification error:", err);
    }

    return res.status(200).send("OK");
});




app.listen(process.env.PORT || 5001, () => console.log(`Lalamove service running on port ${process.env.PORT || 5001}`));