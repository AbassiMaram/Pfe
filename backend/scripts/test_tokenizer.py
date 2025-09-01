import tensorflow as tf
from tensorflow.keras.preprocessing.text import tokenizer_from_json
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import load_model
import numpy as np
import json

# Charger le modèle
model = load_model('C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/models/multilang_sentiment_model.h5')
print("Modèle chargé.")

# Charger le tokenizer corrigé
with open('C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/models/multilang_sentiment_model/tokenizer_fixed.json', "r", encoding="utf-8") as f:
    tokenizer_json = f.read()
tokenizer = tokenizer_from_json(tokenizer_json)
print("Tokenizer chargé avec word_index :", list(tokenizer.word_index.items())[:5])

# Fonction de tokenisation
def tokenize(comment):
    seq = tokenizer.texts_to_sequences([comment])[0]
    padded = pad_sequences([seq], maxlen=50, padding="post", truncating="post")
    return padded

# Tester les commentaires
comments = ["جيد", "سيء", "très mauvais"]
for comment in comments:
    input_tensor = tokenize(comment)
    pred = model.predict(input_tensor)
    print(f"Commentaire : {comment}")
    print(f"Séquence tokenisée : {input_tensor[0]}")
    print(f"Prédiction : {pred[0]}")
    sentiment = "positif" if pred[0][1] > 0.5 else "négatif"
    print(f"Sentiment calculé : {sentiment}\n")