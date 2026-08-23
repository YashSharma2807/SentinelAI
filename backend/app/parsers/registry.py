from app.parsers.linux_parser import parse_ssh_log
from app.parsers.windows_parser import parse_powershell_log
from app.parsers.web_parser import parse_web_log


def get_parser(file_path: str):

    path = file_path.lower()

    if "powershell" in path:
        return parse_powershell_log

    if "sql" in path:
        return parse_web_log

    return parse_ssh_log