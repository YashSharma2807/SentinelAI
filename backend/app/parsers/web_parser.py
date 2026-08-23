import re

WEB_PATTERN = re.compile(
    r'^(?P<ip>\d+\.\d+\.\d+\.\d+).*?"(?P<method>GET|POST)\s+(?P<url>.+?)\s+HTTP'
)


def parse_web_log(file_path: str):
    events = []

    with open(file_path, "r") as logfile:

        for line in logfile:

            match = WEB_PATTERN.search(line)

            if match:
                event = match.groupdict()
                event["event_type"] = "web_request"
                events.append(event)

    return events