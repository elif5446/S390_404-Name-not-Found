# Backend Setup & Running Instructions

This backend is built with **FastAPI** and runs using **Uvicorn** as the ASGI server.

## Running Instructions 

### Option 1: Run the Backend with Docker (Recommended)

Docker ensures everyone on the team runs the backend in the same environment, avoiding dependency and version issues.

**Steps**: 
1. Download Docker Desktop at -> https://www.docker.com/products/docker-desktop/

2. Verify Docker is installed and running:
```bash
docker --version
docker compose version
```
3. From the project root (where docker-compose.yml is located):
```bash
docker compose up --build
```
- This will build the intial docker image, install dependencies from requirements.txt, start the FastAPI application using Uvicorn.
**Note**:
  - Once the image is built you only need to run `docker compose up`
  - If dependencies change, run: `docker compose up --build`

4. Verify that backend is running at `http://localhost:8000`
5. Checkout FastAPI Swagger docs `http://localhost:8000/docs`
6. Stop running
 ```bash
docker compose down`
```

### Option 2: Run the Backend locally (without Docker)
Running locally will work, make sure to run on python 3.11.

**Steps:**
1. Download Python 3.11
2. Verify python version from the project root:
```bash
   python --version
   #or
   python3 --version

   ```
3. Create python virtual environment
  ```bash
python -m venv venv
```
4. Activate the virtual environment
```bash
source venv/bin/activate # mac or linux
#or
venv\Scripts\Activate.ps1 # on windows
```
- Once activated, your terminal should show (venv)
6. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```
7. Run the FastAPI application
```bash
uvicorn app.main:app --reload
```
8. Verify that backend is running at `http://localhost:8000`
9. Checkout FastAPI Swagger docs `http://localhost:8000/docs`
10. Stop running: `CTL+C`

Notes: 
- Make sure ports used by Docker (if running elsewhere) are not already in use.
- Always activate the virtual environment before running the backend locally.
- If dependencies change, rerun:
  ```bash
  pip install -r requirements.txt
  ```

