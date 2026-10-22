import urllib.request
import json

url = "https://fxnomgqqenaqpuzervxd.supabase.co/rest/v1/electors?epic_number=ilike.*4252136*&select=*"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bm9tZ3FxZW5hcXB1emVydnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjMzNzA5MywiZXhwIjoyMTA3OTEzMDkzfQ.c67TOlHqgzjRQu2uvmhJngSFyeJQAQ6s5n_utqPosmM",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bm9tZ3FxZW5hcXB1emVydnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjMzNzA5MywiZXhwIjoyMTA3OTEzMDkzfQ.c67TOlHqgzjRQu2uvmhJngSFyeJQAQ6s5n_utqPosmM"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print(f"Supabase query for *4252136*: {len(data)} results")
        for d in data:
            print(" ", d)
except Exception as e:
    print(f"Supabase error: {e}")

# Also search for YNT4252136 exact
url_exact = "https://fxnomgqqenaqpuzervxd.supabase.co/rest/v1/electors?epic_number=eq.YNT4252136&select=*"
req_exact = urllib.request.Request(url_exact, headers=headers)
try:
    with urllib.request.urlopen(req_exact) as resp:
        data = json.loads(resp.read().decode())
        print(f"Supabase exact query for YNT4252136: {len(data)} results")
        for d in data:
            print(" ", d)
except Exception as e:
    print(f"Supabase exact error: {e}")
