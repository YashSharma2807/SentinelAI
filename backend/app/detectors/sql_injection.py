SQL_PATTERNS = [
    "union select",
    "' or '1'='1",
    "drop table",
    "sleep(",
    "benchmark(",
    "information_schema",
    "xp_cmdshell"
]


def detect_sql_injection(events):
    detections = []

    for event in events:

        if event.get("event_type") != "web_request":
            continue

        url = event.get("url", "").lower()

        for pattern in SQL_PATTERNS:

            if pattern in url:

                detections.append({
                    "attack": "SQL Injection",
                    "severity": "Critical",
                    "source_ip": event.get("ip"),
                    "url": event.get("url"),
                    "matched_pattern": pattern
                })

                break

    return detections