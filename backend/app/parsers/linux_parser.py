import re

# ================= SSH LOGIN ================= #

SSH_PATTERN = re.compile(
    r"^(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+)\s+"
    r"(?P<host>\S+)\s+"
    r"(?P<service>sshd)\[\d+\]:\s+"
    r"(?P<status>Failed|Accepted)\s+password\s+for\s+"
    r"(?P<user>\S+)\s+from\s+"
    r"(?P<ip>\d+\.\d+\.\d+\.\d+)"
)

# ================= SUDO ================= #

SUDO_PATTERN = re.compile(
    r"^(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+)\s+"
    r"(?P<host>\S+)\s+sudo:\s+"
    r"(?P<user>\S+)\s+:.*USER=(?P<target>\S+)\s+;"
    r".*COMMAND=(?P<command>.+)"
)

# ================= SU ================= #

SU_PATTERN = re.compile(
    r"^(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+)\s+"
    r"(?P<host>\S+)\s+su:\s+"
    r"Successful su for (?P<target>\S+) by (?P<user>\S+)"
)

# ================= USERMOD ================= #

USERMOD_PATTERN = re.compile(
    r"^(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+)\s+"
    r"(?P<host>\S+)\s+usermod:\s+"
    r"user (?P<target>\S+) added to group sudo"
)


def parse_ssh_log(file_path: str):
    events = []

    with open(file_path, "r") as logfile:

        for line in logfile:

            # SSH LOGIN

            match = SSH_PATTERN.search(line)

            if match:
                event = match.groupdict()
                event["event_type"] = "ssh_login"
                events.append(event)
                continue

            # SUDO

            match = SUDO_PATTERN.search(line)

            if match:
                event = match.groupdict()
                event["event_type"] = "privilege_escalation"
                event["action"] = "sudo"
                events.append(event)
                continue

            # SU

            match = SU_PATTERN.search(line)

            if match:
                event = match.groupdict()
                event["event_type"] = "privilege_escalation"
                event["action"] = "su"
                events.append(event)
                continue

            # USERMOD

            match = USERMOD_PATTERN.search(line)

            if match:
                event = match.groupdict()
                event["event_type"] = "privilege_escalation"
                event["action"] = "usermod"
                events.append(event)

    return events