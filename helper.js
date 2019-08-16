function getDataTransferFiles (event) {
  const files = []
  if (event.dataTransfer.items) {
    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const file = event.dataTransfer.items[i]
      file.kind === 'file' && files.push(file.getAsFile())
    }
  } else {
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      files.push(event.dataTransfer.files.item(i))
    }
  }
  return files
}

function toArrayBuffer (buffer) {
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return ab
}

module.exports.getDataTransferFiles = getDataTransferFiles
module.exports.toArrayBuffer = toArrayBuffer
