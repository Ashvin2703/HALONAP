#!/usr/bin/env python3
"""Refresh the static Product JSON-LD snapshot from public approved reviews only."""
import json
import os
import pathlib
import re
import urllib.parse
import urllib.request

HTML = pathlib.Path("index.html")
URL = "https://ufhobvpuwhainuheewxb.supabase.co/rest/v1/product_reviews"
KEY = "sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy"
params = urllib.parse.urlencode({
    "select": "name,rating,review", "status": "eq.approved",
    "order": "created_at.desc", "limit": "1000",
})
req = urllib.request.Request(URL + "?" + params, headers={"apikey": KEY, "Accept": "application/json"})
with urllib.request.urlopen(req, timeout=20) as response:
    rows = json.load(response)
if not isinstance(rows, list):
    raise ValueError("Unexpected approved review response")
valid = [r for r in rows if type(r.get("rating")) is int and 1 <= r["rating"] <= 5]
if len(rows) >= 1000:
    raise ValueError("Pagination required: refusing to publish an incomplete review count")
text = HTML.read_text(encoding="utf-8")
pattern = r'(<script type="application/ld\\+json">)(.*?)(</script>)'
match = re.search(pattern, text, re.DOTALL)
if not match:
    raise ValueError("Product JSON-LD not found")
schema = json.loads(match.group(2))
if schema.get("@type") != "Product":
    raise ValueError("Unexpected JSON-LD type")
if valid:
    schema["aggregateRating"] = {
        "@type": "AggregateRating",
        "ratingValue": round(sum(r["rating"] for r in valid) / len(valid), 2),
        "reviewCount": len(valid), "bestRating": 5, "worstRating": 1,
    }
    schema["review"] = [
        {"@type": "Review",
         "author": {"@type": "Person", "name": r["name"].strip()},
         "reviewRating": {"@type": "Rating", "ratingValue": r["rating"], "bestRating": 5, "worstRating": 1},
         "reviewBody": r["review"].strip()}
        for r in valid
        if isinstance(r.get("name"), str) and r["name"].strip()
        and isinstance(r.get("review"), str) and r["review"].strip()
    ]
    if not schema["review"]:
        del schema["review"]
else:
    schema.pop("aggregateRating", None)
    schema.pop("review", None)
encoded = json.dumps(schema, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
updated = text[:match.start(2)] + encoded + text[match.end(2):]
if updated != text:
    HTML.write_text(updated, encoding="utf-8")
print(f"Updated Product schema from {len(valid)} approved reviews")
