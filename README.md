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

## Step-2: Environment Variables and `config` File Configuration 


Refer env sample file. The MYSQL DB credentials and Redis URL needs to be updated. The remaining conf need not be edited as of now. In case your using docker-compose for the local setup MYSQL DB and Redis config can be left as it is.


```
# REDIS

REDIS_URL=redis://localhost:6379

# DELIVERY NODE MYSQL DATABASE

DELIVERY_NODE_DB_HOST=localhost
DELIVERY_NODE_DB_NAME=dbname
DELIVERY_NODE_DB_USER=user
DELIVERY_NODE_DB_PASS=pass
DELIVERY_NODE_DB_PORT=3306

```

As per the environments, there are three config files:

`config-staging` for staging environment

`config-prod` for production environment

In the `.env.`, the value of `DELIVERY_NODES_NET` determines the config file that will be used. The `CHANNEL_ADDRESS` parameter in the config files specifies which channel's notification will be delivered. Therefore, the user has the option to deliver notifications for either a subset of channels or for all channels. 

There are three level of conditioning that can be made in the config:

For better understanding, we will consider an example where Ethereum channel address is `0xEth` and it's alias(same as channel address) is in Polygon. The channel in caip format will be `eip155:1:0xEth` and the alias in caip format will be `eip155:137:0xEth`.

1. empty array: If the array is empty, all of the channels' notifications will be delivered. In this case `CHANNEL ADDRESSES = []`
2. channel address with no CAIP format: If the user wants to deliver notifications for both the channel and it's alias, then can enter the address without any CAIP. In this case `CHANNEL ADDRESSES = [0xEth]`
3. channel address with no CAIP format: If the user wants to deliver notifications for only the Ethereum channel or the alias channel, they can specify it in the CAIP format of that specific chain. In this case, for delivering Ethereum channel's notification, it will be  `CHANNEL ADDRESSES = [eip155:1:0xEth]` and for delivering Polygon alias channel's notification, it will be `CHANNEL ADDRESSES = [eip155:137:0xEth]`

## Step-3: Infra Setup - Local

The docker-compose will bring up the MYSQL, Redis and PHPMyAdmin containers for the Delivery Node.

```sh
docker compose up
```


## Step-3: (Alternate) Infra Setup - Production

- Host MYSQL and Redis seperately
- Add MYSQL and Redis credentials in the .env file



## Step-4: FCM Project Setup

- Refer https://firebase.google.com/docs/admin/setup
- Create firebase-adminsdk.json file in the root folder and add the FCM JSON to this file

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

Or, you can build and start the server via docker-compose:

```sh
docker compose --profile prod --env-file .env up -d
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

- [x] Dockerization
- Analytics
- Video Tutorials
- Monitoring APIs
- Demo APP to Test Delivery Node Notifications


## Note

The Push delivery node is  a copyrighted work owned by Push org (Ethereum Push Notification Service). Unauthorized use of the Push delivery node product for profit or by competitors is strictly prohibited. While the Push delivery node product may be used for demonstration or illustrative purposes in the context of web3, it may not be used to compete with or copy the products or services of the Push Protocol. Any violation of this disclaimer may result in legal action.


