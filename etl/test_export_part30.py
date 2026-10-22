import sqlite3
import re
import os
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

TALUK_MAP = {
    30: ("Molakalmuru", "Molakalmuru"),
    31: ("Molakalmuru", "Molakalmuru"),
    32: ("Challakere", "Challakere"),
    33: ("Challakere", "Challakere"),
    34: ("Challakere", "Challakere"),
    35: ("Challakere", "Challakere"),
    36: ("Chitradurga", "Chitradurga"),
    37: ("Chitradurga", "Chitradurga"),
    38: ("Chitradurga", "Chitradurga"),
    39: ("Chitradurga", "Chitradurga"),
    40: ("Hiriyur", "Hiriyur"),
    41: ("Hiriyur", "Hiriyur"),
    42: ("Hiriyur", "Hiriyur"),
    43: ("Hiriyur", "Hiriyur"),
    44: ("Hosadurga", "Hosadurga"),
    45: ("Hosadurga", "Hosadurga"),
    46: ("Hosadurga", "Hosadurga"),
    47: ("Hosadurga", "Hosadurga"),
    48: ("Holalkere", "Holalkere"),
    49: ("Holalkere", "Holalkere"),
    50: ("Holalkere", "Holalkere"),
    51: ("Holalkere", "Holalkere"),
}

def clean_name(val):
    if not val:
        return ""
    s = str(val).strip()
    if s.lower() in ('null', 'none', '—', '-', '.'):
        return ""
    # Strip weird OCR special characters like #, $, @, !, ~, %, ^, *, _, +, =, [, ], {, }, ;, :, ", <, >, ?, /, \, |
    s = re.sub(r'[\$#@!~%^*_+=\[\]{};:\"\'\<\>?/\\|]+', '', s).strip()
    # Separate lowercase letters followed directly by uppercase letters (e.g., "RojaY" -> "Roja Y")
    s = re.sub(r'([a-z])([A-Z])', r'\1 \2', s)
    # Collapse multiple whitespace
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def clean_phone(val):
    if not val:
        return ""
    digits = re.sub(r'\D', '', str(val))
    if len(digits) == 10 and digits[0] in '6789':
        # Reject 10 identical repeating digits (e.g. 9999999999)
        if len(set(digits)) > 1:
            return digits
    return ""

def clean_address(val):
    if not val:
        return ""
    s = str(val).strip()
    if s.lower() in ('null', 'none', '—', '-'):
        return ""
    # Replace literal \n or newline characters with comma space
    s = s.replace('\\n', ', ').replace('\n', ', ').replace('\r', '')
    # Collapse commas and spaces
    s = re.sub(r'[,;\s]+,', ',', s)
    s = re.sub(r',\s*,+', ', ', s)
    s = re.sub(r'\s+', ' ', s).strip(' ,')
    return s

def clean_text(val):
    if not val:
        return ""
    s = str(val).strip()
    if s.lower() in ('null', 'none', '—', '-'):
        return ""
    return re.sub(r'\s+', ' ', s)

print("Helper functions ready")
