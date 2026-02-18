import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import json
import os

# --- 🔑 GROQ API KEY CONFIGURATION ---
# Apni key yahan quotes ke andar paste karo
GROQ_API_KEY = "YOUR GROQ API KEY"
# Client Setup (Safe fallback logic)
if GROQ_API_KEY == "YAHAN_APNI_GROQ_KEY_PASTE_KARO":
    # Agar upar edit nahi kia, to environment variable check karega
    api_key_to_use = os.environ.get("GROQ_API_KEY")
else:
    api_key_to_use = GROQ_API_KEY

client = Groq(api_key=api_key_to_use)

app = FastAPI()

# --- 🌐 CORS SETUP (Frontend Connection) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # React app (localhost:5173) ke liye open hai
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 📦 DATA MODELS ---
class Item(BaseModel):
    text: str

class RephraseItem(BaseModel):
    text: str

# --- 🚀 ROUTE 1: SAFETY ANALYSIS (Risk + Tips) ---
# ai_server/main.py ke andar analyze_safety function ko isse replace kro:

@app.post("/analyze")
async def analyze_safety(item: Item):
    print(f"\n🛡️  Analyzing Report: {item.text}")

    # --- UPDATED SYSTEM PROMPT WITH STRICT SCORING RULES ---
    system_prompt = """
    You are an expert Safety AI. Analyze the incident report and assign a Risk Score based STRICTLY on this matrix:

    🔴 EXTREME RISK (0.80 - 0.99):
    - Immediate physical danger (Chasing, cornering, weapons).
    - Sexual assault or physical attack in progress.
    - Kidnapping attempts.

    kq ORANGE HIGH RISK (0.60 - 0.79):
    - Physical stalking (following in real life).
    - Groping or physical harassment.
    - Aggressive confrontation or road rage.

    🟡 MEDIUM RISK (0.35 - 0.59):
    - Cyberbullying, online harassment, unwanted calls/texts (Digital threats).
    - Verbal harassment (catcalling) without physical approach.
    - Environmental hazards (Dark streets, lonely areas, suspicious people nearby).

    🟢 LOW RISK (0.10 - 0.34):
    - General safety tips or observations.
    - Infrastructure issues (Street light broken).
    - Feeling uneasy but no specific threat.

    CRITICAL RULE: 
    - Cyberbullying is serious but NOT immediate physical danger. Score it between 0.35 and 0.50 unless there is a specific death threat or location leak.
    
    Output strictly valid JSON:
    {
      "risk_score": float,
      "safety_tip": "string (max 20 words)"
    }
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": item.text}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}, 
            temperature=0.1 # Temperature kam rakha hai taki wo rules follow kare
        )

        response_content = chat_completion.choices[0].message.content
        data = json.loads(response_content)
        
        print(f"✅ Analysis Success! Risk: {data['risk_score']} | Tip: {data['safety_tip']}")
        return data

    except Exception as e:
        print(f"❌ Analyze Error: {e}")
        return {
            "risk_score": 0.5,
            "safety_tip": "AI Service Unavailable. Stay Alert."
        }
# --- ✨ ROUTE 2: MAGIC REPHRASE (Hinglish -> English) ---
@app.post("/rephrase")
async def rephrase_text(item: RephraseItem):
    print(f"\n✨ Rephrasing Text: {item.text}")

    system_prompt = """
    You are an expert editor for safety reports. 
    Convert the user's input (which may be in Hinglish, Hindi, or broken English) into clear, professional, and concise English.
    
    Rules:
    1. Keep the meaning exactly the same.
    2. Make it sound serious and urgent.
    3. Output ONLY the rephrased text. No "Here is the text" or quotes.
    
    Example Input: "Bhai koi ganda admi mera picha krra h raat se"
    Example Output: "A suspicious individual has been following me since last night."
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": item.text}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3
        )

        rephrased = chat_completion.choices[0].message.content.strip()
        # Clean extra quotes if AI adds them
        rephrased = rephrased.replace('"', '').replace("'", "")
        
        print(f"✅ Rephrased Result: {rephrased}")
        return {"rephrased_text": rephrased}

    except Exception as e:
        print(f"❌ Rephrase Error: {e}")
        # Fail safe: Return original text if AI fails
        return {"rephrased_text": item.text}

# --- SERVER START ---
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)