# Forest Fires Russia

The primary goal of this project is to provide a visualization tool that enables users to analyze fire occurrences based on location, time, and other parameters. It will be particularly useful for the Ministry of Emergency Situations of Russia and researchers studying fire patterns to help prevent fire spread and predict high-risk ignition areas. Additionally, regular users can explore fire statistics, identify trends, and interact with the data through a visually appealing, accessible, and user-friendly interface.

This project loads forest fire data from a CSV file into a PostgreSQL database using Python. It uses a `.env` file for secure database credentials and Pandas for efficient data processing.

## Prerequisites

1. Docker engine 
2. Docker compose 

## How to run backend 

First you need to create .env file and put this data:
```
#.env
#Database
POSTGRES_DB=fires_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<passw>
DB_HOST=db
DB_PORT=5432

# Application
API_HOST=0.0.0.0
API_PORT=8000
## Finished
```

and then run docker compose file. 
```
docker-compose up -d
```
After that you should see container outputs.  It takes usually 1-5 min to initial start it. and then you will see adress where api is located.
or you can enter using this ```localhost:8000/docs```

Remal: Finding a dataset, creating a database, parsing, creating backend api, deploying and working with docker compose  
Artyom: Cleaning data, creating charts, EDA (Exploratory Data Analysis)  
Vladislav: Studying the data, EDA, creating a prototype  