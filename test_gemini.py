import urllib.request
from urllib.error import HTTPError
import json

api_key = "AQ.Ab8RN6JooO9c-2Ts4lr5fmXU8uFXOKIqIvD8PLXTVmWsRGpP4A"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

payload = {
    "contents": [{
        "parts": [{"text": "Hello, how are you?"}]
    }]
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print(result['candidates'][0]['content']['parts'][0]['text'])
except HTTPError as e:
    print("Error:", e.read().decode())
except Exception as e:
    print("Error:", e)
