#!/usr/bin/env python3
"""Refresh the static Product JSON-LD snapshot (approved reviews, price, delivery) and price in meta descriptions."""
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
settings_req = urllib.request.Request(
    "https://ufhobvpuwhainuheewxb.supabase.co/rest/v1/store_settings?select=price_pence,standard_delivery_pence&id=eq.true",
    headers={"apikey": KEY, "Accept": "application/json"})
with urllib.request.urlopen(settings_req, timeout=20) as response:
    settings_rows = json.load(response)
settings = settings_rows[0] if isinstance(settings_rows, list) and settings_rows else {}

def pounds(value, low, high):
    """Admin Studio stores pence; return '12.99' or None when missing or out of range."""
    if type(value) is int and low <= value <= high:
        return f"{value / 100:.2f}"
    return None

price = pounds(settings.get("price_pence"), 100, 100000)
standard = pounds(settings.get("standard_delivery_pence"), 0, 2000)
text = HTML.read_text(encoding="utf-8")
if price:
    # Search snippets in the description meta tags mention the price, so keep them in step.
    def fix_meta(m):
        return re.sub(r"£\d+(?:\.\d{2})?", "£" + price, m.group(0))
    text = re.sub(r'<meta (?:name="description"|property="og:description") content="[^"]*">', fix_meta, text)
pattern = r'(<script type="application/ld\+json">)(.*?)(</script>)'
match = re.search(pattern, text, re.DOTALL)
if not match:
    raise ValueError("Product JSON-LD not found")
schema = json.loads(match.group(2))
offer = schema.get("offers") if isinstance(schema.get("offers"), dict) else None
if offer is not None and price:
    offer["price"] = price
if offer is not None and standard:
    rate = offer.get("shippingDetails", {}).get("shippingRate")
    if isinstance(rate, dict):
        rate["value"] = standard
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
print(f"Updated Product schema from {len(valid)} approved reviews; price {price}, standard delivery {standard}")
