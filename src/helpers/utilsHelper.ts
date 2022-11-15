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


    generateMessagingPayloadFromFeed: feedPayload => {
    let payload = {
      notification: feedPayload.notification,
      apns: {
        payload: {
          aps: {
            'content-available': 1,
            'mutable-content': 1,
            category: 'withappicon'
          }
        },
        fcm_options: {
          image: feedPayload.data.icon
        }
      },
      android: {
        notification: {
          icon: '@drawable/ic_stat_name',
          color: '#e20880',
          default_vibrate_timings: 'true',
          image: feedPayload.data.icon
        }
      }
    };

    return payload;
  }
}
