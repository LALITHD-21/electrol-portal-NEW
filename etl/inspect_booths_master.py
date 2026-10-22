import re
import json

with open('c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/lib/pollingStationMaster.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract POLLING_BOOTHS_MASTER JSON
start = content.find('export const POLLING_BOOTHS_MASTER: MasterPollingBooth[] = [')
end = content.find('];', start)
array_str = content[start + len('export const POLLING_BOOTHS_MASTER: MasterPollingBooth[] = ['):end].strip()
# Wrap in brackets to make valid JSON
items = json.loads('[' + array_str + ']')
print(f"Total master booths: {len(items)}")

booth_by_part = {}
for b in items:
    bp = str(b.get('basePart'))
    if bp not in booth_by_part:
        booth_by_part[bp] = []
    booth_by_part[bp].append(b)

for p in range(30, 52):
    p_str = str(p)
    if p_str in booth_by_part:
        b_list = booth_by_part[p_str]
        print(f"Part {p:2}: {len(b_list)} booths. Main: {b_list[0]['buildingName']} | Loc: {b_list[0]['location']} | Area: {b_list[0]['pollingArea']}")
    else:
        print(f"Part {p:2}: NOT FOUND")
