import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
import json

# Charger les données
data = pd.read_csv("../data/multilang_sentiment_data.csv", low_memory=False)
data["cleaned_text"] = data["cleaned_text"].fillna("")
texts = data["cleaned_text"].values
sentiments = data["sentiment"].map({"positif": 1, "négatif": 0}).values

if pd.isna(sentiments).any():
    raise ValueError("Des valeurs NaN dans 'sentiment'")

# Vérifier l’équilibre des classes
print(f"Positif : {np.sum(sentiments == 1)}, Négatif : {np.sum(sentiments == 0)}")

# Tokenisation
max_words = 10000
max_len = 50
tokenizer = Tokenizer(num_words=max_words)
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
X = pad_sequences(sequences, maxlen=max_len)
y = tf.keras.utils.to_categorical(sentiments, num_classes=2)

# Diviser avec mélange
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=True)

# Modèle (légère optimisation)
model = Sequential([
    Embedding(max_words, 128, input_length=max_len),
    LSTM(128, return_sequences=True),  # Plus de neurones
    LSTM(64),                         # Plus de neurones
    Dense(32, activation="relu"),     # Plus de capacité
    Dropout(0.3),                     # Moins agressif
    Dense(2, activation="softmax")
])

model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

# Entraîner
batch_size = 1024
model.fit(X_train, y_train, epochs=10, batch_size=batch_size, validation_data=(X_test, y_test))

# Évaluer
loss, accuracy = model.evaluate(X_test, y_test)
print(f"Précision : {accuracy}")

# Sauvegarder en HDF5
model.save("../models/multilang_sentiment_model.h5")
print("Modèle sauvegardé en .h5")

# Sauvegarder le tokenizer
tokenizer_dict = {
    "class_name": "Tokenizer",
    "config": {
        "num_words": max_words,
        "filters": '!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~\t\n',
        "lower": True,
        "split": " ",
        "char_level": False,
        "oov_token": None,
        "document_count": len(texts)
    },
    "word_index": tokenizer.word_index
}
with open("../models/multilang_sentiment_model/tokenizer.json", "w", encoding="utf-8") as f:
    json.dump(tokenizer_dict, f, ensure_ascii=False)
print("Tokenizer sauvegardé")