import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

print("API Key Loaded:", api_key is not None)
if api_key:
    print("API Key Prefix:", api_key[:8])

client = Groq(api_key=api_key) if api_key else None


def _fallback_report():
    return """# Executive Summary
AI analysis is unavailable because the Groq API key is missing or invalid.

# Severity
Unknown

# MITRE ATT&CK
Not available

# Technical Analysis
The backend returned parsed detections, but the AI summary could not be generated.

# Recommendations
Set a valid GROQ_API_KEY to enable AI summaries.

# Confidence Score
0%
"""

def generate_incident_report(detections):

    if client is None:
        return _fallback_report()

    prompt = f"""
You are a Senior SOC Analyst.

Analyze the following security detections.

Detections:
{detections}

Return your answer in Markdown with the following sections:

# Executive Summary

# Severity

# MITRE ATT&CK

# Technical Analysis

# Recommendations

# Confidence Score
"""

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert cybersecurity SOC analyst."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
        )

        return response.choices[0].message.content
    except Exception as exc:
        print(f"GROQ analysis failed: {exc}")
        return _fallback_report()