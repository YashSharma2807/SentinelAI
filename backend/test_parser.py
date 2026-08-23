from app.parsers.linux_parser import parse_ssh_log
from app.detectors.engine import run_detectors

events = parse_ssh_log("../sample_logs/linux/privilege_escalation.log")

print("===== Parsed Events =====")

for event in events:
    print(event)

print("\n===== Detection Results =====")

detections = run_detectors(events)

for detection in detections:
    print(detection)