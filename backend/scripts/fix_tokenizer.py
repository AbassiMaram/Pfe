import json

# Chemin vers le fichier tokenizer.json
input_path = "C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/models/multilang_sentiment_model/tokenizer.json"
output_path = "C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/models/multilang_sentiment_model/tokenizer_fixed.json"

# Charger le fichier
with open(input_path, "r", encoding="utf-8") as f:
    tokenizer_data = json.load(f)

# Vérifier et corriger word_index
if isinstance(tokenizer_data["word_index"], str):
    print("word_index est une chaîne, correction en cours...")
    tokenizer_data["word_index"] = json.loads(tokenizer_data["word_index"])
else:
    print("word_index est déjà un objet, pas de correction nécessaire.")

# Sauvegarder le fichier corrigé
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(tokenizer_data, f, ensure_ascii=False)
    print(f"Tokenizer corrigé sauvegardé dans {output_path}")