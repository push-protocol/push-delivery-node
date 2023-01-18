# Push Delivery Node

The Delivery node can be hosted separately by third-party customers and hackers and receive notifications from the push node.

## Prerequisites

- MYSQL (Version >= 5.7)
- Redis (Version >= 6.0)
- Docker (For local setup)
- Google FCM Account Setup


## Environment Configuration

Refer env sample file, the MYSQL DB Credentails and Redis URL needs to be updated. The remaining conf need not be edited as of now.

```
# DELIVERY NODE DATABASE
DELIVERY_NODE_DB_HOST=localhost
DELIVERY_NODE_DB_NAME=dbname
DELIVERY_NODE_DB_USER=user
DELIVERY_NODE_DB_PASS=pass
DELIVERY_NODE_DB_PORT=3306

# FIREBASE
FIREBASE_DATABASE_URL=<url>

```


## Local Setup

To start the Delivery node with MYSQL and Redis :

```sh
docker compose up
```

You should then be able to build the server using:

```sh
npm install
```

You should then be able to start the server using:

```sh
npm start
```




## Production Setup

- Host MYSQL, Redis Seperately
- Delivery node installation
- Add MYSQL and Redis credentials in the .env file

You should then be able to build the server using:

```sh
npm install
```

You should then be able to start the server using:

```sh
npm start
```



## FCM Setup

- Refer https://firebase.google.com/docs/admin/setup
- Create firebase-adminsdk.json file in the root folder and add the FCM JSON in the file
- Add FIREBASE_DATABASE_URL in the .env file



## Device Registration

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


## Note

The Push delivery node is  a copyrighted work owned by Push org (Ethereum Push Notification Service). Unauthorized use of the Push delivery node product for profit or by competitors is strictly prohibited. While the Push delivery node product may be used for demonstration or illustrative purposes in the context of web3, it may not be used to compete with or copy the products or services of the Push Protocol. Any violation of this disclaimer may result in legal action.

