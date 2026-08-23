import re

POWERSHELL_PATTERN = re.compile(
    r"^(?P<timestamp>\S+\s+\S+)\s+"
    r"(?P<host>\S+)\s+"
    r"powershell\.exe\s+(?P<command>.+)"
)


def parse_powershell_log(file_path: str):
    events = []

    with open(file_path, "r") as logfile:

        for line in logfile:

            match = POWERSHELL_PATTERN.search(line)

            if match:

                event = match.groupdict()

                event["event_type"] = "powershell"

                events.append(event)

    return events