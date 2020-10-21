import requests
import random

PREFIX = "LoadTest"
JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imdsb2JhbC1hZG1pbkBvczJpb3QuZGsiLCJzdWIiOjEsImlhdCI6MTYwMTg5NTUyOCwiZXhwIjo1MjAxODkxOTI4fQ.PBSqB20fqz1PrrNG4eBhJMBjtokD7Z7cHQiKRrA7Y5k"
applications_made = []

headers = {
    "Authorization": f"Bearer {JWT}"
}

def random_mac():
    return "02:00:00:%02x:%02x:%02x" % (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))


def generate_application():
    dto = {
        "name": f"{PREFIX}-{random_mac()}",
        "organizationId": 1,
        "description": PREFIX
    }
    res = requests.post(
        'http://[::1]:3000/api/v1/application', json=dto, headers=headers)
    id = res.json()['id']
    print(f"made application: {id}")
    return id


def generate_iot_device():
    dto = {
        "name": f"{PREFIX}-iot-{random_mac()}",
        "type": "GENERIC_HTTP",
        "applicationId": random.choice(applications_made),
        "commentOnLocation": PREFIX,
        "comment": PREFIX
    }
    res = requests.post(
        'http://[::1]:3000/api/v1/iot-device', json=dto, headers=headers)
    id = res.json()['id']
    print(f"made iot device: {id}")
    return id


for i in range(100):
    applications_made.append(generate_application())

for i in range(10000):
    generate_iot_device()
