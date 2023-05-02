import { ethers } from 'ethers'

module.exports = {
    // To Generate Random Password
    generateRandomWord: (length, includeSpecial) => {
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

    isValidAddress: (address) => {
        return ethers.utils.isAddress(address)
    },

    isValidPartialCAIP10Address: function (
        addressinPartialCAIP: string
    ): boolean {
        try {
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

    generateMessagingPayloadFromFeed: (feedPayload) => {
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
                        (feedPayload.data.additionalMeta !== null ||
                        feedPayload.data.videoMeta !== null)
                            ? '10'
                            : '5', // Set the priority to high
                },
                fcm_options: {
                    image: feedPayload.data.icon,
                },
            },
            android: {
                priority:
                  (feedPayload.data.additionalMeta !== null ||
                  feedPayload.data.videoMeta !== null)
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
     * @param addressinCAIP This address can be in the CAIP10 format (example: eip155:1:0xabc) or in the changed format eip155:0xabc (without the chainId). When this happens, the chainId will be null
     * @returns
     */
    convertCaipToAddress: function (addressinCAIP: string): {
        result: string
        err: string | null
    } {
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
