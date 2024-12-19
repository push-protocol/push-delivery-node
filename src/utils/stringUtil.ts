
type MessageType = "Reply" | "GIF" | "MediaEmbed" | "Image" | "Text" | "File";
const MAX_ADDRESS_LEN = 21;

export function getGenericMessage(messageType: MessageType): string {
    const messageMap: { [key in MessageType]?: string } = {
        Reply: "replied to a message",
        GIF: "sent a GIF",
        Image: "sent an image",
        File: "sent a file",
        Text: "sent a message",
        MediaEmbed: "sent a GIF",
    };

    return messageMap[messageType] || "sent a message";
}


export function getTrimmedAddress (
  originalAddress: string,
  trimLength?: number,
): string {
  const addrsLen = originalAddress.length;
  if (addrsLen >= MAX_ADDRESS_LEN) {
    const startPart = originalAddress.substring(0, trimLength ?? 8);
    const endPart = originalAddress.substring(addrsLen - (trimLength ?? 7));
    return `${startPart}...${endPart}`;
  }
  return originalAddress;
};