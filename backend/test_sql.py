from app.parsers.web_parser import parse_web_log
from app.detectors.engine import run_detectors

events = parse_web_log("../sample_logs/web/sql_injection.log")

print("===== Parsed Events =====")

for event in events:
    print(event)

print("\n===== Detection Results =====")

detections = run_detectors(events)

for detection in detections:
    print(detection)