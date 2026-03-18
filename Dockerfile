# Use the official Python image
FROM python:3.11.8-slim

# Set the working directory
WORKDIR /app

# Install OS-level dependencies required for audio processing and SciPy compilation
RUN apt-get update && apt-get install -y \
    gfortran \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the entire project code into the container
COPY . .

# Expose the port that FastAPI will run on
EXPOSE 8000

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
