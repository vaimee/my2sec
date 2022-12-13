# ActivityTypeAI
A Python program that adds the Activity Type (i.e. developing, researching, testing, etc) to the ActivityWatch events. You can see the behaviour on ```main.py``` and ```ActivityTypeAI.ipynb```, inside the PY folder.


## Train phase
The function ```GetTrainActivityEvents``` returns a small set of train events to show to the user, that is the events that the user needs to assign with the Activity Type. The number of train events may vary between 0 and 10. The function simply takes a listo of json as parameter.<br>


## Test phase
The function ```GetTestActivityEvents``` returns all the events with the Activity Type using the user's train events plus the events stored in the ```knowledge.csv``` file. The function uses SVM to choose the Activity Type, using a linear kernel. The function also applies a Preprocessing phase using tokenization, english-italian stopwords (the number of languages can be set on the configurations variable), lemmatizer and regex.<br>
The function takes a json as parameter composed by:<br>
```
{     
      'train_events': [...]   # a listo of user's train events with the Activity Type<br>
      'evetnt': [...]         # a list of json with all the events without Activity Type<br>
}
```

## Future Step
- Show to the user only the events that don't appear in the knowledge;
- Add the validation phase;
- Store the events in the CSV with only the useful columns (i.e. without duration, event type, etc);
- Apply Sliding Window on 15 days, by default (i.e. remove the events seen above 15 days before from ```knowledge.csv```);
- Remove the configurations variable and get the info from the ontology.
