# check_columns.py
# check_columns.py
import pandas as pd

# Charger chaque fichier et afficher les colonnes
en_data = pd.read_csv("../data/training.1600000.processed.noemoticon.csv", encoding="ISO-8859-1", nrows=5)
fr_data = pd.read_csv("../data/french_tweets.csv", nrows=5)
ar_neg_data = pd.read_csv("../data/train_Arabic_tweets_negative_20190413.tsv", sep="\t", nrows=5)
ar_pos_data = pd.read_csv("../data/train_Arabic_tweets_positive_20190413.tsv", sep="\t", nrows=5)

print("Sentiment140 colonnes :", en_data.columns.tolist())
print("French Tweets colonnes :", fr_data.columns.tolist())
print("Arabic Negative colonnes :", ar_neg_data.columns.tolist())
print("Arabic Positive colonnes :", ar_pos_data.columns.tolist())