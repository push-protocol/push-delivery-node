# Push Delivery Node

The Push Delivery Node is a service that facilitates push notifications for third-party customers, hackers and apps. It can be hosted separately and receives notifications from the push node.

## Prerequisites

- MYSQL (Version >= 5.7)
- Redis (Version >= 6.0)
- Docker (For local setup)
- Google FCM Account Setup


Here is the step by step guide for setting up the delivery node.


## Step-1: Clone Push Delivery Node Repo

```
  git clone https://github.com/ethereum-push-notification-service/push-delivery-node.git
```

## Step-2: Environment Configuration


Refer env sample file, the MYSQL DB Credentails and Redis URL needs to be updated. The remaining conf need not be edited as of now.
In case your using docker compose for the local setup MYSQL DB and Redis config can be left as it is.

```
# DELIVERY NODE DATABASE

DELIVERY_NODE_DB_HOST=localhost
DELIVERY_NODE_DB_NAME=dbname
DELIVERY_NODE_DB_USER=user
DELIVERY_NODE_DB_PASS=pass
DELIVERY_NODE_DB_PORT=3306

```


## Step-3: Infra Setup - Local

The Docker compose will bring up the MYSQL, Redis and PHPMyAdmin containers for the Delivery Node to use.

```sh
docker compose up
```


## Step-3: (Alternate) Infra Setup - Production

- Host MYSQL, Redis Seperately
- Add MYSQL and Redis credentials in the .env file



## Step-4: FCM Project Setup

- Refer https://firebase.google.com/docs/admin/setup
- Create firebase-adminsdk.json file in the root folder and add the FCM JSON in the file

## Step-5: Build the Delivery node project

You should then be able to build the project using:

```sh
cd push-delivery-node
npm install
```

## Step-6: Start the Delivery node project

You should then be able to start the server using:

```sh
cd push-delivery-node
npm start
```



## Step-7: Device Registration

- There is and endpoint hosted as part of the Delivery Node Project which can used for the Device Registartion.
- Below is the API to create a mapping between the wallet address and the device token for which the messages need to be delivered.
- <delivery_node_url> is the base URL of the Delivery node which you have hosted.


```

curl --location --request POST 'https://<delivery_node_url>/apis/v1/pushtokens/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    
    "wallet": "eip155:0x35B84d6848D16415177c64D64504663b998A6ab4",
    "device_token": "device_token",
    "platform": "android"
}'

```



## Upcoming features

- Dockerization
- Analytics
- Video Tutorials
- Monitoring APIs
- Demo APP to Test Delivery Node Notifications


## Note

The Push delivery node is  a copyrighted work owned by Push org (Ethereum Push Notification Service). Unauthorized use of the Push delivery node product for profit or by competitors is strictly prohibited. While the Push delivery node product may be used for demonstration or illustrative purposes in the context of web3, it may not be used to compete with or copy the products or services of the Push Protocol. Any violation of this disclaimer may result in legal action.


