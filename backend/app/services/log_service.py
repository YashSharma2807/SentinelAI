from app.detectors.engine import run_detectors
from app.parsers.registry import get_parser


def analyze_log(file_path: str):
    parser = get_parser(file_path)

    events = parser(file_path)

    detections = run_detectors(events)

    return {
        "events": events,
        "detections": detections
    }