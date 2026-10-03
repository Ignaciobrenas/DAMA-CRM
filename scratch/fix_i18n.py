import json
import os

locales_dir = r"C:\Users\Ignacio\Desktop\Proyectos\DAMA-CRM\client\src\i18n\locales"
base_file = os.path.join(locales_dir, "es.json")

with open(base_file, "r", encoding="utf-8") as f:
    base_data = json.load(f)

# Get all privacy keys from es.json
privacy_keys = {k: v for k, v in base_data.items() if k.startswith("privacy.")}

for filename in os.listdir(locales_dir):
    if filename.endswith(".json") and filename != "es.json":
        filepath = os.path.join(locales_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Remove the buggy "privacy": {} if it exists
        if "privacy" in data and isinstance(data["privacy"], dict):
            del data["privacy"]
            
        # Merge missing keys
        for key, value in privacy_keys.items():
            if key not in data:
                data[key] = value # fallback to spanish
                
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print(f"i18n locales synchronized and buggy nested privacy keys removed.")
