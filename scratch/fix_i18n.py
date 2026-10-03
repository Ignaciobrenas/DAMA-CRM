import json
import os

locales_dir = r"C:\Users\Ignacio\Desktop\Proyectos\DAMA-CRM\client\src\i18n\locales"
base_file = os.path.join(locales_dir, "en.json")

with open(base_file, "r", encoding="utf-8") as f:
    base_data = json.load(f)

privacy_keys = base_data.get("privacy", {})

for filename in os.listdir(locales_dir):
    if filename.endswith(".json") and filename != "en.json" and filename != "es.json":
        filepath = os.path.join(locales_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if "privacy" not in data:
            data["privacy"] = {}
        
        # Merge missing keys
        for key, value in privacy_keys.items():
            if key not in data["privacy"]:
                data["privacy"][key] = value # Just fallback to english
                
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print("i18n locales synchronized with privacy keys.")
