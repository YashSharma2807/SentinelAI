from app.parsers.windows_parser import parse_powershell_log
from app.detectors.engine import run_detectors

events = parse_powershell_log("../sample_logs/windows/powershell_attack.log")

print("===== Parsed Events =====")

for event in events:
    print(event)

print("\n===== Detection Results =====")

detections = run_detectors(events)

for detection in detections:
    print(detection)