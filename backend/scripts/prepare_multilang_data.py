# prepare_multilang_data.py
import pandas as pd
import re

# Nettoyer le texte
def clean_text(text):
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"[^\w\s]", "", text)  # Compatible arabe
    return text.lower().strip()

# Charger Sentiment140 (anglais)
en_data = pd.read_csv("../data/training.1600000.processed.noemoticon.csv", encoding="ISO-8859-1",
                      names=["sentiment", "id", "date", "query", "user", "text"])
en_data["cleaned_text"] = en_data["text"].apply(clean_text)
en_data["sentiment"] = en_data["sentiment"].map({0: "négatif", 4: "positif"})
en_data["lang"] = "en"
en_sample = en_data[["cleaned_text", "sentiment", "lang"]].sample(500000)

# Charger French Tweets (français)
fr_data = pd.read_csv("../data/french_tweets.csv")
fr_data["cleaned_text"] = fr_data["text"].apply(clean_text)
fr_data["sentiment"] = fr_data["label"].map({0: "négatif", 1: "positif"})  # Corrigé pour 0/1
fr_data["lang"] = "fr"

# Charger Arabic Tweets (arabe négatif et positif)
ar_neg_data = pd.read_csv("../data/train_Arabic_tweets_negative_20190413.tsv", sep="\t", 
                          names=["sentiment", "text"], header=None)
ar_pos_data = pd.read_csv("../data/train_Arabic_tweets_positive_20190413.tsv", sep="\t", 
                          names=["sentiment", "text"], header=None)
ar_neg_data["cleaned_text"] = ar_neg_data["text"].apply(clean_text)
ar_pos_data["cleaned_text"] = ar_pos_data["text"].apply(clean_text)
ar_neg_data["sentiment"] = "négatif"
ar_pos_data["sentiment"] = "positif"
ar_neg_data["lang"] = "ar"
ar_pos_data["lang"] = "ar"
ar_data = pd.concat([ar_neg_data, ar_pos_data], ignore_index=True)[["cleaned_text", "sentiment", "lang"]]

# Combiner
multilang_data = pd.concat([en_sample, fr_data, ar_data], ignore_index=True)
multilang_data.to_csv("../data/multilang_sentiment_data.csv", index=False)
print(f"Données prêtes : anglais ({len(en_sample)}), français ({len(fr_data)}), arabe ({len(ar_data)})")