# check_french_size.py
import pandas as pd

fr_data = pd.read_csv("../data/french_tweets.csv")
print("Taille de french_tweets.csv :", len(fr_data))
print("Colonnes :", fr_data.columns.tolist())
print("Échantillon :", fr_data.head(5))