from collections import defaultdict


def detect_brute_force(events):
    ip_stats = defaultdict(lambda: {
        "failed": 0,
        "accepted": 0
    })

    for event in events:

        # Ignore non-SSH events
        if event.get("event_type") != "ssh_login":
            continue

        ip = event["ip"]

        if event["status"] == "Failed":
            ip_stats[ip]["failed"] += 1

        elif event["status"] == "Accepted":
            ip_stats[ip]["accepted"] += 1

    detections = []

    for ip, stats in ip_stats.items():

        if stats["failed"] >= 5:

            detections.append({
                "attack": "SSH Brute Force",
                "severity": "High",
                "source_ip": ip,
                "failed_attempts": stats["failed"],
                "successful_login": stats["accepted"] > 0
            })

    return detections