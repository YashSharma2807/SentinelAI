from app.ai.analyzer import generate_incident_report

detections = [
    {
        "attack": "SQL Injection",
        "severity": "Critical",
        "source_ip": "192.168.1.10",
        "matched_pattern": "UNION SELECT"
    }
]

report = generate_incident_report(detections)

print(report)