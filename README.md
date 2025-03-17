# Forest Fires Russia

The primary goal of this project is to provide a visualization tool that enables users to analyze fire occurrences based on location, time, and other parameters. It will be particularly useful for the Ministry of Emergency Situations of Russia and researchers studying fire patterns to help prevent fire spread and predict high-risk ignition areas. Additionally, regular users can explore fire statistics, identify trends, and interact with the data through a visually appealing, accessible, and user-friendly interface.

This project loads forest fire data from a CSV file into a PostgreSQL database using Python. It uses a `.env` file for secure database credentials and Pandas for efficient data processing.

## Prerequisites

1. **Python 3.11+**: Ensure Python is installed.
2. **PostgreSQL**: Install and set up PostgreSQL on your machine.

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Data-Wrangling-and-Visualisation/Russia-on-fire
cd Russia-on-fire
```


### 2. Install dependencies

Installing python packets from pip

```bash
pip install -r requirements.txt
```

### 3. Preparing data to upload to Database

First of all, you need to create database in posgresql DBMS(Database Management System). And the Insert prepared table scheme which is located in `src/table_scheme.sql`

And then create file with environment vars like postgresql user password and so on
```
DB_NAME=<database_name>
DB_USER=<db_user>
DB_PASSWORD=<user_passw>
DB_HOST=<host_ip>
DB_PORT=<db_port>
```

### 4. Uploading data into Database

Now you need to run python script and wait around 3-5 min till all data will be loaded to database.

```bash
python src/load_data.py
```

After that everything will be inserted into database


## Work done for the checkpoint 

Remal: Finding a dataset, creating a database, parsing  
Artyom: Cleaning data, creating charts, EDA (Exploratory Data Analysis)  
Vladislav: Studying the data, EDA, creating a prototype  
