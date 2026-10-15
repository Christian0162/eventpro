from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import payout, recommendations, payments, refund, delivery, auto_cancel

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://unite-eventpro.netlify.app",
        "https://unite-eventpro.site",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(payout.router)
app.include_router(recommendations.router)
app.include_router(payments.router)
app.include_router(refund.router)
app.include_router(delivery.router)
app.include_router(auto_cancel.router)


@app.get("/")
async def root():
    return {"message": "Welcome to the Supplier Recommendation API"}
