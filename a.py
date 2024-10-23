import pandas as pd
import numpy as np
import PyPDF2
import textract
import re
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
#Open the PDF File using a File Object by Parsing
filename ='JavaBasics-notes.pdf' 

pdfFileObj = open(filename,'rb')               
pdfReader = PyPDF2.PdfFileReader(pdfFileObj)   
#Reads the number of pages in the PDF
num_pages = pdfReader.numPages                 

#Reads through all the pages
count = 0
text = ""
                                                            
while count < num_pages:                       
    pageObj = pdfReader.getPage(count)
    count +=1
    text += pageObj.extractText()
    
if text != "":
    text = text
 
else:
    text = textract.process('http://bit.ly/epo_keyword_extraction_document', method='tesseract', language='eng')
#Separates out the keywords from the text
keywords = re.findall(r'[a-zA-Z]\w+',text)
#Create a dataframe of the keywords for easier processing using pandas package and prevents duplicates
df = pd.DataFrame(list(set(keywords)),columns=['keywords'])
#Calculate the number of occurences of a word ie the weight of word in the keywords extracted
def weight_calc(word,text,number_of_test_cases=1):
    word_list = re.findall(word,text)
    number_of_occurences =len(word_list)
    tf = number_of_occurences/float(len(text))
    idf = np.log((number_of_test_cases)/float(number_of_occurences))
    tf_idf = tf*idf
    return number_of_occurences,tf,idf ,tf_idf 

df['number_of_occurences'] = df['keywords'].apply(lambda x: weight_calc(x,text)[0])
df['tf'] = df['keywords'].apply(lambda x: weight_calc(x,text)[1])
df['idf'] = df['keywords'].apply(lambda x: weight_calc(x,text)[2])
df['tf_idf'] = df['keywords'].apply(lambda x: weight_calc(x,text)[3])
#Sort the words in the order of weights
df = df.sort_values('tf_idf',ascending=True)
#print the dataframe
print(df.head(len(keywords)))
#Stores the data in excel file
writer = pd.ExcelWriter('keywords_extracted.xlsx', engine='xlsxwriter')
df.to_excel(writer, sheet_name='Sheet1')
writer.save()