import { ethers } from 'ethers'
import * as apn from 'apn'
import config from '../config'
import crypto from 'crypto'
module.exports = {
    /* GENERATE RANDOM WORD */
    generateRandomWord: (length: number, includeSpecial: boolean) => {
        var result = ''
        var characters =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        if (includeSpecial) {
            characters =
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}~<>;:-='
        }
        var charactersLength = characters.length
        for (var i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            )
        }
        return result
    },

    /* VALIDATES EVM ADDRESS */
    isValidAddress: (address: string) => {
        return ethers.utils.isAddress(address)
    },

    /**
     * VALIDATES NFT ADDRESS
     * nft:eip155:nftChainId:nftContractAddress:nftTokenId:RandomHash
     */
    isValidNFTAddress: (address: string): boolean => {
        const addressComponents = address.split(':')
        const epochRegex = /^[0-9]{10}$/

        if (
            addressComponents.length >= 5 &&
            addressComponents[0].toLowerCase() === 'nft' &&
            addressComponents[1].toLowerCase() === 'eip155' &&
            !isNaN(Number(addressComponents[2])) &&
            Number(addressComponents[2]) > 0 &&
            ethers.utils.isAddress(addressComponents[3]) &&
            !isNaN(Number(addressComponents[4])) &&
            Number(addressComponents[4]) > 0
        ) {
            if (addressComponents.length === 5) {
                // The address is in the V2 format
                return true
            } else if (
                addressComponents.length === 6 &&
                epochRegex.test(addressComponents[5])
            ) {
                // The address is in the original format
                return true
            }
        }
        // The address does not conform to either format
        return false
    },

    isValidPartialCAIP10Address: function (
        addressinPartialCAIP: string
    ): boolean {
        try {
            if (this.isValidNFTAddress(addressinPartialCAIP)) {
                return true
            }

            let addressComponent = addressinPartialCAIP.split(':')
            if (
                addressComponent.length === 2 &&
                addressComponent[0] == 'eip155'
            )
                return true
            return false
        } catch (err) {
            return false
        }
    },

    generateAndrioidVideoCallPayloadFromFeed: (feedPayload) => {
        let payload = {
            data: feedPayload.notification,
            apns: {
                payload: {
                    aps: {
                        'content-available': 1,
                        'mutable-content': 1,
                        category: 'withappicon',
                    },
                },
                headers: {
                    'apns-priority':
                        feedPayload.data.additionalMeta !== null ||
                        feedPayload.data.videoMeta !== null
                            ? '10'
                            : '5', // Set the priority to high
                },
                fcm_options: {
                    image: feedPayload.data.icon,
                },
            },
            android: {
                priority:
                    feedPayload.data.additionalMeta !== null ||
                    feedPayload.data.videoMeta !== null
                        ? 'high'
                        : 'normal',
            },
        }

        return payload
    },

    generateIOSVideoCallPayloadFromFeed: (
        feedPayload,
        apnConfig = config.apnConfig
    ) => {
        const sender = JSON.parse(
            feedPayload.data.additionalMeta.data
        ).senderAddress
        const shorthandSenderAdress =
            sender.substring(0, 4) + '....' + sender.substring(38)
        const note = new apn.Notification()
        note.expiry = apnConfig.expiry
        note.badge = apnConfig.badge
        note.alert = `Video call from ${shorthandSenderAdress}`
        note.sound = apnConfig.sound
        const details = {
            title: 'Video Call from ' + shorthandSenderAdress,
            body: 'Video Call from ' + shorthandSenderAdress,
        }
        note.rawPayload = {
            callerName: shorthandSenderAdress,
            aps: {
                'content-available': 1,
            },
            handle: shorthandSenderAdress,
            details,
            status: 1, // VideoCallStatus.INITIALIZED,
            uuid: crypto.randomUUID(),
        }
        note.topic =
            config.deliveryNodesNet == 'STAGING' ||
            config.deliveryNodesNet == 'DEV'
                ? 'io.epns.epnsstaging.voip'
                : config.deliveryNodesNet == 'PROD'
                ? 'io.epns.epnsproject.voip'
                : ''
        return note
    },

    /**
     * GENERATE FCM MESSAGING PAYLOAD FROM FEED
     * Used only for `web` platform tokens
     */
    generateWebMessagingPayloadFromFeed: (feedPayload) => {
        let payload = {
            notification: feedPayload.notification,
            apns: {
                payload: {
                    aps: {
                        'content-available': 1,
                        'mutable-content': 1,
                        category: 'withappicon',
                    },
                },
                headers: {
                    'apns-priority':
                        feedPayload.data.additionalMeta !== null ||
                        feedPayload.data.videoMeta !== null
                            ? '10'
                            : '5', // Set the priority to high
                },
                fcm_options: {
                    image: feedPayload.data.icon,
                },
            },
            android: {
                priority:
                    feedPayload.data.additionalMeta !== null ||
                    feedPayload.data.videoMeta !== null
                        ? 'high'
                        : 'normal',
                notification: {
                    icon: '@drawable/ic_stat_name',
                    color: '#e20880',
                    default_vibrate_timings: 'true',
                    image: feedPayload.data.icon,
                },
            },
        }

        return payload
    },

    /**
     * GENERATE FCM MESSAGING PAYLOAD FROM FEED
     * Used only for `android` | `ios` platform tokens
     */
    generateMobileMessagingPayloadFromFeed: (feedPayload) => {
        return {
            type:
                feedPayload.data.app === 'Push Chat'
                    ? 'PUSH_NOTIFICATION_CHANNEL'
                    : 'PUSH_NOTIFICATION_CHAT',
            data: {
                notification: feedPayload.notification,
                image: feedPayload.data.icon,
            },
            apns: {
                payload: {
                    aps: {
                        'content-available': 1,
                        'mutable-content': 1,
                        category: 'withappicon',
                    },
                },
                headers: {
                    'apns-priority': '10', // Set the priority to high
                },
                fcm_options: {
                    image: feedPayload.data.icon,
                },
            },
            android: {
                priority: 'high', // Set the priority to high
                notification: {
                    icon: '@drawable/ic_stat_name',
                    color: '#e20880',
                    default_vibrate_timings: 'true',
                    image: feedPayload.data.icon,
                },
            },
        }
    },

    /**
     * @param addressinCAIP This address can be in the CAIP10 format (example: eip155:1:0xabc) or in the changed format eip155:0xabc (without the chainId). When this happens, the chainId will be null
     * @returns
     */
    convertCaipToAddress: function (addressinCAIP: string): {
        result: string
        err: string | null
    } {
        if (this.isValidNFTAddress(addressinCAIP)) {
            return { result: addressinCAIP, err: null }
        }
        let addressComponent = addressinCAIP.split(':')
        if (
            addressComponent.length === 3 &&
            addressComponent[0] === 'eip155' &&
            this.isValidAddress(addressComponent[2])
        ) {
            return { result: addressComponent[2], err: null }
        }
        // Wallet can be in the new caip10 format used in w2w: eip155:walletAddress
        else if (
            addressComponent.length === 2 &&
            addressComponent[0] === 'eip155' &&
            this.isValidAddress(addressComponent[1])
        ) {
            const wallet = addressinCAIP.replace('eip155:', '')
            return { result: wallet, err: null }
        } else {
            throw new Error('Invalid CAIP Format')
        }
    },
}
