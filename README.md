# ActivityTypeAI
The following is a formal description of a Python program designed to incorporate the Activity Type (such as developing, researching, testing, etc.) to the ActivityWatch events. Detailed instructions and examples of the program's behavior can be found in the file ```Guide.ipynb```, which also includes explanations and examples. The source code is located in the ```src``` folder.


## Installation
You can simply run the following line of code in your terminal:<br>
```
python -m pip install -r requirements.txt
```

## Future Steps
- Display to the user only events that are not present in the knowledge;
- Store the events in the CSV file while retaining only the relevant columns (excluding columns such as duration and event type, etc.);
- Implement a sliding window of 15 days by default (i.e. remove events that were seen more than 15 days ago from the ```knowledge.csv``` file);
- Eliminate the configuration variables and retrieve the information from an ontology.

Another future step would be the use of ***Transformers***, with the issue being that an extremely high number of events would be necessary and it may no longer be user-dependent.
