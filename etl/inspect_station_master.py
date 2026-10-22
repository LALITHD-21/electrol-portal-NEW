import re

with open('c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/lib/pollingStationMaster.ts', 'r', encoding='utf-8') as f:
    content = f.read()

for part in range(30, 52):
    m = re.search(rf'"{part}":\s*\{{([^}}]+)\}}', content)
    if m:
        print(f"Part {part}: {m.group(1).strip()[:100]}")
    else:
        print(f"Part {part}: NOT FOUND in master")
