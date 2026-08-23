def detect_powershell_abuse(events):
    detections = []

    for event in events:

        if event.get("event_type") != "powershell":
            continue

        command = event.get("command", "").lower()

        if (
            "encodedcommand" in command
            or "invoke-expression" in command
            or "iex(" in command
            or "downloadstring" in command
        ):

            detections.append({
                "attack": "PowerShell Abuse",
                "severity": "Critical",
                "host": event.get("host"),
                "command": event.get("command")
            })

    return detections