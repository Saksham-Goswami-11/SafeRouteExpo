# ai_server/check_models.py
import google.generativeai as genai
import os

# Wahi API Key daalo jo tumne banayi thi
API_KEY = "YAHAN_APNI_KEY_DAALO"

genai.configure(api_key=API_KEY)

print("Checking available models for your API Key...")

try:
    count = 0
    # Models list karte hain
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Found Model: {m.name}")
            count += 1
    
    if count == 0:
        print("❌ No text generation models found. Check if 'Generative Language API' is enabled in Google Cloud Console.")
        
except Exception as e:
    print(f"❌ Error: {e}")