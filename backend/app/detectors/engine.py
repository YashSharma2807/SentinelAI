from app.detectors.brute_force import detect_brute_force
from app.detectors.privilege_escalation import detect_privilege_escalation
from app.detectors.powershell import detect_powershell_abuse
from app.detectors.sql_injection import detect_sql_injection


def run_detectors(events):
    detections = []

    detections.extend(detect_brute_force(events))

    detections.extend(detect_privilege_escalation(events))

    detections.extend(detect_powershell_abuse(events))

    detections.extend(detect_sql_injection(events))

    return detections