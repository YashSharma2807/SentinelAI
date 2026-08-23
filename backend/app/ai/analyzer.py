import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

print("API Key Loaded:", os.getenv("GROQ_API_KEY") is not None)
print("API Key Prefix:", os.getenv("GROQ_API_KEY")[:8])

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def generate_incident_report(detections):

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