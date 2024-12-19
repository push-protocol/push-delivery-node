export const verifyBase64ImageSize = (base64String, maxSize = 4096) => {
    if (!base64String) return false

    try {
        const base64WithoutPrefix = base64String.split(',')[1] || base64String

        const sizeInBytes = Math.ceil((base64WithoutPrefix.length * 3) / 4)

        return sizeInBytes <= maxSize
    } catch (error) {
        console.error('Error checking base64 image size:', error)
        return false
    }
}

export const verifyPayloadSize = (payload: string, maxSize = 4096) => {
    try {
        const sizeInBytes = new TextEncoder().encode(payload).length
        console.log("Payload size is: ", sizeInBytes)
        return sizeInBytes <= maxSize
    } catch (error) {
        console.error('Error checking payload size:', error)
        return false
    }
}
