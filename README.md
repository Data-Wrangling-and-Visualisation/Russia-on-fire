# Forest Fires Russia

The primary goal of this project is to provide a visualization tool that enables users to analyze fire occurrences based on location, time, and other parameters. It will be particularly useful for the Ministry of Emergency Situations of Russia and researchers studying fire patterns to help prevent fire spread and predict high-risk ignition areas. Additionally, regular users can explore fire statistics, identify trends, and interact with the data through a visually appealing, accessible, and user-friendly interface.

This project loads forest fire data from a CSV file into a PostgreSQL database using Python. It uses a `.env` file for secure database credentials and Pandas for efficient data processing.
## Team
- **Remal Gareev (DS-2)**
  - Team Lead, Backend
- **Artyom Grishin (DS-2)**
  - EDA, Frontend
- **Vlad Merkulov (DS-2)**
  - EDA, Frontend
## Github structure
- Folder **client** contains code for front-end
- Folder **server** contains code for back-end
- Folder **plots** contains a ipynb file with our Exploratory data analysis(EDA)
- Folder **data** contains a dataset itself in zip achive format and a pdf file with description of the dataset
## Setup and Run Instructions

### Prerequisites

1. Docker engine 
2. Docker compose
### Installation
1. **Clone the repository:**
     ```sh
    git clone https://github.com/Data-Wrangling-and-Visualisation/Russia-on-fire
    cd Russia-on-fire
    ```
2. **Run the project via Docker**

First you need to create .env file in the Russia-on-fire folder and put this data:
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
docker-compose up
```
After that you should see container outputs.  It takes usually 1-5 min to initial start it. and then you will see adress where api is located.
or you can enter using this ```localhost:8000/docs```

If it says there is an error in backend - you should restart the container, because it needs some time to run the database
```
docker-compose down
docker-compose up
```
After that you will see the addresses from front-end to go to the website.

