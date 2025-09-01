# check_data.py
import pandas as pd

# Charger les données
data = pd.read_csv("../data/multilang_sentiment_data.csv", low_memory=False)

# Vérifier les NaN dans 'sentiment'
nan_sentiments = data[data["sentiment"].isna()]
print(f"Nombre de lignes avec sentiment NaN : {len(nan_sentiments)}")
print("Exemples de lignes avec sentiment NaN :")
print(nan_sentiments.head())

# Vérifier les valeurs uniques dans 'sentiment'
print("\nValeurs uniques dans 'sentiment' :")
print(data["sentiment"].value_counts(dropna=False))