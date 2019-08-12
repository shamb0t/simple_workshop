import { observable } from 'mobx'

import Identities from 'orbit-db-identity-provider'
import OrbitDB from 'orbit-db'

class PlaylistsStore {
  @observable playlists = []

  constructor() {
    this._ipfs = null
    this.odb = null
    this._identity = null
  }

  async connect(ipfs) {
    this._ipfs = ipfs
    const identity = await Identities.createIdentity({ id: 'fry' })
    this._identity = identity
    this.odb = await OrbitDB.createInstance(ipfs, { identity, directory: './odb'})
  }

  load(key = 'playlists') {
    this.playlists = JSON.parse(localStorage.getItem(key)) || []
  }

  save(key = 'playlists') {
    localStorage.setItem(key, JSON.stringify(this.playlists))
  }

  deletePlaylist(name) {
    const filtered = this.playlists.filter(x => x.name !== name)
    this.playlists = filtered
    this.save()
  }

  async createNewPlaylist(name) {
    const playlist = await this.odb.feed(name, { accessController: { type: 'orbitdb', write: [this.odb.identity.id]}})
    const p = {
      name,
      address: playlist.address.toString()
    }

    this.playlists.push(p)
    this.save()
    return name
  }

  async openPlaylist (address) {
    if (!this.odb) return
    const playlist = this.odb.stores[address] || await this.odb.open(address)
    await playlist.load()
    const items = playlist.all.map(p => ({ hash: p.hash, name: p.payload.value.name, data: p.payload.value }))
    return items
  }

  async addFile (address, source) {
  if (!source || (!source.filename && !source.directory)) {
    throw new Error('Filename or directory not specified')
  }

  async function _addToIpfsJs (data) {
    const result = await this._ipfs.add(Buffer.from(data))
    const isDirectory = false
    const hash = result[0].hash
    return { hash, isDirectory }
  }

  const isBuffer = source.buffer && source.filename
  const name = source.directory
    ? source.directory.split('/').pop()
    : source.filename.split('/').pop()
  const size = source.meta && source.meta.size ? source.meta.size : 0

  let addToIpfs

  addToIpfs = _addToIpfsJs.bind(this, source.buffer)

  const upload = await addToIpfs()
  console.log("upload", upload)

  // Create a post
  const data = {
    content: upload.hash,
    meta: Object.assign(
      {
        from: this._identity.id,
        type: upload.isDirectory ? 'directory' : 'file',
        ts: new Date().getTime()
      },
      { size, name },
      source.meta || {}
    )
  }

  return this.addToPlaylist(address, data)
}

  async addToPlaylist (address, data) {
    const feed = this.odb.stores[address] || await this.odb.open(address)
    if (feed) {
      const hash = await feed.add(data)
      console.log("HASH", hash)
      return { hash, name: data.name, data}
    }
    return
  }

  async _sendFile (file, address) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = async event => {
        const f = await this.addFile(address,
          {
            filename: file.name,
            buffer: event.target.result,
            meta: { mimeType: file.type, size: file.size }
          })
        resolve(f)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  sendFiles (files, address) {
    const promises = []
    for (let i = 0; i < files.length; i++) {
      promises.push(this._sendFile(files[i], address))
    }
    return Promise.all(promises)
  }

  async sharePlaylist (address, peer) {
    // add peer to ac
    // send message to peer
    if (!this.odb) return
    const feed = this.odb.stores[address] || await this.odb.open(address)
    await feed.access.grant(peer)
  }
}

const store = window.store = new PlaylistsStore

store.load()

export default store
