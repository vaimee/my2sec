print("STARTING AI FILTER IMPORTS")
import pandas as pd
import numpy as np
import re
import nltk
print("IMPORTED NLTK")
import os
import sys
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from sklearn.feature_extraction.text import CountVectorizer
#import re
import string
#import nltk
#from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.metrics import confusion_matrix
from sklearn.metrics import ConfusionMatrixDisplay
from sklearn.metrics import classification_report
from sklearn.utils import resample
from sklearn import svm
print("FINISHED IMPORTS")

import ssl
try:
     _create_unverified_https_context =     ssl._create_unverified_context
except AttributeError:
     pass
else:
    ssl._create_default_https_context = _create_unverified_https_context
nltk.download('stopwords')
nltk.download('punkt')



# training and test set as pandas
def Filter(training_set, test_set):
    try:
        italian_stopwords = set(stopwords.words('italian'))
        english_stopword = set(stopwords.words('english'))
        df = pd.concat([training_set, test_set])


        # balancing working / not-working events
        #factor = df[df["working_selection"]==1].shape[0]//df[df["working_selection"]==0].shape[0]-1
        #no_working = df[df["working_selection"]==0]
        #for i in range(factor):
            #df = pd.concat([df,no_working])

        # Random Upsampling
        spam_upsample = resample(df[df["working_selection"]!='None'], n_samples=df.shape[0]//3)
        df = pd.concat([df,spam_upsample]).reset_index().drop(columns="index")

        corpus = []
        no_words = ' '.join(["firefox", "exe", "chrome", "safari", "opera", "google", "youtube", "http", "www", "microsoft"])
        test = []
        y = []
        for i in range(df.shape[0]):
            text = str(df.iloc[i]["app"])+" " +str(df.iloc[i]["title"])
            text = re.sub('[^a-zA-Z0-9]', ' ', text) # to find all the alphabet letter

            # Stopwords and removing integers
            word_tokens = word_tokenize(text)
            filtered_sentence = [w for w in word_tokens if not w.lower() in english_stopword]
            filtered_sentence = [w for w in word_tokens if not w.lower() in italian_stopwords]
            filtered_sentence = [w for w in filtered_sentence if not w.isnumeric()]
            text = ' '.join(filtered_sentence)

            # Removing words in the no_words list
            text = text.lower()
            text = text.split()
            tmp = []
            for t in text:
                if t in no_words:
                    continue
                tmp.append(t)
            text = ' '.join(tmp)

            # Appending to corpus
            corpus.append(text)
            y.append(df.iloc[i]["working_selection"])
            if df.iloc[i]["working_selection"]=='None':
                test.append(i)

        cv = CountVectorizer()
        X = cv.fit_transform(corpus).toarray()


        X_train = [X[z] for z in range(len(X)) if not z in test]
        y_train = [y[z] for z in range(len(y)) if not z in test]
        X_test = [X[z] for z in range(len(X)) if z in test]

        classifier = svm.SVC(C=10.0, kernel='linear', gamma='auto')
        classifier.fit(X_train, y_train)

        df_test = df[df["working_selection"]=='None'].reset_index().drop(columns="index")
        df_test = df_test.drop(columns="working_selection")
        df_test["working_selection"] = classifier.predict(X_test)


        return df_test.drop_duplicates().reset_index().drop(columns="index")

    except Exception as ex:
        print(ex)
        return pd.DataFrame()
