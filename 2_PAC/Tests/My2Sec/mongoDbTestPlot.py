import matplotlib.pyplot as plt
import json
import numpy as np

with open('./test_results.json') as json_file:
    jsonObj = json.load(json_file)
    print(jsonObj)

results=jsonObj["results"]


xAxis=[]
for multiplier in results:
    xAxis.append(multiplier)

plotArg=[]
for j in range(5):
    currLine=[]
    for multiplier in results:
        currLine.append(results[multiplier]["data"][j])
    plotArg.append(xAxis)
    plotArg.append(currLine)

print(plotArg)
counter=0
multipliers=[]
nEvents=[]

t = np.arange(0, 7, 0.2)


plt.plot(plotArg[0],plotArg[1],plotArg[2],plotArg[3],plotArg[4],plotArg[5],plotArg[6],plotArg[7],plotArg[8],plotArg[9])
plt.ylabel('ms')
plt.xlabel('multiplier (base: 59)')
plt.title("Sparql upload time with MongoDb Data Virtualization")
plt.grid(True)
plt.show()