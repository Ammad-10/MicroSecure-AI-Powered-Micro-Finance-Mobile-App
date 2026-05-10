import urllib.request
import json
import socket

def check_health(url):
    print(f"Checking health at: {url}")
    try:
        response = urllib.request.urlopen(url, timeout=5)
        status = response.getcode()
        content = response.read().decode()
        print(f"Status Code: {status}")
        print(f"Response Content: {content}")
        return status == 200
    except Exception as e:
        print(f"Error connecting to {url}: {e}")
        return False

if __name__ == "__main__":
    # Check localhost first
    check_health("http://localhost:8005/api/health")
    
    # Check fallback for machine IP if needed
    check_health("http://10.54.14.135:8005/api/health")
