import google.generativeai as genai
import os
from typing import List
from models.schemas import Supplier
from dotenv import load_dotenv

load_dotenv()


class GeminiService:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Missing GEMINI_API_KEY in environment")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def get_recommendations(self, user_prompt: str, suppliers: List[Supplier]) -> dict:
        suppliers_text = "\n".join(
            f"{s.name} ({s.category}): {s.avg_rating}/5 – {s.reviews}"
            for s in suppliers
        )

        print(suppliers)

        prompt = f"""`
            You are an intelligent assistant that recommends suppliers to event planners. Speak naturally like a human.

            User wants: {user_prompt}

            Here is the list of suppliers:
            {suppliers_text}

            Instructions:
            - Suggest the TOP 3 suppliers.
            - Prioritize suppliers that have reviews and ratings.
            - Still include suppliers with no reviews or ratings if necessary.
            - For each supplier, give a short explanation (25-35 words) why they are suitable.
            - Use the following format exactly:

            1: <Supplier Name> – short explanation
            2: <Supplier Name> – short explanation
            3: <Supplier Name> – short explanation

            """.strip()
        response = self.model.generate_content(prompt)
        return response.text
