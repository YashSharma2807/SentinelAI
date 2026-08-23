def detect_privilege_escalation(events):
    detections = []

    for event in events:

        if event.get("event_type") != "privilege_escalation":
            continue

        detections.append({
            "attack": "Privilege Escalation",
            "severity": "Critical",
            "user": event.get("user"),
            "target": event.get("target"),
            "action": event.get("action")
        })

    return detections